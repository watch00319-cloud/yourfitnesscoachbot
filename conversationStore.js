const config = require('./config');

/**
 * Conversation Store - Enhanced for fitness analysis flow
 */
class ConversationStore {
  constructor() {
    this.conversations = new Map();
    this.globalAIEnabled = true;
  }

  getConversation(phone) {
    if (!this.conversations.has(phone)) {
      this.conversations.set(phone, {
        history: [],
        userData: {
          firstContact: new Date().toISOString(),
          onboardingStatus: 'none',
          analysis_step: 0,  // 0-12 for analysis flow
          premium_pitch_count: 0,
          last_pitch: null
        },
        lastActive: Date.now(),
        messageCount: 0
      });
    }
    return this.conversations.get(phone);
  }

  addMessage(phone, role, content) {
    const conv = this.getConversation(phone);
    conv.history.push({ role, content, timestamp: Date.now() });
    if (conv.history.length > 20) conv.history = conv.history.slice(-20);
    conv.lastActive = Date.now();
    conv.messageCount++;
    return conv;
  }

  getHistory(phone) {
    return this.getConversation(phone).history;
  }

  updateAnalysisStep(phone, step) {
    const conv = this.getConversation(phone);
    conv.userData.analysis_step = step;
    if (step >= 12) {
      conv.userData.analysis_complete = true;
    }
  }

  resetAnalysis(phone) {
    const conv = this.getConversation(phone);
    conv.userData.analysis_step = 0;
    conv.userData.analysis_complete = false;
  }

  isNewUser(phone) {
    return this.conversations.has(phone) === false || 
           this.getConversation(phone).messageCount === 0;
  }

  canPitchPremium(phone) {
    const conv = this.getConversation(phone);
    const hoursSince = (Date.now() - (conv.userData.last_pitch || 0)) / (1000 * 60 * 60);
    return hoursSince > 1 && conv.userData.premium_pitch_count < 3;
  }

  markPitchSent(phone) {
    const conv = this.getConversation(phone);
    conv.userData.premium_pitch_count++;
    conv.userData.last_pitch = Date.now();
  }

  getInactivePremiumUsers() {
    const now = Date.now();
    return Array.from(this.conversations.entries())
      .filter(([phone, conv]) => {
        const daysInactive = (now - conv.lastActive) / (1000 * 60 * 60 * 24);
        return daysInactive > 7 && conv.userData.premium_status;
      })
      .map(([phone, conv]) => phone);
  }
}

module.exports = new ConversationStore();

