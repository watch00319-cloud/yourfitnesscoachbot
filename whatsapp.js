require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const aiService = require('./aiService');
const intentHandler = require('./intentHandler');
const userStore = require('./userStore');
const conversationStore = require('./conversationStore');

// Global user states for analysis (phone -> {step: number})
const userStates = new Map();

// Text constants
const WELCOME_MSG = `*Namaste bhai! 🔥 Elite Fitness Coach yahan.*\n\n20+ saal experience, ISSA/ACE certified.\nFat loss, muscle gain, contest prep - sab expert.\n\n*Free basic tips, premium mein real transformation.*\n\nGoal bata: fat loss, muscle gain, ya custom plan chahiye? 💪`;

const MAIN_MENU = `*Main Menu* 💪\n\n1. Free Tips\n2. Diet Advice\n3. Workout Plan\n4. Supplements\n5. *Premium Plans*\n6. My Progress\n\nNumber reply kar ya goal bata!`;

const PREMIUM_MENU = `*Premium Services 🔥*\n\n1. Custom Diet Chart = ₹1500\n2. Monthly Nutrition Support = ₹1500/mo\n3. Full Personal Coaching = ₹2999/mo\n\n*Serious transformation ke liye ye packages.*\nUPI: ${config.UPI_LINK}\n\nKaunsa chahiye bro?`;

const ANALYSIS_STEPS = ['name', 'age', 'height', 'weight', 'goal', 'target_weight', 'timeline', 'veg_nonveg', 'food_budget', 'gym_home', 'schedule', 'medical', 'experience'];

const ANALYSIS_QUESTIONS = {
  name: '1. Apna naam bata?',
  age: '2. Age kitni?',
  height: '3. Height cm mein?',
  weight: '4. Current weight kg?',
  goal: '5. Main goal? (fat loss/muscle/strength)',
  target_weight: '6. Target weight?',
  timeline: '7. Kitne months mein?',
  veg_nonveg: '8. Veg/Non-veg/Eggitarian?',
  food_budget: '9. Monthly food budget?',
  gym_home: '10. Gym ya home workout?',
  schedule: '11. Daily schedule?',
  medical: '12. Medical issues?',
  experience: '13. Experience level?'
};

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: false,
    browser: ['Elite Coach', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n📱 **SCAN QR TO LOGIN:**');
      qrcode.generate(qr, { small: true });
      console.log('\n');
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log('Disconnected:', statusCode);
      if (statusCode !== DisconnectReason.loggedOut) {
        startBot();
      }
    } 
    if (connection === 'open') {
      console.log('✅ **WhatsApp Connected!** Test with "hi"');
    }
  });

  // Messages handler
  sock.ev.on('messages.upsert', async ({ messages: [msg] }) => {
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = from.endsWith('@g.us') ? msg.key.participant : from;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const isImage = msg.message.imageMessage;
    
    if (!text && !isImage) return;

    console.log(`[Msg from ${sender.split('@')[0]}]: ${text || '📸 Photo'}`);

    const userData = userStore.getUser(sender);
    const analysisState = userStates.get(sender);

    // Welcome new user
    if (conversationStore.isNewUser(sender)) {
      await sock.sendMessage(from, { text: WELCOME_MSG });
      conversationStore.completeOnboarding(sender);
      return;
    }

    // Analysis flow active
    if (analysisState?.step !== undefined) {
      const step = analysisState.step;
      const field = ANALYSIS_STEPS[step];
      userStore.setUser(sender, { [field]: text });

      if (step >= 12) {
        userStates.delete(sender);
        const report = require('./premiumHandler').generateReport(sender);
        await sock.sendMessage(from, { text: report });
        return;
      }

      // Next question
      const next = step + 1;
      userStates.set(sender, { step: next });
      const question = ANALYSIS_QUESTIONS[ANALYSIS_STEPS[next]];
      await sock.sendMessage(from, { text: question });
      return;
    }

    // Premium photo analysis
    if (isImage && userData.premium_status) {
      const buffer = await sock.downloadMediaMessage(msg);
      const analysis = await aiService.analyzePhoto(buffer.toString('base64'), userData);
      await sock.sendMessage(from, { text: analysis });
      return;
    }

    // Quick menus
    if (/menu|main|1|2|3|4|5|6/i.test(text)) {
      const menu = /5|premium|paid|upgrade/i.test(text) ? PREMIUM_MENU : MAIN_MENU;
      await sock.sendMessage(from, { text: menu });
      return;
    }

    if (/report|profile|analysis/i.test(text)) {
      const report = require('./premiumHandler').generateReport(sender);
      await sock.sendMessage(from, { text: report });
      return;
    }

    // AI logic
    const { enhanced, intent } = intentHandler.enhanceMessage(sender, text);

    // Auto-start analysis on goals/sales
    if ((intent.intent === 'fitness_goal' || intent.intent === 'sales_trigger') && !userData.analysis_complete) {
      userStates.set(sender, { step: 0 });
      await sock.sendMessage(from, { text: ANALYSIS_QUESTIONS.name });
      return;
    }

    let reply = await aiService.generateReply(sender, enhanced, userData, intent);

    // Smart CTAs
    if (intent.intent === 'subscription' || intent.intent === 'sales_trigger') {
      reply += `\n\n${PREMIUM_MENU}`;
    }

    await sock.sendMessage(from, { text: reply });
    conversationStore.addMessage(sender, 'user', text);
    conversationStore.addMessage(sender, 'model', reply);
  });

  console.log('🔄 Connecting to WhatsApp... QR will appear shortly.');
  return sock;
}

// Start bot
startBot().catch(console.error);

