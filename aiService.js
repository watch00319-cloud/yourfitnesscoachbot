const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const userStore = require('./userStore');

/**
 * AI Service - Telegram Fitness Coach with Gemini
 */
class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    this.quotaMessageCount = new Map();
    console.log('✅ AI Service ready for Telegram');
  }

  async generateReply(chatId, userMessage, userData = {}) {
    try {
      // Simple history from userStore (last 10 messages if stored)
      const history = []; // Extend later with message store

      const chat = this.model.startChat({
        history,
        systemInstruction: { parts: [{ text: config.SYSTEM_PROMPT }] }
      });

      const enhancedMessage = this.enhanceWithUserData(userMessage, userData);
      const result = await chat.sendMessage(enhancedMessage);
      const response = await result.response;
      let replyText = response.text();

      const cleaned = this.cleanForTelegram(replyText);
      userStore.setUser(chatId, { lastAIResponse: cleaned });
      return cleaned;
    } catch (error) {
      console.error('AI error:', error.message);
      return this.buildFallbackReply(userMessage, userData);
    }
  }

  enhanceWithUserData(message, data) {
    const context = [];
    if (data.goal) context.push(`Goal: ${data.goal}`);
    if (data.weight) context.push(`Weight: ${data.weight}kg, Height: ${data.height}cm, Age: ${data.age}`);
    return context.length ? `${message}\n\nUser context: ${context.join(', ')}` : message;
  }

  cleanForTelegram(text) {
    // Telegram MarkdownV2 escape
    const escape = (str) => str.replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1');
    return escape(text)
      .replace(/\*\*(.*?)\*\*/g, '*\\*$1\\*') // Bold safe
      .replace(/##?\s*/g, '')
      .trim();
  }

  buildFallbackReply(message, data) {
    const normalized = message.toLowerCase();
    if (/(diet|meal)/.test(normalized)) return '*Diet Plan*\\n✅ High protein meals\\nTap *Diet Plan* button for details';
    if (/(workout)/.test(normalized)) return '*Workout*\\n💪 3x week full body\\nTap *Workout Plan*';
    return 'Tap *Main Menu* for your options! 💪';
  }
}

module.exports = new AIService();
