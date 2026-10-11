# ÖSD A1 Coach

Installable study app (PWA) for the ÖSD Zertifikat A1 exam on 14 November 2026.
Static front end + Vercel functions + Supabase (auth, sync, file storage) + Gemini (Live tutor, writing feedback, lesson checks).

## What's where

| Path | What it does |
|---|---|
| `index.html`, `styles.css`, `app.js` | The app (no build step) |
| `live.js` | Gemini Live voice client: mic → 16 kHz PCM → WebSocket, 24 kHz PCM → speakers |
| `config.js` | Public Supabase URL + anon key (safe: Row Level Security protects data) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and "Install app" |
| `days/dayNN.json`, `days/index.json` | Published lessons. Add a day = add its JSON and its number to `index.json` |
| `api/live-token.js` | Mints a single-use Gemini Live token (your API key never reaches the browser) |
| `api/ai.js` | Writing feedback, lesson checking, tutor-session summaries |
| `api/health.js` | Tells the app whether AI features are configured |
| `supabase/schema.sql` | Tables `progress`, `days` and private bucket `media` (already applied) |

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://bnltfspyvssygfysqlpy.supabase.co` |
| `SUPABASE_ANON_KEY` | the anon key from `config.js` |
| `GEMINI_API_KEY` | your key from https://aistudio.google.com/apikey |
| `LIVE_MODEL` (optional) | defaults to `gemini-3.8-live` |
| `TEXT_MODEL` (optional) | defaults to `gemini-flash-latest` |

Redeploy after changing variables.

## Supabase settings

Authentication → URL Configuration → **Site URL** = your Vercel address (e.g. `https://osd-a1-coach.vercel.app`), so the confirmation email opens the app.

## How the tutor knows your day

When you start a session, the app builds the tutor's instructions from: the day number and plan position, that day's words, phrases, grammar and speaking script, your recent mistakes, weak exercise scores, and the notes saved from your last three tutor sessions. After each session the transcript is summarised by Gemini and stored with your progress, so the next session continues from there.

## Local development

Any static server works for the UI (`npx serve .`); the `/api` functions need `npx vercel dev`.
