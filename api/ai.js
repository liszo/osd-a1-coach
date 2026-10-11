// Text tasks for the app: grade a Schreiben email, check an imported lesson,
// and summarise a Live tutor session so the next session can build on it.
import { requireUser, requireKey, gemini, onlyPost, TEXT_MODEL } from "./_lib.js";

function gradePrompt(p) {
  return `You are a certified ÖSD Zertifikat A1 examiner grading Schreiben Aufgabe 2 (reply to a personal email, about ${p.wordTarget || 30} words).
Prompt email from ${p.from}:
"""${p.email}"""
Task: ${p.task}
Guiding points: ${(p.points || []).join("; ")}
Learner's reply:
"""${p.text}"""
Grade on the ÖSD A1 criteria: task fulfilment (all guiding points, greeting and sign-off), text structure and register (informal du), vocabulary, formal accuracy (grammar, word order, spelling, capital letters). Maximum 10 points; 4 are needed to pass. Be fair to an absolute beginner on day ${p.day} of 34, but strict about exam rules.
Reply with JSON only:
{"score": number 0-10, "criteria":[{"name":"Task","score":"x/4","comment_en":""},{"name":"Structure & register","score":"x/2","comment_en":""},{"name":"Vocabulary","score":"x/2","comment_en":""},{"name":"Accuracy","score":"x/2","comment_en":""}], "errors":[{"wrong":"","right":"","why_en":"","why_fa":"short Persian explanation"}], "corrected_de":"the learner's text, minimally corrected", "tip_en":"one concrete tip", "tip_fa":"the same tip in Persian"}`;
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
