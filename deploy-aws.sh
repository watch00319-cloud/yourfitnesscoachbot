#!/bin/bash
set -e

echo "🚀 FitCoach Bot AWS Deploy Script"
echo "================================="

# Config
EC2_IP="13.49.227.70"
EC2_USER="ubuntu"
BOT_DIR="/home/ubuntu/fitcoach-bot"
KEY_FILE="BOT-KEY.pem"

echo "📦 1. Creating deploy package..."
zip -r deploy-bot.zip . -x "node_modules/*" ".wwebjs_auth/*" ".wwebjs_auth_v2/*" ".wwebjs_cache/*" "deploy-aws.sh" "*.zip"

echo "📤 2. Uploading to EC2..."
scp -i $KEY_FILE -o StrictHostKeyChecking=no deploy-bot.zip $EC2_USER@$EC2_IP:/home/$EC2_USER/

echo "🔗 3. SSH & Deploying..."
ssh -i $KEY_FILE -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'EOF'
  cd /home/ubuntu
  unzip -o deploy-bot.zip
  cd fitcoach-bot || cd bot || exit 1
  npm ci --production --no-audit --no-fund
  pm2 restart fitcoach-bot || pm2 restart ecosystem.config.js || pm2 restart all
  pm2 save
  echo "✅ Deploy complete! Check: curl http://localhost:11000/health"
EOF

echo "🎉 Deployment successful!"
echo "🔍 Verify: http://13.49.227.70:11000/health"
rm deploy-bot.zip
