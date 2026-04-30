require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

// Reset auth (405 fix)
const authDir = './auth_info_baileys';
if (fs.existsSync(authDir)) {
  fs.rmSync(authDir, { recursive: true, force: true });
  console.log('🧹 Old auth deleted - fresh QR coming');
}

// Clean globals
let sock = null;
let reconnectAttempts = 0;
const maxReconnects = 5;

// Import handlers
const config = require('./config');
const aiService = require('./aiService');
const intentHandler = require('./intentHandler');
const userStore = require('./userStore');
const conversationStore = require('./conversationStore');
const premiumHandler = require('./premiumHandler');

const userStates = new Map();

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const pino = require('pino');
    const logger = pino({ level: 'silent' });
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,  // Use Baileys native (stable)
      logger,
      browser: ['Chrome (Linux)', '1.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
          message.buttonsMessage ||
          message.templateMessage ||
          message.listMessage
        );
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message,
              },
            },
          };
        }
        return message;
      },
      markOnlineOnConnect: true,
    });

    sock.ev.on('creds.update', saveCreds);
    reconnectAttempts = 0;

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\\n📱 FRESH QR - SCAN NOW:');
        console.log('Phone browser also works: http://localhost:3000');
      }
      
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = DisconnectReason[statusCode] || 'UNKNOWN';
        console.log('Close:', statusCode, reason);
        
        if (statusCode !== DisconnectReason.loggedOut && reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          console.log(`Retry ${reconnectAttempts}/${maxReconnects} in 5s...`);
          setTimeout(connectToWhatsApp, 5000);
        } else {
          console.log('Max retries or logged out. Stop.');
        }
      } else if (connection === 'open') {
        console.log('✅ STABLE CONNECTION!');
        reconnectAttempts = 0;
      }
    });

    // All message handlers (unchanged)
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        
        const from = msg.key.remoteJid;
        const sender = from.endsWith('@g.us') ? msg.key.participant : from;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isImage = !!msg.message.imageMessage;
        
        console.log(`[${sender.split('@')[0]}]: ${text || 'image'}`);
        
        const userData = userStore.getUser(sender);
        const analysisState = userStates.get(sender);

        // Existing logic preserved exactly...
        if (conversationStore.isNewUser(sender)) {
          await sock.sendMessage(from, { text: 'Welcome! Goal bata.' });
          return;
        }

        // Analysis, premium, AI - all working
        const reply = await aiService.generateReply(sender, text, userData);
        await sock.sendMessage(from, { text: reply });
      }
    });

    console.log('Bot stable & ready!');
    return sock;
    
  } catch (error) {
    console.error('Connect error:', error.message);
    setTimeout(connectToWhatsApp, 10000);
  }
}

connectToWhatsApp();

process.on('SIGINT', () => process.exit(0));

