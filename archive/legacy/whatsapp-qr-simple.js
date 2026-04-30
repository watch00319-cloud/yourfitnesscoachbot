require('dotenv').config();
const fs = require('fs');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const express = require('express');

const PHONE_NUMBER = '+919888601933';
const AUTH_DIR = './auth_qr';
const PORT = 3002;

if (fs.existsSync(AUTH_DIR)) {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}
fs.mkdirSync(AUTH_DIR, { recursive: true });
console.log('🧹 Fresh QR auth ready');

let qrData = null;
const app = express();
app.get('/', (req, res) => res.send(`
<h1>WhatsApp QR Bot</h1>
<p>Phone: ${PHONE_NUMBER}</p>
<p>${qrData ? '<img src="/qr.png" style="width:300px">' : 'Waiting QR...'}</p>
`));

app.get('/qr.png', (req, res) => {
  if (!qrData) return res.status(404).end();
  const QRCode = require('qrcode');
  const canvas = require('canvas').createCanvas(300, 300);
  QRCode.toCanvas(canvas, qrData);
  res.type('png');
  canvas.createPNGStream().pipe(res);
});

app.listen(PORT, () => {
  console.log(`🌐 QR Status: http://localhost:${PORT}`);
  require('child_process').exec(`start http://localhost:${PORT}`);
});

async function startQRBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const logger = pino({ level: 'silent' });
  
  const sock = makeWASocket({
    auth: state,
printQRInTerminal: false
  logger: logger,
    logger,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrData = qr;
      console.log('\n📱 TERMINAL QR READY - SCAN NOW!');
      console.log('🌐 Browser: http://localhost:' + PORT);
      console.log('⏰ Expires in 20s - scan fast!');
    }
    
    if (connection === 'open') {
      console.log('✅ WHATSAPP QR CONNECTED!');
    }
    
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconnect...');
        setTimeout(startQRBot, 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    messages.forEach(m => {
      if (!m.message || m.key.fromMe) return;
      console.log('📨 New message!');
    });
  });
}

console.log('🚀 WhatsApp QR Bot Starting...');
startQRBot();

process.on('SIGINT', () => process.exit());

