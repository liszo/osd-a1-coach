// Shared helpers for the Vercel functions.
const GEMINI = "https://generativelanguage.googleapis.com";

export const LIVE_MODEL = process.env.LIVE_MODEL || "gemini-3.8-live";
export const TEXT_MODEL = process.env.TEXT_MODEL || "gemini-flash-latest";

// Only signed-in users of this app may spend the Gemini key.
export async function requireUser(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { res.status(401).json({ error: "Sign in first." }); return null; }
  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) { res.status(401).json({ error: "Your session expired. Sign in again." }); return null; }
  return r.json();
}

export function requireKey(res) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY is not set in Vercel → Settings → Environment Variables." });
    return false;
  }
  return true;
}

export async function gemini(path, body, version = "v1beta") {
  const r = await fetch(`${GEMINI}/${version}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { ok: r.ok, status: r.status, json, text };
}

export function onlyPost(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Use POST." }); return false; }
  return true;
}
