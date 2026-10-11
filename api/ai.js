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
Official criteria: Kommunikative Angemessenheit/Textsorte (0–1), Textaufbau (0–1: greeting, logical order, sign-off), Lexik (0–4), Formale Richtigkeit (0–4: grammar, word order, spelling, capital letters). Then deductions: 20–24 words −1, 15–19 words −2, under 15 words = not assessed (score 0); one guiding point answered too briefly or missing −1, only one point answered −2, off topic = 0. Score cannot go below 0. Maximum 10; at least 4 is required, otherwise the whole Schreiben module scores 0.
Be fair to an absolute beginner (day ${p.day} of 34) but apply the rules exactly. Count words yourself.
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
  return `You are an ÖSD A1 speaking coach. Below is the transcript of a voice practice session (Day ${p.day} of 34) between the tutor and Raam, an absolute beginner. Transcription of the learner may contain recognition errors; judge kindly.
TRANSCRIPT:
${String(p.transcript).slice(0, 60000)}
Reply with JSON only:
{"summary_en":"2 sentences on what was practised","strengths":["",""],"errors":[{"wrong":"","right":""}],"next_focus":["what the next session should drill"],"score_25": number 0-25}`;
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  if (!(await requireUser(req, res))) return;
  if (!requireKey(res)) return;

  const { mode, payload } = req.body || {};
  const prompt = mode === "grade" ? gradePrompt(payload) : mode === "check" ? checkPrompt(payload) : mode === "summarize" ? summarizePrompt(payload) : null;
  if (!prompt) return res.status(400).json({ error: "Unknown mode." });

  const r = await gemini(`models/${TEXT_MODEL}:generateContent`, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
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
