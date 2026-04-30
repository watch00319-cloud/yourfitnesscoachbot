require('dotenv').config();
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

// Core handlers
const userStore = require('./userStore');
const config = require('./config');

// Advanced memory system
const userMemory = new Map();

const AUTH_DIR = './auth_smart';
const PORT = 3003;

let sock = null;
let qrData = null;
const app = express();

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html><head><title>Smart Fitness Bot</title><meta name="viewport" content="width=device-width">
<style>body{font-family:system-ui;background:linear-gradient(135deg,#1e40af,#3b82f6);min-height:100vh;display:flex;align-items:center;justify-content:center;color:white;}
.container{background:rgba(255,255,255,0.1);padding:40px;border-radius:20px;backdrop-filter:blur(20px);max-width:400px;text-align:center;}
h1{font-size:28px;margin-bottom:20px;color:#10b981;}
.qr{width:300px;height:300px;border-radius:16px;margin:20px auto;box-shadow:0 20px 40px rgba(0,0,0,0.3);}
.status{padding:20px;border-radius:12px;margin:20px;font-weight:600;}
.connecting{background:rgba(59,130,246,0.3);}
.ready{background:rgba(16,185,129,0.3);}
.spinner{border:3px solid rgba(255,255,255,0.3);border-top:3px solid #10b981;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:10px auto;}
@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style></head>
<body><div class="container"><h1>🧠 Smart Fitness Bot</h1><img id="qr" style="display:none" class="qr"><div id="status" class="status connecting"><div class="spinner"></div>QR Loading...</div></div>
<script>let i=setInterval(async()=>{try{const r=await fetch('/qr');const d=await r.json();if(d.qr){document.getElementById('qr').src='/qr.png?t='+Date.now();document.getElementById('qr').style.display='block';document.getElementById('status').innerHTML='✅ QR Ready';document.getElementById('status').className='status ready';clearInterval(i)}}catch(e){}},1000);</script></body></html>`));

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
  console.log('🌐 Smart Bot Dashboard:', `http://localhost:${PORT}`);
  require('child_process').exec(`start http://localhost:${PORT}`);
});

// DATA PARSER - Extract numbers/text from messages
function extractData(text) {
  const data = {};
  const lower = text.toLowerCase();
  
  // Age
  const ageMatch = text.match(/age[:\-]?\s*(\d{1,3})/i);
  if (ageMatch) data.age = parseInt(ageMatch[1]);
  
  // Weight
  const weightMatch = text.match(/weight|wt|wajan|kg[:\-]?\s*(\d{2,4})/i);
  if (weightMatch) data.weight = parseInt(weightMatch[1]);
  
  // Height
  const heightMatch = text.match(/height|ht|inch|cm|feet|fit|5\.(\d{2})|(\d)\.(\d{1})/i);
  if (heightMatch) data.height = heightMatch[1] ? parseFloat('5.' + heightMatch[1]) : parseFloat(heightMatch[2] + '.' + heightMatch[3]);
  
  // Diet
  if (lower.includes('veg') || lower.includes('vegetarian')) data.dietType = 'veg';
  if (lower.includes('non') || lower.includes('chicken') || lower.includes('egg')) data.dietType = 'nonveg';
  
  // Budget
  const budgetMatch = text.match(/budget|rs|rupee|rs[:\-]?\s*(\d{3,5})/i);
  if (budgetMatch) data.budget = parseInt(budgetMatch[1]);
  
  // Gym/Home
  if (lower.includes('gym')) data.gym = 'gym';
  if (lower.includes('home') || lower.includes('ghar')) data.gym = 'home';
  
  // Goal
  if (lower.includes('fat') || lower.includes('loss')) data.goal = 'fatloss';
  if (lower.includes('muscle') || lower.includes('gain')) data.goal = 'muscle';
  if (lower.includes('diet')) data.intent = 'diet';
  
  return data;
}

// GET MISSING DATA
function getMissingFields(userData) {
  const required = ['age', 'height', 'weight', 'dietType', 'budget', 'gym'];
  return required.filter(field => !userData[field]);
}

async function connectSmartBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const logger = pino({ level: 'silent' });
  
  sock = makeWASocket({
    auth: state,
    qrTimeout: 60000,
    logger,
    browser: ['SmartBot', 'Chrome', '1.0.0'],
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;
    
    if (qr) {
      qrData = qr;
      console.log('📱 QR Ready - Scan Now');
      console.log('Dashboard:', `http://localhost:${PORT}`);
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'open') {
      console.log('✅ Smart Bot Connected - Memory Active');
    }
    
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) setTimeout(connectSmartBot, 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      
      const from = msg.key.remoteJid;
      const sender = from.endsWith('@g.us') ? msg.key.participant : from;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      
      if (!text.trim()) continue;
      
      console.log(`📨 [${sender.split('@')[0]}]: ${text}`);
      
      // Load memory
      let memory = userMemory.get(sender) || {};
      const userData = userStore.getUser(sender);
      
      // Extract new data
      const newData = extractData(text);
      Object.assign(memory, newData);
      
      // Save to store
      userStore.setUser(sender, { ...userData, ...newData });
      
      // Anti-repeat
      if (memory.lastReply === text.toLowerCase()) {
        await sock.sendMessage(from, { text: 'Got it. What else can I help with?' });
        continue;
      }
      
      let reply;
      const lower = text.toLowerCase();
      
      // Welcome
      if (lower.includes('hi') || lower.includes('hello')) {
        reply = `Hello 👋 Welcome to Elite Fitness.\n\nWhat's your main goal?\n1. Fat Loss\n2. Muscle Gain\n3. Diet Plan`;
        memory.stage = 'new_user';
      }
      
      // Data collection logic
      else if (memory.stage === 'new_user' || lower.includes('fat') || lower.includes('muscle') || lower.includes('gain')) {
        const missing = getMissingFields(memory);
        memory.goal = 'muscle'; // Default or detect
        
        if (missing.length === 0) {
          reply = `Perfect 💪\n\nBased on your profile:\n• Age: ${memory.age}\n• Weight: ${memory.weight}kg\n• Diet: ${memory.dietType}\n\nNext: Gym or Home training?`;
          memory.stage = 'goal_selected';
        } else {
          reply = `To create your plan, I need:\n\n${missing.map(f => `• ${f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`).join('\n')}`;
        }
      }
      
      // Enough data - Analysis
      else if (memory.stage === 'goal_selected') {
        reply = `Based on ${memory.weight}kg ${memory.dietType} diet, ${memory.goal} is achievable.\n\nCalories: 2500-2800\nProtein: ${Math.round(memory.weight * 1.8)}g\n\nWant your complete premium plan?`;
        memory.stage = 'premium_offer';
      }
      
      // Premium flow
      else if (lower.includes('premium') || lower.includes('plan') || memory.stage === 'premium_offer') {
        reply = `**Premium Plans:**\n\n📊 Custom Diet: ₹1500\n🏋️ Full Coaching: ₹2999/month\n\nReply "diet" or "coaching"`;
        memory.stage = 'premium_offer';
      }
      
      else {
        reply = `Thanks for sharing. What's your main fitness goal?\n• Fat loss\n• Muscle gain\n• Diet`;
      }
      
      // Anti-repeat save
      memory.lastReply = lower;
      userMemory.set(sender, memory);
      
      await sock.sendMessage(from, { text: reply });
      console.log('✅ Smart Reply:', reply.slice(0, 50) + '...');
    }
  });
}

connectSmartBot();
console.log('🧠 Smart Memory Bot Ready!');
process.on('SIGINT', () => process.exit());

