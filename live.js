// Gemini Live client: microphone → 16 kHz PCM → WebSocket; 24 kHz PCM → speakers.
// Connects straight from the browser with a single-use token from /api/live-token.
// Long sessions: context-window compression lifts the 15-minute audio limit, and session resumption
// reconnects transparently when Google closes a connection (about every 10 minutes, announced by goAway).

const CAPTURE_WORKLET = `
class Cap extends AudioWorkletProcessor {
  process(inputs) { const ch = inputs[0] && inputs[0][0]; if (ch) this.port.postMessage(ch.slice(0)); return true; }
}
registerProcessor("cap", Cap);`;

function b64FromInt16(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function int16FromB64(b64) {
  const bin = atob(b64);
  const len = bin.length - (bin.length % 2);
  const out = new Int16Array(len / 2);
  for (let i = 0, j = 0; i < len; i += 2, j++) { let v = bin.charCodeAt(i) | (bin.charCodeAt(i + 1) << 8); if (v >= 0x8000) v -= 0x10000; out[j] = v; }
  return out;
}
function downsample(f32, fromRate, toRate) {
  if (fromRate === toRate) return f32;
  const ratio = fromRate / toRate, n = Math.floor(f32.length / ratio), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * ratio), end = Math.min(f32.length, Math.floor((i + 1) * ratio));
    let sum = 0; for (let k = start; k < end; k++) sum += f32[k];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export class LiveSession {
  /**
   * @param {{token:string, apiVersion:string, model:string, systemText:string, voice?:string,
   *          onStatus:(s:string)=>void, onTranscript:(role:"you"|"tutor", text:string, final:boolean)=>void,
   *          onError:(msg:string)=>void, onLevel?:(v:number)=>void}} o
   */
  constructor(o) { this.o = o; this.muted = false; this.closed = false; this.userClosed = false; this.sources = []; this.nextTime = 0; this.cur = { you: "", tutor: "" };
    this.handle = null; this.reconnects = 0; this.micStarted = false; this.lite = false; this.everLive = false; }

  async start() {
    const { token, apiVersion, model, systemText, voice } = this.o;
    // Audio contexts must be created inside the user's tap.
    this.outCtx = this.o.outCtx || new AudioContext({ sampleRate: 24000 });
    this.inCtx = this.o.inCtx || new AudioContext();
    try { await this.outCtx.resume(); await this.inCtx.resume(); } catch {}
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });

    this.connect(token, apiVersion);
  }

  connect(token, apiVersion) {
    const { model, systemText, voice } = this.o;
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url); this.ws = ws; this.gotSetup = false;
    this.o.onStatus(this.everLive ? "reconnecting" : "connecting");
    ws.onopen = () => {
      const setup = {
        model: `models/${model}`,
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || "Kore" } } } },
        systemInstruction: { parts: [{ text: systemText }] },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: { automaticActivityDetection: { silenceDurationMs: 1400, prefixPaddingMs: 300 } },
      };
      if (!this.lite) { setup.contextWindowCompression = { slidingWindow: {} }; setup.sessionResumption = this.handle ? { handle: this.handle } : {}; }
      this.send({ setup });
    };
    ws.onmessage = (ev) => { if (ws === this.ws) this.onMessage(ev); };
    ws.onerror = () => {};
    ws.onclose = (ev) => { if (ws === this.ws) this.onClose(ev); };
  }

  async onClose(ev) {
    if (this.userClosed || this.closed) return;
    this.flush("you"); this.flush("tutor");
    // the first connection was refused before setup finished: retry once without the long-session options
    if (!this.everLive && !this.gotSetup && !this.lite) { this.lite = true; try { const t = await this.o.getToken(); return this.connect(t.token, t.apiVersion); } catch {} }
    // Google closes connections regularly; resume the same conversation with a fresh token
    if (this.everLive && this.reconnects < 6 && this.o.getToken) {
      this.reconnects++; this.o.onStatus("reconnecting");
      try { await new Promise((r) => setTimeout(r, 400)); const t = await this.o.getToken(); if (!this.userClosed) return this.connect(t.token, t.apiVersion); } catch {}
    }
    const why = ev.reason ? ` (${ev.reason})` : ev.code !== 1000 ? ` (code ${ev.code})` : "";
    this.cleanup();
    if (ev.code !== 1000) this.o.onError("The tutor disconnected" + why + ".");
    this.o.onStatus("ended");
  }

  send(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }

  async onMessage(ev) {
    const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.setupComplete) {
      this.gotSetup = true; const first = !this.everLive; this.everLive = true; this.o.onStatus("live");
      if (!this.micStarted) { this.micStarted = true; await this.startMic(); }
      if (first) this.send({ realtimeInput: { text: this.o.starter || "Hallo! Bitte beginnen Sie die heutige Übung." } });
      else if (this.o.onResumed) this.o.onResumed(!!this.handle && !this.lite);
      return;
    }
    if (m.sessionResumptionUpdate) { const u = m.sessionResumptionUpdate; if (u.resumable && u.newHandle) this.handle = u.newHandle; }
    if (m.goAway && this.o.onGoAway) this.o.onGoAway(m.goAway.timeLeft);
    const sc = m.serverContent;
    if (!sc) return;
    if (sc.interrupted) this.stopPlayback();
    if (sc.inputTranscription && sc.inputTranscription.text) { this.flush("tutor"); this.cur.you += sc.inputTranscription.text; this.o.onTranscript("you", this.cur.you, false); }
    if (sc.outputTranscription && sc.outputTranscription.text) { this.flush("you"); this.cur.tutor += sc.outputTranscription.text; this.o.onTranscript("tutor", this.cur.tutor, false); }
    if (sc.modelTurn && sc.modelTurn.parts) for (const p of sc.modelTurn.parts) if (p.inlineData && p.inlineData.data) this.play(p.inlineData.data);
    if (sc.turnComplete) { this.flush("you"); this.flush("tutor"); }
  }

  flush(role) { if (this.cur[role]) { this.o.onTranscript(role, this.cur[role], true); this.cur[role] = ""; } }

  async startMic() {
    const blobUrl = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: "text/javascript" }));
    await this.inCtx.audioWorklet.addModule(blobUrl);
    this.src = this.inCtx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.inCtx, "cap");
    const rate = this.inCtx.sampleRate;
    let pending = [], pendingLen = 0;
    this.node.port.onmessage = (e) => {
      if (this.muted || this.closed) return;
      const ds = downsample(e.data, rate, 16000);
      pending.push(ds); pendingLen += ds.length;
      if (this.o.onLevel) { let s = 0; for (let i = 0; i < ds.length; i++) s += ds[i] * ds[i]; this.o.onLevel(Math.sqrt(s / ds.length)); }
      if (pendingLen >= 1600) { // ~100 ms
        const pcm = new Int16Array(pendingLen); let o = 0;
        for (const c of pending) for (let i = 0; i < c.length; i++) { const v = Math.max(-1, Math.min(1, c[i])); pcm[o++] = v < 0 ? v * 0x8000 : v * 0x7fff; }
        pending = []; pendingLen = 0;
        this.send({ realtimeInput: { audio: { data: b64FromInt16(pcm), mimeType: "audio/pcm;rate=16000" } } });
      }
    };
    this.src.connect(this.node);
  }

  play(b64) {
    const pcm = int16FromB64(b64);
    if (!pcm.length) return;
    const buf = this.outCtx.createBuffer(1, pcm.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    const s = this.outCtx.createBufferSource();
    s.buffer = buf; s.connect(this.outCtx.destination);
    const t = Math.max(this.outCtx.currentTime + 0.02, this.nextTime);
    s.start(t); this.nextTime = t + buf.duration;
    this.sources.push(s);
    s.onended = () => { this.sources = this.sources.filter((x) => x !== s); };
  }

  stopPlayback() { for (const s of this.sources) { try { s.stop(); } catch {} } this.sources = []; this.nextTime = 0; }

  setMuted(v) { this.muted = v; }

  sendText(t) { this.send({ realtimeInput: { text: t } }); }

  stop() { this.flush("you"); this.flush("tutor"); this.userClosed = true; this.closed = true; try { this.ws && this.ws.close(1000, "done"); } catch {} this.cleanup(); this.o.onStatus("ended"); }

  cleanup() {
    this.closed = true;
    this.stopPlayback();
    try { this.src && this.src.disconnect(); } catch {}
    try { this.node && this.node.disconnect(); } catch {}
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    try { this.inCtx && this.inCtx.state !== "closed" && this.inCtx.close(); } catch {}
    try { this.outCtx && this.outCtx.state !== "closed" && this.outCtx.close(); } catch {}
  }
}
