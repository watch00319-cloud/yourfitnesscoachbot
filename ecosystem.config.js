module.exports = {
  apps: [
    {
      name: 'elite-fitness-coach',
      script: 'whatsapp-stable.js',
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
        BOT_DISABLE_QR_OPEN: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        SESSION_PATH: './auth_info'
      }
    },
  ],
};
