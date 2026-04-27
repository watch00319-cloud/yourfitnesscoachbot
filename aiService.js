const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const userStore = require('./userStore');

/**
 * Elite AI Service - WhatsApp Fitness Coach with Gemini Vision & Modes
 */
class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log('✅ Elite AI Service ready (Text + Vision)');
  }

  async generateReply(from, userMessage, userData = {}, intent = {}) {
    try {
      const history = []; // TODO: integrate conversationStore
      const modeContext = this.getModeContext(userData, intent, userMessage);

      const chat = this.textModel.startChat({
        history,
        systemInstruction: { 
          parts: [{ 
            text: config.SYSTEM_PROMPT + '\n\n' + modeContext 
          }] 
        }
      });

      const enhanced = this.enhanceWithUserData(userMessage, userData);
      const result = await chat.sendMessage(enhanced);
      const response = await result.response;
      let reply = response.text();

      // Enforce concise for free mode
      if (!userData.premium_status) {
        reply = reply.slice(0, 300) + '\n\nPremium ke liye full plan chahiye? 🔥';
      }

      // Format report for premium
      if (intent.intent === 'premium_report' || userData.analysis_complete) {
        reply = this.formatFitnessReport(reply, userData);
      }

      userStore.setUser(from, { lastAIResponse: reply });
      return this.cleanForWhatsApp(reply);
    } catch (error) {
      console.error('AI error:', error.message);
      return this.buildFallbackReply(userMessage, userData, intent);
    }
  }

  getModeContext(userData, intent, message) {
    const lowerMsg = message.toLowerCase();
    let context = '';

    // Sales mode detect
    if (intent.intent === 'subscription' || /serious|plan\s*chahiye|transform|body\s*bana|personal\s*coach/i.test(lowerMsg)) {
      context += '\nSALES MODE: Upsell ethically. Use exact pricing/services from config. Build trust first.';
    }

    // Anabolic mode
    if (/steroid|anabolic|test|cycle|trt|pct|gear/i.test(lowerMsg)) {
      context += '\nANABOLIC MODE: Education only. Stress risks, bloodwork, PCT, doctor supervision. Recommend natural first. Harm reduction.';
    }

    // Free mode
    if (!userData.premium_status) {
      context += '\nFREE MODE: Short tips ONLY. No full plans. Always end with premium CTA.';
    } else {
      context += '\nPREMIUM MODE: Full detailed guidance. Use CLIENT FITNESS REPORT format.';
    }

    // Retention
    if (userData.premium_status && !userData.last_checkin) {
      context += '\nRETENTION: Ask weight/energy/sleep/diet adherence/photos.';
    }

    return context;
  }

  async analyzePhoto(imageBase64, userData) {
    try {
      const prompt = `Analyze this fitness progress photo. Expert coach view:
- Posture analysis
- Fat storage patterns 
- Muscle imbalances/weakness
- Conditioning/definition level
- Visible improvements
- 7-day correction plan

User context: ${JSON.stringify(userData)}
Output in Hinglish.`;

      const result = await this.visionModel.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
      ]);
      return this.cleanForWhatsApp(result.response.text());
    } catch (error) {
      return 'Photo analysis: Good progress bhai! Weight/measurements update kar. 💪 Premium mein detailed breakdown milega.';
    }
  }

  enhanceWithUserData(message, data) {
    const context = [];
    if (data.goal) context.push(`Goal: ${data.goal}`);
    if (data.weight) context.push(`Weight: ${data.weight}kg`);
    if (data.height) context.push(`Height: ${data.height}cm`);
    if (data.age) context.push(`Age: ${data.age}`);
    if (data.veg_nonveg) context.push(`Diet: ${data.veg_nonveg}`);
    if (data.premium_status) context.push('Premium client');
    return context.length ? `${message}\n\nUser profile: ${context.join(', ')}` : message;
  }

  formatFitnessReport(content, userData) {
    return `*CLIENT FITNESS REPORT* 🔥

Name: ${userData.name || 'N/A'}
Goal: ${userData.goal || 'N/A'}
Current Weight: ${userData.weight || 'N/A'}kg
Target Weight: ${userData.target_weight || 'N/A'}kg  
Timeline: ${userData.timeline || 'N/A'} months
Veg/Non-Veg: ${userData.veg_nonveg || 'N/A'}
Gym/Home: ${userData.gym_home || 'N/A'}

Main Problems: 
Metabolism Estimate: 
Calorie Range: 
Protein Target: 

Recommended Plan:
${content}`;
  }

  cleanForWhatsApp(text) {
    // WhatsApp markdown: *bold*, _italic_, ~strikethrough~
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/```/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  buildFallbackReply(message, data, intent) {
    const normalized = message.toLowerCase();
    if (/(diet|khana|meal)/.test(normalized)) {
      return 'Diet tip: Roz 1.6-2.2g protein/kg bodyweight. Premium mein full chart! 🔥';
    }
    if (/(workout|kasrat)/.test(normalized)) {
      return 'Workout: 3x week full body. Push/pull/legs. Form perfect rakh! 💪';
    }
    if (intent.intent === 'subscription') {
      return `${config.SERVICES.FULL_COACHING.desc} - ${config.SERVICES.FULL_COACHING.price}\nUPI bhej!`;
    }
    return `${MAIN_MENU}\n\nFree tips yahan, premium results wahan!`;
  }
}

module.exports = new AIService();

