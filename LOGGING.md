# Bot Logging & Monitoring Guide

## 🔍 How to Monitor Fixed Bot

### 1. Restart Bot (Apply Fixes)
```bash
# Stop current bot (Ctrl+C)
# Then restart:
node index.js
```

### 2. Watch Key Logs
```
📩 Incoming user messages
🤖 Normal replies  
⏳ Spam protection (new)
📤 Follow-ups (now properly cooldown-protected)
⏭️ Skipped replies (mute/maintenance/spam)
```

### 3. Test the Fix
1. Send test message → **should get 1 normal reply**
2. Wait 1min → send again → **should reply normally** 
3. Wait 35min+ → **might get 1 follow-up** (24h cooldown now)
4. No more "same message bar bar"!

### 4. Debug Commands (Owner Only)
```
.status    → Bot stats
.off       → Disable AI globally  
.on        → Enable AI
.mute      → Reply to msg to mute user
.unmute    → Reply to msg to unmute
```

### 5. Health Check
```
http://localhost:11000/health
```
Shows: status, uptime, whatsappReady

## ✅ Expected Result
**NO MORE repeated same messages!** 🎉

**Root cause fixed:** Inactivity follow-ups now 24h cooldown + 2min anti-spam.
