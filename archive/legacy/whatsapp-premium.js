require('dotenv').config();
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

// All handlers
const config = require('./config');
const aiService = require('./aiService');
const userStore = require('./userStore');
const conversationStore = require('./conversationStore');

// Global memory
const userStates = new Map();
const AUTH_DIR = './auth_premium';
const PORT = 3003;

let sock = null;

console.log('🧹 Elite Premium Bot Starting...');
if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
fs.mkdirSync(AUTH_DIR, { recursive: true });

let qrData = null;
const app = express();

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html><head><title>Elite Fitness Bot</title><meta name="viewport" content="width=device-width">
<style>body{font-family:system-ui;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;text-align:center;padding:40px;}
.container{max-width:400px;margin:auto;background:rgba(255,255,255,0.1);border-radius:20px;backdrop-filter:blur(10px);padding:40px;}
h1{font-size:28px;margin-bottom:20px;color:#10b981;}
.qr{width:300px;height:300px;border-radius:16px;margin:20px auto;box-shadow:0 20px 40px rgba(0,0,0,0.3);}
.status{padding:20px;border-radius:12px;margin:20px;background:rgba(16,185,129,0.2);font-weight:600;}
.connecting{background:rgba(59,130,246,0.3);color:#60a5fa;}
.spinner{border:3px solid rgba(255,255,255,0.3);border-top:3px solid #10b981;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:10px auto;}
@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style></head>
<body><div class="container"><h1>🏆 Elite Fitness Bot</h1><img id="qr" style="display:none" class="qr"><div id="status" class="status connecting"><div class="spinner"></div>Waiting for QR code...</div></div>
<script>let i=setInterval(async()=>{try{const r=await fetch('/qr');const d=await r.json();if(d.qr){document.getElementById('qr').src='/qr.png?t='+Date.now();document.getElementById('qr').style.display='block';document.getElementById('status').innerHTML='✅ QR Ready - Scan Now';document.getElementById('status').className='status';clearInterval(i)}}catch(e){}},1500);</script></body></html>`));

app.get('/qr', (req, res) => res.json({ qr: qrData }));
app.get('/qr.png', async (req, res) => {
  if (!qrData) return res.status(404).send('No QR');
  const QRCode = require('qrcode');
  const canvas = require('canvas').createCanvas(300, 300);
  QRCode.toCanvas(canvas, qrData);
  res.type('png');
  canvas.createPNGStream().pipe(res);
});

app.listen(PORT, () => {
  console.log('🌐 Dashboard:', `http://localhost:${PORT}`);
  require('child_process').exec(`start http://localhost:${PORT}`);
});

async function connectEliteBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: 'silent' });
  
  sock = makeWASocket({
    version,
    auth: state,
    qrTimeout: 60000,
    logger,
    browser: ['EliteFitness', 'Chrome', '1.0.0'],
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;
    
    if (qr) {
      qrData = qr;
      console.log('📱 QR Ready');
      console.log('Browser:', `http://localhost:${PORT}`);
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'open') {
      console.log('✅ Elite Bot Connected');
    }
    
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) setTimeout(connectEliteBot, 3000);
    }
  });

  // ELITE MESSAGE HANDLER
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      
      const from = msg.key.remoteJid;
      const sender = from.endsWith('@g.us') ? msg.key.participant : from;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      
      if (!text) continue;
      
      console.log(`📨 [${sender?.split('@')[0] || 'unknown'}]: ${text}`);
      
      const userData = userStore.getUser(sender);
      let reply;
      
      const lower = text.toLowerCase().trim();
      
      // ELITE FLOWS
      if (lower === 'hi' || lower === 'hello') {
        reply = `Hello 👋\nWelcome to your personal fitness support.\n\nTell me your main goal:\n\n1. Fat Loss\n2. Muscle Gain\n3. Weight Gain\n4. Personalized Diet Plan\n5. Full Coaching`;
      } 
      else if (lower.includes('fat') || lower.includes('loss') || lower.includes('pet') || lower.includes('slim')) {
        reply = `Great choice 🔥\n\nTo guide you professionally:\n\n1. Age\n2. Height\n3. Current Weight\n4. Daily activity level\n5. Veg or Non-veg?\n\nOnce I have this, I'll create your custom strategy.`;
      } 
      else if (lower.includes('muscle') || lower.includes('gain') || lower.includes('bulk') || lower.includes('gym')) {
        reply = `Excellent goal 💪\n\nFor optimal results:\n\n1. Age\n2. Height\n3. Weight\n4. Gym or Home?\n5. Veg/Non-veg\n6. Food budget\n\nReady to build serious muscle?`;
      } 
      else if (lower.includes('diet') || lower.includes('khana') || lower.includes('meal')) {
        reply = `Custom diet plans created based on:\n\n• Goal\n• Budget\n• Veg/Non-veg\n• Schedule\n• Body type\n\nShare: Age/Height/Weight/Goal`;
      }
      else if (lower.includes('premium') || lower.includes('plan') || lower.includes('coaching') || lower.includes('price')) {
        reply = `**Premium Transformation Packages:**\n\n📊 *Custom Diet Plan* - ₹1500\n✅ Macros + Grocery list + Recipes\n\n🏋️ *Full Coaching* - ₹2999/month\n✅ Diet + Workout + Analysis + Support\n\nReply "diet" or "coaching" to start.\n\nUPI ready?`;
      }
      else if (lower === 'menu') {
        reply = `*Elite Fitness Support*\n\n🔥 Fat Loss\n💪 Muscle Gain\n🍎 Custom Diet\n🏠 Home Workouts\n⭐ Premium Packages\n\nWhat's your priority?`;
      }
      else {
        // AI fallback
        reply = await aiService.generateReply(sender, text, userData);
      }
      
      await sock.sendMessage(from, { text: reply });
      console.log('✅ Replied:', reply.slice(0, 50) + '...');
    }
  });
  
  console.log('✅ Elite Message Handler Ready');
}

connectEliteBot();
console.log('🏆 Elite Premium Fitness Bot Live!');
process.on('SIGINT', () => process.exit(0));

