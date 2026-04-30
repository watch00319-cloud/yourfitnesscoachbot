# Elite Fitness Coach WhatsApp Bot

Production-ready WhatsApp bot built with Baileys + Gemini AI.

## Run Locally

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
copy .env.example .env
```
Fill real values in `.env`.

3. Start bot:
```bash
npm start
```

Default dashboard: `http://localhost:3000` (or `PORT` from `.env`).

## Required Environment Variables

- `GEMINI_API_KEY`
- `OWNER_PHONE` (digits only, country code included)
- `UPI_LINK`
- `PORT` (optional, default `3000`)

## Project Entry Point

- Main bot: `whatsapp-stable.js`

## Notes

- Auth/session files are persisted in `auth_info/`.
- Logs are written to `bot.log` and `bot-error.log`.
- Do not commit `.env`, auth folders, logs, or private keys.
