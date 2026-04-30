require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const PHONE_NUMBER = '+919888601933'; // Fixed format
const AUTH_DIR = './auth_pair_fixed';
const PORT = 3001; // Different port

// Clean auth
if (fs.existsSync(AUTH_DIR)) {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}
fs.mkdirSync(AUTH_DIR, { recursive: true });
console.log('🧹 Fresh auth created');

const app = express();
app.get('/', (req, res) => res.send(`
<h1>🤖 WhatsApp Pairing Bot</h1>
<p>Phone: <strong>${PHONE_NUMBER}</strong></p>
<p>Check terminal for 8-digit code</p>
<p>Port: ${PORT}</p>
`));
app.listen(PORT, () => {
  console.log(`🌐 Status: http://localhost:${PORT}`);
  require('child_process').exec('start http://localhost:' + PORT);
});

let reconnectCount = 0;
const MAX_RECONNECT = 10;

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: 'silent' });
    
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      keepAliveIntervalMs: 30000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, pairingCode } = update;
      
      if (pairingCode) {
        console.log('\n🎉 PAIRING CODE READY!');
        console.log('📱 CODE: ' + pairingCode);
        console.log('1. WhatsApp > Settings > Linked Devices');
        console.log('2. Tap "Link with phone number"');
        console.log('3. Enter code: ' + pairingCode);
        console.log('4. Bot connects automatically!');
        return;
      }

      if (connection === 'open') {
        console.log('✅ WHATSAPP CONNECTED!');
        reconnectCount = 0;
        return;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log('Disconnect:', statusCode);
        
        if (statusCode !== DisconnectReason.loggedOut && reconnectCount < MAX_RECONNECT) {
          reconnectCount++;
          console.log(`🔄 Retry ${reconnectCount}/${MAX_RECONNECT}...`);
          setTimeout(startBot, 3000);
        } else {
          console.log('Max retries reached');
        }
      }
    });

    console.log('📲 Requesting pairing code for ' + PHONE_NUMBER + '...');
    
    // Wait for connecting then request
    const phoneId = PHONE_NUMBER.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    setTimeout(() => {
      sock.requestPairingCode(phoneId).catch(e => {
        console.log('Pairing code request failed:', e.message);
        setTimeout(() => sock.requestPairingCode(phoneId), 2000);
      });
    }, 2000);

    sock.ev.on('messages.upsert', ({ messages }) => {
      messages.forEach(m => {
        if (!m.message || m.key.fromMe) return;
        console.log('📨 Message:', m.message.conversation || 'media');
      });
    });

  } catch (e) {
    console.error('Error:', e.message);
    setTimeout(startBot, 5000);
  }
}

console.log('🚀 WhatsApp Pairing Bot Starting...');
startBot();

process.on('SIGINT', () => process.exit(0));

