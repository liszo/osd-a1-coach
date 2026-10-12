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
| `SUPABASE_URL` | `https://jadzhgtnefezrlhapqwj.supabase.co` |
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

## v7 — daily report and personal tutor (Oct 2026)

- **Daily report (Tagesbericht):** tap the trophy at the end of the path (or "See today's report" when the day is complete, or Progress → Day reports). Shows today's Lesen, Hören and Schreiben projected onto the official ÖSD scale (30/30/15, written total /75 with the minimums 6/6/email 4 and 38), Sprechen /25 from the tutor or a self-rating with the ÖSD criteria, every exam part's raw score, lesson accuracy, all mistakes grouped by type, and up to six ranked weak spots with examples.
- **Repair lesson:** one tap turns today's mistakes into a short lesson.
- **Personal tutor:** the Gemini Live brief now contains today's scores, exam-part results, lesson accuracy, every mistake, the email errors, pronunciation problems, ranked weak points with a drill for each, weak points from earlier days and what was still weak after earlier sessions. New default mode at the end of a day: **Fix my weak spots**. Session notes record what got fixed and what is still weak, so the next session continues from there.
- Hören Teil 2 notes and Schreiben Teil 1 form errors are now logged as mistakes; the form score is saved; pronunciation checks are kept per day.

## v6 — more game (Oct 2026)

- **Schilling coins** (top bar → Shop): earned for lessons (5, +5 perfect), exam-format steps (10), break chests (5–15), daily quests (10–20), achievements (20), level-ups (30) and finishing a whole day (50).
- **Shop:** streak freeze (150, hold up to 2, used automatically for missed days; one free to start), Double XP for 15 minutes (100), lesson hints (10, removes one wrong answer).
- **Levels** from total XP, with a level-up screen. **Combo bonus** XP for long right-answer streaks.
- **Weekly leagues** named after Austrian cities, Bregenz → Innsbruck → Salzburg → Linz → Graz → Wien. Honest rules, no fake opponents: 800+ XP in a week moves you up, under 300 moves you down.
- **24 achievements** (Progress tab), **rotating daily quests** you claim for coins, celebration screens for streaks, levels, badges and promotions.
- **Wörter-Blitz** (Review tab): 60-second vocabulary speed round with a high score.
- **Edi**, an original edelweiss mascot, greets you on the path and cheers on the celebration screens.

## v5 — game-style lessons (Oct 2026)

- **Learn tab = a lesson path.** Each day is a winding path of round lesson buttons. Learn is split into short lessons (Alphabet, Sounds, Words 1–3, Phrases 1–3, Grammar), Practice into parts, then Hören, Dictation, Lesen, Schreiben, Sprechen and the Daily quiz. Tap a button for its card, then Start. Break chests sit at 60/120/180 minutes; a trophy waits at the end of the day.
- **One question per screen.** Progress bar, big Check button, green/red feedback bar with the right answer and EN/FA explanation, then Continue. Wrong answers come back once at the end of the lesson. Exercise types: new-word cards, meaning, listen and pick (with slow button), match pairs, der/die/das, word bank, typing with ä ö ü ß keys, dictation, spelled names, speak (speech recognition in Chrome/Edge).
- **XP, streak, daily goal.** Lessons give 10 XP (+5 for 100 %), exam-format steps 15, breaks 5. Top bar: day, streak, XP today, days to the exam. Daily goal and sound effects in Settings. Daily quests on the Learn tab, weekly XP chart on Progress.
- **Lesson complete screen** with XP, accuracy and time; below 80 % it offers Practise again.
- **Guidebook** (button on the day banner) holds the full reference page: goals, alphabet, vocabulary with cover-and-check, phrases, grammar.
- Plan tab is grouped into five colour-coded units; flashcards and exam-format steps use the same full-screen lesson layout. Keyboard: Enter = Check/Continue, 1–9 = pick an answer, 1–4 = grade a flashcard.

## v4 — research-based redesign (Oct 2026)

- **Exam centre** (`Exam` tab): 4 scheduled mocks (Day 22 official ZA1 Modellsatz, Day 27 official ZA1/Österreich, Day 29 Übungsmaterialien Übungssatz 1, Day 31 Übungssatz 2 / Digital Test-Training) plus the in-app **Übungstest A** (`days/mock-a.json`, original content in exact ZA1 format). Timers 25/10/20 + 10 min Sprechen prep, test mode without feedback, flags, answer sheet, results against the real minimums (Lesen ≥6, Hören ≥6, Schreiben A2 ≥4, written ≥38/75, oral ≥12/25). Official PDFs are only linked, never hosted.
- **Lessons** (Oxford Word Skills / Living Grammar pattern): "Ich kann…" goals, cover-and-check vocabulary, 3-item "check yourself" before practice, mastery at 80 % with "retry the wrong ones".
- **Review tab**: spaced-repetition cards incl. every logged mistake, Austrian words deck (`days/austria.json`), mixed review across all days.
- **Schreiben checker**: greeting/sign-off/length checks with the official ÖSD deductions; Gemini grades with the official Auswertungsbogen rubric.
- **Sprechen**: record yourself and compare with the model voice.
- **Progress tab**: streak, hours, latest mock vs minimums, accuracy by skill, 34-day map.
- **Today**: steps grouped with breaks, extra resources per day (DW Nicos Weg, ÖIF Sprachportal, Hueber Schritte Österreich, ÖSD downloads).
