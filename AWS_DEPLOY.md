## AWS EC2 Stable Run Guide

If the bot worked once and later stopped, the most common reason is that it was started from an SSH terminal and no process manager was keeping it alive.

### Recommended setup

1. Install Node.js and Chromium dependencies on the EC2 server.
2. Upload the project and `.env`.
3. Install dependencies:

```bash
npm install
npm install -g pm2
```

4. Start the bot with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. Open the health URL in browser:

```text
http://YOUR_SERVER_IP:11000/health
```

### Why AWS deployment may stop

- SSH terminal closed after running `node index.js`
- EC2 instance rebooted and bot was not configured to auto-start
- Bot crashed and there was no process manager to restart it
- Security group did not allow the required port
- Session files were not persisted properly between deploys or restarts

### Useful PM2 commands

```bash
pm2 status
pm2 logs fitcoach-bot
pm2 restart fitcoach-bot
pm2 stop fitcoach-bot
```

### Port and firewall

Make sure EC2 Security Group allows inbound traffic on:

- `11000` for browser status/QR page
- `22` for SSH

### Important note for WhatsApp session

The first QR scan must happen once on the server environment. After that, keep the session directory safe and do not delete it unless login breaks.
