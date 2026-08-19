# Анна

A warm, low-pressure fitness companion for Мила (Mila), delivered entirely through Telegram.
Twice a week, at the times she chose, Анна checks in by voice note and text, and negotiates a
delay or a reschedule instead of guilt-tripping when the timing doesn't work.

## Stack

Next.js (App Router) + Supabase (Postgres) + Claude API (Haiku 4.5) + Telegram Bot API +
ElevenLabs (voice, optional).

## Setup

1. **Supabase** — create a project, then run `supabase/schema.sql` in the SQL editor (or deploy
   and hit `/api/admin/migrate?key=$ADMIN_KEY` once `DATABASE_URL` is set). Collect the project
   URL, anon key, service-role key, and Postgres connection string.
2. **Anthropic** — create an API key at console.anthropic.com.
3. **ElevenLabs** (optional, for voice) — create an API key and pick/clone a Russian voice,
   grab its voice ID. Without this, Анна still works over plain text.
4. **Telegram** — message [@BotFather](https://t.me/BotFather), run `/newbot`, and copy the token
   it gives you. Free, no phone number of its own, no per-message cost.
5. Copy `.env.example` to `.env.local` and fill in the values above, plus `MILA_TIMEZONE`.
6. Deploy (e.g. to Vercel) with the same environment variables set.
7. Register the webhook once, from your machine (replace both placeholders):
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://<your-domain>/api/telegram/webhook"
   ```
8. Set up a free external scheduler (e.g. [cron-job.org](https://cron-job.org)) to call
   `https://<your-domain>/api/cron/tick?secret=$CRON_SECRET` every 5 minutes. This is what fires
   scheduled check-ins, nudges, and rolls next week's sessions — Vercel's Hobby plan only allows
   once-daily cron, so an external pinger is required for anything more frequent.
9. Have Mila install Telegram, find the bot (by the username you gave it in BotFather), and send
   it a first message — that starts onboarding (Mode 1: Анна asks for her two preferred days and
   times).

The root page (`/`) is a read-only admin dashboard: her schedule, this week's progress, the next
session, and the recent transcript.

## Local development

```bash
npm install
npm run dev
```

`npm run lint` and `npm run build` should both pass before deploying.
