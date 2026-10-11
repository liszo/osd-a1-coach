import { LIVE_MODEL, TEXT_MODEL } from "./_lib.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ai: !!process.env.GEMINI_API_KEY, liveModel: LIVE_MODEL, textModel: TEXT_MODEL });
}
