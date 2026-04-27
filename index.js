require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const aiService = require('./aiService');
const userStore = require('./userStore');

// Init bot
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });
console.log('🚀 FitCoach Telegram Bot LIVE! /start to test.');

// User states
const userStates = new Map();

// Main Menu
const mainMenuKeyboard = {
  inline_keyboard: [
    [{ text: '📋 Get Free Plan', callback_data: 'free_plan' }],
    [{ text: '💪 Workout Plan', callback_data: 'workout' }, { text: '🍎 Diet Plan', callback_data: 'diet' }],
    [{ text: '💊 Supplements', callback_data: 'supplements' }],
    [{ text: '⭐ Upgrade Premium', callback_data: 'premium' }, { text: '💬 Talk Coach', callback_data: 'coach' }],
    [{ text: '🏆 My Progress', callback_data: 'progress' }, { text: '👥 Refer', callback_data: 'refer' }]
  ]
};

// Goal buttons
const goalKeyboard = {
  inline_keyboard: [
    [{ text: '🥗 Lose Weight', callback_data: 'goal_lose' }],
    [{ text: '💪 Gain Muscle', callback_data: 'goal_gain' }],
    [{ text: '⚖️ Stay Fit', callback_data: 'goal_fit' }],
    [{ text: 'Main Menu', callback_data: 'main_menu' }]
  ]
};

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStore.setUser(chatId, {});
  userStates.delete(chatId);
  const welcome = `*Welcome to FitCoach AI!*\\\\n\\\\n` +
    `Your personal fitness coach ready to transform you.\\\\n` +
    `💥 *Fast results* with science\\-backed plans\\\\n` +
    `✅ *Personalized* for your goal & body\\\\n\\\\n` +
    `*What\\'s your main goal?*`;
  bot.sendMessage(chatId, welcome, { parse_mode: 'MarkdownV2', reply_markup: goalKeyboard });
});

bot.onText(/\/plan/, (msg) => showMainMenu(msg.chat.id));
bot.onText(/\/upgrade/, (msg) => showPremium(msg.chat.id));
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, '*Commands:*\\\\n/start \\- Begin\\\\n/plan \\- Main menu\\\\n/upgrade \\- Premium', { parse_mode: 'MarkdownV2' });
});

// Buttons
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  bot.answerCallbackQuery(query.id);

  const userData = userStore.getUser(chatId);

  if (data.startsWith('goal_')) {
    const goal = data.split('_')[1];
    userStore.setUser(chatId, { goal, onboardingStep: 'weight' });
    userStates.set(chatId, { step: 'weight', tempData: { goal } });
    bot.sendMessage(chatId, '*Great choice!*\\\\n\\\\nNow enter your *weight* (kg, e\\\\.g\\\\. 70):', { parse_mode: 'MarkdownV2' });
  } else if (data === 'main_menu') {
    showMainMenu(chatId);
  } else if (['free_plan', 'workout', 'diet', 'supplements', 'coach'].includes(data)) {
    const prompts = {
      free_plan: 'Free starter plan based on my goal.',
      workout: 'Simple 3-day workout routine for my goal.',
      diet: '7-day meal plan, easy recipes, grocery list.',
      supplements: 'Basic supplement guide for beginners.',
      coach: 'Ask fitness question.'
    };
    const reply = await aiService.generateReply(chatId, prompts[data], userData);
    bot.sendMessage(chatId, reply, { parse_mode: 'MarkdownV2', reply_markup: mainMenuKeyboard });
  } else if (data === 'premium') {
    showPremium(chatId);
  } else if (data === 'progress') {
    const streak = userStore.updateStreak(chatId);
    bot.sendMessage(chatId, `*Your Progress*\\\\n\\\\n🏆 *Streak:* ${streak} days\\\\n⭐ *Goal:* ${userData.goal || 'Set goal'} \\\\n📊 *Weight:* ${userData.weight || 'Update'}\\\\n\\\\nKeep going! 💪`, { parse_mode: 'MarkdownV2', reply_markup: mainMenuKeyboard });
  } else if (data === 'refer') {
    let code = userData.referralCode;
    if (!code) code = userStore.generateReferral(chatId);
    const refMsg = `*Refer & Earn!*\\\\n\\\\nYour code: \\\`${code}\\\`\\\\nShare: t\\\\.me/YourBot\\?start\\\\=${code}\\\\n\\\\n*Reward:* Free week premium per referral!`;
    bot.sendMessage(chatId, refMsg, { parse_mode: 'MarkdownV2', reply_markup: mainMenuKeyboard });
  }
});

// Text messages (onboarding or AI)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text && msg.text.startsWith('/')) return;

  const state = userStates.get(chatId);
  if (!state) {
    const aiReply = await aiService.generateReply(chatId, msg.text || 'Hi', userStore.getUser(chatId));
    bot.sendMessage(chatId, aiReply, { parse_mode: 'MarkdownV2', reply_markup: mainMenuKeyboard });
    return;
  }

  const value = parseFloat(msg.text);
  if (isNaN(value)) {
    bot.sendMessage(chatId, 'Please enter a *number*! Try again.', { parse_mode: 'MarkdownV2' });
    return;
  }

  const tempData = state.tempData;
  switch (state.step) {
    case 'weight':
      tempData.weight = value;
      userStates.set(chatId, { ...state, step: 'height' });
      bot.sendMessage(chatId, 'Perfect! Now your *height* (cm, e\\\\.g\\\\. 170):', { parse_mode: 'MarkdownV2' });
      break;
    case 'height':
      tempData.height = value;
      userStates.set(chatId, { ...state, step: 'age' });
      bot.sendMessage(chatId, 'Got it! Your *age*?:', { parse_mode: 'MarkdownV2' });
      break;
    case 'age':
      tempData.age = value;
      userStore.setUser(chatId, tempData);
      userStates.delete(chatId);
      bot.sendMessage(chatId, '*Profile Saved!* 💪\\\\n\\\\nTap *Main Menu* for plans.', { parse_mode: 'MarkdownV2', reply_markup: mainMenuKeyboard });
      break;
  }
});

// Helpers
function showMainMenu(chatId) {
  bot.sendMessage(chatId, '*Main Menu*\\\\n\\\\nTap button for your need:\\n*Free plans* or *Upgrade* for custom!', { parse_mode: 'MarkdownV2', reply_markup: mainMenuKeyboard });
}

function showPremium(chatId) {
  const table = `*FREE vs PREMIUM* \\\\(₹${config.PREMIUM_PRICE}/month\\\\)\\\\n\\\\n` +
    `*FREE*          | *PREMIUM*\\\\n` +
    `---             | ---\\\\n` +
    `Basic plans     | Custom diet\\\\n` +
    `General workout | Weekly tracking\\\\n` +
    `---             | ---\\\\n` +
    `                | 1:1 Coach calls\\\\n` +
    `                | Advanced plans\\\\n\\\\n` +
    `\\*Limited:* 50\\% off first month!`;
  const keyboard = {
    inline_keyboard: [[{ text: '🚀 Upgrade Now', callback_data: 'premium_pay' }], [{ text: 'Main Menu', callback_data: 'main_menu' }]]
  };
  bot.sendMessage(chatId, table, { parse_mode: 'MarkdownV2', reply_markup: keyboard });
}

// Automations stub
setInterval(() => console.log('📅 Daily tips cron...'), 6 * 60 * 60 * 1000);

console.log('✅ Bot ready! Message /start in Telegram.');
