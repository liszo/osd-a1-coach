// Mints a short-lived, single-use token so the browser can open a Gemini Live
// session without ever seeing the real API key.
import { requireUser, requireKey, gemini, onlyPost, LIVE_MODEL } from "./_lib.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  if (!(await requireUser(req, res))) return;
  if (!requireKey(res)) return;

  const now = Date.now();
  const body = {
    uses: 1,
    expireTime: new Date(now + 30 * 60 * 1000).toISOString(),       // session may run up to 30 min
    newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(), // must connect within 2 min
  };

  // Ephemeral tokens are documented on v1beta; v1alpha is tried as a fallback.
  for (const version of ["v1beta", "v1alpha"]) {
    const r = await gemini("auth_tokens", body, version);
    if (r.ok && r.json && r.json.name) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ token: r.json.name, apiVersion: version, model: LIVE_MODEL });
    }
    if (version === "v1alpha") {
      return res.status(502).json({ error: "Gemini refused to create a Live token.", detail: r.json || r.text });
    }
  }
}
