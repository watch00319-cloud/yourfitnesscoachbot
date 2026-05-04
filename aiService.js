const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const userStore = require('./userStore');
const { parseFitnessDetails } = require('./profileParser');

class AIService {
  constructor() {
    this.genAI = null;
    this.textModel = null;
    
    if (config.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        this.textModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('✅ Gemini Premium AI Ready');
      } catch (error) {
        console.log('⚠️ Gemini setup failed - Professional fallback active');
      }
    } else {
      console.log('✅ Professional Fallback Mode - Premium Tone');
    }
  }

  async generateReply(from, userMessage, userData = {}) {
    const normalized = userMessage.toLowerCase().trim();
    const parsedDetails = parseFitnessDetails(userMessage);
    const effectiveUserData = { ...userData, ...parsedDetails };

    if (this.isFirstContact(effectiveUserData)) {
      return this.firstMessage();
    }

    if (this.hasProfileUpdate(parsedDetails)) {
      return this.profileProgressReply(effectiveUserData, parsedDetails);
    }

    if (this.isGoalReply(normalized)) {
      return this.goalReply(normalized, effectiveUserData);
    }

    if (this.isPaidServiceQuestion(normalized) && !effectiveUserData._canOfferPaid) {
      return this.earlyPaidServiceReply();
    }

    // Try Gemini first
    if (this.genAI) {
      try {
        const chat = this.textModel.startChat({
          systemInstruction: { parts: [{ text: config.SYSTEM_PROMPT }] }
        });
        
        const result = await chat.sendMessage(userMessage);
        let reply = await result.response.text();
        
        // Premium polish
        reply = reply.slice(0, 350);
        return this.formatPremiumReply(reply);
        
      } catch (error) {
        console.log('Gemini fallback:', error.message);
      }
    }

    // **Premium Professional Fallbacks**
    return this.getPremiumFallback(normalized, effectiveUserData);
  }

  isFirstContact(userData) {
    return userData._isNewUser === true || !userData.lastActive;
  }

  isGoalReply(message) {
    return /(weight loss|fat loss|loss|slim|pet|muscle gain|gain|bulk|diet|better diet|transform|transformation)/i.test(message);
  }

  isPaidServiceQuestion(message) {
    return /(price|cost|rate|kitna|rupee|₹|fees|charges|payment|paid|premium|package|plan)/i.test(message);
  }

  hasProfileUpdate(details) {
    return ['weight', 'height', 'age', 'gender', 'goal']
      .some(field => details[field]);
  }

  firstMessage() {
    return `Tell me your goal:\n• Weight loss?\n• Muscle gain?\n• Better diet?\n• Full transformation?\n\nProfessional guidance available.`;
  }

  quickFitnessCheck() {
    return `Tell me your goal:\n• Weight loss?\n• Muscle gain?\n• Better diet?\n• Full transformation?\n\nProfessional guidance available.`;
  }

  earlyPaidServiceReply() {
    return `Premium details share karne se pehle main aapko ek free basic plan bana deta hoon.\n\nYe details bhej do:\n• Name\n• Age\n• Gender\n• Height\n• Weight\n• Goal\n• Activity level\n• Food preference\n• Any medical condition\n\nUske baad main FREE BASIC PLAN dunga, phir aap PREMIUM choose kar sakte ho.`;
  }

  goalReply(message, userData = {}) {
    const nextQuestion = this.nextProfileQuestion(userData);

    if (/(weight loss|fat loss|loss|slim|pet)/i.test(message)) {
      return `Great choice! Weight loss is a popular goal that I can definitely help you with.\n\nHere are 2 useful free tips to get started:\n• Keep a small calorie deficit daily\n• Add protein with each meal to stay full\n\n${nextQuestion}`;
    }

    if (/(muscle gain|gain|bulk|muscle)/i.test(message)) {
      return `Great choice! Muscle gain is an excellent goal for your physique.\n\nHere are 2 useful free tips to get started:\n• Eat enough protein (1.6-2g per kg bodyweight)\n• Train with progressive overload each week\n\n${nextQuestion}`;
    }

    if (/(diet|better diet|meal|khana)/i.test(message)) {
      return `Great choice! Improving your diet is the foundation of good health.\n\nHere are 2 useful free tips to get started:\n• Include protein in every meal for balance\n• Keep home-style foods simple and nutritious\n\n${nextQuestion}`;
    }

    return `Great choice! A full transformation will change how you look and feel.\n\nHere are 2 useful free tips to get started:\n• Keep your meals organized and consistent\n• Train regularly with both cardio and strength\n\n${nextQuestion}`;
  }

  profileProgressReply(userData, updatedDetails = {}) {
    const acknowledgements = [];

    if (userData.weight && userData.height && (updatedDetails.weight || updatedDetails.height)) {
      acknowledgements.push(`Thank you for sharing. Your current weight is ${userData.weight} kg and height is ${userData.height}.`);
    } else {
      if (updatedDetails.weight && userData.weight) acknowledgements.push(`Noted, your current weight is ${userData.weight} kg.`);
      if (updatedDetails.height && userData.height) acknowledgements.push(`Noted, your height is ${userData.height}.`);
    }

    if (updatedDetails.age && userData.age) acknowledgements.push(`Noted, your age is ${userData.age}.`);
    if (updatedDetails.gender && userData.gender) acknowledgements.push(`Noted, gender is ${userData.gender}.`);
    if (updatedDetails.goal && userData.goal) acknowledgements.push(`Great, your goal is ${userData.goal}.`);

    const valueTip = this.smallValueTip(userData);
    const nextQuestion = this.nextProfileQuestion(userData);

    return `${acknowledgements.join('\n')}\n\n${valueTip}\n\n${nextQuestion}`.trim();
  }

  smallValueTip(userData) {
    const goal = String(userData.goal || '').toLowerCase();
    if (goal.includes('loss')) {
      return 'Small tip: For fat loss, protein and daily steps make the calorie deficit easier to maintain.';
    }
    if (goal.includes('gain')) {
      return 'Small tip: For muscle gain, progressive training and enough protein matter more than random supplements.';
    }
    return 'Small tip: Tracking simple basics like meals, steps, and sleep helps me guide you more accurately.';
  }

  nextProfileQuestion(userData) {
    if (!userData.weight || !userData.height) {
      return 'What is your current weight and height?';
    }

    if (!userData.age || !userData.gender) {
      return 'Next, may I know your age and gender? This will help me give better suggestions.';
    }

    if (!userData.goal) {
      return 'What is your main goal right now: weight loss, muscle gain, better diet, or full transformation?';
    }

    if (!userData.timeline) {
      return 'What timeline do you have in mind for this goal?';
    }

    if (!userData.veg_nonveg) {
      return 'Are you vegetarian or non-vegetarian?';
    }

    return 'How many days per week can you work out?';
  }

  formatPremiumReply(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/```[\s\S]*?```/g, '')
      .trim()
      .slice(0, 400);
  }

  getPremiumFallback(message, userData) {
    if (this.isGoalReply(message)) {
      return this.goalReply(message, userData);
    }

    if (message.includes('diet') || message.includes('meal') || message.includes('khana')) {
      return `Tell me your current diet habits:\n• Vegetarian or non-vegetarian?\n• Any foods you avoid?\n• What do you eat on a normal day?\n\nProfessional guidance available.`;
    }

    if (message.includes('weight') || message.includes('height')) {
      return `Tell me your current weight and height.\n\nProfessional guidance available.`;
    }

    if (message.includes('age') || message.includes('gender')) {
      return `Tell me your age and gender.\n\nProfessional guidance available.`;
    }

    if (message.includes('medical') || message.includes('injury') || message.includes('pain')) {
      return `Do you have any medical conditions or injuries?\n\nProfessional guidance available.`;
    }

    if (message.includes('days') || message.includes('week') || message.includes('workout')) {
      return `How many days per week can you work out?\n\nProfessional guidance available.`;
    }

    if (message.includes('price') || message.includes('premium') || message.includes('plan')) {
      return this.earlyPaidServiceReply();
    }

    return this.quickFitnessCheck();
  }
}

module.exports = new AIService();
