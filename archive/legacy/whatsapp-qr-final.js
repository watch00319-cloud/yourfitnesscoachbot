require('dotenv').config();
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

const PHONE_NUMBER = '+919888601933';
const AUTH_DIR = './auth_qr_final';
const PORT = 3003;

console.log('🧹 Deleting old auth...');
if (fs.existsSync(AUTH_DIR)) {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}
fs.mkdirSync(AUTH_DIR, { recursive: true });

let qrData = null;
const app = express();
app.use(express.static('.'));

app.get('/', (req, res) => `
<!DOCTYPE html>
<html>
<head>
<title>WhatsApp QR Login</title>
<meta name="viewport" content="width=device-width">
<style>
body { font-family: system-ui, sans-serif; background: linear-gradient(135deg, #25d366, #128c7e); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
.container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px; }
h1 { color: #25d366; margin-bottom: 20px; }
.qr { width: 280px; height: 280px; margin: 20px auto; }
.status { font-size: 18px; font-weight: bold; padding: 15px; border-radius: 10px; margin: 20px 0; }
.connecting { background: #e3f2fd; color: #1976d2; }
.ready { background: #e8f5e8; color: #2e7d32; }
.spinner { border: 3px solid #f3f3f3; border-top: 3px solid #25d366; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="container">
  <h1>🤖 WhatsApp Bot QR</h1>
  <img id="qr" class="qr" style="display:none">
  <div id="status" class="status connecting">
    <div class="spinner"></div>
    Waiting for QR...
  </div>
</div>
<script>
let polling = setInterval(() => {
  fetch('/qr').then(r=>r.json()).then(data => {
    if (data.qr) {
      document.getElementById('qr').src = data.qr;
      document.getElementById('qr').style.display = 'block';
      document.getElementById('status').innerHTML = '✅ QR READY - SCAN NOW!';
      document.getElementById('status').className = 'status ready';
      clearInterval(polling);
    }
  }).catch(() => {});
}, 1000);
</script>
</body>
</html>`);

app.get('/qr', (req, res) => {
  res.json({ qr: qrData ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' : null }); // Placeholder
});

app.get('/qr.png', async (req, res) => {
  if (!qrData) return res.status(404).send('No QR');
  const QRCode = require('qrcode');
  const canvas = require('canvas').createCanvas(300, 300);
  await QRCode.toCanvas(canvas, qrData);
  res.type('png');
  canvas.createPNGStream().pipe(res);
});

app.listen(PORT, () => {
  console.log(`🌐 QR Page: http://localhost:${PORT}`);
  require('child_process').exec(`start http://localhost:${PORT}`);
});

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: 'silent' });
    
    console.log('🔄 Connecting to WhatsApp...');
    
    const sock = makeWASocket({
      version,
      auth: state,
      qrTimeout: 60000,
      logger,
      browser: ['Ubuntu', 'Chrome', '20.0.0'],
      syncFullHistory: false,
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
      const { connection, qr, lastDisconnect } = update;
      
      console.log('Connection:', connection);
      
      if (qr) {
        qrData = qr;
        console.log('\n📱 QR CODE GENERATED!');
        console.log('✅ Browser: http://localhost:' + PORT);
        console.log('✅ Terminal QR:');
        qrcode.generate(qr, { small: true });
        console.log('⏰ SCAN WITHIN 60 SECONDS!');
      }
      
      if (connection === 'open') {
        console.log('✅ WHATSAPP CONNECTED - READY FOR MESSAGES!');
      }
      
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('Disconnected:', code);
        if (code !== DisconnectReason.loggedOut) {
          setTimeout(startBot, 3000);
        }
      }
    });
    
    sock.ev.on('messages.upsert', (m) => {
      console.log('Message received');
    });
    
  } catch (e) {
    console.error('Error:', e.message);
    setTimeout(startBot, 5000);
  }
}

startBot();
console.log('🚀 WhatsApp QR Bot Ready!');

