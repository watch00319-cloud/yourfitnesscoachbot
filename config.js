require('dotenv').config();

module.exports = {
  // Telegram Bot API
TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8754517074:AAHc06U_tVTbpqK1Flt4R--8i8gd9-6gDwU',

  // Gemini API (for personalized AI responses)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Business Info
  BUSINESS_NAME: process.env.BUSINESS_NAME || 'FitCoach AI',
  OWNER_CHAT_ID: process.env.OWNER_CHAT_ID || '', // Telegram chat ID for notifications

  // Premium Settings
  PREMIUM_PRICE: process.env.PREMIUM_PRICE || '₹499',
  PREMIUM_UPI: process.env.PREMIUM_UPI || 'yourupi@bank',

  // User data persistence (simple JSON file)
  USER_DATA_FILE: './user-data.json',

  // Engagement timers (minutes)
  DAILY_TIP_INTERVAL: 1440, // 24 hours
  MOTIVATION_INTERVAL: 360, // 6 hours
  PROGRESS_CHECK_INTERVAL: 720, // 12 hours

  // System prompt for AI personalization
  SYSTEM_PROMPT: `You are FitCoach AI, a professional Telegram fitness coach. 
Tone: Friendly, motivating, authoritative. Use short sentences, emojis sparingly.
Always suggest next actionable step.
When upgrading to premium, be helpful first, then soft CTA.
Format for Telegram: use *bold* and _italic_ correctly.
Never say you are AI/bot.
Premium benefits: Custom diet, weekly tracking, 1-1 support, advanced plans.`,
};
