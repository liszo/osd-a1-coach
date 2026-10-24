// Text tasks for the app: grade a Schreiben email, check an imported lesson,
// and summarise a Live tutor session so the next session can build on it.
import { requireUser, requireKey, gemini, onlyPost, TEXT_MODEL } from "./_lib.js";

function gradePrompt(p) {
  return `You are a certified ÖSD Zertifikat A1 examiner grading Schreiben Aufgabe 2 (reply to a personal email, about ${p.wordTarget || 30} words) with the OFFICIAL ÖSD ZA1 rubric (Auswertungsbogen).
Prompt email from ${p.from}:
"""${p.email}"""
Task: ${p.task}
Guiding points: ${(p.points || []).join("; ") || "(the three questions in the email)"}
Learner's reply:
"""${p.text}"""
${p.intro ? `These opening lines were PRINTED on the answer sheet (they are not the learner's words, don't count them and don't grade them): """${p.intro}""". The learner still has to end with a sign-off (Gruß).` : ""}
Official criteria: Kommunikative Angemessenheit/Textsorte (0–1), Textaufbau (0–1: greeting, logical order, sign-off), Lexik (0–4), Formale Richtigkeit (0–4: grammar, word order, spelling, capital letters). Then deductions: 20–24 words −1, 15–19 words −2, under 15 words = not assessed (score 0); one guiding point answered too briefly or missing −1, only one point answered −2, off topic = 0. Score cannot go below 0. Maximum 10; at least 4 is required, otherwise the whole Schreiben module scores 0.
Be fair to an absolute beginner (day ${p.day} of ${p.plan || 52}) but apply the rules exactly. Count words yourself.
Reply with JSON only:
{"score": number 0-10 after deductions, "words": number, "criteria":[{"name":"Task & register","score":"x/1","comment_en":""},{"name":"Text structure","score":"x/1","comment_en":""},{"name":"Vocabulary","score":"x/4","comment_en":""},{"name":"Accuracy","score":"x/4","comment_en":""}], "deductions":["e.g. 22 words −1"], "errors":[{"wrong":"","right":"","why_en":"","why_fa":"short Persian explanation"}], "corrected_de":"the learner's text, minimally corrected", "tip_en":"one concrete tip", "tip_fa":"the same tip in Persian"}`;
}

function checkPrompt(p) {
  return `You are a meticulous German teacher and ÖSD examiner. Check this A1 lesson JSON for an absolute beginner. Report real errors only: wrong article or plural, wrong German grammar or spelling, wrong answer keys, wrong English or Persian translations, and items that break the ÖSD task format (JA/NEIN in Lesen Teil 2; 6 pictures with one extra in Lesen Teil 3 and Hören Teil 1; Hören Teil 2 note fields; ~30-word informal email in Schreiben Teil 2).
Reply with JSON only: {"issues":[{"path":"vocab[3].plural","problem_en":"","fix":"the full corrected value for that path"}]}. Use an empty list if everything is correct.
LESSON:
${JSON.stringify(p.lesson).slice(0, 200000)}`;
}

function summarizePrompt(p) {
  return `You are an ÖSD A1 speaking coach. Below is the transcript of a voice practice session (Day ${p.day} of ${p.plan || 52}) between the tutor and Raam, an absolute beginner. Transcription of the learner may contain recognition errors; judge kindly.
TRANSCRIPT:
${String(p.transcript).slice(0, 60000)}
SESSION MODE: ${p.mode || "coach"}. WEAK POINTS HE CAME IN WITH: ${(p.weak || []).join("; ") || "none listed"}.
Errors: list only real learner mistakes you are sure about. Skip lines that look like speech-recognition noise (garbled or non-German words), skip anything the tutor said, and do not "correct" a sentence into a different sentence with another meaning.
Score him with the official ÖSD Zertifikat A1 Sprechen criteria, judging only what he actually did in this session (give null for a part that was not practised):
teil1 = introducing himself (0-4), teil2 = describing a photo/situation (0-4), teil3 = role-play/asking and answering (0-4), vocab = range and accuracy of words (0-5), pron = pronunciation and fluency (0-4), grammar = basic structures, verb position, endings (0-4).
Reply with JSON only:
{"summary_en":"2 sentences on what was practised","strengths":["",""],
"errors":[{"wrong":"the exact words Raam said (copied from a Raam line, never from the tutor)","right":"the corrected German","category":"article|verb_position|conjugation|case|vocabulary|pronunciation|word_order|other","why_en":"one short reason"}],
"criteria":{"teil1":null,"teil2":null,"teil3":null,"vocab":null,"pron":null,"grammar":null},
"score_25": number 0-25 (sum of the criteria, scaled up fairly if some parts were not practised),
"topics_covered":["only from: Sprachen, Hobbys, Sport, Familie, Beruf, Lieblingsessen"],
"new_words_used":["German words he used correctly"],
"next_focus":["what the next session should drill"],
"fixed":["weak points from the list that he now handles correctly"],
"still_weak":["weak points or new problems that still need work"]}`;
}

function variantsPrompt(p) {
  return `You write practice sentences for Raam, an absolute beginner (CEFR A1) learning Austrian German for the ÖSD Zertifikat A1 exam. Day ${p.day}: ${p.theme}${p.grammar ? " (grammar: " + p.grammar + ")" : ""}.
Words he already knows: ${(p.known || []).join(", ").slice(0, 4000)}
For EACH target item below write ${p.count || 3} NEW sentences that use the target in a different everyday context (not the textbook example). Rules:
- 4–9 words, A1 level, mostly present tense, only very common words (mainly from the known list), correct capitalisation and punctuation, natural Austrian standard German.
- Vary the sentence type: statement, W-question, yes/no question. Personal contexts are welcome: Raam is from Tehran, works as a web developer, is married, is learning German for a trip to Austria.
- Word targets: use the word itself (with article or in the right case form). Phrase targets: put the phrase in a mini situation (it may be followed by a second short sentence).
For each sentence return:
  "de": the German sentence,
  "en": a natural English translation,
  "gap": the exact substring of "de" that contains the target (so it can be blanked; for nouns include the article if present),
  "wrong_en": 2 plausible but WRONG English translations (change the meaning, e.g. person, time, negation, object),
  "near_de": 2 German sentences identical to "de" except ONE word changed, both still correct German (for a listening test),
  "situation_en": for phrase targets only, one English sentence describing a situation where you would say the phrase (do not include the phrase itself).
Also return "hook": a short, vivid memory aid for the target in English (a sound-alike with an English or Persian word, or a funny image), max 15 words, no explanation of grammar.
Targets: ${JSON.stringify(p.items || [])}
Reply with JSON only: {"items":[{"id":"<target id exactly as given>","hook":"","sentences":[{"de":"","en":"","gap":"","wrong_en":["",""],"near_de":["",""],"situation_en":""}]}]}`;
}

// Transcribe an official recording from the user's private storage (signed URL) so the learner can re-listen with the text.
async function transcribe(p, res) {
  const base = (process.env.SUPABASE_URL || "https://jadzhgtnefezrlhapqwj.supabase.co") + "/storage/v1/object/sign/media/";
  if (!p || typeof p.url !== "string" || !p.url.startsWith(base)) return res.status(400).json({ error: "Bad audio URL." });
  const a = await fetch(p.url);
  if (!a.ok) return res.status(502).json({ error: "Couldn't read the recording." });
  const buf = Buffer.from(await a.arrayBuffer());
  if (buf.length > 18 * 1024 * 1024) return res.status(413).json({ error: "The recording is too large." });
  const prompt = `Transcribe this German exam recording (ÖSD Zertifikat A1, Hören ${String(p.part || "").replace(/[^A-Z0-9]/gi, "")}) word for word, including the spoken instructions. Split it into segments labelled "Anweisung" for instructions and "Text 1", "Text 2" … for the listening texts; label a repeated message "Wiederholung". For every line give the start time as m:ss, the speaker (Sprecher, Sprecherin, Mann, Frau, Kind) and a short English translation. Reply with JSON only: {"segments":[{"label":"","lines":[{"t":"0:00","speaker":"","de":"","en":""}]}]}`;
  const r = await gemini(`models/${TEXT_MODEL}:generateContent`, {
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: "audio/mpeg", data: buf.toString("base64") } }, { text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  });
  if (!r.ok) return res.status(502).json({ error: "Gemini request failed.", detail: r.json || r.text });
  const text = r.json?.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || "";
  try { return res.status(200).json({ result: JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) }); }
  catch { return res.status(502).json({ error: "Gemini returned text that is not JSON." }); }
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  if (!(await requireUser(req, res))) return;
  if (!requireKey(res)) return;

  const { mode, payload } = req.body || {};
  if (mode === "transcribe") return transcribe(payload, res);
  const prompt = mode === "grade" ? gradePrompt(payload) : mode === "check" ? checkPrompt(payload) : mode === "summarize" ? summarizePrompt(payload) : mode === "variants" ? variantsPrompt(payload) : null;
  if (!prompt) return res.status(400).json({ error: "Unknown mode." });

  const r = await gemini(`models/${TEXT_MODEL}:generateContent`, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: mode === "variants" ? 0.8 : 0.3 },
  });
  if (!r.ok) return res.status(502).json({ error: "Gemini request failed.", detail: r.json || r.text });

  const text = r.json?.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || "";
  try {
    const clean = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    return res.status(200).json({ result: JSON.parse(clean) });
  } catch {
    return res.status(502).json({ error: "Gemini returned text that is not JSON.", raw: text.slice(0, 2000) });
  }
}
