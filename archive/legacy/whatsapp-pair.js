require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const PHONE_NUMBER = '919888601933'; // User's number
const AUTH_DIR = './auth_pair';
const PORT = process.env.PORT || 3000;

// Clean auth if first run
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  console.log('📁 New auth dir created');
} else {
  console.log('📁 Using existing auth');
}

// Status server (port 3000)
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send(`WhatsApp Bot Status: <strong>Running on ${PHONE_NUMBER}</strong><br>Check terminal for pairing code.`));
app.listen(PORT, () => console.log(`🌐 Status: http://localhost:${PORT}`));

let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECTS = 5;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    const logger = pino({ level: 'silent' });
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      keepAliveIntervalMs: 30000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, pairingCode } = update;
      
      if (pairingCode) {
        const code = pairingCode;
        console.log(`\\n🔗 PAIRING CODE: ${code}`);
        console.log(`📱 WhatsApp > Linked Devices > Link with Phone Number > Enter: ${code}`);
        return;
      }
      
      if (qr) {
        console.log('QR fallback (rare)');
        // Handle QR if needed
        return;
      }
      
      if (connection === 'connecting') {
        console.log('🔄 Connecting...');
        return;
      }
      
      if (connection === 'open') {
        console.log('✅ WhatsApp Connected!');
        reconnectAttempts = 0;
        rl.close();
        return;
      }
      
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('❌ Disconnected:', code, DisconnectReason[code] || 'UNKNOWN');
        
        if (code !== DisconnectReason.loggedOut && reconnectAttempts < MAX_RECONNECTS) {
          reconnectAttempts++;
          console.log(`🔄 Reconnect ${reconnectAttempts}/${MAX_RECONNECTS} in 5s...`);
          setTimeout(connectToWhatsApp, 5000);
        } else {
          console.log('💀 Max retries. Run again.');
        }
      }
    });

    // Request pairing code for this phone
    const phone = PHONE_NUMBER + '@s.whatsapp.net';
    console.log(`📲 Using phone: ${PHONE_NUMBER}`);
    await sock.requestPairingCode(phone);
    
    // Message handler stub (add your logic)
    sock.ev.on('messages.upsert', ({ messages }) => {
      console.log('📨 Message received');
      // aiService, etc.
    });

  } catch (error) {
    console.error('❌ Connect error:', error.message);
    setTimeout(connectToWhatsApp, 10000);
  }
}

console.log('🚀 Starting WhatsApp Bot with Pairing Code...');
connectToWhatsApp();

process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down');
  process.exit(0);
});
