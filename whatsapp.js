require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const aiService = require('./aiService');
const intentHandler = require('./intentHandler');
const userStore = require('./userStore');
const conversationStore = require('./conversationStore');

// User states for analysis flow (phone -> state)
const userStates = new Map();

// Welcome message
const WELCOME_MSG = `*Namaste bhai! 🔥 Elite Fitness Coach yahan hu.* 

20+ saal ka experience, ISSA/ACE certified. 
Body transformation specialist - fat loss, muscle gain, contest prep, sab mein expert.

*FREE mein basic tips dunga, lekin real results ke liye premium coaching chahiye.*

Kya goal hai tera? 
1. Fat loss
2. Muscle gain 
3. Custom plan chahiye?

Reply kar, start karte hain! 💪`;

// Main menu text
const MAIN_MENU = `*Main Menu* 💪

1. Free Tips
2. Diet Advice  
3. Workout Plan
4. Supplements
5. Premium Plans 
6. My Progress

Reply number ya goal bata!`;

// Premium menu
const PREMIUM_MENU = `*Premium Services* 🔥

1. Custom Diet Chart - ₹1500
2. Monthly Nutrition - ₹1500/mo
3. Full Coaching - ₹2999/mo

*Bro serious ho to ye options dekho.*
Payment UPI: ${config.UPI_LINK}

Kaunsa chahiye?`;

// States for 12-point analysis
const ANALYSIS_STEPS = [
  'name', 'age', 'height', 'weight', 'goal', 'target_weight', 'timeline', 
  'veg_nonveg', 'food_budget', 'gym_home', 'schedule', 'medical', 'experience'
];

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Connected! Bot ready.');
    }
  });

  // Handle messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const isImage = !!msg.message.imageMessage;
    const imageUrl = isImage ? await sock.downloadMediaMessage(msg, 'buffer') : null;

    console.log(`[${sender}] ${text || '📷'}`);

    const userData = userStore.getUser(sender);
    const conv = conversationStore.getConversation(sender);
    const state = userStates.get(sender);

    // New chat welcome
    if (!conv.userData.onboardingStatus || conv.isNewUser(sender)) {
      await sock.sendMessage(from, { text: WELCOME_MSG });
      conversationStore.completeOnboarding(sender);
      return;
    }

    // Analysis flow
    if (state && state.step) {
      handleAnalysisStep(sock, from, sender, text, state);
      return;
    }

    // Photo analysis (premium users or progress)
    if (isImage && userData.premium_status) {
      const analysis = await aiService.analyzePhoto(imageUrl.toString('base64'), userData);
      await sock.sendMessage(from, { text: analysis });
      userStore.setUser(sender, { last_photo_analyzed: Date.now() });
      return;
    }

    // Intent & AI reply
    const { enhanced, intent } = intentHandler.enhanceMessage(sender, text);
    let reply = await aiService.generateReply(sender, enhanced, userData, intent);

    // Post-process modes
    if (intent.intent === 'subscription' || /plan\s*chahiye|serious|transform/i.test(text)) {
      reply += `\n\n${PREMIUM_MENU}`;
    } else if (/menu|main/i.test(text)) {
      reply = MAIN_MENU;
    }

    await sock.sendMessage(from, { text: reply });

    // Save interaction
    conversationStore.addMessage(sender, 'user', text);
    conversationStore.addMessage(sender, 'model', reply);
  });

  // Handle reactions etc. (optional)
  sock.ev.on('message.receipts.update', () => {});
}

function handleAnalysisStep(sock, from, sender, text, state) {
  const stepIndex = ANALYSIS_STEPS.indexOf(state.step);
  userStore.setUser(sender, { [`${state.step}`]: text });

  if (stepIndex === ANALYSIS_STEPS.length - 1) {
    // Complete analysis → Generate report
    userStates.delete(sender);
    const userData = userStore.getUser(sender);
    const report = generateFitnessReport(userData);
    const upsell = `Ye tera complete analysis hai bro! 🔥\n\nReal plan ke liye:\n${PREMIUM_MENU}`;
    sock.sendMessage(from, { text: report + '\n\n' + upsell });
    return;
  }

  // Next step
  const nextStep = ANALYSIS_STEPS[stepIndex + 1];
  userStates.set(sender, { step: nextStep });
  const questions = {
    name: '1. Naam bata?',
    age: '2. Age kitni hai?',
    height: '3. Height cm mein?',
    weight: '4. Current weight kg?',
    goal: '5. Goal kya? (fat loss/muscle/strength)',
    target_weight: '6. Target weight?',
    timeline: '7. Kitne mahine mein achieve karna hai?',
    veg_nonveg: '8. Veg/non-veg/eggitarian?',
    food_budget: '9. Monthly food budget kitna? (e.g. 5000)',
    gym_home: '10. Gym jaata hai ya home workout?',
    schedule: '11. Daily schedule? (job timings, sleep)',
    medical: '12. Koi medical issue? (thyroid/BP etc)',
    experience: '13. Experience level? (beginner/intermediate)'
  };
  sock.sendMessage(from, { text: questions[nextStep] || 'Thanks! Profile saved.' });
}

function generateFitnessReport(userData) {
  // Placeholder - full impl in premiumHandler later
  return `*CLIENT FITNESS REPORT*

Name: ${userData.name || 'N/A'}
Goal: ${userData.goal || 'N/A'}
Current Weight: ${userData.weight}kg
... (full format later)

Detailed plan premium mein milega! 💪`;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  process.exit(0);
});

startBot().catch(console.error);

console.log('🚀 Elite Fitness Coach Bot starting... Scan QR when shown.');

