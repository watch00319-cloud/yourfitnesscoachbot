# Railway Deploy Guide

1. Install CLI:
```
npm i -g @railway/cli
```

2. Login:
```
railway login
```

3. Init (in project dir):
```
railway init
```
Select/create project.

4. Vars in Railway Dashboard:
- TELEGRAM_BOT_TOKEN
- GEMINI_API_KEY

5. Deploy:
```
railway up
```

Procfile created: `web: npm start`

Auto-deploys on git push. Bot polls 24/7!
