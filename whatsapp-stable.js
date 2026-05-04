require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const express = require('express');
const winston = require('winston');
const pino = require('pino');
const QRCode = require('qrcode');

// 🧠 PROFESSIONAL MODULES
const config = require('./config');
const userStore = require('./userStore');
const conversationStore = require('./conversationStore');
const intentHandler = require('./intentHandler');
const premiumHandler = require('./premiumHandler');
const aiService = require('./aiService');
const fitnessFlow = require('./fitnessFlow');
const jobService = require('./jobService');
const { renderQrPage } = require('./qrPage');
const { parseFitnessDetails } = require('./profileParser');

// 🔒 PROCESSING LOCKS PER USER (avoid blocking all users)
const processingUsers = new Set();
const cooldownUsers = new Map();
const seenMessages = new Map();
let currentQR = null;
let sock = null;

const PHONE_NUMBER = '919888601933';
const AUTH_DIR = './auth_info';
const LOCK_FILE = path.join(__dirname, 'bot.instance.lock');
const PORT = Number(process.env.PORT || 3000);
const USE_PAIRING_CODE = String(process.env.USE_PAIRING_CODE || 'false').toLowerCase() === 'true';
const AUTO_OPEN_QR = String(process.env.AUTO_OPEN_QR || 'true').toLowerCase() === 'true';

// Keep existing auth for stable reconnects
fs.mkdirSync(AUTH_DIR, { recursive: true });
console.log('✅ Auth directory ready:', AUTH_DIR);

function acquireSingleInstanceLock() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const existingPid = Number(fs.readFileSync(LOCK_FILE, 'utf8').trim());
      if (Number.isFinite(existingPid) && existingPid !== process.pid) {
        try {
          process.kill(existingPid, 0);
          console.error(`❌ Another bot instance is already running (PID ${existingPid}). Stop it first.`);
          process.exit(1);
        } catch (error) {
          fs.unlinkSync(LOCK_FILE);
        }
      }
    } catch (error) {
      try { fs.unlinkSync(LOCK_FILE); } catch (e) {}
    }
  }

  fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: 'w' });
  const cleanup = () => {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const pid = Number(fs.readFileSync(LOCK_FILE, 'utf8').trim());
        if (!Number.isFinite(pid) || pid === process.pid) {
          fs.unlinkSync(LOCK_FILE);
        }
      }
    } catch (error) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

acquireSingleInstanceLock();

let isPairingRequested = false;
let pairingTimeout = null;
let hasOpenedBrowserForQR = false;
let reconnectTimer = null;
let isStartingBot = false;
let activePort = PORT;
let hasResetAuth = false;

const app = express();
let status = 'Starting...';
function hasCooldown(userId) {
  const until = cooldownUsers.get(userId) || 0;
  return Date.now() < until;
}

function updateCooldown(userId, seconds) {
  cooldownUsers.set(userId, Date.now() + (seconds * 1000));
}

function cleanupCooldowns() {
  const now = Date.now();
  for (const [userId, until] of cooldownUsers.entries()) {
    if (until <= now) cooldownUsers.delete(userId);
  }
}

function hasSeenMessage(messageId) {
  return seenMessages.has(messageId);
}

function markSeenMessage(messageId) {
  seenMessages.set(messageId, Date.now());
}

function cleanupSeenMessages() {
  const now = Date.now();
  for (const [messageId, seenAt] of seenMessages.entries()) {
    if (now - seenAt > 5 * 60 * 1000) {
      seenMessages.delete(messageId);
    }
  }
}

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head><title>🏆 Elite Fitness Bot Dashboard</title>
<meta http-equiv="refresh" content="2">
<meta name="viewport" content="width=device-width">
<style>
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:white}
  .container{background:white;padding:40px;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.2);text-align:center;max-width:450px}
  h1{color:#25D366;margin-bottom:20px;font-size:28px}
  .qr{width:280px;height:280px;border-radius:16px;margin:20px 0;box-shadow:0 10px 30px rgba(0,0,0,.2);display:none}
  #status{font-size:18px;font-weight:600;padding:20px;border-radius:12px;margin:20px 0}
  .ready{background:#d4f4dd;color:#1a7e2d}.connecting{background:#f0f4f8;color:#666}
  .stats{margin:20px 0;padding:15px;background:rgba(255,255,255,.1);border-radius:12px}
  a{color:#25D366;text-decoration:none;font-weight:600}
</style>
</head>
<body>
<div class="container">
  <h1>🏆 Elite Fitness Bot</h1>
  <img id="qr" class="qr" src="">
  <div id="status" class="connecting">Status: ${status}</div>
  <div class="stats">
    <p>📱 Phone: ${PHONE_NUMBER}</p>
    <p>💾 Auth: ${AUTH_DIR}</p>
    <a href="/stats" target="_blank">📊 Bot Stats</a> | <a href="/qr" target="_blank">📱 QR Fallback</a>
  </div>
</div>
<script>
setInterval(async()=>{ 
  try{
    const r=await fetch('/api/status');const d=await r.json();
    document.getElementById('status').textContent='Status: '+d.status;
    document.getElementById('status').className=d.connected?'ready':'connecting';
    if(d.qr){document.getElementById('qr').src='/qr.png?t='+Date.now();document.getElementById('qr').style.display='block'}
  }catch(e){}
},2000);
</script>
</body>
</html>`));

// 🧠 PROFESSIONAL ENDPOINTS
app.get('/api/status', (req, res) => res.json({ status, connected: sock?.user, qr: !!currentQR }));

// Connection health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsapp: {
      connected: !!sock?.user,
      status: status,
      reconnectAttempts: reconnectAttempts,
      lastReconnectTime: lastReconnectTime ? new Date(lastReconnectTime).toISOString() : null
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    bot: {
      processingUsers: processingUsers.size,
      cooldownUsers: cooldownUsers.size,
      activeConversations: conversationStore.conversations.size
    }
  };
  
  // Determine overall health status
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    health.status = 'degraded';
    health.issues = ['Max reconnection attempts exceeded'];
  } else if (!sock?.user && reconnectAttempts > 3) {
    health.status = 'degraded';
    health.issues = ['Multiple reconnection attempts'];
  } else if (processingUsers.size > 10) {
    health.status = 'degraded';
    health.issues = ['High number of processing users'];
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
  
  log.info('health_check', {
    status: health.status,
    statusCode,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
});
app.get('/stats', (req, res) => {
  const userStats = userStore.getStats();
  const inactivePremiumUsers = conversationStore.getInactivePremiumUsers();
  
  // Enhanced conversation metrics
  const totalConversations = conversationStore.conversations.size;
  const activeConversations = Array.from(conversationStore.conversations.values())
    .filter(conv => Date.now() - conv.lastActive < 86400000).length;
  
  // Calculate average messages per conversation
  const totalMessages = Array.from(conversationStore.conversations.values())
    .reduce((sum, conv) => sum + conv.messageCount, 0);
  const avgMessagesPerConversation = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0;
  
  // Premium metrics
  const premiumPitchCount = Array.from(conversationStore.conversations.values())
    .reduce((sum, conv) => sum + (conv.userData.premium_pitch_count || 0), 0);
  
  // Analysis completion metrics
  const analysisCompleteCount = Array.from(conversationStore.conversations.values())
    .filter(conv => conv.userData.analysis_complete).length;
  
  const uptime = {
    total: Math.floor(process.uptime()),
    days: Math.floor(process.uptime() / 86400),
    hours: Math.floor((process.uptime() % 86400) / 3600),
    minutes: Math.floor((process.uptime() % 3600) / 60)
  };
  
  const mem = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Connection metrics
  const connectionMetrics = {
    reconnectAttempts: reconnectAttempts,
    lastReconnectTime: lastReconnectTime ? new Date(lastReconnectTime).toISOString() : null,
    isReconnecting: !!reconnectTimer,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    currentBackoffDelay: reconnectTimer ? reconnectAttempts * RECONNECT_BACKOFF_MS : 0
  };
  
  // Log stats request
  log.info('stats_endpoint_accessed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Job submissions metric
  const jobSubmissionsCount = (() => {
    try { const jobStore = require('./jobStore'); return jobStore.getRecent(200).length; } catch(e) { return 0; }
  })();
  
  res.json({
    timestamp: new Date().toISOString(),
    bot: {
      status: status,
      connected: !!sock?.user,
      qrAvailable: !!currentQR,
      phone: PHONE_NUMBER,
      version: require('./package.json').version
    },
    users: {
      ...userStats,
      analysisComplete: analysisCompleteCount
    },
    conversations: {
      total: totalConversations,
      active: activeConversations,
      inactivePremium: inactivePremiumUsers.length,
      jobSubmissions: jobSubmissionsCount,
      processingUsers: processingUsers.size,
      cooldownUsers: cooldownUsers.size,
      avgMessagesPerConversation: parseFloat(avgMessagesPerConversation),
      totalPremiumPitches: premiumPitchCount
    },
    connection: connectionMetrics,
    system: {
      uptime,
      memory: {
        rss: (mem.rss / 1024 / 1024).toFixed(1) + 'MB',
        heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1) + 'MB',
        heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1) + 'MB',
        external: (mem.external / 1024 / 1024).toFixed(1) + 'MB'
      },
      cpu: {
        user: (cpuUsage.user / 1000).toFixed(2) + 'ms',
        system: (cpuUsage.system / 1000).toFixed(2) + 'ms'
      },
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    logs: 'bot.log | bot-error.log',
      endpoints: {
      status: '/api/status',
      qr: '/qr',
      qrPng: '/qr.png',
      stats: '/stats'
    }
  });
});

// Admin: view recent job submissions (basic HTML)
app.get('/admin/jobs', (req, res) => {
  try {
    const jobStore = require('./jobStore');
    const subs = jobStore.getRecent(100);
    let html = `<html><head><title>Job Submissions</title><meta charset="utf-8"/></head><body><h1>Recent Job Submissions (${subs.length})</h1><ul>`;
    for (const s of subs) {
      html += `<li><strong>${s.role}</strong> — ${s.experience} — ${s.location} — ${s.contact} <br/><small>from: ${s.userId} • ${s.createdAt}</small></li>`;
    }
    html += `</ul></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading job submissions');
  }
});
app.get('/qr', (req, res) => res.send(renderQrPage({
  hasQr: !!currentQR,
  connected: !!sock?.user,
  status,
  port: activePort
})));
app.get('/qr.png', async (req, res) => {
  if (currentQR) {
    try {
      const canvas = require('canvas').createCanvas(300, 300);
      await QRCode.toCanvas(canvas, currentQR, { width: 300 });
      res.type('png');
      canvas.createPNGStream().pipe(res);
    } catch(e) {
      res.status(500).send('QR Error');
    }
  } else {
    res.status(404).send('No QR - Use pairing code');
  }
});
global.botStatus = status; // Make global for updates
function startHttpServer(startPort, maxAttempts = 20) {
  let attempt = 0;
  let currentPort = startPort;

  const tryListen = () => {
    const server = app.listen(currentPort, () => {
      activePort = currentPort;
      console.log(`🌐 Status: http://localhost:${currentPort}`);
      if (currentPort !== startPort) {
        console.log(`ℹ️ Auto-switched from port ${startPort} to ${currentPort}`);
      }
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
        attempt += 1;
        currentPort += 1;
        console.warn(`⚠️ Port busy. Retrying on ${currentPort}...`);
        setTimeout(tryListen, 150);
        return;
      }
      console.error('❌ Server failed to start:', err.message);
      process.exit(1);
    });
  };

  tryListen();
}

startHttpServer(PORT);

let reconnectAttempts = 0;
let lastReconnectTime = null;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BACKOFF_MS = 5000; // 5 seconds base backoff

// 🪵 GLOBAL WINSTON LOGGER
const appLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'bot.log' }),
    new winston.transports.File({
      filename: 'bot-error.log',
      level: 'error'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Log helper
const log = {
  info: (msg, meta = {}) => appLogger.info(msg, { ...meta, source: 'whatsapp-stable' }),
  error: (msg, meta = {}) => appLogger.error(msg, { ...meta, source: 'whatsapp-stable' }),
  warn: (msg, meta = {}) => appLogger.warn(msg, { ...meta, source: 'whatsapp-stable' })
};

function scheduleRestart(delayMs = 5000) {
  if (reconnectTimer || isStartingBot) return;
  
  // Calculate backoff delay based on attempt count
  const backoffDelay = Math.min(delayMs + (reconnectAttempts * RECONNECT_BACKOFF_MS), 60000); // Max 60 seconds
  
  reconnectAttempts++;
  lastReconnectTime = Date.now();
  
  log.info('scheduling_bot_restart', {
    delayMs: backoffDelay,
    attempt: reconnectAttempts,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    timestamp: new Date().toISOString(),
    currentStatus: status,
    timeSinceLastReconnect: lastReconnectTime ? Date.now() - lastReconnectTime : 'first_attempt'
  });
  
  // Check if we've exceeded max reconnect attempts
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    log.error('max_reconnect_attempts_exceeded', {
      attempts: reconnectAttempts,
      lastReconnectTime: new Date(lastReconnectTime).toISOString()
    });
    console.error('❌ Max reconnection attempts reached. Please check the bot configuration and network.');
    // Reset counter after a longer delay
    setTimeout(() => {
      reconnectAttempts = 0;
      log.info('reconnect_attempt_counter_reset');
    }, 300000); // 5 minutes
    return;
  }
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    log.info('executing_scheduled_restart', { attempt: reconnectAttempts });
    startBot();
  }, backoffDelay);
}

function resetReconnectCounter() {
  if (reconnectAttempts > 0) {
    log.info('reconnect_counter_reset', {
      previousAttempts: reconnectAttempts,
      connectedAt: new Date().toISOString()
    });
    reconnectAttempts = 0;
    lastReconnectTime = null;
  }
}

function resetAuthState() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('❌ Failed to reset auth directory:', error.message);
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  currentQR = null;
  hasOpenedBrowserForQR = false;
  isPairingRequested = false;
  clearTimeout(pairingTimeout);
  pairingTimeout = null;
}

async function startBot() {
  if (isStartingBot) return;
  isStartingBot = true;
  
  try {
    if (sock) {
      try {
        sock.end();
      } catch (e) {}
      sock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
const { version } = await fetchLatestBaileysVersion();
const baileysLogger = pino({ level: 'error' });

    log.info('bot_startup_initiated', {
      version: require('./package.json').version,
      nodeVersion: process.version,
      platform: process.platform,
      authDir: AUTH_DIR,
      usePairingCode: USE_PAIRING_CODE,
      autoOpenQR: AUTO_OPEN_QR
    });
    
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: baileysLogger,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      generateHighQualityLinkPreview: false
    });
    
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, pairingCode } = update;
      console.log('Connection:', connection);
      log.info('connection.update', { connection, hasQR: !!qr, hasPairingCode: !!pairingCode });
      
      if (pairingCode) {
        console.log('\\n🎉 PAIRING CODE GENERATED!');
        console.log('📱 CODE:', pairingCode);
        console.log('WhatsApp > Linked Devices > Link with phone number > Enter code above');
        status = `✅ Paired with ${PHONE_NUMBER}`;
        global.botStatus = status;
        isPairingRequested = false;
        log.info('pairing_code_generated', {
          pairingCode,
          phone: PHONE_NUMBER,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      if (qr) {
        console.log('📱 QR Code Ready! Check browser: http://localhost:' + activePort);
        currentQR = qr;
        status = '✅ QR Ready - Scan Now (60s)';
        global.botStatus = status;
        log.info('qr_code_generated', {
          port: activePort,
          timestamp: new Date().toISOString()
        });
        
        if (AUTO_OPEN_QR && !hasOpenedBrowserForQR) {
          hasOpenedBrowserForQR = true;
          const url = `http://localhost:${activePort}`;
          require('child_process').exec(`start "" "${url}"`, (err) => {
            if (err) {
              console.log('⚠️ Could not auto-open browser. Open manually:', url);
              log.warn('browser_auto_open_failed', { error: err.message, url });
            } else {
              log.info('browser_auto_opened', { url });
            }
          });
        }
        
        // Terminal QR backup
        try {
          const qrcode = require('qrcode-terminal');
          qrcode.generate(qr, { small: true });
        } catch(e) {
          console.log('Terminal QR failed, use browser');
          log.warn('terminal_qr_failed', { error: e.message });
        }
        return;
      }
      
      if (connection === 'connecting') {
        status = '🔄 Connecting...';
        global.botStatus = status;
        log.info('connection_connecting', {
          usePairingCode: USE_PAIRING_CODE,
          isPairingRequested
        });
        
        if (USE_PAIRING_CODE && !isPairingRequested) {
          console.log('🔄 Socket ready - requesting pairing code...');
          isPairingRequested = true;
          pairingTimeout = setTimeout(async () => {
            try {
              const phoneAttr = PHONE_NUMBER.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
              console.log('Requesting pairing for', PHONE_NUMBER);
              await sock.requestPairingCode(phoneAttr);
              log.info('pairing_code_requested', { phone: PHONE_NUMBER });
            } catch (e) {
              console.log('Pairing request failed:', e.message);
              log.error('pairing_request_failed', { error: e.message });
              isPairingRequested = false;
            }
          }, 5000); // 5s wait
        } else if (!USE_PAIRING_CODE) {
          status = '✅ Waiting for QR scan';
          global.botStatus = status;
          console.log('🔄 Socket ready - waiting for QR event...');
          log.info('waiting_for_qr_scan');
        }
        return;
      }
      
      if (connection === 'open') {
        console.log('✅ WhatsApp Connected Stable!');
        status = `✅ Connected as ${PHONE_NUMBER}`;
        global.botStatus = status;
        currentQR = null; // Clear QR
        clearTimeout(pairingTimeout);
        resetReconnectCounter(); // Reset reconnect counter on successful connection
        log.info('whatsapp_connected', {
          phone: PHONE_NUMBER,
          timestamp: new Date().toISOString(),
          reconnectAttempts: reconnectAttempts
        });
        return;
      }
      
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const reason = DisconnectReason[code] || 'UNKNOWN';
        console.log('Disconnect:', code, reason);
        clearTimeout(pairingTimeout);
        
        log.info('connection_closed', {
          code,
          reason,
          timestamp: new Date().toISOString()
        });
        
        if (code === DisconnectReason.loggedOut || code === 401) {
          console.log('🔐 401 LoggedOut - resetting stale auth session');
          status = USE_PAIRING_CODE ? 'Waiting pairing code - check terminal' : 'Reconnecting for QR...';
          global.botStatus = status;
          log.warn('logged_out_resetting_auth', { code, reason });
          
          if (!hasResetAuth) {
            hasResetAuth = true;
            resetAuthState();
            log.info('auth_state_reset');
          }
          scheduleRestart(5000);
          return; // Don't clear, let pairing complete
        }
        
        if (code !== 405) {
          console.log('🔄 Recoverable disconnect - retry in 10s');
          log.info('scheduling_reconnect', { delay: 10000, code, reason });
          scheduleRestart(10000);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const m of messages) {
        const messageData = {
          hasMessage: !!m.message,
          remoteJid: m.key?.remoteJid,
          fromMe: m.key?.fromMe,
          messageType: m.message ? Object.keys(m.message)[0] : 'none'
        };
        
        console.log('📩 Incoming message event:', messageData);
        log.info('incoming_message', messageData);
        
        if (!m.message || m.key.fromMe) continue;
        const messageId = m.key?.id;
        cleanupSeenMessages();
        if (messageId && hasSeenMessage(messageId)) {
          console.log('↩️ Duplicate message ignored:', messageId);
          log.warn('duplicate_message_ignored', { messageId, userId: m.key?.remoteJid });
          continue;
        }
        if (messageId) markSeenMessage(messageId);
        
        const userId = m.key.remoteJid;
        if (!userId || processingUsers.has(userId)) continue;
        const text =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          m.message.imageMessage?.caption ||
          m.message.videoMessage?.caption ||
          '';
        if (!text.trim()) continue;
        cleanupCooldowns();

        console.log('📨 Processing:', userId, text.substring(0, 50));
        log.info('message_processing_start', {
          userId,
          textLength: text.length,
          messageId,
          processingUsersCount: processingUsers.size
        });
        processingUsers.add(userId);

        try {
          // 🔥 STEP 3: FULL PROFESSIONAL FLOW
          const { intent } = intentHandler.detectIntent(userId, text);
          console.log('🎯 Intent detected:', intent);
          log.info('intent_detected', { userId, intent, textLength: text.length });
          
          let user = userStore.getUser(userId);
          const isNewUser = !user || Object.keys(user).length === 0;
          if (isNewUser) {
            user = userStore.setUser(userId, { phone: userId, lastActive: Date.now() });
            console.log('👤 New user created:', userId);
            log.info('new_user_created', { userId });
          }

          const parsedDetails = parseFitnessDetails(text);
          if (Object.keys(parsedDetails).length > 0) {
            user = userStore.setUser(userId, parsedDetails);
            log.info('user_details_updated', { userId, details: Object.keys(parsedDetails) });
          }

          conversationStore.addMessage(userId, 'user', text);

          // Job service flow (handles 'job' or common typo 'jop')
          if (/\b(job|jop)\b/i.test(text)) {
            const jobResult = jobService.processFlow(userId, text);
            response = jobResult.reply;
            conversationStore.addMessage(userId, 'assistant', response);
            await sock.sendMessage(userId, { text: response });

            // If job flow completed, forward submission to owner/admin
            if (jobResult.done) {
              try {
                const u = userStore.getUser(userId) || {};
                const owner = config.OWNER_PHONE || PHONE_NUMBER;
                const summary = `New job submission from: ${userId}\nName: ${u.name || 'N/A'}\nRole: ${u.jobRole || 'N/A'}\nExperience: ${u.jobExperience || 'N/A'}\nLocation: ${u.jobLocation || 'N/A'}\nContact: ${u.jobContact || 'N/A'}`;
                // send to owner
                await sock.sendMessage(owner, { text: summary });
                log.info('job_forwarded', { userId, owner });
              } catch (err) {
                console.error('Error forwarding job submission to owner:', err.message);
                log.error('job_forward_error', { userId, error: err.message });
              }
            }

            processingUsers.delete(userId);
            continue;
          }

          // Check for steroids question - handle specially
          if (fitnessFlow.isSteroidsQuestion(text)) {
            response = fitnessFlow.handleSteroidsQuestion();
            console.log('💉 Steroids question handled');
            log.info('steroids_question_handled', { userId });
          } else {
            // Use the new fitness flow for conversation
            const flowResult = fitnessFlow.processFlow(user, text);
            response = flowResult.message;
            
            // Update user data with flow data
            if (flowResult.userData) {
              user = userStore.setUser(userId, { ...user, ...flowResult.userData });
              log.info('user_data_updated_from_flow', {
                userId,
                updatedFields: Object.keys(flowResult.userData),
                nextStep: flowResult.nextStep
              });
            }
            
            console.log('🏋️ Fitness flow response:', flowResult.nextStep);
            log.info('fitness_flow_processed', {
              userId,
              nextStep: flowResult.nextStep,
              responseLength: response.length
            });
          }
          
          // FINAL SEND
          await sock.sendMessage(userId, { text: response });
          conversationStore.addMessage(userId, 'assistant', response);
          userStore.setUser(userId, { lastAIResponse: response });
          console.log('✅ Full flow completed for:', userId);
          log.info('message_flow_completed', {
            userId,
            responseLength: response.length,
            processingTime: Date.now() - (messageId ? parseInt(messageId.split('_')[1]) || Date.now() : Date.now())
          });
          
        } catch (error) {
          console.error('❌ Flow failed:', error.message);
          log.error('message_flow_failed', {
            userId,
            error: error.message,
            stack: error.stack,
            text: text.substring(0, 100)
          });
          try {
            await sock.sendMessage(userId, {
              text: '⚠️ Apologies! Processing your request. Try "hi" or "help".'
            });
          } catch(e) {
            log.error('error_message_failed', { userId, error: e.message });
          }
        } finally {
          // Per-user lock release (safety)
          setTimeout(() => {
            processingUsers.delete(userId);
            log.info('user_lock_released', { userId, processingTime: 1500 });
          }, 1500);
        }
      }
    });

    console.log('🚀 Bot started - waiting for WhatsApp auth...');
    log.info('bot_startup_completed', {
      port: activePort,
      status: 'waiting_for_auth'
    });
  } catch (error) {
    console.error('💥 Startup error:', error.message);
    log.error('bot_startup_failed', {
      error: error.message,
      stack: error.stack
    });
    scheduleRestart(15000);
  } finally {
    isStartingBot = false;
  }
}

startBot();

process.on('SIGINT', () => process.exit(0));
