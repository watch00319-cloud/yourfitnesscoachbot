module.exports = {
  apps: [
    {
      name: 'fitcoach-bot',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '20s',
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 11000,
        BOT_DISABLE_QR_OPEN: 'true',
        PUPPETEER_EXECUTABLE_PATH: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        SESSION_PATH: 'C:/Users/thenu/OneDrive/Desktop/whatsaap bot laptop on/.wwebjs_auth',
      },
    },
  ],
};
