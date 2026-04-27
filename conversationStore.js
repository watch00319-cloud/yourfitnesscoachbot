const config = require('./config');

/**
 * In-memory conversation store
 * Maintains chat history, user data, and activity tracking per user
 */
class ConversationStore {
  constructor() {
    // Map<userId, { history: [], userData: {}, lastActive: Date }>
    this.conversations = new Map();
    this.globalAIEnabled = true;
    this.mutedUsers = new Set();
  }

  /**
   * AI Management
   */
  setGlobalAI(state) {
    this.globalAIEnabled = !!state;
    return this.globalAIEnabled;
  }

  muteUser(userId, state) {
    if (state) {
      this.mutedUsers.add(userId);
    } else {
      this.mutedUsers.delete(userId);
    }
  }

  isAIEnabled(userId) {
    return this.globalAIEnabled && !this.mutedUsers.has(userId);
  }

  /**
   * Get or create a conversation for a user
   */
  getConversation(userId) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, {
        history: [],
        userData: {
          name: null,
          interests: [],
          issues: [],
          firstContact: new Date().toISOString(),
          onboardingStatus: 'none',
          welcomeScheduledAt: null,
          welcomedAt: null,
          paidPitchSentAt: null,
          maintenanceNotifiedAt: null,
        },
        lastActive: Date.now(),
        messageCount: 0,
        userMessageCount: 0,
        hasRecentFollowUp: false,
        lastFollowUpAt: null,
        lastBotReplyAt: null,
      });
    }
    return this.conversations.get(userId);
  }

  /**
   * Add a message to history (keeps last MAX_HISTORY messages)
   */
  addMessage(userId, role, content) {
    const conv = this.getConversation(userId);
    conv.history.push({
      role,        // 'user' or 'model'
      parts: [{ text: content }],
    });

    // Trim history to stay within limits
    if (conv.history.length > config.MAX_HISTORY) {
      conv.history = conv.history.slice(-config.MAX_HISTORY);
    }

    conv.lastActive = Date.now();
    conv.messageCount++;
    if (role === 'user') {
      conv.userMessageCount++;
      // Don't reset follow-up flag on user message - use time-based cooldown instead
    }
    return conv;
  }

  /**
   * Get chat history formatted for Gemini
   */
  getHistory(userId) {
    const conv = this.getConversation(userId);
    return conv.history;
  }

  /**
   * Update user data (name, interest, etc.)
   */
  updateUserData(userId, data) {
    const conv = this.getConversation(userId);
    Object.assign(conv.userData, data);
  }

  markQuotaError(userId) {
    const conv = this.getConversation(userId);
    conv.userData.lastAIErrorAt = new Date().toISOString();
    conv.userData.isQuotaError = true;
  }

  clearQuotaError(userId) {
    const conv = this.getConversation(userId);
    delete conv.userData.isQuotaError;
    delete conv.userData.lastAIErrorAt;
  }

  isQuotaErrorActive(userId, skipMinutes) {
    const conv = this.getConversation(userId);
    if (!conv.userData.isQuotaError || !conv.userData.lastAIErrorAt) return false;
    
    const minutesSince = (Date.now() - new Date(conv.userData.lastAIErrorAt).getTime()) / (1000 * 60);
    return minutesSince < skipMinutes;
  }

  beginOnboarding(userId) {
    const conv = this.getConversation(userId);
    conv.userData.onboardingStatus = 'pending';
    conv.userData.welcomeScheduledAt = new Date().toISOString();
    return conv.userData;
  }

  isOnboardingPending(userId) {
    const conv = this.getConversation(userId);
    return conv.userData.onboardingStatus === 'pending';
  }

  completeOnboarding(userId) {
    const conv = this.getConversation(userId);
    conv.userData.onboardingStatus = 'complete';
    conv.userData.welcomedAt = new Date().toISOString();
    return conv.userData;
  }

  getConversationAgeMinutes(userId) {
    const conv = this.getConversation(userId);
    const firstContact = new Date(conv.userData.firstContact).getTime();
    return (Date.now() - firstContact) / (1000 * 60);
  }

  canSendPaidPitch(userId, minMinutes) {
    const conv = this.getConversation(userId);
    return (
      conv.userData.onboardingStatus === 'complete' &&
      !conv.userData.paidPitchSentAt &&
      conv.userMessageCount >= 3 &&
      this.getConversationAgeMinutes(userId) >= minMinutes
    );
  }

  markPaidPitchSent(userId) {
    const conv = this.getConversation(userId);
    conv.userData.paidPitchSentAt = new Date().toISOString();
  }

  shouldSendMaintenance(userId, cooldownMinutes = 30) {
    const conv = this.getConversation(userId);
    const lastNotified = conv.userData.maintenanceNotifiedAt
      ? new Date(conv.userData.maintenanceNotifiedAt).getTime()
      : 0;

    return !lastNotified || (Date.now() - lastNotified) / (1000 * 60) >= cooldownMinutes;
  }

  markMaintenanceNotified(userId) {
    const conv = this.getConversation(userId);
    conv.userData.maintenanceNotifiedAt = new Date().toISOString();
  }

  markFollowUpSent(userId) {
    const conv = this.getConversation(userId);
    conv.hasRecentFollowUp = true;
    conv.lastFollowUpAt = new Date().toISOString();
  }

  updateLastBotReply(userId) {
    const conv = this.getConversation(userId);
    conv.lastBotReplyAt = new Date().toISOString();
    conv.lastActive = Date.now(); // Also update activity
  }

  getMinutesSinceLastBotReply(userId) {
    const conv = this.getConversation(userId);
    if (!conv.lastBotReplyAt) return Infinity;
    return (Date.now() - new Date(conv.lastBotReplyAt).getTime()) / (1000 * 60);
  }

  /**
   * Save a user interest
   */
  addInterest(userId, interest) {
    const conv = this.getConversation(userId);
    if (!conv.userData.interests.includes(interest)) {
      conv.userData.interests.push(interest);
    }
  }

  /**
   * Get time since last message (in minutes)
   */
  getInactiveMinutes(userId) {
    const conv = this.getConversation(userId);
    return (Date.now() - conv.lastActive) / (1000 * 60);
  }

  /**
   * Check if user is new (first message)
   */
  isNewUser(userId) {
    return !this.conversations.has(userId);
  }

  /**
   * Get all conversations (for monitoring)
   */
  getAllConversations() {
    const result = {};
    for (const [userId, conv] of this.conversations) {
      result[userId] = {
        messageCount: conv.messageCount,
        lastActive: new Date(conv.lastActive).toISOString(),
        userData: conv.userData,
      };
    }
    return result;
  }

  /**
   * Clear a specific conversation
   */
  clearConversation(userId) {
    this.conversations.delete(userId);
  }

  /**
   * Get inactive users (for follow-up)
   */
  getInactiveUsers(minutes = config.INACTIVITY_TIMEOUT) {
    const inactive = [];
    const FOLLOWUP_COOLDOWN_HOURS = 24;
    
    for (const [userId, conv] of this.conversations) {
      const inactiveMin = (Date.now() - conv.lastActive) / (1000 * 60);
      
      // Check cooldown: skip if follow-up sent within last 24h
      let canSendFollowUp = true;
      if (conv.lastFollowUpAt) {
        const lastFollowUp = new Date(conv.lastFollowUpAt).getTime();
        const hoursSince = (Date.now() - lastFollowUp) / (1000 * 60 * 60);
        if (hoursSince < FOLLOWUP_COOLDOWN_HOURS) {
          canSendFollowUp = false;
        }
      }
      
      if (
        inactiveMin >= minutes &&
        conv.messageCount > 0 &&
        conv.userData.onboardingStatus === 'complete' &&
        canSendFollowUp
      ) {
        inactive.push({ 
          userId, 
          ...conv.userData, 
          inactiveMinutes: Math.round(inactiveMin),
          hoursSinceLastFollowUp: Math.round((Date.now() - (conv.lastFollowUpAt ? new Date(conv.lastFollowUpAt).getTime() : 0)) / (1000 * 60 * 60))
        });
      }
    }
    return inactive;
  }
}

module.exports = new ConversationStore();
