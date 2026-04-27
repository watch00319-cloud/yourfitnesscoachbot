# FitCoach Telegram Bot 🚀

## Local Run
```
npm start
```

## Railway Deploy (GitHub + Railway)
1. GitHub Repo banao:
```
git init
git add .
git commit -m "Initial Telegram bot"
gh repo create fitcoach-telegram --public --push
```

2. Railway:
```
npm i -g @railway/cli
railway login
railway init --github
```
Railway GitHub repo link → Auto-deploy on push!

3. Railway Dashboard:
- TELEGRAM_BOT_TOKEN
- GEMINI_API_KEY

Done! Bot on Railway + GitHub linked. 🎉
