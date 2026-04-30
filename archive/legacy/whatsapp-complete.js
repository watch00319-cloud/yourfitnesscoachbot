require('dotenv').config();
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

// Import ALL handlers
const config = require('./config');
const aiService = require('./aiService');
const intentHandler = require('./intentHandler');
const userStore = require('./userStore');
const conversationStore = require('./conversationStore');
const premiumHandler = require('./premiumHandler');
const analysisFlow = require('./analysisFlow');

// Global states
const userStates = new Map();

const PHONE_NUMBER = '+919888601933';
const AUTH_DIR = './auth_complete';
const PORT = 3003;

console.log('🧹 Fresh complete bot setup...');
if (fs.existsSync(AUTH_DIR)) {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}
fs.mkdirSync(AUTH_DIR, { recursive: true });

let qrData = null;
let sock = null; // Global socket
const app = express();

// QR Web page
app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head><title>WhatsApp Complete Bot</title><meta name="viewport" content="width=device-width">
<style>body{font-family:system-ui;background:linear-gradient(135deg,#25d366,#128c7e);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;}
.container{background:white;padding:40px;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.3);text-align:center;max-width:400px;}
h1{color:#25d366;margin-bottom:20px;}.qr{width:280px;height:280px;margin:20px auto;}.status{font-size:18px;font-weight:bold;padding:15px;border-radius:10px;margin:20px 0;background:#e3f2fd;color:#1976d2;}
.spinner{border:3px solid #f3f3f3;border-top:3px solid #25d366;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:20px auto;}
@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style></head>
<body><div class="container"><h1>🤖 Complete WhatsApp AI Bot</h1><img id="qr" style="display:none;width:300px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.2)"><div id="status" class="status"><div class="spinner"></div>Waiting QR code...</div></div>
<script>const iv=setInterval(async()=>{try{const r=await fetch('/qr');const d=await r.json();if(d.qr){document.getElementById('qr').src='/qr.png?t='+Date.now();document.getElementById('qr').style.display='block';document.getElementById('status').innerHTML='✅ QR READY - SCAN NOW';document.getElementById('status').style.background='#e8f5e8';document.getElementById('status').style.color='#2e7d32';clearInterval(iv)}}catch(e){}},1500);</script></body></html>`));

app.get('/qr', (req, res) => res.json({ qr: qrData }));

app.get('/qr.png', async (req, res) => {
  if (!qrData) return res.status(404).send('No QR');
  const QRCode = require('qrcode');
  const canvas = require('canvas').createCanvas(300, 300);
  await QRCode.toCanvas(canvas, qrData);
  res.type('png');
  canvas.createPNGStream().pipe(res);
});

app.listen(PORT, () => {
  console.log(`🌐 Bot Dashboard: http://localhost:${PORT}`);
  require('child_process').exec(`start http://localhost:${PORT}`);
});

async function connectBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: 'silent' });
    
    sock = makeWASocket({
      version,
      auth: state,
      qrTimeout: 60000,
      logger,
      browser: ['Ubuntu', 'Chrome', '20.0.0'],
      syncFullHistory: false,
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;
      console.log('Connection:', connection);
      
      if (qr) {
        qrData = qr;
        console.log('📱 **QR GENERATED** - Scan now!');
        console.log('Browser:', `http://localhost:${PORT}`);
        qrcode.generate(qr, { small: true });
        console.log('⏰ 60s expiry');
      }
      
      if (connection === 'open') {
        console.log('✅ **BOT CONNECTED** - Messages active!');
      }
      
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('Disconnect:', code);
        if (code !== DisconnectReason.loggedOut) {
          setTimeout(connectBot, 3000);
        }
      }
    });

    // **COMPLETE MESSAGE HANDLER - Integrated with ALL handlers**
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        
        const from = msg.key.remoteJid;
        const sender = from.endsWith('@g.us') ? msg.key.participant : from;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isImage = !!msg.message.imageMessage;
        
        if (!text && !isImage) continue;
        
        console.log(`📨 Message from [${sender.split('@')[0]}]: ${text || '📷 image'}`);
        
        try {
          // Load user data
          const userData = userStore.getUser(sender);
          
          // Basic tests
          if (text.toLowerCase() === 'hi') {
            await sock.sendMessage(from, { text: 'Hello 👋 Fitness goal bata!\n\n"menu" for options' });
            continue;
          }
          
          if (text.toLowerCase() === 'menu') {
            await sock.sendMessage(from, { text: '*Bot Menu* 💪\n\n1. Goal bata (weight loss/muscle)\n2. Diet/workout tips\n3. Premium upgrade 🔥\n\nType your query!' });
            continue;
          }
          
          // Full AI + handlers
          const intentResult = intentHandler.detectIntent(sender, text);
          const reply = await aiService.generateReply(sender, text, userData, intentResult);
          
          await sock.sendMessage(from, { text: reply });
          console.log(`✅ Replied to ${sender.split('@')[0]}: ${reply.slice(0, 50)}...`);
          
        } catch (error) {
          console.error('Reply error:', error.message);
          await sock.sendMessage(from, { text: 'Bot busy, 1 min wait kar! 💪' });
        }
      }
    });
    
    console.log('✅ Message handler attached - Ready for messages!');
    
  } catch (e) {
    console.error('Connect error:', e.message);
    setTimeout(connectBot, 5000);
  }
}

console.log('🚀 Complete WhatsApp AI Bot v2 - QR + AI Ready!');
connectBot();

process.on('SIGINT', () => process.exit(0));

