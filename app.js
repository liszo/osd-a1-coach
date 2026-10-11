import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { CONFIG } from "./config.js";
import { LiveSession } from "./live.js";
/* ---------- constants ---------- */
const EXAM = new Date(2026, 10, 14);           // Sat 14 Nov 2026 = 23 Aban 1405
const DEFAULT_START = "2026-10-11";
const NOTEBOOK_URL = "https://notebook.google.com/notebook/9637d072-33fc-4071-bd1f-732309a91656";
const MODELSATZ_URL = "https://www.osd.at/wp-content/uploads/2024/09/ZA1-Modellsatzbroschure_WEB.pdf";
const DAY_MS = 86400000;

const PLAN = [
 {t:"Alphabet, sounds, greetings, du or Sie", fa:"الفبا، تلفظ، سلام و احوال‌پرسی", g:"du / Sie, heißen, spelling your name", k:"lesson"},
 {t:"Introducing yourself: country, city, languages", fa:"معرفی خود: کشور، شهر، زبان‌ها", g:"sein, personal pronouns, W-questions (wer, wie, woher, wo)", k:"lesson"},
 {t:"Numbers 0–100, phone numbers, age", fa:"اعداد ۰ تا ۱۰۰، شماره تلفن، سن", g:"haben; number order (einundzwanzig = 1 + 20)", k:"lesson"},
 {t:"Everyday verbs, yes/no questions", fa:"فعل‌های روزمره، سؤال بله/خیر", g:"present tense endings, verb in position 2, verb-first questions", k:"lesson"},
 {t:"Family", fa:"خانواده", g:"der/die/das, ein/eine, plurals, mein/dein", k:"lesson"},
 {t:"Jobs and work", fa:"شغل و کار", g:"nicht vs kein, stem-changing verbs (sprechen, fahren, lesen)", k:"lesson"},
 {t:"Review + mini-test 1", fa:"مرور و آزمونک ۱", g:"everything from Days 1–6", k:"review"},
 {t:"Food and drink, ordering", fa:"غذا و نوشیدنی، سفارش دادن", g:"Akkusativ (einen/den), möchten", k:"lesson"},
 {t:"Shopping, prices, euros", fa:"خرید، قیمت، یورو", g:"numbers to 1000, Wie viel kostet …?, quantities", k:"lesson"},
 {t:"Clock time, daily routine", fa:"ساعت و برنامه روزانه", g:"separable verbs (aufstehen, anrufen, einkaufen)", k:"lesson"},
 {t:"Days, months (Jänner), dates, appointments", fa:"روزها، ماه‌ها، تاریخ، قرار ملاقات", g:"am / um / im, ordinal numbers", k:"lesson"},
 {t:"Free time and invitations", fa:"اوقات فراغت و دعوت", g:"gern, können, wollen", k:"lesson"},
 {t:"Home, furniture, colours", fa:"خانه، وسایل، رنگ‌ها", g:"adjectives after sein, es gibt", k:"lesson"},
 {t:"Review + mini-test 2", fa:"مرور و آزمونک ۲", g:"everything from Days 8–13", k:"review"},
 {t:"Buffer: catch up + vocabulary sweep", fa:"روز جبرانی: عقب‌ماندگی و مرور لغات", g:"", k:"buffer"},
 {t:"City, directions, transport", fa:"شهر، آدرس، حمل‌ونقل", g:"Dativ prepositions (mit, in, bei, zu), wo / wohin", k:"lesson"},
 {t:"Body, health, at the doctor", fa:"بدن، سلامتی، پیش دکتر", g:"müssen, dürfen, imperative with Sie", k:"lesson"},
 {t:"Clothes, weather, Austrian words", fa:"لباس، هوا، واژه‌های اتریشی", g:"Austrian vocabulary, adjectives (basic)", k:"lesson"},
 {t:"Station, hotel, announcements", fa:"ایستگاه، هتل، اطلاعیه‌ها", g:"Perfekt with haben", k:"lesson"},
 {t:"Last weekend", fa:"آخر هفته گذشته", g:"Perfekt with sein, war / hatte", k:"lesson"},
 {t:"Post office, bank, filling in forms", fa:"پست، بانک، پر کردن فرم", g:"form vocabulary (Schreiben Teil 1)", k:"lesson"},
 {t:"MOCK 1: official ÖSD model test", fa:"آزمون آزمایشی ۱: نمونه رسمی ÖSD", g:"timed, all four skills", k:"mock"},
 {t:"Fix mock 1 + Lesen strategies", fa:"رفع اشکال آزمون ۱ + استراتژی خواندن", g:"", k:"review"},
 {t:"Hören strategies: numbers, spelling, announcements", fa:"استراتژی شنیدن: اعداد، هجی، اطلاعیه", g:"", k:"review"},
 {t:"Schreiben drill: forms + emails", fa:"تمرین نوشتن: فرم و ایمیل", g:"", k:"review"},
 {t:"Sprechen: all three parts with Gemini Live", fa:"صحبت: هر سه بخش با Gemini Live", g:"", k:"review"},
 {t:"MOCK 2 + review", fa:"آزمون آزمایشی ۲ + مرور", g:"timed", k:"mock"},
 {t:"Buffer: weakest skill", fa:"روز جبرانی: ضعیف‌ترین مهارت", g:"", k:"buffer"},
 {t:"MOCK 3 + review", fa:"آزمون آزمایشی ۳ + مرور", g:"timed", k:"mock"},
 {t:"Weak spots + full vocabulary sweep", fa:"رفع ضعف‌ها + مرور کامل لغات", g:"", k:"review"},
 {t:"FINAL timed mock", fa:"آزمون نهایی زمان‌دار", g:"exam conditions", k:"mock"},
 {t:"Buffer: targeted repair", fa:"روز جبرانی: رفع اشکال", g:"", k:"buffer"},
 {t:"Light review + speaking warm-up", fa:"مرور سبک + گرم کردن صحبت", g:"", k:"buffer"},
 {t:"Rest + exam logistics", fa:"استراحت + آماده‌سازی روز آزمون", g:"", k:"rest"}
];

const STEPS = [
 {id:"review",   en:"Review cards",   de:"Wiederholen", min:20, has:()=>true},
 {id:"media",    en:"Listen & watch", de:"Einstimmen",  min:15, has:d=>d.media||d.watch},
 {id:"learn",    en:"Learn",          de:"Lernen",      min:45, has:d=>d.vocab||d.grammar||d.alphabet},
 {id:"practice", en:"Practice",       de:"Üben",        min:20, has:d=>d.exercises&&d.exercises.length},
 {id:"hoeren",   en:"Listening",      de:"Hören",       min:30, has:d=>d.hoeren},
 {id:"diktat",   en:"Dictation",      de:"Diktat",      min:10, has:d=>d.diktat&&d.diktat.length},
 {id:"lesen",    en:"Reading",        de:"Lesen",       min:25, has:d=>d.lesen},
 {id:"schreiben",en:"Writing",        de:"Schreiben",   min:30, has:d=>d.schreiben},
 {id:"sprechen", en:"Speaking",       de:"Sprechen",    min:35, has:d=>d.sprechen},
 {id:"quiz",     en:"Daily quiz",     de:"Quiz",        min:10, has:d=>d.review_quiz&&d.review_quiz.length}
];

const LETTER_TTS = {A:"A",B:"Be",C:"Ze",D:"De",E:"E",F:"Eff",G:"Ge",H:"Ha",I:"I",J:"Jott",K:"Ka",L:"Ell",M:"Emm",N:"Enn",O:"O",P:"Pe",Q:"Ku",R:"Err",S:"Ess",T:"Te",U:"U",V:"Vau",W:"We",X:"Ix",Y:"Ypsilon",Z:"Zett","Ä":"Ä","Ö":"Ö","Ü":"Ü","ß":"Eszett"};

const ICONS = {
 today:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 plan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 cards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="13" height="16" rx="2"/><path d="M4 7v12a2 2 0 0 0 2 2h10"/></svg>',
 exam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l1 3H8z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="m9 13 2 2 4-4"/></svg>',
 settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
 speaker:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
 copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
 progress:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 review:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
 rec:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
 flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
};

/* ---------- state ---------- */
function defaultState(){ return {v:1, updatedAt:0, start:DEFAULT_START, lang:"both", strict:true, rate:0.9, voice:"", tutorVoice:"Kore", decks:{}, mocks:{}, done:{}, results:{}, srs:{}, intro:{}, mistakes:[], drafts:{}, grades:{}, live:{}}; }
const S = { st: defaultState(), uid:null, email:"", sync:"local", ai:false, liveModel:"",
  published:new Set(), imported:{}, days:{}, view:"today", dayN:null, step:null,
  ans:{}, checked:{}, plays:{}, wo:{}, ex:{}, fc:null, timer:null, gradeBusy:false, checkBusy:false, importText:{},
  authMode:"signin", authBusy:false, authMsg:"", offline:false, att:{}, attBusy:false, cardText:{}, pron:{}, live:null, liveMode:"coach", installEvt:null, confirmDel:null, mock:null, mockData:{}, austria:null, mix:null, rec:{}, recActive:null, testPrefix:"" };

const LS_KEY = "osd-a1-coach-state";
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
(function loadLocal(){ const raw = lsGet(LS_KEY); if(raw){ try{ S.st = Object.assign(defaultState(), JSON.parse(raw)); }catch(e){} }
  const imp=lsGet("osd-a1-imported"); if(imp){ try{ S.imported=JSON.parse(imp)||{}; }catch(e){} }
  S.offline = lsGet("osd-a1-offline")==="1"; })();

const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });

let saveTimer=null, saving=false, saveAgain=false;
function save(){ S.st.updatedAt = Date.now(); lsSet(LS_KEY, JSON.stringify(S.st)); clearTimeout(saveTimer); saveTimer=setTimeout(pushRemote, 1200); }
async function pushRemote(){
  if(!S.uid) return;
  if(saving){ saveAgain=true; return; }
  saving=true;
  try{ const { error } = await sb.from("progress").upsert({ user_id:S.uid, state:S.st, updated_at:new Date().toISOString() }); S.sync = error ? "error" : "synced"; }
  catch(e){ S.sync="error"; }
  saving=false;
  if(saveAgain){ saveAgain=false; pushRemote(); }
}
async function pullRemote(){
  if(!S.uid) return;
  try{
    const { data, error } = await sb.from("progress").select("state").eq("user_id", S.uid).maybeSingle();
    if(error) throw error;
    if(data && data.state){
      const remote=data.state;
      if((remote.updatedAt||0) > (S.st.updatedAt||0)){ S.st=Object.assign(defaultState(), remote); lsSet(LS_KEY, JSON.stringify(S.st)); }
      else if((S.st.updatedAt||0) > (remote.updatedAt||0)) pushRemote();
    } else if(S.st.updatedAt) pushRemote();
    const d = await sb.from("days").select("day,content").eq("user_id", S.uid);
    if(!d.error){ S.imported={}; (d.data||[]).forEach(r=>{ S.imported[r.day]=r.content; }); lsSet("osd-a1-imported", JSON.stringify(S.imported)); S.days={}; }
    S.sync="synced";
  }catch(e){ S.sync="error"; }
}
async function onSession(session){
  const uid = session ? session.user.id : null;
  const changed = uid!==S.uid;
  S.uid=uid; S.email=session?session.user.email:"";
  if(uid && changed){ S.att={}; await pullRemote(); }
  render();
}
async function initAuth(){
  try{ const { data } = await sb.auth.getSession(); await onSession(data.session); }catch(e){ render(); }
  sb.auth.onAuthStateChange((ev, session)=>{ if(ev==="SIGNED_IN"||ev==="SIGNED_OUT"||ev==="INITIAL_SESSION") onSession(session); });
  document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible" && S.uid && !S.live) pullRemote().then(()=>render()); });
}
async function initHealth(){ try{ const r=await fetch("/api/health",{cache:"no-store"}); const j=await r.json(); S.ai=!!j.ai; S.liveModel=j.liveModel||""; }catch(e){ S.ai=false; } }
async function api(path, body){
  const { data } = await sb.auth.getSession(); const tok=data.session&&data.session.access_token;
  if(!tok) throw new Error("Sign in to use AI features.");
  const r = await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},body:JSON.stringify(body||{})});
  const j = await r.json().catch(()=>({error:"The server sent an unreadable answer."}));
  if(!r.ok) throw new Error(j.error||("HTTP "+r.status));
  return j;
}
async function saveOverlay(n, content){
  S.imported[n]=content; delete S.days[n];
  lsSet("osd-a1-imported", JSON.stringify(S.imported));
  if(S.uid){ const { error } = await sb.from("days").upsert({ user_id:S.uid, day:n, content, updated_at:new Date().toISOString() }); if(error) toast("Saved on this device. Sync failed: "+error.message); }
}
/* ---------- utilities ---------- */
const $ = s=>document.querySelector(s);
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function attr(s){ return esc(s); }
function pad(n){ return String(n).padStart(2,"0"); }
function startDate(){ const [y,m,d]=(S.st.start||DEFAULT_START).split("-").map(Number); return new Date(y,m-1,d); }
function dateOf(n){ const s=startDate(); return new Date(s.getFullYear(), s.getMonth(), s.getDate()+n-1); }
function todayMid(){ const t=new Date(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()); }
function currentDay(){ const n=Math.floor((todayMid()-startDate())/DAY_MS)+1; return Math.max(1,Math.min(PLAN.length,n)); }
function daysLeft(){ return Math.round((EXAM - todayMid())/DAY_MS); }
function fmtDate(d){ return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }
function fmtFa(d){ try{ return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{day:"numeric",month:"long"}).format(d); }catch(e){ return ""; } }
function norm(s){ return String(s||"").toLowerCase().replace(/ß/g,"ss").replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/[.,!?;:„“"'()\-–]/g," ").replace(/\s+/g," ").trim(); }
function normKeepUml(s){ return String(s||"").toLowerCase().replace(/[.,!?;:„“"'()\-–]/g," ").replace(/\s+/g," ").trim(); }
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true, 2200); }
function hashStr(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function shuffled(arr, seed){ const a=arr.slice(); let x=hashStr(seed)||1; for(let i=a.length-1;i>0;i--){ x^=x<<13; x^=x>>>17; x^=x<<5; const j=(x>>>0)%(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function ex(en, fa){ // explanation in chosen language(s)
  const L=S.st.lang; let h="";
  if(en && L!=="fa") h+=`<div>${esc(en)}</div>`;
  if(fa && L!=="en") h+=`<div class="fa">${esc(fa)}</div>`;
  if(!h && en) h=`<div>${esc(en)}</div>`;
  return h;
}
function artClass(a){ return a==="der"?"g-der":a==="die"?"g-die":a==="das"?"g-das":""; }
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); toast("Copied"); }
  catch(e){ const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); toast("Copied"); }catch(_){ toast("Select the text and copy it manually"); } ta.remove(); }
}

/* ---------- speech ---------- */
const TTS = { voices:[], ok:("speechSynthesis" in window) };
function loadVoices(){ if(!TTS.ok) return; const v=speechSynthesis.getVoices().filter(v=>/^de(-|_|$)/i.test(v.lang));
  const score=v=>(/AT/i.test(v.lang)?40:0)+(/natural|online|neural/i.test(v.name)?20:0)+(/google/i.test(v.name)?10:0);
  TTS.voices=v.sort((a,b)=>score(b)-score(a)); if(S.view==="settings") render(); }
if(TTS.ok){ loadVoices(); speechSynthesis.onvoiceschanged=loadVoices; }
function pickVoice(gender){
  if(!TTS.voices.length) return null;
  let main = TTS.voices.find(v=>v.name===S.st.voice) || TTS.voices[0];
  if(gender==="m" || gender==="f"){
    const want = gender==="f" ? /katja|hedda|ingrid|anna|petra|helena|female|frau|marlene|vicki|seraphina|amala|elke|klarissa|louisa|maja|tanja/i : /conrad|stefan|jonas|markus|male|hans|yannick|florian|killian|bernd|christoph|kasper|klaus|ralf/i;
    const g = TTS.voices.find(v=>want.test(v.name));
    if(g) return g;
    if(gender==="m" && TTS.voices.length>1) return TTS.voices.find(v=>v!==main)||main;
  }
  return main;
}
function speak(text, opts={}){
  return new Promise(res=>{
    if(!TTS.ok){ toast("Speech is not available in this browser"); return res(); }
    const u=new SpeechSynthesisUtterance(text);
    const v=pickVoice(opts.voice); if(v){ u.voice=v; u.lang=v.lang; } else u.lang="de-DE";
    u.rate=(opts.slow?0.62:S.st.rate||0.9);
    u.pitch = opts.voice==="m" && v===pickVoice() ? 0.82 : opts.voice==="f" && v===pickVoice() ? 1.12 : 1;
    u.onend=res; u.onerror=res;
    speechSynthesis.speak(u);
  });
}
function stopSpeech(){ if(TTS.ok) speechSynthesis.cancel(); }
async function speakLines(lines, slow){ stopSpeech(); for(const l of lines){ await speak(l.tts||l.text_de||l.de||l, {voice:l.voice, slow}); await new Promise(r=>setTimeout(r,350)); } }
function spellOut(word){ stopSpeech(); const parts=[...String(word).toUpperCase()].filter(c=>c.trim()).map(c=>LETTER_TTS[c]||c); return speak(parts.join(". "), {slow:true}); }
const SAY_BANK = []; // index -> text payload for buttons
function sayBtn(text, opts={}){ const i=SAY_BANK.push({text, voice:opts.voice, lines:opts.lines})-1;
  const slow = opts.slow ? `<button class="say slow" data-act="say" data-i="${i}" data-slow="1" title="Play slowly" aria-label="Play slowly">slow</button>` : "";
  return `<button class="say" data-act="say" data-i="${i}" title="Play" aria-label="Play: ${attr(typeof text==="string"?text:"audio")}">${ICONS.speaker}</button>${slow}`; }

/* ---------- day data ---------- */
async function loadIndex(){ try{ const r=await fetch("days/index.json",{cache:"no-store"}); if(r.ok){ const j=await r.json(); (j.available||[]).forEach(n=>S.published.add(n)); } }catch(e){} }
function hasDay(n){ const o=S.imported[n]; return S.published.has(n) || !!(o && (o.vocab||o.lesen||o.hoeren||o.schreiben)); }
async function getDay(n){
  if(S.days[n]) return S.days[n];
  let base=null;
  if(S.published.has(n)){ try{ const r=await fetch(`days/day${pad(n)}.json`); if(r.ok) base=await r.json(); }catch(e){} }
  const ov=S.imported[n];
  if(!base && !(ov && (ov.vocab||ov.lesen||ov.hoeren||ov.schreiben))) return null;
  S.days[n]=Object.assign({}, base||{}, ov||{});
  return S.days[n];
}
function stepsFor(d){ return STEPS.filter(s=>s.has(d)); }
function dayProgress(n, d){ if(!d) return {done:0,total:0,min:0,minTotal:0};
  const st=stepsFor(d); let done=0,min=0,minT=0; st.forEach(s=>{ minT+=s.min; if(S.st.done[n+":"+s.id]){ done++; min+=s.min; } }); return {done,total:st.length,min,minTotal:minT}; }

/* ---------- SRS ---------- */
function cardsForDay(n, d){ const out=[]; (d.vocab||[]).forEach(v=>out.push({id:"v:"+v.de, day:n, kind:"v", ...v})); (d.phrases||[]).forEach(p=>out.push({id:"p:"+p.de, day:n, kind:"p", ...p}));
  (d.flashcards||[]).forEach(c=>out.push({id:"x:"+c.front, day:n, kind:"x", de:c.front, en:c.back, fa:c.fa||"", plural:c.plural||"", example_de:c.example||"", article:"-"})); return out; }
function allCards(){ const out=[]; Object.keys(S.st.intro).forEach(k=>{ const n=+k; const d=S.days[n]; if(d) out.push(...cardsForDay(n,d)); });
  if(S.st.decks&&S.st.decks.austria&&S.austria) S.austria.cards.forEach(c=>out.push({id:"a:"+c.de, kind:"a", ...c}));
  const seenQ=new Set(); (S.st.mistakes||[]).forEach(m=>{ if(m.q&&m.right&&!seenQ.has(m.q)&&seenQ.size<80){ seenQ.add(m.q); out.push({id:"m:"+m.q, kind:"m", de:m.q, en:m.right, article:"-", fa:""}); } }); const seen=new Set(); return out.filter(c=>!seen.has(c.id)&&seen.add(c.id)); }
function srsCounts(){ const now=Date.now(); let due=0,fresh=0,learned=0; allCards().forEach(c=>{ const r=S.st.srs[c.id]; if(!r) fresh++; else if(r.due<=now) due++; else learned++; }); return {due,fresh,learned}; }
function grade(card, q){ const now=Date.now(); const r=S.st.srs[card.id]||{ef:2.5,ivl:0,reps:0,lapses:0,due:now};
  if(q<3){ r.reps=0; r.ivl=0; r.lapses++; r.due=now+10*60000; }
  else { r.reps++; r.ivl = r.reps===1 ? (q===5?3:1) : r.reps===2 ? (q===3?2:q===5?6:4) : Math.max(1,Math.round(r.ivl*r.ef*(q===3?0.8:q===5?1.3:1)));
         r.ef=Math.max(1.3, r.ef+0.1-(5-q)*(0.08+(5-q)*0.02)); r.due=now+r.ivl*DAY_MS; }
  S.st.srs[card.id]=r; save(); }
function nextLabel(card,q){ const r=S.st.srs[card.id]; if(q<3) return "10 min"; const reps=(r?r.reps:0)+1; const ivl=reps===1?(q===5?3:1):reps===2?(q===3?2:q===5?6:4):Math.max(1,Math.round((r?r.ivl:1)*(r?r.ef:2.5)*(q===3?0.8:q===5?1.3:1))); return ivl+" d"; }

/* ---------- mistakes ---------- */
function logMistake(day, src, q, your, right){ S.st.mistakes.unshift({day,src,q,your,right,at:Date.now()}); if(S.st.mistakes.length>300) S.st.mistakes.length=300; save(); }

/* ---------- rendering: shell ---------- */
const TABS=[["today","Today"],["plan","Plan"],["review","Review"],["exam","Exam"],["progress","Progress"]];
function renderTabs(){ if(!S.uid && !S.offline){ $("#tabs").innerHTML=""; return; } $("#tabs").innerHTML = TABS.map(([id,nm])=>`<button data-act="tab" data-v="${id}" ${S.view===id?'aria-current="page"':""}>${ICONS[id]}<span>${nm}</span></button>`).join(""); }
function renderCountdown(){ const gb=$("#gearBtn"); if(gb){ gb.innerHTML=ICONS.settings; gb.hidden=!S.uid&&!S.offline; } const n=daysLeft(); $("#countdown").innerHTML = n>0 ? `<span class="n tnum">${n}</span><span class="t">days to the exam<br>Sat 14 Nov · <span class="fa">۲۳ آبان</span></span>` : n===0 ? `<span class="n">Heute!</span><span class="t">Exam day. Viel Glück!</span>` : `<span class="t">Exam done. Gratuliere!</span>`; }

async function render(){
  SAY_BANK.length=0;
  renderTabs(); renderCountdown();
  const app=$("#app");
  let html="";
  try{
    if(!S.uid && !S.offline) html = vAuth();
    else if(S.live) html = vLive();
    else if(S.view==="today") html = await vToday();
    else if(S.view==="plan") html = vPlan();
    else if(S.mock && S.view==="exam") html = await vMock();
    else if(S.view==="review") html = await vReview();
    else if(S.view==="exam") html = vExam();
    else if(S.view==="progress") html = await vProgress();
    else if(S.view==="settings") html = vSettings();
  }catch(e){ html = `<div class="banner">Something went wrong while drawing this page: ${esc(e.message)}</div>`; }
  app.innerHTML = html;
  if(S.live) drawLiveLog();
  tickTimer(); tickMock();
}

/* ---------- Today / day view ---------- */
async function vToday(){
  const n = S.dayN || currentDay();
  const p = PLAN[n-1];
  const d = await getDay(n);
  if(d) { if(S.step) return vStep(n,d,S.step); }
  const nav = `<div class="row between">
    <button class="btn sm" data-act="day" data-v="${n-1}" ${n<=1?"disabled":""}>${ICONS.back}${n>1?"Day "+(n-1):"Previous"}</button>
    ${n!==currentDay()?`<button class="btn sm ghost" data-act="day" data-v="${currentDay()}">Back to today</button>`:""}
    <button class="btn sm" data-act="day" data-v="${n+1}" ${n>=PLAN.length?"disabled":""}>${n<PLAN.length?"Day "+(n+1):"Next"}${ICONS.next}</button></div>`;
  const date=dateOf(n);
  const head = `<div class="hero">
    <div class="dayline"><span class="chip ${n===currentDay()?"acc":""}">Day ${n} of ${PLAN.length}</span><span>${fmtDate(date)}</span><span class="fa">${fmtFa(date)}</span>${p.k!=="lesson"?`<span class="chip ${p.k==="mock"?"at":"warn"}">${p.k}</span>`:""}</div>
    <h1>${esc(d&&d.title||p.t)}</h1>
    <p class="fa muted">${esc(d&&d.title_fa||p.fa)}</p>
    ${p.g?`<p class="small muted"><b>Grammar:</b> ${esc(p.g)}</p>`:""}
    ${d?progressBar(n,d):""}
    <div class="row"><button class="btn sm" data-act="live-start" data-n="${n}">${ICONS.mic}Talk to tutor</button>${installHint()}</div>
  </div>`;
  if(!d) return nav + head + mockCta(n) + resCard(n) + pendingPanel(n);
  const pr=dayProgress(n,d);
  const obj = d.objectives&&d.objectives.length ? `<details class="acc"><summary>Today's goals</summary><div class="in stack">${d.objectives.map(o=>`<div class="stack" style="gap:2px">${ex(o.en,o.fa)}</div>`).join("")}</div></details>` : "";
  let cum=0; const breaks={60:["Short break","5 min · stand up, drink water"],120:["Long break","15 min · eat something, walk"],180:["Short break","5 min"]};
  const steps = `<div class="steps">${stepsFor(d).map((s,i)=>{ const done=S.st.done[n+":"+s.id]; const res=S.st.results[n+":"+s.id];
    let br=""; const before=cum; cum+=s.min; Object.keys(breaks).forEach(m=>{ if(before<+m && cum>=+m && i<stepsFor(d).length-1) br=`<div class="brk"><b>${breaks[m][0]}</b> · ${breaks[m][1]}</div>`; });
    return `<button class="step ${done?"done":""}" data-act="step" data-v="${s.id}">
      <span class="num">${done?ICONS.check.replace('<svg','<svg width="16" height="16"'):i+1}</span>
      <span><span class="nm">${s.en}</span> <span class="muted small">· ${s.de}</span><br><span class="sub">${s.min} min${res?` · last score ${res.score}/${res.total}`:""}</span></span>
      ${ICONS.next.replace('<svg','<svg width="18" height="18" style="color:var(--muted)"')}</button>${br}`; }).join("")}</div>`;
  const tip = pr.done===pr.total && pr.total ? `<div class="banner info">All steps done for Day ${n}. Finish your due cards, then rest. Morgen geht's weiter!</div>` : "";
  return nav + head + tip + obj + steps + resCard(n);
}
function progressBar(n,d){ const pr=dayProgress(n,d); const pct=pr.minTotal?Math.round(pr.min/pr.minTotal*100):0;
  return `<div class="stack" style="gap:6px"><div class="row between small"><span>${pr.done}/${pr.total} steps</span><span class="tnum muted">${pr.min} / ${pr.minTotal} min</span></div><div class="meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>`; }

function stepShell(n, d, s, body){
  const key=n+":"+s.id, done=S.st.done[key];
  const t=S.timer&&S.timer.key===key?S.timer:null;
  const remaining = t ? (t.running? Math.max(0,t.endAt-Date.now()) : t.left) : s.min*60000;
  return `<div class="row between"><button class="btn sm" data-act="back">${ICONS.back}Day ${n}</button>
      <div class="row"><span class="timer tnum" id="timerTxt" data-key="${key}">${fmtMs(remaining)}</span>
      <button class="btn sm" data-act="timer" data-key="${key}" data-min="${s.min}">${t&&t.running?"Pause":"Start timer"}</button></div></div>
    <div><div class="label">Day ${n} · ${s.min} min</div><h1>${s.en} <span class="muted" style="font-weight:500">· ${s.de}</span></h1></div>
    ${body}
    <div class="row between"><button class="btn" data-act="back">${ICONS.back}Back</button>
      <button class="btn ${done?"":"primary"}" data-act="done" data-key="${key}">${done?"Done ✓ (tap to undo)":"Mark step done"}</button></div>`;
}
function fmtMs(ms){ const t=Math.ceil(ms/1000); return pad(Math.floor(t/60))+":"+pad(t%60); }
function tickTimer(){ clearInterval(tickTimer._i); if(!S.timer||!S.timer.running) return; tickTimer._i=setInterval(()=>{ const el=$("#timerTxt"); if(!S.timer||!S.timer.running){ clearInterval(tickTimer._i); return; } const left=S.timer.endAt-Date.now();
  if(el && el.dataset.key===S.timer.key) el.textContent=fmtMs(Math.max(0,left));
  if(left<=0){ S.timer.running=false; S.timer.left=0; clearInterval(tickTimer._i); toast("Time's up for this step"); } }, 500); }

async function vStep(n, d, id){
  const s=STEPS.find(x=>x.id===id);
  let body="";
  if(id==="review") body=await stReview(n,d);
  if(id==="media") body=stMedia(n,d);
  if(id==="learn") body=stLearn(n,d);
  if(id==="practice") body=stExercises(n, d.exercises, "practice");
  if(id==="hoeren") body=stHoeren(n,d);
  if(id==="diktat") body=stDiktat(n,d);
  if(id==="lesen") body=stLesen(n,d);
  if(id==="schreiben") body=stSchreiben(n,d);
  if(id==="sprechen") body=stSprechen(n,d);
  if(id==="quiz") body=stExercises(n, d.review_quiz.map(q=>({type:"mcq",prompt:q.q,options:q.options,answer:q.answer,explain_en:q.explain_en,explain_fa:q.explain_fa})), "quiz");
  return stepShell(n,d,s,body);
}

/* step: review */
async function stReview(n,d){
  const c=srsCounts();
  const due = S.st.mistakes.filter(m=>m.day<n).slice(0,8);
  return `<div class="card stack">
    <p>${ex("Start every day by clearing the flashcards that are due. Cards come from the words you opened in Learn, and the app schedules them so you see each word just before you forget it.","هر روز را با مرور کارت‌هایی که موعدشان رسیده شروع کن. کارت‌ها از لغاتی می‌آیند که در بخش Learn دیده‌ای و برنامه‌ریزی می‌شوند تا هر کلمه را درست قبل از فراموش کردن ببینی.")}</p>
    <div class="row"><span class="chip acc">${c.due} due</span><span class="chip">${c.fresh} new</span><span class="chip ok">${c.learned} scheduled</span></div>
    ${c.due+c.fresh? `<button class="btn primary" data-act="tab" data-v="review">Open flashcards</button>` : `<p class="muted small">${n===1?"Nothing to review on Day 1. Go straight to Learn.":"No cards due. Good job."}</p>`}
  </div>
  ${due.length?`<div class="card stack"><h3>Recent mistakes to look at again</h3>${due.map(m=>`<div class="sunk small"><b>${esc(m.q)}</b><br><span style="color:var(--bad)">${esc(m.your)}</span> → <span style="color:var(--ok)">${esc(m.right)}</span></div>`).join("")}</div>`:""}`;
}

/* step: media */
function stMedia(n,d){
  const m=d.media||{}; let h="";
  if(m.audio) h+=`<div class="card stack"><div class="label">Audio overview</div><h3>${esc(m.audio.title)}</h3><audio controls preload="none" src="${attr(m.audio.src)}" style="width:100%"></audio></div>`;
  if(m.video) h+=`<div class="card stack"><div class="label">Video overview</div><h3>${esc(m.video.title)}</h3><video controls preload="none" playsinline src="${attr(m.video.src)}" style="width:100%;border-radius:8px;background:#000"></video></div>`;
  h+=attachmentsCard(n);
  h+=flashcardImportCard(n);
  if(d.watch&&d.watch.length) h+=`<div class="card stack"><div class="label">Watch in your notebook</div>${d.watch.map(w=>`<div><b>${esc(w.source_title)}</b><br><span class="small muted">${esc(w.why)}</span></div>`).join("")}<a class="btn sm" href="${NOTEBOOK_URL}" target="_blank" rel="noopener">Open NotebookLM</a></div>`;
  return h;
}
function attachmentsCard(n){
  const help = ex("Add what you made in NotebookLM Studio for this day: Audio and Video Overview (⋮ → Download), Mind Map (download icon, PNG), Infographic (⋮ → Download PNG), Slide Deck (⋮ → Download PDF). Files are private to your account and appear on every device.","خروجی‌های Studio در NotebookLM را برای این روز اضافه کن: فایل صوتی و ویدیو (⋮ → Download)، نقشه ذهنی (آیکون دانلود، PNG)، اینفوگرافیک (PNG)، اسلایدها (PDF). فایل‌ها خصوصی‌اند و روی همه دستگاه‌ها دیده می‌شوند.");
  if(!S.uid) return `<div class="card stack"><div class="label">From NotebookLM</div><h3>Your Studio files</h3><p class="small muted">Sign in to upload and sync files.</p></div>`;
  const list=S.att[n];
  if(list===undefined){ loadAtt(n); }
  const items=(list||[]).map(f=>{
    const t=f.type||""; let body="";
    if(t.startsWith("image/")) body=`<a href="${attr(f.url)}" target="_blank" rel="noopener"><img src="${attr(f.url)}" alt="${attr(f.label)}" loading="lazy" class="att-img"></a>`;
    else if(t.startsWith("audio/")) body=`<audio controls preload="none" src="${attr(f.url)}" style="width:100%"></audio>`;
    else if(t.startsWith("video/")) body=`<video controls preload="none" playsinline src="${attr(f.url)}" style="width:100%;border-radius:8px;background:#000"></video>`;
    else body=`<a class="btn sm" href="${attr(f.url)}" target="_blank" rel="noopener">Open ${esc(f.label)}</a>`;
    const del = S.confirmDel===f.path ? `<button class="btn sm" data-act="att-del-yes" data-path="${attr(f.path)}" data-n="${n}" style="color:var(--bad)">Delete for good</button><button class="btn sm ghost" data-act="att-del-no">Keep</button>` : `<button class="btn sm ghost" data-act="att-del" data-path="${attr(f.path)}">Remove</button>`;
    return `<div class="att"><div class="row between"><b class="small" style="word-break:break-word">${esc(f.label)}</b><div class="row">${del}</div></div>${body}</div>`;
  }).join("");
  return `<div class="card stack"><div class="label">From NotebookLM</div><h3>Your Studio files for Day ${n}</h3><p class="small">${help}</p>
    ${list===undefined?`<p class="small muted">Loading…</p>`:items||`<p class="small muted">No files yet.</p>`}
    <label class="btn primary" style="align-self:flex-start">${S.attBusy?"Uploading…":"Add files"}<input type="file" multiple accept="image/*,audio/*,video/*,application/pdf" data-upload="${n}" hidden ${S.attBusy?"disabled":""}></label>
    <p class="small muted">Max 50 MB per file.</p></div>`;
}
async function loadAtt(n){
  if(!S.uid || S.att["_l"+n]) return; S.att["_l"+n]=true;
  try{
    const dir=`${S.uid}/day-${pad(n)}`;
    const { data, error } = await sb.storage.from("media").list(dir, { limit:100, sortBy:{ column:"name", order:"asc" } });
    if(error) throw error;
    const files=(data||[]).filter(f=>f.id);
    let urls=[];
    if(files.length){ const r=await sb.storage.from("media").createSignedUrls(files.map(f=>dir+"/"+f.name), 60*60*6); urls=r.data||[]; }
    S.att[n]=files.map((f,i)=>({ path:dir+"/"+f.name, label:f.name.replace(/^\d+-/,""), type:(f.metadata&&f.metadata.mimetype)||"", url:(urls[i]&&urls[i].signedUrl)||"" }));
  }catch(e){ S.att[n]=[]; toast("Couldn't load files: "+(e.message||e)); }
  delete S.att["_l"+n]; render();
}
async function uploadFiles(n, files){
  if(!S.uid) return;
  S.attBusy=true; render();
  for(const f of files){
    if(f.size>50*1024*1024){ toast(f.name+" is larger than 50 MB"); continue; }
    const safe=f.name.normalize("NFKD").replace(/[^\w.\-]+/g,"_").slice(-80);
    const { error } = await sb.storage.from("media").upload(`${S.uid}/day-${pad(n)}/${Date.now()}-${safe}`, f, { contentType:f.type||"application/octet-stream", upsert:false });
    if(error) toast("Upload failed: "+error.message); else toast("Uploaded "+f.name);
  }
  S.attBusy=false; delete S.att[n]; render();
}
function flashcardImportCard(n){
  const ov=S.imported[n]||{}; const count=(ov.flashcards||[]).length;
  return `<div class="card stack"><div class="label">From NotebookLM</div><h3>Add flashcards</h3>
    <p class="small">${ex("Fastest native route: in NotebookLM open Data Table and ask for 'flashcards for Day "+n+" with columns German | Plural | English | Persian | Example'. Export it to Google Sheets, select the cells, copy, and paste here. CSV or JSON from a NotebookLM exporter extension also works.","ساده‌ترین روش: در NotebookLM ابزار Data Table را باز کن و جدول فلش‌کارت با ستون‌های German | Plural | English | Persian | Example بخواه. آن را به Google Sheets بفرست، سلول‌ها را کپی کن و اینجا بچسبان.")}</p>
    <textarea data-cards="${n}" placeholder="German&#9;Plural&#9;English&#9;Persian&#9;Example" style="min-height:100px;font-size:.85rem" spellcheck="false">${esc(S.cardText[n]||"")}</textarea>
    <div class="row"><button class="btn primary" data-act="cards-import" data-n="${n}">Add to my cards</button>${count?`<span class="chip ok tnum">${count} added</span><button class="btn sm ghost" data-act="cards-clear" data-n="${n}">Remove them</button>`:""}</div></div>`;
}
function parseCards(text){
  text=String(text||"").trim(); if(!text) return [];
  const pick=(o,keys)=>{ for(const k of Object.keys(o)){ if(keys.some(x=>k.toLowerCase().includes(x))) return o[k]; } return ""; };
  try{ let j=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,"")); if(!Array.isArray(j)) j=j.cards||j.flashcards||j.items||[];
    return j.map(o=>typeof o==="object"?({front:String(pick(o,["front","german","deutsch","term","question","de"])||"").trim(), back:String(pick(o,["back","english","definition","answer","meaning","en"])||"").trim(), fa:String(pick(o,["persian","farsi","fa"])||"").trim(), plural:String(pick(o,["plural"])||"").trim(), example:String(pick(o,["example","beispiel"])||"").trim()}):null).filter(c=>c&&c.front&&c.back);
  }catch(e){}
  const rows=text.split(/\r?\n/).filter(l=>l.trim());
  const sep = rows[0].includes("\t")?"\t": rows[0].includes(";")?";": rows[0].includes("|")?"|":",";
  const cells=rows.map(r=>r.split(sep).map(c=>c.trim().replace(/^"|"$/g,"")));
  let map={front:0,back:1,fa:2,plural:-1,example:-1};
  const head=cells[0].map(c=>c.toLowerCase());
  if(head.some(h=>/german|deutsch|front|term|english|back|persian|plural|example/.test(h))){
    const f=(re)=>head.findIndex(h=>re.test(h));
    map={front:f(/german|deutsch|front|term|wort/), back:f(/english|back|meaning|definition|bedeutung/), fa:f(/persian|farsi|fa\b|فارسی/), plural:f(/plural/), example:f(/example|beispiel|sentence/)};
    if(map.front<0) map.front=0; if(map.back<0) map.back=1;
    cells.shift();
  }
  const g=(r,i)=>i>=0&&r[i]?r[i]:"";
  const clean=v=>/^(not in source|uncountable|no plural|-|–)$/i.test(String(v).trim())?"":v;
  return cells.map(r=>({front:clean(g(r,map.front)), back:clean(g(r,map.back)), fa:clean(g(r,map.fa)), plural:clean(g(r,map.plural)), example:clean(g(r,map.example))})).filter(c=>c.front&&c.back);
}
/* step: learn */
function stLearn(n,d){
  if(!S.st.intro[n]){ S.st.intro[n]=Date.now(); save(); }
  let h="";
  if(d.objectives&&d.objectives.length) h+=`<section class="card stack goal"><div class="label">Ich kann … · Today you will be able to</div>${d.objectives.map(o=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:8px"><span style="color:var(--accent)">${ICONS.check.replace('<svg','<svg width="18" height="18"')}</span><div>${ex(o.en,o.fa)}</div></div>`).join("")}</section>`;
  if(d.alphabet){
    h+=`<section class="card stack"><div class="row between"><h2>Das Alphabet</h2><span class="small muted">tap a letter</span></div>
      <div class="abc">${d.alphabet.map(a=>`<button data-act="letter" data-v="${attr(a.l)}" aria-label="${attr(a.l+", "+a.name)}"><span class="L">${esc(a.l)}${a.l.length===1&&a.l!=="ß"?`<span style="font-weight:500;font-size:1rem">${esc(a.l.toLowerCase())}</span>`:""}</span><span class="nm">${esc(a.name)}</span>${S.st.lang!=="en"?`<span class="fa">${esc(a.fa)}</span>`:""}</button>`).join("")}</div>
      <div class="sunk stack"><div class="label">Spell it · Buchstabieren</div>
        <div class="row"><input type="text" id="spellIn" class="grow" value="${attr(S.ans.spell||"Raam")}" data-store="spell" aria-label="Word to spell" style="flex:1"><button class="btn primary" data-act="spell">Spell aloud</button></div>
        <p class="small muted">${ex("The examiner will ask you to spell your name. Practise your first name, surname and street.","ممتحن از تو می‌خواهد اسمت را هجی کنی. نام، نام خانوادگی و خیابانت را تمرین کن.")}</p></div>
    </section>`;
  }
  if(d.pronunciation&&d.pronunciation.length){
    h+=`<section class="card stack"><h2>Aussprache · Pronunciation</h2>${d.pronunciation.map(p=>`<div class="stack" style="gap:6px;padding-top:6px"><h3>${esc(p.focus)}</h3>${ex(p.tip_en,p.tip_fa)}<div class="row">${(p.words||[]).map(w=>`<button class="wchip" data-act="sayw" data-v="${attr(w)}">${esc(w)}</button>`).join("")}</div></div>`).join('<hr class="soft">')}</section>`;
  }
  if(d.vocab&&d.vocab.length){
    h+=`<section class="card stack"><div class="row between"><h2>Wörter · Words</h2><span class="small muted">${d.vocab.length} words · added to Cards</span></div>
      <p class="small"><span class="g-der art">der</span> masculine · <span class="g-die art">die</span> feminine · <span class="g-das art">das</span> neuter</p>
      <div class="row"><span class="small muted">Cover and check:</span>${[["","Show all"],["de","Hide German"],["en","Hide meaning"]].map(([v,l])=>`<button class="opt ${(S.cover||"")===v?"sel":""}" data-act="cover" data-v="${v}">${l}</button>`).join("")}</div>
      <div class="vlist ${S.cover?"cover-"+S.cover:""}">${d.vocab.map(v=>`<div class="vrow" data-act="reveal"><div class="row" style="gap:4px">${sayBtn((v.article&&v.article!=="-"?v.article+" ":"")+v.de)}</div>
        <div style="min-width:0"><div class="de">${v.article&&v.article!=="-"?`<span class="art ${artClass(v.article)}">${esc(v.article)}</span> `:""}${esc(v.de)} ${v.plural&&v.plural!=="-"?`<span class="meta">· ${esc(v.plural)}</span>`:""}</div>
          <div class="meta">${esc(v.en)}${S.st.lang!=="en"&&v.fa?` · <span class="fa">${esc(v.fa)}</span>`:""}${v.austrian?` <span class="chip at">AT</span>`:""}</div>
          ${v.example_de?`<div class="ex">${esc(v.example_de)} <span class="muted small">${esc(v.example_en||"")}</span></div>`:""}
          ${v.austrian?`<div class="small muted">🇦🇹 ${esc(v.austrian)}</div>`:""}</div>
        <div>${v.example_de?sayBtn(v.example_de,{slow:true}):""}</div></div>`).join("")}</div>${S.cover?`<p class="small muted">Say the hidden part aloud, then tap the row to check.</p>`:""}</section>`;
  }
  if(d.phrases&&d.phrases.length){
    h+=`<section class="card stack"><h2>Sätze · Phrases</h2><div class="vlist">${d.phrases.map(p=>`<div class="vrow"><div>${sayBtn(p.de)}</div><div style="min-width:0"><div class="de">${esc(p.de)}</div><div class="meta">${esc(p.en)}${S.st.lang!=="en"&&p.fa?` · <span class="fa">${esc(p.fa)}</span>`:""}</div></div>
      <div class="row" style="gap:4px;justify-content:flex-end">${p.register==="formal"?'<span class="chip acc">Sie</span>':p.register==="informal"?'<span class="chip">du</span>':""}${p.austrian?'<span class="chip at">AT</span>':""}</div></div>`).join("")}</div></section>`;
  }
  if(d.grammar&&d.grammar.length){
    h+=d.grammar.map(g=>`<section class="card stack"><div class="label">Grammatik</div><h2>${esc(g.topic)}</h2>${ex(g.explain_en,g.explain_fa)}
      ${g.table&&g.table.length?`<div class="tablewrap"><table class="gram">${g.table.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></div>`:""}
      ${(g.examples||[]).map(e=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(e.de)}<div><b>${esc(e.de)}</b><br><span class="small muted">${esc(e.en)}</span></div></div>`).join("")}
      ${g.common_mistakes&&g.common_mistakes.length?`<div class="sunk small"><b>Common mistakes</b><ul style="margin:6px 0 0;padding-left:18px">${g.common_mistakes.map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div>`:""}</section>`).join("");
  }
  if(d.exercises&&d.exercises.length>=3) h+=`<section class="stack"><div><div class="label">Check yourself</div><h2>3 quick questions before Practice</h2></div>${stExercises(n, d.exercises.slice(0,3), "check")}</section>`;
  return h;
}

/* exercises (practice + quiz) */
function stExercises(n, items, src){
  const keyBase=n+":"+src;
  let right=0, answered=0;
  const html = items.map((it,i)=>{
    const key=keyBase+":"+i; const st=S.ex[key];
    if(st){ answered++; if(st.ok) right++; }
    let ctrl="";
    if(it.type==="word_order"){
      const words = shuffled(it.prompt.split(/\s*·\s*/), key);
      const picked = S.wo[key]||[];
      ctrl = `<div class="chips-build">${picked.map(ix=>`<button class="wchip" data-act="wo-del" data-key="${key}" data-ix="${ix}">${esc(words[ix])}</button>`).join("")||'<span class="muted small" style="padding:4px">Tap the words in order</span>'}</div>
        <div class="row">${words.map((w,ix)=>`<button class="wchip ${picked.includes(ix)?"used":""}" data-act="wo-add" data-key="${key}" data-ix="${ix}" ${picked.includes(ix)||st?"disabled":""}>${esc(w)}</button>`).join("")}</div>
        ${st?"":`<div><button class="btn sm primary" data-act="wo-check" data-key="${key}" data-i="${i}" data-src="${src}">Check</button></div>`}`;
    } else if(it.type==="translate"){
      ctrl = `<div class="row" style="flex-wrap:nowrap"><input type="text" data-store="${key}" value="${attr(S.ans[key]||"")}" ${st?"disabled":""} class="${st?(st.ok?"inp-ok":"inp-bad"):""}" aria-label="Your answer" autocomplete="off" autocapitalize="off" spellcheck="false">${st?"":`<button class="btn sm primary" data-act="tr-check" data-key="${key}" data-i="${i}" data-src="${src}">Check</button>`}</div>`;
    } else {
      ctrl = `<div class="opts">${(it.options||[]).map(o=>{ let c=""; if(st){ if(o===it.answer) c="right"; else if(o===st.pick) c="wrong"; }
        return `<button class="opt ${c}" data-act="pick" data-key="${key}" data-i="${i}" data-src="${src}" data-v="${attr(o)}" ${st?"disabled":""}>${esc(o)}</button>`; }).join("")}</div>`;
    }
    const label = it.type==="article"?"Which article?":it.type==="word_order"?"Put the words in order":it.type==="translate"?"Translate":it.type==="gap"?"Fill the gap":"";
    const fb = st ? `<div class="fb ${st.ok?"ok":"bad"}"><b>${st.ok?"Richtig!":"Not quite."} ${st.ok?"":"Answer: "+esc(it.answer)}</b>${ex(it.explain_en,it.explain_fa)}</div>` : "";
    const sayIt = /[äöüßÄÖÜ]|\b(der|die|das|ich|Sie|du)\b/.test(it.answer||"") && it.type!=="mcq" ? sayBtn(it.type==="article"?it.answer+" "+it.prompt.replace(/_+/,"").trim():it.answer) : "";
    return `<div class="q">${label?`<div class="label">${label}</div>`:""}<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div class="q-prompt grow">${esc(it.prompt)}</div>${st?sayIt:""}</div>${ctrl}${fb}</div>`;
  }).join("");
  if(answered===items.length && items.length){ const k=n+":"+src; const prev=S.st.results[k]; if(!prev||prev.at<(S.exAt||0)||prev.score!==right){ S.st.results[k]={score:right,total:items.length,at:Date.now()}; save(); } }
  return `<div class="card"><div class="row between" style="margin-bottom:6px"><span class="small muted">${answered}/${items.length} answered</span><span class="chip ${answered?"ok":""} tnum">${right} correct</span></div>${html}
    ${answered===items.length&&items.length?masteryBox(right, items.length, keyBase):answered?`<div style="padding-top:12px"><button class="btn sm" data-act="ex-reset" data-pre="${keyBase}:">Start again</button></div>`:""}</div>`;
}
function masteryBox(right, total, keyBase){ const pct=Math.round(right/total*100); const wrong=total-right;
  return `<div class="mastery ${pct>=80?"ok":"bad"}"><div><b class="tnum">${pct}%</b> · ${pct>=80?ex("Mastered. You can move on.","تسلط کافی. برو مرحله بعد."):ex("Aim for 80% before moving on.","قبل از ادامه به ۸۰٪ برس.")}</div>
    <div class="row">${wrong?`<button class="btn sm primary" data-act="ex-retry" data-pre="${keyBase}:">Retry the ${wrong} wrong</button>`:""}<button class="btn sm" data-act="ex-reset" data-pre="${keyBase}:">Start again</button></div></div>`; }

/* Hören */
function playBtn(key, lines, max, label){
  const used=S.plays[key]||0; const g0=key.split("|")[0]; const unlimited=(!S.st.strict && !isTest(g0))||S.checked[g0];
  const left = unlimited? "" : ` (${Math.max(0,max-used)} left)`;
  const dis = !unlimited && used>=max;
  const i=SAY_BANK.push({lines})-1;
  return `<button class="btn sm ${dis?"":"primary"}" data-act="play" data-key="${key}" data-i="${i}" data-max="${max}" ${dis?"disabled":""}>${ICONS.play}${esc(label||"Play")}${left}</button>`;
}
function stHoeren(n,d){
  const H=d.hoeren; let h=`<div class="banner info"><div>${ex(`Exam mode is ${S.st.strict?"ON":"OFF"}: the audio plays exactly as often as in the real exam (Teil 1 and 3 once, Teil 2 twice). After you check your answers you can replay freely and read the transcript.`,"در حالت آزمون، صدا دقیقاً به تعداد آزمون واقعی پخش می‌شود (بخش ۱ و ۳ یک بار، بخش ۲ دو بار). بعد از تصحیح، می‌توانی آزادانه گوش کنی و متن را ببینی.")}</div></div>`;
  if(H.teil1){ const g=n+":h1"; const T=H.teil1; const chk=S.checked[g];
    let sc=0; T.texts.forEach(t=>{ if(S.ans[g+":"+t.n]===t.answer) sc++; });
    h+=`<section class="card stack"><div class="label">Hören · Teil 1 · played once</div><h2>Welches Bild passt?</h2>
      <p class="small">${ex("You hear 5 short texts. Match each text to a picture. One picture is extra.","۵ متن کوتاه می‌شنوی. هر متن را به یک تصویر وصل کن. یک تصویر اضافه است.")}</p>
      ${pics(T.pictures)}
      ${T.texts.map(t=>`<div class="row" style="padding-top:8px;border-top:1px solid var(--line)"><b style="width:56px">Text ${t.n}</b>${playBtn(g+"|"+t.n, t.script, 1)}
        <select data-store="${g}:${t.n}" aria-label="Picture for text ${t.n}" style="width:auto;min-width:90px" class="${chk?(S.ans[g+":"+t.n]===t.answer?"inp-ok":"inp-bad"):""}" ${chk?"disabled":""}><option value="">–</option>${T.pictures.map(p=>`<option ${S.ans[g+":"+t.n]===p.id?"selected":""}>${esc(p.id)}</option>`).join("")}</select>
        ${chk&&S.ans[g+":"+t.n]!==t.answer?`<span class="chip ok">${esc(t.answer)}</span>`:""}</div>
        ${chk?`<div class="sunk small">${t.script.map(l=>esc(l.text_de)).join("<br>")}</div>`:""}`).join("")}
      ${checkRow(g, chk, sc, T.texts.length, n, "hoeren-1")}</section>`; }
  if(H.teil2){ const g=n+":h2"; const T=H.teil2; const chk=S.checked[g]; let sc=0;
    const okField=(f,i)=>{ const v=S.ans[g+":"+i]||""; const acc=(f.accept&&f.accept.length?f.accept:[f.answer]); if(f.digits) return acc.concat([f.answer]).some(a=>String(a).replace(/\D/g,"")===v.replace(/\D/g,"")&&v.replace(/\D/g,"")!==""); return f.exact? acc.some(a=>normKeepUml(a)===normKeepUml(v)) : acc.some(a=>norm(a)===norm(v)); };
    T.note_fields.forEach((f,i)=>{ if(okField(f,i)) sc++; });
    h+=`<section class="card stack"><div class="label">Hören · Teil 2 · played twice</div><h2>Notizen</h2>
      <p class="small">${ex((T.intro_de?T.intro_de+" ":"")+"Write the key information on the note sheet. Spelled names and phone numbers must be 100% correct, or the line gets 0 points.","اطلاعات مهم را روی برگه یادداشت بنویس. اسم‌های هجی‌شده و شماره تلفن باید کاملاً درست باشند، وگرنه آن خط صفر می‌گیرد.")}</p>
      <div>${playBtn(g+"|msg", T.script, 2, "Play message")}</div>
      <div class="sunk stack"><div class="label">Notizblatt</div>${T.note_fields.map((f,i)=>`<div class="field"><label for="nf${i}">${esc(f.label_de)}${f.exact?' <span class="chip warn">exact</span>':""}</label>
        <input type="text" id="nf${i}" data-store="${g}:${i}" value="${attr(S.ans[g+":"+i]||"")}" ${chk?"disabled":""} class="${chk?(okField(f,i)?"inp-ok":"inp-bad"):""}" autocomplete="off" spellcheck="false">
        ${chk&&!okField(f,i)?`<span class="small" style="color:var(--ok)">→ ${esc(f.answer)}</span>`:""}</div>`).join("")}</div>
      ${chk?`<div class="sunk small">${T.script.map(l=>esc(l.text_de)).join("<br>")}</div>`:""}
      ${checkRow(g, chk, sc, T.note_fields.length, n, "hoeren-2")}</section>`; }
  if(H.teil3){ const g=n+":h3"; const T=H.teil3; const chk=S.checked[g]; let sc=0; T.people.forEach((p,i)=>{ if(S.ans[g+":"+i]===p.answer) sc++; });
    const allLines = T.people.map(p=>({voice:p.voice, text_de:p.name.replace(/Person/,"Person")+". "+p.text_de}));
    h+=`<section class="card stack"><div class="label">Hören · Teil 3 · played once</div><h2>${esc(T.question_de)}</h2>
      <p class="small">${ex("Five people answer the same question. Tick one answer per person. Watch out: people sometimes mention an option and then reject it.","پنج نفر به یک سؤال جواب می‌دهند. برای هر نفر فقط یک گزینه علامت بزن. مراقب باش: گاهی کسی گزینه‌ای را نام می‌برد ولی ردش می‌کند.")}</p>
      <div>${playBtn(g+"|all", allLines, 1, "Play all 5")}</div>
      <div class="matrix"><table><tr><th></th>${T.options.map(o=>`<th>${esc(o)}</th>`).join("")}</tr>
      ${T.people.map((p,i)=>`<tr><td><b>${esc(p.name)}</b>${chk?`<div class="small muted" style="max-width:220px">${esc(p.text_de)}</div>`:""}</td>${T.options.map(o=>{ const sel=S.ans[g+":"+i]===o; const mark=chk?(o===p.answer?"background:var(--ok-soft)":sel?"background:var(--bad-soft)":""):"";
        return `<td style="${mark}"><input type="radio" name="${g}-${i}" data-store="${g}:${i}" value="${attr(o)}" ${sel?"checked":""} ${chk?"disabled":""} aria-label="${attr(p.name+": "+o)}"></td>`; }).join("")}</tr>`).join("")}</table></div>
      ${checkRow(g, chk, sc, T.people.length, n, "hoeren-3")}</section>`; }
  return h;
}
function pics(list){ return `<div class="pics">${list.map(p=>`<div class="pic"><div class="id">${esc(p.id)}</div><div class="e" aria-hidden="true">${esc(p.emoji||"▢")}</div><div class="lb">${esc(p.label_en||"")}</div></div>`).join("")}</div>`; }
function isTest(g){ return S.testPrefix && String(g).startsWith(S.testPrefix); }
function checkRow(g, chk, sc, total, n, rk){
  if(isTest(g) && !chk) return "";
  if(chk){ const k=n+":"+rk; if(!S.st.results[k]||S.st.results[k].score!==sc){ S.st.results[k]={score:sc,total,at:Date.now()}; save(); } }
  return `<div class="row">${chk?`<span class="chip ${sc>=total*0.6?"ok":"bad"} tnum">${sc} / ${total} · ${sc*2} pts of ${total*2}</span><button class="btn sm" data-act="uncheck" data-g="${g}">Try again</button>`:`<button class="btn primary" data-act="check" data-g="${g}">Check answers</button>`}</div>`;
}

/* Diktat */
function lcsDiff(a,b){ const A=a.split(/\s+/).filter(Boolean), B=b.split(/\s+/).filter(Boolean); const cl=w=>w.replace(/[.,!?;:„“"]/g,"");
  const m=A.length,n=B.length, L=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  for(let i=m-1;i>=0;i--) for(let j=n-1;j>=0;j--) L[i][j]= cl(A[i])===cl(B[j]) ? L[i+1][j+1]+1 : Math.max(L[i+1][j],L[i][j+1]);
  const out=[]; let i=0,j=0; while(i<m&&j<n){ if(cl(A[i])===cl(B[j])){ out.push({w:A[i],t:"ok"}); i++; j++; } else if(L[i+1][j]>=L[i][j+1]){ const cand=B[j]; out.push({w:A[i],t: cand&&cl(cand).toLowerCase()===cl(A[i]).toLowerCase()?"case":"miss", you:cand}); i++; } else { out.push({w:B[j],t:"extra"}); j++; } }
  while(i<m){ out.push({w:A[i],t:"miss"}); i++; } while(j<n){ out.push({w:B[j],t:"extra"}); j++; }
  return out; }
function stDiktat(n,d){
  const g=n+":dk"; let sc=0;
  const rows=d.diktat.map((s,i)=>{ const key=g+":"+i; const chk=S.checked[key]; const v=S.ans[key]||"";
    const exact = chk && v.trim().replace(/\s+/g," ")===s.trim();
    if(exact) sc++;
    let diff="";
    if(chk){ const parts=lcsDiff(s, v); diff=`<div class="small" style="line-height:2">${parts.map(p=>p.t==="ok"?`<span style="color:var(--ok)">${esc(p.w)}</span>`:p.t==="case"?`<span class="chip warn" title="capital letter">${esc(p.w)}</span>`:p.t==="miss"?`<span class="chip bad">${esc(p.w)}</span>`:`<s class="muted">${esc(p.w)}</s>`).join(" ")}</div>`; }
    return `<div class="q"><div class="row"><b class="tnum">${i+1}.</b>${sayBtn(s,{slow:true})}</div>
      <input type="text" data-store="${key}" value="${attr(v)}" ${chk?"disabled":""} class="${chk?(exact?"inp-ok":"inp-bad"):""}" autocomplete="off" spellcheck="false" aria-label="Sentence ${i+1}">
      ${chk?diff:`<div><button class="btn sm" data-act="check" data-g="${key}">Check</button></div>`}</div>`; }).join("");
  return `<div class="card"><p class="small">${ex("Listen, then type exactly what you hear. Capital letters on nouns and punctuation count. Orange = only the capital letter is wrong.","گوش کن و دقیقاً همان را تایپ کن. حرف بزرگ اسم‌ها و علائم نگارشی مهم‌اند. نارنجی یعنی فقط حرف بزرگ اشتباه است.")}</p>
    <p class="small muted">${ex("Typing ä ö ü ß: on Android, long-press a, o, u or s. On Windows, add the German keyboard or type ae, oe, ue, ss for now.","تایپ ä ö ü ß: در اندروید روی a، o، u یا s انگشت را نگه دار. در ویندوز کیبورد آلمانی اضافه کن.")}</p>
    ${rows}<div class="row" style="padding-top:10px"><span class="chip tnum">${sc} / ${d.diktat.length} perfect</span>${Object.keys(S.checked).some(k=>k.startsWith(g))?`<button class="btn sm" data-act="uncheck-pre" data-g="${g}:">Try again</button>`:""}</div></div>`;
}

/* Lesen */
function stLesen(n,d){
  const L=d.lesen; let h="";
  if(L.teil1){ const g=n+":l1"; const T=L.teil1; const chk=S.checked[g]; let sc=0; T.situations.forEach(s=>{ if(String(S.ans[g+":"+s.id])===String(T.answers[s.id])) sc++; });
    h+=`<section class="card stack"><div class="label">Lesen · Teil 1</div><h2>Welche Anzeige passt?</h2><p class="small">${ex("Match each situation A–E to an ad 1–6. One ad is extra.","هر موقعیت A تا E را به یک آگهی ۱ تا ۶ وصل کن. یک آگهی اضافه است.")}</p>
      <div class="grid2">${T.ads.map(a=>`<div class="notice"><b>${a.n}. ${esc(a.title||"")}</b>\n${esc(a.text_de)}</div>`).join("")}</div>
      ${T.situations.map(s=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start;border-top:1px solid var(--line);padding-top:8px"><b>${esc(s.id)}</b><div class="grow">${esc(s.text_de)}</div>
        <select data-store="${g}:${s.id}" style="width:auto" ${chk?"disabled":""} class="${chk?(String(S.ans[g+":"+s.id])===String(T.answers[s.id])?"inp-ok":"inp-bad"):""}" aria-label="Ad for ${attr(s.id)}"><option value="">–</option>${T.ads.map(a=>`<option ${String(S.ans[g+":"+s.id])===String(a.n)?"selected":""}>${a.n}</option>`).join("")}</select>
        ${chk&&String(S.ans[g+":"+s.id])!==String(T.answers[s.id])?`<span class="chip ok">${esc(T.answers[s.id])}</span>`:""}</div>`).join("")}
      ${checkRow(g,chk,sc,T.situations.length,n,"lesen-1")}</section>`; }
  else h+=`<div class="banner"><div>${ex("Lesen Teil 1 (match situations to ads) starts on Day 8, once you know enough words.","بخش اول خواندن (وصل کردن موقعیت به آگهی) از روز ۸ شروع می‌شود.")}</div></div>`;
  if(L.teil2){ const g=n+":l2"; const chk=S.checked[g]; let sc=0, tot=0;
    h+=`<section class="card stack"><div class="label">Lesen · Teil 2</div><h2>Ja oder Nein?</h2><p class="small">${ex("Read three short texts. Answer each statement with JA or NEIN.","سه متن کوتاه بخوان و به هر جمله با JA (بله) یا NEIN (خیر) جواب بده.")}</p>
      ${L.teil2.map((t,ti)=>`<div class="stack" style="gap:8px;padding-top:6px"><div class="notice">${t.title?`<b>${esc(t.title)}</b>\n`:""}${esc(t.text_de)}</div>
        ${t.items.map((it,ii)=>{ tot++; const k=g+":"+ti+":"+ii; const v=S.ans[k]; if(v===it.answer) sc++;
          return `<div class="stack" style="gap:6px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div class="grow">${esc(it.statement_de)}</div>
            <div class="ja-nein">${["ja","nein"].map(o=>{ let c=v===o?"sel":""; if(chk){ c = o===it.answer?"right":(v===o?"wrong":""); } return `<button class="opt ${c}" data-act="set" data-k="${k}" data-v="${o}" ${chk?"disabled":""}>${o.toUpperCase()}</button>`; }).join("")}</div></div>
            ${chk?`<div class="fb ${v===it.answer?"ok":"bad"}">${ex(it.explain_en,it.explain_fa)}</div>`:""}</div>`; }).join("")}</div>`).join('<hr class="soft">')}
      ${checkRow(g,chk,sc,tot,n,"lesen-2")}</section>`; }
  if(L.teil3){ const g=n+":l3"; const T=L.teil3; const chk=S.checked[g]; let sc=0; T.texts.forEach(t=>{ if(S.ans[g+":"+t.n]===T.answers[t.n]) sc++; });
    h+=`<section class="card stack"><div class="label">Lesen · Teil 3</div><h2>Welches Bild passt?</h2><p class="small">${ex("Match each short notice to a picture. One picture is extra.","هر متن کوتاه را به یک تصویر وصل کن. یک تصویر اضافه است.")}</p>
      ${pics(T.pictures)}
      ${T.texts.map(t=>`<div class="row" style="flex-wrap:nowrap;border-top:1px solid var(--line);padding-top:8px"><b>${t.n}</b><div class="grow notice" style="padding:8px 10px">${esc(t.text_de)}</div>
        <select data-store="${g}:${t.n}" style="width:auto" ${chk?"disabled":""} class="${chk?(S.ans[g+":"+t.n]===T.answers[t.n]?"inp-ok":"inp-bad"):""}" aria-label="Picture for notice ${t.n}"><option value="">–</option>${T.pictures.map(p=>`<option ${S.ans[g+":"+t.n]===p.id?"selected":""}>${esc(p.id)}</option>`).join("")}</select>
        ${chk&&S.ans[g+":"+t.n]!==T.answers[t.n]?`<span class="chip ok">${esc(T.answers[t.n])}</span>`:""}</div>`).join("")}
      ${checkRow(g,chk,sc,T.texts.length,n,"lesen-3")}</section>`; }
  return h;
}

/* Schreiben */
function stSchreiben(n,d){
  const W=d.schreiben; let h="";
  if(W.teil1){ const g=n+":s1"; const T=W.teil1; const chk=S.checked[g]; let sc=0;
    const fOk=f=>{ const v=S.ans[g+":"+f.id]; if(f.type==="multi"){ const arr=(v||[]).slice().sort(); return JSON.stringify(arr)===JSON.stringify((f.answer||[]).slice().sort()); } if(f.type==="choice") return v===f.answer; const acc=f.accept&&f.accept.length?f.accept:[f.answer]; return acc.some(a=>norm(a)===norm(v)); };
    T.fields.forEach(f=>{ if(fOk(f)) sc++; });
    h+=`<section class="card stack"><div class="label">Schreiben · Teil 1 · Formular</div><h2>Formular ausfüllen</h2>
      <p>${esc(T.situation_de)}</p><p class="small muted">${esc(T.situation_en||"")}</p>
      <div class="notice">${esc(T.profile_de)}</div>
      <div class="grid2">${T.fields.map(f=>{ const v=S.ans[g+":"+f.id]; const cls=chk?(fOk(f)?"inp-ok":"inp-bad"):"";
        let ctl="";
        if(f.type==="text") ctl=`<input type="text" id="${g}-${f.id}" data-store="${g}:${f.id}" value="${attr(v||"")}" ${chk?"disabled":""} class="${cls}" autocomplete="off">`;
        else if(f.type==="choice") ctl=`<div class="checks ${cls}" style="padding:6px;border-radius:8px">${f.options.map(o=>`<label><input type="radio" name="${g}-${f.id}" data-store="${g}:${f.id}" value="${attr(o)}" ${v===o?"checked":""} ${chk?"disabled":""}> ${esc(o)}</label>`).join("")}</div>`;
        else ctl=`<div class="checks ${cls}" style="padding:6px;border-radius:8px">${f.options.map(o=>`<label><input type="checkbox" data-multi="${g}:${f.id}" value="${attr(o)}" ${(v||[]).includes(o)?"checked":""} ${chk?"disabled":""}> ${esc(o)}</label>`).join("")}</div>`;
        return `<div class="field"><span class="lb">${esc(f.label_de)}</span>${ctl}${chk&&!fOk(f)?`<span class="small" style="color:var(--ok)">→ ${esc(Array.isArray(f.answer)?f.answer.join(", "):f.answer)}</span>`:""}</div>`; }).join("")}</div>
      <div class="row">${chk?`<span class="chip ${sc>=T.fields.length*0.6?"ok":"bad"} tnum">${sc}/${T.fields.length} · ${(sc*0.5).toFixed(1)} pts</span><button class="btn sm" data-act="uncheck" data-g="${g}">Try again</button>`:isTest(g)?"":`<button class="btn primary" data-act="check" data-g="${g}">Check form</button>`}</div></section>`; }
  if(W.teil2){ const T=W.teil2; const dk=n+":email"; const txt=S.st.drafts[dk]||""; const wc=(txt.match(/[A-Za-zÄÖÜäöüß0-9-]+/g)||[]).length; const gr=S.st.grades[dk];
    h+=`<section class="card stack"><div class="label">Schreiben · Teil 2 · E-Mail · 10 points, you need 4</div><h2>Antworten Sie ${esc(T.email_from||"")}</h2>
      <div class="mail"><div class="hd">Von: ${esc(T.email_from||"")}</div><div class="bd">${esc(T.email_de)}</div></div>
      <p><b>${esc(T.task_de)}</b></p><p class="small muted">${esc(T.task_en||"")}</p>
      <div class="row">${(T.points_de||[]).map(p=>`<span class="chip acc">${esc(p)}</span>`).join("")}</div>
      <textarea id="emailTxt" data-draft="${dk}" aria-label="Your email" placeholder="Hallo ${attr(T.email_from||"")}, …" spellcheck="false">${esc(txt)}</textarea>
      <div id="wcheck" class="wcheck">${writeCheckHtml(txt)}</div>
      <div class="checks">${(T.points_de||[]).map((p,pi)=>`<label><input type="checkbox" data-pt="${dk}:${pi}" ${S.st.drafts[dk+":p"+pi]?"checked":""}> ${esc(p)} answered</label>`).join("")}</div>
      <div class="row between"><span class="small tnum" id="wc" style="color:${wc>=25?"var(--ok)":"var(--muted)"}">${wc} words · aim for 30, at least 25</span>
        <div class="row">${isTest(dk)?"":S.ai&&S.uid?`<button class="btn primary" data-act="grade" data-n="${n}" ${S.gradeBusy?"disabled":""}>${S.gradeBusy?"The examiner is reading…":"Get examiner feedback"}</button>`:`<span class="small muted">${S.uid?"Feedback needs GEMINI_API_KEY on the server.":"Sign in to get feedback."}</span>`}</div></div>
      ${gr&&!isTest(dk)?gradeView(gr):""}
      ${isTest(dk)?"":`<details class="acc"><summary>Useful phrases</summary><div class="in stack">${(T.useful_phrases||[]).map(p=>`<div class="row" style="flex-wrap:nowrap">${sayBtn(p.replace(/…/g,""))}<span>${esc(p)}</span></div>`).join("")}</div></details>
      <details class="acc"><summary>Model answer (try first!)</summary><div class="in stack"><div class="mail"><div class="bd">${esc(T.model_answer_de)}</div></div>${ex(T.notes_en,T.notes_fa)}</div></details>`}
    </section>`; }
  return h;
}
function wordCount(t){ return (String(t||"").match(/[A-Za-zÄÖÜäöüß0-9-]+/g)||[]).length; }
function writeCheckHtml(txt){
  const lines=String(txt||"").trim().split(/\n+/).filter(Boolean); const wc=wordCount(txt);
  const greet=/^(hallo|hi|liebe|lieber|sehr geehrte|grüß|servus)/i.test(lines[0]||"");
  const bye=/(grüße|gruß|bis bald|bis morgen|bis samstag|bis dann|tschüss|baba|servus|liebe grüße)/i.test(lines.slice(-3).join(" "));
  const wtxt = wc>=25 ? ["ok","Length OK (no deduction)"] : wc>=20 ? ["warn","20–24 words: −1 point"] : wc>=15 ? ["warn","15–19 words: −2 points"] : ["bad","Under 15 words: not graded (0 points)"];
  const item=(ok,t)=>`<span class="chip ${ok===true?"ok":ok===false?"bad":ok}">${ok===true?"✓":ok===false?"✗":"!"} ${esc(t)}</span>`;
  return `<div class="row" style="gap:6px">${item(greet,"Greeting")}${item(bye,"Sign-off")}${item(wtxt[0]==="ok"?true:wtxt[0],wc+" words · "+wtxt[1])}</div>`;
}
function gradeView(g){ return `<div class="card stack" style="border-color:var(--accent)"><div class="row between"><h3>Examiner feedback</h3><span class="chip ${g.score>=4?"ok":"bad"} tnum">${esc(g.score)} / 10 ${g.score>=4?"· pass":"· below 4"}</span></div>
  ${g.score<4?`<div class="banner">${ex("Below 4 points: in the exam your whole Schreiben score would be 0. Fix the length and answer every point first.","زیر ۴ امتیاز: در آزمون کل نمره نوشتن صفر می‌شود. اول طول متن و جواب همه سؤال‌ها را درست کن.")}</div>`:""}
  ${(g.deductions||[]).length?`<div class="small"><b>Deductions:</b> ${esc(g.deductions.join("; "))}</div>`:""}
  ${(g.criteria||[]).map(c=>`<div class="small"><b>${esc(c.name)}</b> <span class="tnum muted">${esc(c.score)}</span> · ${esc(c.comment_en)}</div>`).join("")}
  ${(g.errors||[]).length?`<div class="stack" style="gap:6px">${g.errors.map(e=>`<div class="sunk small"><span style="color:var(--bad);text-decoration:line-through">${esc(e.wrong)}</span> → <b style="color:var(--ok)">${esc(e.right)}</b><br>${ex(e.why_en,e.why_fa)}</div>`).join("")}</div>`:""}
  ${g.corrected_de?`<div><div class="label">Corrected</div><div class="mail"><div class="bd">${esc(g.corrected_de)}</div></div></div>`:""}
  ${ex(g.tip_en,g.tip_fa)}</div>`; }
async function gradeEmail(n){
  const d=S.days[n]; const T=d.schreiben.teil2; const dk=n+":email"; const txt=(S.st.drafts[dk]||"").trim();
  if(txt.length<10){ toast("Write your email first"); return; }
  S.gradeBusy=true; render();
  try{
    const r=await api("/api/ai",{mode:"grade", payload:{from:T.email_from, email:T.email_de, task:T.task_de, points:T.points_de, wordTarget:T.word_target||30, text:txt, day:n}});
    const g=r.result; if(g && typeof g==="object"){ g.score=Number(g.score)||0; S.st.grades[dk]=g; save(); }
  }catch(e){ toast("Feedback failed: "+e.message); }
  S.gradeBusy=false; render();
}
/* Sprechen */
function stSprechen(n,d){
  const P=d.sprechen; let h=tutorCard(n);
  if(P.teil1){ const T=P.teil1;
    h+=`<section class="card stack"><div class="label">Sprechen · Teil 1 · Sich vorstellen</div><h2>Introduce yourself</h2>
      <p class="small">${ex("In the exam you pick 4 of these 6 topics and say a few sentences about each. The examiner may then ask follow-up questions, often 'please spell your name'. This script grows every day; by Day 21 it covers all six topics.","در آزمون ۴ موضوع از این ۶ موضوع را انتخاب می‌کنی و درباره هر کدام چند جمله می‌گویی. ممتحن بعد سؤال می‌پرسد، معمولاً «اسمتان را هجی کنید». این متن هر روز کامل‌تر می‌شود تا روز ۲۱ هر شش موضوع را پوشش دهد.")}</p>
      <div class="row">${T.topics.map(t=>`<span class="chip ${(T.today_topics||[]).includes(t)?"acc":""}">${esc(t)}</span>`).join("")}</div>
      <div class="sunk stack"><div class="row between"><div class="label">My script today</div>${(()=>{const i=SAY_BANK.push({lines:T.my_script.map(l=>({text_de:l.tts||l.de}))})-1; return `<button class="btn sm primary" data-act="sayall" data-i="${i}">${ICONS.play}Play all</button>`;})()}</div>
        ${T.my_script.map((l,li)=>{ const pk=n+":pron:"+li; return `<div class="stack" style="gap:4px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(l.tts||l.de,{slow:true})}<button class="say" data-act="pron" data-k="${pk}" data-t="${attr(l.de)}" title="Say it and check" aria-label="Say it and check">${ICONS.mic}</button>${recBtns(pk, l.tts||l.de)}<div><b>${esc(l.de)}</b><br><span class="small muted">${esc(l.en)}</span></div></div>${pronView(pk)}</div>`; }).join("")}</div>
      <p class="small">${ex("Shadowing: play a sentence, pause, say it aloud yourself. Do the whole script 5 times.","سایه‌خوانی: یک جمله را پخش کن، مکث کن و خودت بلند تکرار کن. کل متن را ۵ بار انجام بده.")}</p>
      ${T.examiner_questions_de&&T.examiner_questions_de.length?`<div class="stack" style="gap:6px"><div class="label">The examiner may ask</div>${T.examiner_questions_de.map(q=>`<div class="row" style="flex-wrap:nowrap">${sayBtn(q)}<span>${esc(q)}</span></div>`).join("")}</div>`:""}</section>`; }
  if(P.teil2){ const T=P.teil2;
    h+=`<section class="card stack"><div class="label">Sprechen · Teil 2 · Situation beschreiben</div><h2>Describe a photo</h2><div class="notice">${esc(T.photo_scene_en||"")}</div>
      ${(T.questions_de||[]).map(q=>`<div class="row" style="flex-wrap:nowrap">${sayBtn(q)}<span>${esc(q)}</span></div>`).join("")}
      ${T.model_answer_de?`<details class="acc"><summary>Model answer</summary><div class="in row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(T.model_answer_de,{slow:true})}<p>${esc(T.model_answer_de)}</p></div></details>`:""}</section>`; }
  else h+=`<div class="banner"><div>${ex("Teil 2 (describe a photo) and Teil 3 (role-play with the examiner) start on Day 8.","بخش ۲ (توصیف عکس) و بخش ۳ (نقش‌آفرینی با ممتحن) از روز ۸ شروع می‌شوند.")}</div></div>`;
  if(P.teil3){ const T=P.teil3;
    h+=`<section class="card stack"><div class="label">Sprechen · Teil 3 · Miteinander sprechen</div><h2>Role-play</h2><p>${esc(T.roleplay_en||"")}</p>${T.examiner_role_de?`<div class="notice">${esc(T.examiner_role_de)}</div>`:""}
      ${(T.model_dialogue||[]).map(l=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(l.text_de,{voice:l.speaker==="Ich"?"m":"f"})}<div><span class="label">${esc(l.speaker)}</span><br>${esc(l.text_de)}</div></div>`).join("")}</section>`; }
  if(P.live_brief){
    h+=`<details class="acc"><summary>Use the Gemini app instead</summary><div class="in stack">
      <p class="small">${ex("Copy this brief, open the Gemini app on your phone, start Live, paste or read it out, then talk. Use headphones.","این متن را کپی کن، اپ Gemini را باز کن، Live را شروع کن، متن را بفرست یا بخوان و صحبت کن. از هدفون استفاده کن.")}</p>
      <div><button class="btn primary" data-act="copy-context" data-n="${n}">${ICONS.copy}Copy full context for Gemini</button></div></div></details>`; }
  return h;
}

/* ---------- pending day: prompts + import ---------- */
function prevThemes(n){ return PLAN.slice(0,n-1).filter(p=>p.k==="lesson").map(p=>p.t).join("; ") || "nothing yet"; }
function prompt2A(n){ const p=PLAN[n-1]; return `Day ${n} of my 34-day ÖSD Zertifikat A1 plan. Theme: ${p.t}. Grammar: ${p.g||"review"}. Already covered: ${prevThemes(n)}.
Ground everything in my sources. Explanations: simple English plus Persian (fa). Give Austrian variants where they exist. Nouns always with article and plural.
Output ONLY one JSON code block, no citation markers:
{
 "day": ${n}, "title": "", "title_fa": "",
 "objectives": [{"en":"","fa":""}],
 "vocab": [{"de":"","article":"der|die|das|-","plural":"die …|-","pos":"noun|verb|adj|adv|pronoun","en":"","fa":"","example_de":"","example_en":"","austrian":""}],
 "phrases": [{"de":"","en":"","fa":"","register":"formal|informal|both"}],
 "pronunciation": [{"focus":"","words":[""],"tip_en":"","tip_fa":""}],
 "grammar": [{"topic":"","explain_en":"","explain_fa":"","table":[[""]],"examples":[{"de":"","en":""}],"common_mistakes":[""]}],
 "exercises": [{"type":"mcq|gap|article|word_order|translate","prompt":"","options":[""],"answer":"","accept":[""],"explain_en":"","explain_fa":""}],
 "watch": [{"source_title":"exact title from my sources","why":""}]
}
Rules: vocab 20–25 high-frequency A1 items for this theme. phrases 10–15 ready-to-use chunks. pronunciation 1–2 items. exercises exactly 20, about 5 of them revising earlier days. For word_order, the prompt is the words separated by " · " and options is []. For translate, options is [] and accept lists every correct version.`; }
function prompt2B(n){ return `Now create the Lesen and Hören practice for Day ${n}, in the EXACT ÖSD Zertifikat A1 task formats below. Use only vocabulary and grammar from Days 1–${n}. Take the formats from official ÖSD material only and ignore Goethe/telc formats. Names, places and prices should feel Austrian.
Output ONLY one JSON code block:
{
 "day": ${n},
 "lesen": {
   "teil1": ${n<8?"null":'{"situations":[{"id":"A","text_de":""}],"ads":[{"n":1,"title":"","text_de":""}],"answers":{"A":1}}'},
   "teil2": [{"title":"","text_de":"","items":[{"statement_de":"","answer":"ja|nein","explain_en":"","explain_fa":""}]}],
   "teil3": {"texts":[{"n":1,"text_de":""}],"pictures":[{"id":"A","emoji":"","label_en":""}],"answers":{"1":"A"}}
 },
 "hoeren": {
   "teil1": {"pictures":[{"id":"A","emoji":"","label_en":""}],"texts":[{"n":1,"answer":"A","script":[{"voice":"f|m","text_de":""}]}]},
   "teil2": {"intro_de":"","script":[{"voice":"f|m","text_de":"","tts":""}],"note_fields":[{"label_de":"","answer":"","accept":[""],"exact":true}]},
   "teil3": {"question_de":"","options":["","","",""],"people":[{"name":"Person 1","voice":"f|m","text_de":"","answer":""}]}
 },
 "diktat": ["","","","","",""]
}
Rules:
- lesen.teil1: 5 situations A–E and 6 short ads 1–6; exactly one ad fits no situation.
- lesen.teil2: exactly 3 short texts (signs, notices, short messages), 2 JA/NEIN statements each.
- lesen.teil3: 5 short public notices and 6 pictures A–F (one emoji + short English label each); one picture fits none.
- hoeren.teil1: 5 very short everyday dialogues and 6 pictures; one picture is extra. Played once.
- hoeren.teil2: ONE answering-machine message with 5 note fields (what, day, time, place, phone number or a spelled name). Played twice. Set "exact": true for spelled names and numbers. In "tts", write spelled letters as letter names (Pe. Ö. El.) and digits as words.
- hoeren.teil3: 5 people answer one question; 4 options; at least one person mentions an option and then rejects it. Played once.
- diktat: 6 short sentences using today's words.`; }
function prompt2C(n){ return `Now create the Schreiben, Sprechen and review quiz for Day ${n} in the EXACT ÖSD Zertifikat A1 formats below, using only language from Days 1–${n}. About me: my name is Raam, I'm from Tehran, Iran, I speak Persian and English, I'm married, I work as a web developer.
Output ONLY one JSON code block:
{
 "day": ${n},
 "schreiben": {
   "teil1": {"situation_de":"","situation_en":"","profile_de":"","fields":[{"id":"f1","label_de":"","type":"text|choice|multi","options":[""],"answer":"","accept":[""]}]},
   "teil2": {"email_from":"","email_de":"","task_de":"Antworten Sie … Schreiben Sie circa 30 Wörter.","task_en":"","points_de":["","",""],"word_target":30,"model_answer_de":"","useful_phrases":[""],"notes_en":"","notes_fa":""}
 },
 "sprechen": {
   "teil1": {"topics":["Sprachen","Hobbys","Sport","Familie","Beruf","Lieblingsessen"],"today_topics":[""],"my_script":[{"de":"","en":""}],"examiner_questions_de":[""]},
   "teil2": ${n<8?"null":'{"photo_scene_en":"","questions_de":["Was sehen Sie?","Wie viele Personen sehen Sie?","Wo sind diese Personen?","Was machen diese Personen?"],"model_answer_de":""}'},
   "teil3": ${n<8?"null":'{"roleplay_en":"","examiner_role_de":"","model_dialogue":[{"speaker":"Prüfer|Ich","text_de":""}]}'},
   "live_brief": ""
 },
 "review_quiz": [{"q":"","options":[""],"answer":"","explain_en":""}]
}
Rules:
- schreiben.teil1: I help a friend fill in a form. 10 fields mixing text, choice and multi; profile_de contains all the information needed. For multi, answer is an array.
- schreiben.teil2: reply to a short PERSONAL email (informal, du) with exactly 3 guiding points. Model answer 30–40 words, with greeting and sign-off.
- sprechen.teil1.my_script: 4–8 sentences about ME on today's topics, building on earlier days.
- live_brief: an English prompt for Gemini Live: act as my ÖSD A1 examiner, today's topics, slow A1 German, correct my mistakes, give a score out of 25 at the end.
- review_quiz: 10 items, half from today and half from earlier days.`; }
function promptCards(n){ const p=PLAN[n-1]; return `DATA TABLE (Studio → Data Table → describe):
Flashcards for Day ${n} of my ÖSD A1 plan: ${p.t}. 30 rows, A1 high-frequency only. Columns: German (nouns with der/die/das) | Plural | English | Persian | Example (short A1 sentence).
Then: ⋮ → Export to Google Sheets → select the cells → copy → paste into the app (Day ${n} → Listen & watch → Add flashcards).`; }
function promptStudio(n){ const p=PLAN[n-1]; return `AUDIO OVERVIEW (Brief, English):
Day ${n}: ${p.t}${p.g?" + "+p.g:""}, for an absolute beginner (Persian native, English B2) preparing for ÖSD A1. Say every German word slowly, twice. Cover only this topic. End with 5 phrases for me to repeat.

VIDEO OVERVIEW (Explainer):
Explain ${p.g||p.t} to an absolute beginner. Colour-code der = blue, die = red, das = green. 6 examples with English. Common mistakes.

INFOGRAPHIC (Portrait):
One-page cheat sheet for ${p.g||p.t} at A1 level, with a table and examples.`; }
function promptMock(n){ return `Create a COMPLETE ÖSD Zertifikat A1 mock exam (mock for Day ${n} of 34), using only A1 language. Use the exact JSON shape from my Prompt 2B and 2C, but with full exam item counts: Lesen Teil 1 = 5 situations + 6 ads, Teil 2 = 3 texts × 2, Teil 3 = 5 texts + 6 pictures; Hören Teil 1 = 5 texts, Teil 2 = 1 message with 5 fields, Teil 3 = 5 people; Schreiben Teil 1 = 10 fields, Teil 2 = 1 email; Sprechen Teil 1–3 including the photo scene and a role-play. Skip vocab/exercises. Make it different from all earlier days.`; }

function pendingPanel(n){
  const p=PLAN[n-1];
  if(p.k==="buffer"||p.k==="rest"){
    const list = p.k==="rest" ? [["Pack: passport or national ID card, exam confirmation, two blue pens, water","پاسپورت یا کارت ملی، تأییدیه ثبت‌نام، دو خودکار آبی، آب"],["Check the route and travel time to Divan Institute; plan to arrive 30 minutes early","مسیر و زمان رفتن به مؤسسه دیوان را چک کن؛ ۳۰ دقیقه زودتر برس"],["Read your Sprechen Teil 1 script aloud twice, nothing else new","متن معرفی را دو بار بلند بخوان؛ چیز جدیدی نخوان"],["Sleep 8 hours","۸ ساعت بخواب"]]
      : [["Clear every due flashcard","همه کارت‌های موعددار را مرور کن"],["Redo your recent mistakes (Cards → Mistakes)","اشتباهات اخیر را دوباره انجام بده"],["Repeat the weakest Hören and Lesen parts from earlier days","ضعیف‌ترین بخش‌های شنیدن و خواندن روزهای قبل را تکرار کن"],["Gemini Live: 20 minutes, Sprechen Teil 1–3","۲۰ دقیقه Gemini Live برای هر سه بخش صحبت"],["Finish any unfinished steps from earlier days","مراحل نیمه‌تمام روزهای قبل را تمام کن"]];
    return `<div class="card stack"><h2>${p.k==="rest"?"Exam eve checklist":"Catch-up routine"}</h2>${list.map(([en,fa],i)=>{ const k=n+":chk"+i; return `<label class="row" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-chk="${k}" ${S.st.done[k]?"checked":""} style="margin-top:6px"><span>${ex(en,fa)}</span></label>`; }).join("")}</div>`;
  }
  const tabs=[["2A","Prompt 2A · Learn",prompt2A(n)],["DT","Data Table · flashcards",promptCards(n)],["2B","Prompt 2B · Lesen + Hören",prompt2B(n)],["2C","Prompt 2C · Schreiben + Sprechen",prompt2C(n)],["ST","Studio prompts",promptStudio(n)]];
  if(p.k==="mock") tabs.unshift(["MK","Mock exam prompt",promptMock(n)]);
  return `<div class="banner"><div>${ex("This day's content isn't in the app yet. Run these prompts in your notebook chat (one after another, same chat), then paste the three JSON answers below. The app checks the German automatically after import.","محتوای این روز هنوز در اپ نیست. این پرامپت‌ها را به ترتیب در چت NotebookLM اجرا کن، سپس سه پاسخ JSON را پایین بچسبان. اپ بعد از وارد کردن، آلمانی را خودکار بررسی می‌کند.")}</div></div>
  ${p.k==="mock"&&n===22?`<div class="card stack"><h3>Use the official model test today</h3><p class="small">${ex("Download the free ÖSD ZA1 model test (with answers and transcripts) and do it timed: Lesen 25 min, Hören about 10 min, Schreiben 20 min.","نمونه آزمون رسمی و رایگان ÖSD را دانلود کن و با زمان‌سنج انجام بده.")}</p><a class="btn sm" href="${MODELSATZ_URL}" target="_blank" rel="noopener">Open ÖSD ZA1 model test (PDF)</a></div>`:""}
  ${tabs.map(([id,nm,txt])=>`<details class="acc"><summary>${esc(nm)}</summary><div class="in stack"><pre class="prompt">${esc(txt)}</pre><div><button class="btn sm primary" data-act="copy" data-txt="${attr(txt)}">${ICONS.copy}Copy</button></div></div></details>`).join("")}
  <div class="card stack"><h2>Import the answers</h2>
    <p class="small muted">${ex("Paste each JSON answer from the notebook as it is (code fences are fine). Then import. The app checks the German and fixes errors before you study.","هر پاسخ JSON را همان‌طور که هست بچسبان. بعد Import بزن؛ اپ آلمانی را قبل از مطالعه بررسی و اصلاح می‌کند.")}</p>
    ${["2A","2B","2C"].map(k=>`<div class="field"><label for="imp${k}">Answer to Prompt ${k}</label><textarea id="imp${k}" data-imp="${n}:${k}" style="min-height:90px;font-family:ui-monospace,Consolas,monospace;font-size:.8rem" spellcheck="false">${esc(S.importText[n+":"+k]||"")}</textarea></div>`).join("")}
    <div><button class="btn primary" data-act="import" data-n="${n}">Import Day ${n}</button></div></div>`;
}
function parseJsonLoose(t){ t=String(t||"").trim(); if(!t) return null; const m=t.match(/```(?:json)?\s*([\s\S]*?)```/); if(m) t=m[1]; const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) throw new Error("No JSON object found"); return JSON.parse(t.slice(a,b+1)); }
async function importDay(n){
  let merged=Object.assign({}, S.imported[n]||{}, {day:n});
  try{ for(const k of ["2A","2B","2C"]){ const j=parseJsonLoose(S.importText[n+":"+k]); if(j) Object.assign(merged, j); } }
  catch(e){ toast("One answer isn't valid JSON: "+e.message); return; }
  merged.day=n;
  if(!merged.vocab && !merged.lesen && !merged.hoeren){ toast("Paste at least one answer first"); return; }
  await saveOverlay(n, merged);
  toast("Day "+n+" imported"); S.dayN=n; S.view="today"; S.step=null; render();
  if(S.ai) checkDay(n);
}
async function checkDay(n){
  if(!S.ai||S.checkBusy) return; S.checkBusy=true; toast("Checking the German…");
  const d=await getDay(n); if(!d){ S.checkBusy=false; return; }
  const copy=JSON.parse(JSON.stringify(d));
  try{
    const r=await api("/api/ai",{mode:"check", payload:{lesson:copy}});
    const issues=(r.result&&r.result.issues)||[]; let applied=0;
    issues.forEach(is=>{ if(setPath(copy, is.path, is.fix)) applied++; });
    copy._checked={at:Date.now(), issues};
    await saveOverlay(n, copy);
    toast(issues.length?`Fixed ${applied} of ${issues.length} issues`:"No errors found");
  }catch(e){ toast("Check failed: "+e.message); }
  S.checkBusy=false; render();
}
function setPath(obj, path, val){ try{ const parts=String(path).replace(/\[(\d+)\]/g,".$1").split(".").filter(Boolean); let o=obj; for(let i=0;i<parts.length-1;i++){ o=o[parts[i]]; if(o==null) return false; } const last=parts[parts.length-1]; if(!(last in o)) return false; o[last]=val; return true; }catch(e){ return false; } }

/* ---------- Plan ---------- */
function vPlan(){
  const cur=currentDay();
  return `<div><h1>34 days to A1</h1><p class="muted">${ex("31 lesson and mock days plus 3 buffer days. Tap a day to study it, or to get its prompts if the content isn't ready yet.","۳۱ روز درس و آزمون آزمایشی + ۳ روز جبرانی. روی هر روز بزن تا مطالعه کنی یا پرامپت‌هایش را بگیری.")}</p></div>
  <div class="card tight plan" style="padding:0">${PLAN.map((p,i)=>{ const n=i+1; const d=S.days[n]; const av=hasDay(n); const pr=d?dayProgress(n,d):null; const dt=dateOf(n);
    let chip = p.k==="buffer"||p.k==="rest" ? `<span class="chip warn">${p.k}</span>` : av ? (pr&&pr.total&&pr.done===pr.total?`<span class="chip ok">done</span>`:pr&&pr.done?`<span class="chip acc tnum">${pr.done}/${pr.total}</span>`:`<span class="chip acc">ready</span>`) : `<span class="chip">prompts</span>`;
    return `<button class="pday ${n===cur?"today":""} kind-${p.k}" data-act="day" data-v="${n}"><span><span class="dn tnum">${n}</span><br><span class="dt">${dt.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span></span>
      <span style="min-width:0"><b>${esc(p.t)}</b><br><span class="small muted">${esc(p.g||"")}</span>${S.st.lang!=="en"?`<br><span class="fa small muted">${esc(p.fa)} · ${fmtFa(dt)}</span>`:""}</span>${chip}</button>`; }).join("")}
    <div class="pday exam" style="cursor:default"><span><span class="dn">✱</span><br><span class="dt">14 Nov</span></span><span><b>ÖSD Zertifikat A1</b><br><span class="small muted">Saturday · Divan Institute, Tehran</span>${S.st.lang!=="en"?`<br><span class="fa small muted">شنبه ۲۳ آبان ۱۴۰۵</span>`:""}</span><span class="chip at">exam</span></div>
  </div>`;
}

/* ---------- Cards ---------- */
async function flashcardsView(){
  // make sure introduced days are loaded
  for(const k of Object.keys(S.st.intro)) await getDay(+k);
  const c=srsCounts();
  if(!S.fc){
    return `<div><h1>Karteikarten</h1><p class="muted">${ex("Spaced repetition: grade yourself honestly and the app decides when you see each card again.","تکرار با فاصله: صادقانه به خودت نمره بده تا اپ تصمیم بگیرد هر کارت را کی دوباره ببینی.")}</p></div>
      <div class="card stack"><div class="row"><span class="chip acc tnum">${c.due} due</span><span class="chip tnum">${c.fresh} new</span><span class="chip ok tnum">${c.learned} scheduled</span></div>
        ${c.due+c.fresh?`<div class="row"><button class="btn primary" data-act="fc-start" data-mode="de">Start: German → meaning</button><button class="btn" data-act="fc-start" data-mode="en">Meaning → German</button></div>`:`<p class="small muted">${Object.keys(S.st.intro).length?"Nothing due right now. Come back later or open a new day's Learn step.":"Cards appear after you open the Learn step of a day."}</p>`}</div>
      ${mistakesView()}`;
  }
  const f=S.fc; const card=f.queue[0];
  if(!card){ S.fc=null; return `<div class="card stack"><h2>Fertig! Session complete.</h2><p>${f.seen} cards reviewed.</p><div><button class="btn primary" data-act="fc-end">Back</button></div></div>`; }
  const art = card.article&&card.article!=="-" ? card.article : "";
  const deFull = (art?art+" ":"")+card.de;
  const front = f.mode==="de" ? `<div class="big">${art?`<span class="${artClass(art)}">${esc(art)}</span> `:""}${esc(card.de)}</div>` : `<div class="big" style="font-size:1.5rem">${esc(card.en)}</div>${S.st.lang!=="en"&&card.fa?`<div class="fa">${esc(card.fa)}</div>`:""}`;
  const back = `<hr class="soft" style="width:100%">${f.mode==="de"?`<div style="font-size:1.2rem;font-weight:700">${esc(card.en)}</div>${S.st.lang!=="en"&&card.fa?`<div class="fa">${esc(card.fa)}</div>`:""}`:`<div class="big">${art?`<span class="${artClass(art)}">${esc(art)}</span> `:""}${esc(card.de)}</div>`}
    ${card.plural&&card.plural!=="-"?`<div class="muted">${esc(card.plural)}</div>`:""}${card.example_de?`<div class="row" style="justify-content:center">${sayBtn(card.example_de)}<span>${esc(card.example_de)}</span></div>`:""}`;
  return `<div class="row between"><button class="btn sm" data-act="fc-end">${ICONS.back}End session</button><span class="small muted tnum">${f.queue.length} left · ${f.seen} done</span></div>
    <div class="card fcard">${f.mode==="de"||f.show?`<div>${sayBtn(deFull,{slow:true})}</div>`:""}${front}${f.show?back:""}</div>
    ${f.show?`<div class="grades">${[["Again",1],["Hard",3],["Good",4],["Easy",5]].map(([nm,q])=>`<button class="btn" data-act="fc-grade" data-q="${q}">${nm}<small>${nextLabel(card,q)}</small></button>`).join("")}</div>`
      :`<button class="btn primary" data-act="fc-show" style="justify-content:center;width:100%">Show answer</button>`}`;
}
function mistakesView(){ const m=S.st.mistakes; return `<div class="card stack"><div class="row between"><h2>My mistakes</h2>${m.length?`<button class="btn sm" data-act="clear-mist">Clear</button>`:""}</div>
  ${m.length?m.slice(0,40).map(x=>`<div class="sunk small"><span class="label">Day ${x.day} · ${esc(x.src)}</span><br><b>${esc(x.q)}</b><br><span style="color:var(--bad)">${esc(x.your||"–")}</span> → <span style="color:var(--ok)">${esc(x.right)}</span></div>`).join(""):`<p class="small muted">Wrong answers from Practice, Quiz and Mixed review collect here and become flashcards automatically.</p>`}</div>`; }
function startFc(mode){ const now=Date.now(); const all=allCards(); const due=all.filter(c=>S.st.srs[c.id]&&S.st.srs[c.id].due<=now).sort((a,b)=>S.st.srs[a.id].due-S.st.srs[b.id].due); const fresh=all.filter(c=>!S.st.srs[c.id]).slice(0,25); S.fc={mode, queue:[...due,...fresh], show:false, seen:0}; }

/* ---------- resources from the research ---------- */
const LINKS={
 nicos:["DW Nicos Weg A1 · free video course","https://learngerman.dw.com/en/overview"],
 kurs:["ÖIF Sprachportal · Kursraum A1 (free live classes, Farsi/Dari starter course)","https://sprachportal.at/deutsch-lernen/a1/online-lernen/kursraum-a1/"],
 sptests:["ÖIF Sprachportal · Übungstests with audio and answers","https://sprachportal.at/kurse-und-pruefungen/pruefungsmaterialien/uebungstests/"],
 hueber:["Hueber Schritte plus Neu Österreich · free online exercises","https://www.hueber.de/reihe/schritte-plus-neu-oesterreich/lernen"],
 osd:["ÖSD Downloads · Modellsatz ZA1 + ZA1/Österreich (MP3 + answer keys)","https://osd.at/downloads/"],
 oral:["ÖSD · official oral exam video","https://www.youtube.com/watch?v=d0RcmGpj5MY"],
 muster:["ÖSD Mustertexte ZA1 · graded writing samples","https://osd.at/wp-content/uploads/2021/06/Mustertexte-ZA1.pdf"],
 sprechpdf:["ÖSD Modellsatz Sprechen · tasks and scoring grid","https://www.osd.at/wp-content/uploads/2021/02/ZA1-Modellsatz-Sprechen.pdf"],
 rules:["ÖSD ZA1 exam rules (Durchführungsbestimmungen 10/2023)","https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf"],
 digital:["ÖSD Digital Test-Training · the real digital exam interface","https://test-training-digital.osd.at/test"],
 osdpage:["ÖSD Zertifikat A1 · exam page","https://www.osd.at/en/exams/oesd-exams/oesd-zertifikat-a1/"],
 goethe:["Goethe-Institut · A1 exam training (Hören)","https://www.goethe.de/en/spr/prf/ueb/pa1.html"],
 wort:["Goethe A1 word list (PDF, ~650 words)","https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf"],
 modell:["modellsatz.de · first ÖSD A1 online mock free","https://modellsatz.de/"],
 testsam:["TESTSAM · audio for ÖSD Übungsmaterialien","https://testsam.at/downloads-public"],
 ythoeren:["YouTube · ZA1 Hören walkthrough","https://www.youtube.com/watch?v=1WfQlZCzJ4I"],
 ytsprech:["YouTube · ZA1 Sprechen Aufgabe 1","https://www.youtube.com/watch?v=9erMeJZIKGQ"],
 ytsprech2:["YouTube · ZA1 speaking exam sample","https://www.youtube.com/watch?v=6FnZeSU7iVI"]
};
const DAYRES={
 1:{t:"Nicos Weg: „Hallo!“, „Von A bis Z“, „Tschüss!“. Download the official ÖSD files today (see Exam → Before you start).",k:["nicos","osd","muster","rules","oral"]},
 2:{t:"Nicos Weg first lessons + Sprachportal live class „Erste Schritte Deutsch – Dari/Farsi“.",k:["nicos","kurs"]},
 3:{t:"Nicos Weg numbers and addresses. Practise phone numbers: Hören Teil 2 needs them 100% right.",k:["nicos"]},
 4:{t:"Schritte plus Neu Österreich A1 online exercises, Lektion 1–2.",k:["hueber"]},
 5:{t:"Nicos Weg family lesson + Schritte Österreich exercises.",k:["nicos","hueber"]},
 6:{t:"Nicos Weg jobs lesson.",k:["nicos"]},
 7:{t:"Sprachportal online A1 practice test (Lesen part). Different format, same skills.",k:["sptests"]},
 8:{t:"Nicos Weg „Lebensmittel“ + Sprachportal vocabulary trainer „Essen und Trinken A1“. Turn on the Austrian words deck in Review.",k:["nicos","kurs"]},
 9:{t:"Schritte Österreich shopping exercises.",k:["hueber"]},
 10:{t:"DW lessons on telling the time.",k:["nicos"]},
 11:{t:"Nicos Weg dates lesson. Austrian months: Jänner, Feber.",k:["nicos"]},
 12:{t:"Nicos Weg free-time lesson.",k:["nicos"]},
 13:{t:"Schritte Österreich home exercises.",k:["hueber"]},
 14:{t:"Goethe A1 Hören training (format differs, skill transfers). Grade one of your emails against the ÖSD Mustertexte.",k:["goethe","muster"]},
 15:{t:"Catch up and clear My mistakes in Review.",k:[]},
 16:{t:"Nicos Weg „Kein Problem!“ (taxi, hotel).",k:["nicos"]},
 17:{t:"DW body and doctor lesson.",k:["nicos"]},
 18:{t:"Sprachportal Austria-focused worksheets + Austrian words deck.",k:["sptests"]},
 19:{t:"DW travel lessons: station, hotel, announcements.",k:["nicos"]},
 20:{t:"Nicos Weg Perfekt lessons.",k:["nicos"]},
 21:{t:"Schritte Österreich forms unit. Aim for 10/10 on Schreiben Teil 1.",k:["hueber"]},
 22:{t:"MOCK 1: official ÖSD ZA1 Modellsatz. Download the ZIP, then run it in Exam → Mocks.",k:["osd"]},
 23:{t:"Lesen strategies: read the task first, find the keyword, one ad is always a distractor.",k:[]},
 24:{t:"Hören strategies: predict the answer before listening; numbers and spelled names.",k:["ythoeren","kurs"]},
 25:{t:"Write 5 messages of ~30 words and compare them with the Mustertexte.",k:["muster"]},
 26:{t:"Official oral video + 2 samples. Then 10-min prep → 10-min oral with the tutor, three times.",k:["oral","ytsprech","ytsprech2","sprechpdf"]},
 27:{t:"MOCK 2: official ÖSD ZA1/Österreich Modellsatz (different content).",k:["osd"]},
 28:{t:"Buffer day.",k:[]},
 29:{t:"MOCK 3: ÖSD Übungsmaterialien Band 1, Übungssatz 1. No book? Use Übungstest A in the app, or modellsatz.de.",k:["testsam","modell"]},
 30:{t:"Weak spots: work from My mistakes and your mock results.",k:[]},
 31:{t:"FINAL MOCK: Übungssatz 2, or the ÖSD Digital Test-Training, at the same time of day as your exam.",k:["testsam","digital"]},
 32:{t:"Redo only the items you got wrong.",k:[]},
 33:{t:"Cards only, plus listening to your Sprechen script.",k:[]},
 34:{t:"Pack passport/ID and a non-erasable pen; check the route to Divan.",k:[]}
};
function resCard(n){ const r=DAYRES[n]; if(!r) return "";
  return `<details class="acc" ${PLAN[n-1].k!=="lesson"?"open":""}><summary>Extra resources for Day ${n}</summary><div class="in stack"><p class="small">${esc(r.t)}</p>${r.k.map(k=>`<a class="reslink" href="${LINKS[k][1]}" target="_blank" rel="noopener">${esc(LINKS[k][0])}</a>`).join("")}</div></details>`; }

/* ---------- mock exams (ÖSD scoring) ---------- */
const MOCKS=[
 {id:"m1", day:22, short:"Mock 1", title:"Mock 1 · Official ÖSD ZA1 Modellsatz", kind:"paper", how:"Download the free ZA1 Modellsatz ZIP from osd.at (PDF + MP3). Do it on paper with the app's timers, then enter how many answers you got right.", links:["osd"]},
 {id:"m2", day:27, short:"Mock 2", title:"Mock 2 · Official ÖSD ZA1/Österreich Modellsatz", kind:"paper", how:"The second official set has different content. Same flow: paper + app timers + scoring.", links:["osd"]},
 {id:"m3", day:29, short:"Mock 3", title:"Mock 3 · ÖSD Übungsmaterialien Band 1, Übungssatz 1", kind:"paper", alt:true, how:"From the ÖSD practice book (audio on testsam.at). No book? Take Übungstest A in the app instead.", links:["testsam","modell"]},
 {id:"m4", day:31, short:"Final mock", title:"Final mock · Übungssatz 2 or ÖSD Digital Test-Training", kind:"paper", how:"Do it at the same time of day as your exam, without breaks except after Hören.", links:["testsam","digital"]},
 {id:"ta", day:null, short:"Übungstest A", title:"Übungstest A · interactive, in the app", kind:"app", file:"days/mock-a.json", how:"An original practice test written for this app in the exact ZA1 format, marked automatically."}
];
const PH_MIN={lesen:25,hoeren:12,schreiben:20,sprechen:10};
const P5=c=>Math.max(0,Math.min(5,c|0))*2;
const PLA2=c=>{ c=c|0; return c>=6?10:c===5?8:c===4?6:c===3?4:c===2?2:0; };
const PSA1=c=>{ c=c|0; return c>=10?5:c>=8?4:c>=6?3:c>=4?2:c>=2?1:0; };
function sa2Score(r, words){
  if(words<15) return {score:0, ded:["under 15 words: not graded"]};
  let base=(+r.k||0)+(+r.t||0)+(+r.l||0)+(+r.f||0); const ded=[];
  if(words<20){ base-=2; ded.push("15–19 words −2"); } else if(words<25){ base-=1; ded.push("20–24 words −1"); }
  const p=+r.points; if(p===0) return {score:0, ded:ded.concat(["no guiding point answered"])};
  if(p===1){ base-=2; ded.push("only one point answered −2"); } else if(p===2){ base-=1; ded.push("one point missing −1"); }
  return {score:Math.max(0,base), ded};
}
function computeResult(c){
  const L=P5(c.la1)+PLA2(c.la2)+P5(c.la3), H=P5(c.ha1)+P5(c.ha2)+P5(c.ha3);
  const sa1=PSA1(c.sa1), sa2=+c.sa2||0, Sch=sa2<4?0:sa1+sa2, W=L+H+Sch;
  const wPass=W>=38&&L>=6&&H>=6&&sa2>=4; const sp=c.sp==null?null:+c.sp;
  return {L,H,Sch,sa1,sa2,W,wPass,sp,oPass:sp!=null&&sp>=12,
    grade:W>=66?"sehr gut":W>=56?"gut":W>=38?"bestanden":"nicht bestanden",
    oGrade:sp==null?"":sp>=22?"sehr gut":sp>=19?"gut":sp>=12?"bestanden":"nicht bestanden"};
}
function noteOk(f,v){ v=v||""; const acc=(f.accept&&f.accept.length?f.accept:[f.answer]); if(f.digits){ const d=v.replace(/\D/g,""); return d!==""&&acc.concat([f.answer]).some(x=>String(x).replace(/\D/g,"")===d); } return f.exact? acc.some(x=>normKeepUml(x)===normKeepUml(v)) : acc.some(x=>norm(x)===norm(v)); }
function formOk(f,v){ if(f.type==="multi") return JSON.stringify((v||[]).slice().sort())===JSON.stringify((f.answer||[]).slice().sort()); if(f.type==="choice") return v===f.answer; const acc=f.accept&&f.accept.length?f.accept:[f.answer]; return acc.some(x=>norm(x)===norm(v)); }
function countApp(id, D){ const a=S.ans, c={}; const L=D.lesen, H=D.hoeren;
  c.la1=L.teil1.situations.filter(s=>String(a[id+":l1:"+s.id])===String(L.teil1.answers[s.id])).length;
  c.la2=0; L.teil2.forEach((t,ti)=>t.items.forEach((it,ii)=>{ if(a[id+":l2:"+ti+":"+ii]===it.answer) c.la2++; }));
  c.la3=L.teil3.texts.filter(t=>a[id+":l3:"+t.n]===L.teil3.answers[t.n]).length;
  c.ha1=H.teil1.texts.filter(t=>a[id+":h1:"+t.n]===t.answer).length;
  c.ha2=H.teil2.note_fields.filter((f,i)=>noteOk(f,a[id+":h2:"+i])).length;
  c.ha3=H.teil3.people.filter((p,i)=>a[id+":h3:"+i]===p.answer).length;
  c.sa1=D.schreiben.teil1.fields.filter(f=>formOk(f,a[id+":s1:"+f.id])).length;
  return c; }
function answeredApp(id, D){ const a=S.ans, out={};
  out.lesen=[D.lesen.teil1.situations.filter(s=>a[id+":l1:"+s.id]).length+"/5", D.lesen.teil2.reduce((n,t,ti)=>n+t.items.filter((x,ii)=>a[id+":l2:"+ti+":"+ii]).length,0)+"/6", D.lesen.teil3.texts.filter(t=>a[id+":l3:"+t.n]).length+"/5"];
  out.hoeren=[D.hoeren.teil1.texts.filter(t=>a[id+":h1:"+t.n]).length+"/5", D.hoeren.teil2.note_fields.filter((f,i)=>(a[id+":h2:"+i]||"").trim()).length+"/5", D.hoeren.teil3.people.filter((p,i)=>a[id+":h3:"+i]).length+"/5"];
  out.schreiben=[D.schreiben.teil1.fields.filter(f=>{ const v=a[id+":s1:"+f.id]; return Array.isArray(v)?v.length:v; }).length+"/10", wordCount(S.st.drafts[id+":email"])+" words"];
  return out; }

async function openMock(id){ const m=MOCKS.find(x=>x.id===id); if(!m) return;
  if(m.kind==="app"&&!S.mockData[id]){ try{ const r=await fetch(m.file); S.mockData[id]=await r.json(); }catch(e){ toast("Couldn't load the test. Check your connection."); return; } }
  const pre=id+":"; [S.ans,S.checked,S.plays].forEach(o=>Object.keys(o).forEach(k=>{ if(k.startsWith(pre)) delete o[k]; }));
  if(m.kind==="app") delete S.st.drafts[id+":email"];
  S.mock={id, phase:"intro", flags:{}, counts:{la1:0,la2:0,la3:0,ha1:0,ha2:0,ha3:0,sa1:0}, rub:{k:1,t:1,l:2,f:2,points:3,len:30}, sp:{a1:2,a2:2,a3:2,lex:3,aus:2,form:2}, spOverride:null, sa2:null, photo:0, endAt:0, startedAt:Date.now()};
  S.testPrefix = m.kind==="app" ? pre : "";
  S.view="exam"; render(); window.scrollTo(0,0); }
const ORDER={app:["intro","lesen","hoeren","schreiben","sheet","sprechen","result"], paper:["intro","lesen","hoeren","schreiben","enter","sprechen","result"]};
function mockGo(phase, keepTime){ const M=S.mock; M.phase=phase; if(!keepTime) M.endAt = PH_MIN[phase]? Date.now()+PH_MIN[phase]*60000 : 0;
  if(phase==="result") saveMockResult(); render(); window.scrollTo(0,0); }
function mockNext(){ const M=S.mock, m=MOCKS.find(x=>x.id===M.id), o=ORDER[m.kind]; const i=o.indexOf(M.phase); if(i<o.length-1) mockGo(o[i+1]); }
function tickMock(){ clearInterval(tickMock._i); if(!S.mock||!S.mock.endAt) return;
  tickMock._i=setInterval(()=>{ const M=S.mock; const el=$("#mockTimer"); if(!M||!M.endAt){ clearInterval(tickMock._i); return; }
    const left=M.endAt-Date.now(); if(el) el.textContent=fmtMs(Math.max(0,left));
    if(left<=0){ clearInterval(tickMock._i); M.endAt=0; toast("Time is up for this part"); if(["lesen","hoeren","schreiben"].includes(M.phase)) mockNext(); else render(); } }, 500); }
function mockSa2(){ const M=S.mock; if(M.sa2!=null) return {score:M.sa2, ded:(M.sa2Detail&&M.sa2Detail.deductions)||[]}; const txt=S.st.drafts[M.id+":email"]||""; const words=txt.trim()?wordCount(txt):+M.rub.len; return sa2Score(M.rub, words); }
function mockSp(){ const M=S.mock; if(M.spOverride!=null) return M.spOverride; const s=M.sp; return (+s.a1)+(+s.a2)+(+s.a3)+(+s.lex)+(+s.aus)+(+s.form); }
function saveMockResult(){ const M=S.mock; const c=Object.assign({}, M.counts, {sa2:mockSa2().score, sp:mockSp()}); const r=computeResult(c);
  S.st.mocks[M.id]=Object.assign({at:Date.now(), counts:c}, r); save(); }
async function submitApp(){ const M=S.mock, D=S.mockData[M.id];
  ["l1","l2","l3","h1","h2","h3","s1"].forEach(g=>S.checked[M.id+":"+g]=true);
  M.counts=countApp(M.id, D); const txt=(S.st.drafts[M.id+":email"]||"").trim();
  mockGo("sprechen");
  if(S.ai&&S.uid&&txt.length>10){ M.grading=true; render();
    try{ const T=D.schreiben.teil2; const r=await api("/api/ai",{mode:"grade",payload:{from:T.email_from,email:T.email_de,task:T.task_de,points:T.points_de,wordTarget:30,text:txt,day:currentDay()}}); M.sa2=Math.max(0,Math.min(10,Number(r.result.score)||0)); M.sa2Detail=r.result; }
    catch(e){ toast("Writing grade failed: "+e.message+". Rate it yourself below."); }
    M.grading=false; render(); } }
async function gradePaperEmail(){ const M=S.mock; const txt=(S.st.drafts[M.id+":email"]||"").trim(); const task=(M.task||"").trim();
  if(txt.length<10){ toast("Type your email first"); return; }
  M.grading=true; render();
  try{ const r=await api("/api/ai",{mode:"grade",payload:{from:"the writer of the prompt email",email:task||"(task text not provided; judge whether 3 guiding points seem answered)",task:"Antworten Sie. Schreiben Sie circa 30 Wörter. Schreiben Sie zu allen drei Punkten.",points:[],wordTarget:30,text:txt,day:currentDay()}}); M.sa2=Math.max(0,Math.min(10,Number(r.result.score)||0)); M.sa2Detail=r.result; }
  catch(e){ toast("Grading failed: "+e.message); }
  M.grading=false; render(); }
function phaseBar(M, m){ const labels={intro:"Start",lesen:"Lesen",hoeren:"Hören",schreiben:"Schreiben",sheet:"Check",enter:"Enter score",sprechen:"Sprechen",result:"Results"}; const o=ORDER[m.kind]; const cur=o.indexOf(M.phase);
  return `<div class="phases">${o.map((p,i)=>`<span class="ph ${i<cur?"done":i===cur?"cur":""}">${labels[p]}</span>`).join("")}</div>`; }
function selN(attrName, key, val, max, min=0){ let o=""; for(let i=min;i<=max;i++) o+=`<option ${+val===i?"selected":""}>${i}</option>`; return `<select ${attrName}="${key}" style="width:auto">${o}</select>`; }
function a2Panel(M, withText){ const txt=S.st.drafts[M.id+":email"]||""; const has=txt.trim().length>0; const res=mockSa2();
  return `<section class="card stack"><div class="label">Schreiben Aufgabe 2 · score</div>
    ${M.sa2!=null?`<p>Gemini graded your email: <b class="tnum">${M.sa2}/10</b>.</p>${M.sa2Detail?gradeView(M.sa2Detail):""}<div><button class="btn sm" data-act="mock-a2-self">Rate it myself instead</button></div>`:`
    ${withText?`<div class="field"><label for="mtask">Paste the task (the email you answered), optional</label><textarea id="mtask" data-mtask="1" style="min-height:70px">${esc(M.task||"")}</textarea></div>
    <div class="field"><label for="memail">Your answer (type what you wrote on paper)</label><textarea id="memail" data-draft="${M.id}:email" style="min-height:110px" spellcheck="false">${esc(txt)}</textarea></div><div id="wcheck">${writeCheckHtml(txt)}</div>
    ${S.ai&&S.uid?`<div><button class="btn primary" data-act="mock-grade" ${M.grading?"disabled":""}>${M.grading?"Grading…":"Grade with Gemini"}</button></div>`:""}`:""}
    <p class="small muted">${ex("Or rate it yourself with the official ÖSD criteria:","یا خودت با معیارهای رسمی ÖSD نمره بده:")}</p>
    <div class="grid2">
      <div class="field"><span class="lb">Task & register (0–1)</span>${selN("data-rub","k",M.rub.k,1)}</div>
      <div class="field"><span class="lb">Text structure: greeting, order, sign-off (0–1)</span>${selN("data-rub","t",M.rub.t,1)}</div>
      <div class="field"><span class="lb">Vocabulary (0–4)</span>${selN("data-rub","l",M.rub.l,4)}</div>
      <div class="field"><span class="lb">Grammar & spelling (0–4)</span>${selN("data-rub","f",M.rub.f,4)}</div>
      <div class="field"><span class="lb">Guiding points answered (0–3)</span>${selN("data-rub","points",M.rub.points,3)}</div>
      ${has?"":`<div class="field"><span class="lb">Length</span><select data-rub="len" style="width:auto">${[[30,"25+ words"],[22,"20–24 words"],[17,"15–19 words"],[10,"under 15 words"]].map(([v,l])=>`<option value="${v}" ${+M.rub.len===v?"selected":""}>${l}</option>`).join("")}</select></div>`}
    </div>
    <p><b class="tnum">${res.score}/10</b>${res.ded.length?` <span class="small muted">(${esc(res.ded.join("; "))})</span>`:""} ${res.score<4?`<span class="chip bad">below 4 → whole Schreiben = 0</span>`:`<span class="chip ok">minimum reached</span>`}</p>`}
  </section>`; }
function barRow(label, val, max, min, extra){ const pct=Math.round(val/max*100), mp=min!=null?Math.round(min/max*100):null; const ok=min==null||val>=min;
  return `<div class="bar-row"><div class="row between small"><b>${esc(label)}</b><span class="tnum">${val} / ${max}${min!=null?` · min ${min}`:""} ${extra||""}</span></div>
    <div class="bar"><i class="${ok?"ok":"bad"}" style="width:${pct}%"></i>${mp!=null?`<span class="minline" style="left:${mp}%" title="minimum"></span>`:""}</div></div>`; }
function resultBlock(r){ return `<div class="stack">
  ${barRow("Lesen", r.L, 30, 6)}${barRow("Hören", r.H, 30, 6)}${barRow("Schreiben", r.Sch, 15, null, r.sa2<4?`<span class="chip bad">Aufgabe 2 below 4</span>`:"")}
  ${barRow("Written total", r.W, 75, 38, r.wPass?`<span class="chip ok">PASS · ${esc(r.grade)}</span>`:`<span class="chip bad">NOT YET</span>`)}
  ${r.sp!=null?barRow("Sprechen", r.sp, 25, 12, r.oPass?`<span class="chip ok">PASS · ${esc(r.oGrade)}</span>`:`<span class="chip bad">NOT YET</span>`):""}</div>`; }
function resultMini(r){ return `<div class="row small"><span class="chip ${r.wPass?"ok":"bad"} tnum">Written ${r.W}/75</span>${r.sp!=null?`<span class="chip ${r.oPass?"ok":"bad"} tnum">Oral ${r.sp}/25</span>`:""}<span class="muted">${new Date(r.at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span></div>`; }
function weakAdvice(r){ const tips=[];
  if(r.sa2<4) tips.push(["Schreiben Aufgabe 2 is below 4, which zeroes your whole Schreiben score. Write at least 25 words and give each guiding point its own sentence.","نوشتن بخش ۲ زیر ۴ است و کل نمره نوشتن صفر می‌شود. حداقل ۲۵ کلمه و برای هر سؤال یک جمله."]);
  if(r.L<15) tips.push(["Lesen is weak: do Day 23 strategies (task first, keyword, one distractor).","خواندن ضعیف است: استراتژی‌های روز ۲۳ را تمرین کن."]);
  if(r.H<15) tips.push(["Hören is weak: drill numbers, spelled names and the Day 24 strategies.","شنیدن ضعیف است: اعداد، اسم‌های هجی‌شده و استراتژی‌های روز ۲۴."]);
  if(r.sp!=null&&r.sp<15) tips.push(["Sprechen: run the tutor in Exam simulation daily until you reach 15+.","صحبت: هر روز با مربی در حالت آزمون تمرین کن تا به ۱۵+ برسی."]);
  if(!tips.length) tips.push(["Solid result. Keep the routine and protect your weakest part.","نتیجه خوب. روال را ادامه بده و روی ضعیف‌ترین بخش کار کن."]);
  return tips.map(([en,fa])=>`<div class="sunk">${ex(en,fa)}</div>`).join(""); }

async function vMock(){
  const M=S.mock, m=MOCKS.find(x=>x.id===M.id), D=S.mockData[M.id];
  const timer = M.endAt ? `<span class="timer tnum" id="mockTimer">${fmtMs(Math.max(0,M.endAt-Date.now()))}</span>` : "";
  const head = `<div class="mockbar"><div class="row between"><div style="min-width:0"><div class="label">${esc(m.short)}</div><b>${esc(m.title)}</b></div><div class="row">${timer}<button class="btn sm" data-act="mock-exit">Exit</button></div></div>${phaseBar(M,m)}</div>`;
  const flagRow=(sec,n)=>`<div class="row">${Array.from({length:n},(_,i)=>{ const k=sec+(i+1); return `<button class="opt ${M.flags[k]?"sel":""}" data-act="mock-flag" data-f="${k}">${ICONS.flag.replace('<svg','<svg width="14" height="14"')} Teil ${i+1}${M.flags[k]?" flagged":""}</button>`; }).join("")}</div>`;
  let body="";
  if(M.phase==="intro"){
    body=`<section class="card stack"><h2>Exam conditions</h2>
      <div class="grid2"><div class="sunk"><b>Lesen</b> · 25 min · 30 pts · min 6</div><div class="sunk"><b>Hören</b> · ≈10 min · 30 pts · min 6 · audio once (Teil 2 twice)</div><div class="sunk"><b>Schreiben</b> · 20 min · 15 pts · Aufgabe 2 min 4</div><div class="sunk"><b>Sprechen</b> · 10 min prep + ≈10 min · 25 pts · min 12</div></div>
      <p class="small">${ex("Pass the written module with 38/75 and every minimum. No dictionary. Don't leave answers blank: wrong answers cost nothing.","قبولی کتبی: ۳۸ از ۷۵ و رسیدن به حداقل هر بخش. دیکشنری ممنوع. هیچ جوابی را خالی نگذار.")}</p>
      ${m.kind==="paper"?`<div class="banner info"><div>${esc(m.how)}<br>${ex("Write your answers on paper. After Schreiben you check with the answer key and enter how many you got right; the app converts them into official points.","جواب‌ها را روی کاغذ بنویس. بعد از نوشتن با کلید جواب چک کن و تعداد درست‌ها را وارد کن؛ اپ آن‌ها را به امتیاز رسمی تبدیل می‌کند.")}</div></div>
        <div class="stack">${(m.links||[]).map(k=>`<a class="reslink" href="${LINKS[k][1]}" target="_blank" rel="noopener">${esc(LINKS[k][0])}</a>`).join("")}</div>`
      :`<div class="banner info"><div>${esc(m.how)} ${ex("In test mode you get no feedback until you submit, exactly like the exam.","در حالت آزمون تا پایان هیچ بازخوردی نمی‌گیری، مثل آزمون واقعی.")}</div></div>`}
      <div><button class="btn primary" data-act="mock-next">Start Lesen (25:00)</button></div></section>`;
  } else if(M.phase==="lesen"){
    body = m.kind==="app" ? stLesen(M.id, D)+`<section class="card stack"><div class="label">Flag for review</div>${flagRow("L",3)}<div><button class="btn primary" data-act="mock-next">Next: Hören</button></div></section>`
      : `<section class="card stack center-card"><h2>Lesen · 25 minutes</h2><p>${ex("Work through Lesen Aufgabe 1–3 in the PDF. Write answers on paper.","خواندن بخش ۱ تا ۳ را در PDF انجام بده و جواب‌ها را روی کاغذ بنویس.")}</p><div><button class="btn primary" data-act="mock-next">Done · go to Hören</button></div></section>`;
  } else if(M.phase==="hoeren"){
    body = m.kind==="app" ? stHoeren(M.id, D)+`<section class="card stack"><div class="label">Flag for review</div>${flagRow("H",3)}<div><button class="btn primary" data-act="mock-next">Next: Schreiben</button></div></section>`
      : `<section class="card stack center-card"><h2>Hören · about 10 minutes</h2><p>${ex("Play the Modellsatz MP3 files in order without pausing. Teil 1 and 3 once, Teil 2 twice. 30 seconds to look at the tasks before each part.","فایل‌های صوتی را به ترتیب و بدون توقف پخش کن. بخش ۱ و ۳ یک بار، بخش ۲ دو بار.")}</p><div><button class="btn primary" data-act="mock-next">Done · go to Schreiben</button></div></section>`;
  } else if(M.phase==="schreiben"){
    body = m.kind==="app" ? stSchreiben(M.id, D)+`<section class="card stack"><div><button class="btn primary" data-act="mock-next">Review my answers</button></div></section>`
      : `<section class="card stack center-card"><h2>Schreiben · 20 minutes</h2><p>${ex("Aufgabe 1 (form) on paper. For Aufgabe 2 you can write on paper or type here so Gemini can grade it.","بخش ۱ (فرم) روی کاغذ. بخش ۲ را روی کاغذ بنویس یا اینجا تایپ کن تا Gemini نمره بدهد.")}</p>
        <textarea data-draft="${M.id}:email" placeholder="Liebe …," style="min-height:150px" spellcheck="false">${esc(S.st.drafts[M.id+":email"]||"")}</textarea><div id="wcheck">${writeCheckHtml(S.st.drafts[M.id+":email"]||"")}</div>
        <div><button class="btn primary" data-act="mock-next">Done · enter my results</button></div></section>`;
  } else if(M.phase==="sheet"){
    const an=answeredApp(M.id, D);
    const row=(name,arr,sec,ph)=>`<tr><td><b>${name}</b></td>${arr.map((x,i)=>`<td>${x}${M.flags[sec+(i+1)]?` <span class="chip warn">flagged</span>`:""}</td>`).join("")}<td><button class="btn sm" data-act="mock-goto" data-ph="${ph}">Open</button></td></tr>`;
    body=`<section class="card stack"><h2>Answer sheet</h2><p class="small">${ex("Check for blanks and flagged parts. A blank answer is always 0; a guess might be right.","جاهای خالی و بخش‌های علامت‌خورده را چک کن. جواب خالی همیشه صفر است.")}</p>
      <div class="tablewrap"><table class="gram"><tr><td></td><td>Teil 1</td><td>Teil 2</td><td>Teil 3</td><td></td></tr>${row("Lesen",an.lesen,"L","lesen")}${row("Hören",an.hoeren,"H","hoeren")}${row("Schreiben",an.schreiben.concat([""]),"S","schreiben")}</table></div>
      <div><button class="btn primary" data-act="mock-submit">Submit written exam</button></div></section>`;
  } else if(M.phase==="enter"){
    const f=(k,label,max)=>`<div class="field"><span class="lb">${label}</span>${selN("data-count",k,M.counts[k],max)}</div>`;
    body=`<section class="card stack"><h2>Enter your results</h2><p class="small">${ex("Check your paper answers with the answer key in the Modellsatz and enter how many were correct.","جواب‌هایت را با کلید جواب Modellsatz چک کن و تعداد درست‌ها را وارد کن.")}</p>
      <div class="label">Lesen</div><div class="grid3">${f("la1","Aufgabe 1 (of 5)",5)}${f("la2","Aufgabe 2 (of 6)",6)}${f("la3","Aufgabe 3 (of 5)",5)}</div>
      <div class="label">Hören</div><div class="grid3">${f("ha1","Aufgabe 1 (of 5)",5)}${f("ha2","Aufgabe 2 (of 5)",5)}${f("ha3","Aufgabe 3 (of 5)",5)}</div>
      <div class="label">Schreiben Aufgabe 1</div><div class="grid3">${f("sa1","Correct form entries (of 10)",10)}</div></section>
      ${a2Panel(M, true)}
      <div><button class="btn primary" data-act="mock-next">Next: Sprechen</button></div>`;
  } else if(M.phase==="sprechen"){
    const photos = D&&D.sprechen&&D.sprechen.teil2 ? D.sprechen.teil2.photos : null;
    const recent = Object.values(S.st.live||{}).flat().filter(x=>x.mode==="exam"&&x.at>M.startedAt&&x.score_25!=null).sort((a,b)=>b.at-a.at)[0];
    const s=M.sp;
    body=`${m.kind==="app"&&M.sa2==null&&!M.grading?a2Panel(M,false):M.grading?`<div class="banner info">Gemini is grading your email…</div>`:""}
      <section class="card stack"><div class="row between"><h2>Sprechen · 10 minutes preparation</h2>${M.endAt?"":`<button class="btn sm" data-act="mock-prep">Start prep timer</button>`}</div>
      <p class="small">${ex("Prepare keywords (not full sentences). You may use your notes during the exam.","کلیدواژه آماده کن، نه جمله کامل. در آزمون می‌توانی از یادداشت‌ها استفاده کنی.")}</p>
      <div><b>Aufgabe 1</b> · pick 4: ${["Sprachen","Hobbys","Sport","Familie","Beruf","Lieblingsessen"].map(t=>`<span class="chip">${t}</span>`).join(" ")}</div>
      <div><b>Aufgabe 2</b> · ${photos?ex("choose one photo:","یک عکس انتخاب کن:"):ex("choose one of the three photos in your Modellsatz.","یکی از سه عکس Modellsatz را انتخاب کن.")} Was sehen Sie? · Wie viele Personen? · Wo? · Was machen sie?</div>
      ${photos?`<div class="grid3">${photos.map((p,i)=>`<button class="photo ${M.photo===i?"sel":""}" data-act="mock-photo" data-i="${i}"><span class="e">${esc(p.emoji)}</span><span class="small">${esc(p.scene_en)}</span></button>`).join("")}</div>
        <div class="sunk small"><b>Aufgabe 3 (role-play):</b> ${esc(photos[M.photo].roleplay_en)}<br>Examiner starts: <i>${esc(photos[M.photo].starter_de)}</i></div>`:""}
      <div class="row"><button class="btn primary" data-act="mock-tutor">${ICONS.mic}Do the oral exam with the tutor</button></div>
      ${recent?`<div class="banner info"><div>Tutor exam score: <b>${recent.score_25}/25</b>. <button class="btn sm" data-act="mock-use-tutor" data-v="${recent.score_25}">Use this score</button></div></div>`:""}
      <div class="label">Or rate yourself (official bands)</div>
      <div class="grid3">
        <div class="field"><span class="lb">Aufgabe 1 (0–4)</span>${selN("data-spr","a1",s.a1,4)}</div><div class="field"><span class="lb">Aufgabe 2 (0–4)</span>${selN("data-spr","a2",s.a2,4)}</div><div class="field"><span class="lb">Aufgabe 3 (0–4)</span>${selN("data-spr","a3",s.a3,4)}</div>
        <div class="field"><span class="lb">Vocabulary (0–5)</span>${selN("data-spr","lex",s.lex,5)}</div><div class="field"><span class="lb">Pronunciation & fluency (0–4)</span>${selN("data-spr","aus",s.aus,4)}</div><div class="field"><span class="lb">Grammar (0–4)</span>${selN("data-spr","form",s.form,4)}</div></div>
      <p><b class="tnum">Sprechen: ${mockSp()}/25</b>${M.spOverride!=null?` <span class="chip acc">from tutor</span> <button class="btn sm ghost" data-act="mock-use-tutor" data-v="">use my rating</button>`:""}</p>
      <div><button class="btn primary" data-act="mock-result" ${M.grading?"disabled":""}>See results</button></div></section>`;
  } else if(M.phase==="result"){
    const r=S.st.mocks[M.id];
    body=`<section class="card stack"><h2>Results</h2>${resultBlock(r)}</section>
      <section class="card stack"><h3>What to do next</h3>${weakAdvice(r)}</section>
      ${m.kind==="app"?`<details class="acc"><summary>Show corrected answers</summary><div class="in stack">${stLesen(M.id,D)}${stHoeren(M.id,D)}${stSchreiben(M.id,D)}</div></details>`:""}
      <div class="row"><button class="btn primary" data-act="mock-exit">Done</button><button class="btn" data-act="mock-open" data-id="${M.id}">Take it again</button></div>`;
  }
  return head + body;
}

/* ---------- Exam centre ---------- */
function mockList(){ return `<section class="stack"><div class="row between"><h2>Mock exams</h2><span class="small muted">scored like the real ÖSD</span></div>
  ${MOCKS.map(m=>{ const r=S.st.mocks[m.id]; return `<div class="card stack"><div class="row between"><div style="min-width:0"><div class="label">${m.day?`Day ${m.day} · ${dateOf(m.day).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}`:"Any time"}</div><b>${esc(m.title)}</b></div><button class="btn ${r?"":"primary"} sm" data-act="mock-open" data-id="${m.id}">${r?"Retake":"Start"}</button></div><p class="small muted">${esc(m.how)}</p>${r?resultMini(r):""}</div>`; }).join("")}</section>`; }
function prepChecklist(){ const items=[
  ["Download both official Modellsatz ZIPs (ZA1 and ZA1/Österreich) from osd.at/downloads","هر دو فایل ZIP نمونه آزمون رسمی را از osd.at دانلود کن","osd"],
  ["Download the Mustertexte ZA1 and the exam rules (Durchführungsbestimmungen)","نمونه نوشته‌ها و قوانین آزمون را دانلود کن","muster"],
  ["Check osd.at for the new 2026 Modellsatz brochure and note any changes","بروشور جدید ۲۰۲۶ را در osd.at بررسی کن","osdpage"],
  ["Ask Divan: is 14 November on paper or digital? Is the oral exam the same day?","از مؤسسه دیوان بپرس: آزمون کاغذی است یا دیجیتال؟ شفاهی همان روز است؟",""],
  ["Ask Divan if they sell or lend ÖSD Übungsmaterialien Band 1 (for Mock 3 and 4)","از دیوان بپرس کتاب Übungsmaterialien Band 1 را می‌فروشند یا امانت می‌دهند",""],
  ["Watch the official ÖSD oral exam video once","ویدیوی رسمی آزمون شفاهی را یک بار ببین","oral"]];
  return `<details class="acc" open><summary>Before you start · checklist</summary><div class="in stack">${items.map(([en,fa,k],i)=>`<label class="row" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-chk="prep:${i}" ${S.st.done["prep:"+i]?"checked":""} style="margin-top:6px"><span>${ex(en,fa)}${k?` <a href="${LINKS[k][1]}" target="_blank" rel="noopener" class="small">open</a>`:""}</span></label>`).join("")}</div></details>`; }
function scoringCard(){ return `<details class="acc"><summary>How ÖSD scores you</summary><div class="in stack">
  <div class="sunk small"><b>Lesen & Hören:</b> each task is worth 10 points. With 5 items: 5/4/3/2/1/0 correct = 10/8/6/4/2/0. Lesen Aufgabe 2 (6 items): 6/5/4/3/2/≤1 = 10/8/6/4/2/0.</div>
  <div class="sunk small"><b>Hören Aufgabe 2:</b> spelling is not marked, but spelled names and phone numbers must be fully correct.</div>
  <div class="sunk small"><b>Schreiben Aufgabe 1:</b> 10 entries → 10 = 5 pts, 9–8 = 4, 7–6 = 3, 5–4 = 2, 3–2 = 1. Names must be spelled correctly.</div>
  <div class="sunk small"><b>Schreiben Aufgabe 2 (10 pts, minimum 4):</b> task & register 1 + structure 1 + vocabulary 4 + accuracy 4, minus deductions: 20–24 words −1, 15–19 words −2, under 15 = not graded; one point missing −1, only one point answered −2. <b>Below 4 → the whole Schreiben score becomes 0.</b></div>
  <div class="sunk small"><b>Sprechen (25, minimum 12):</b> Aufgabe 1, 2, 3 (0–4 each) + vocabulary 5 + pronunciation/fluency 4 + grammar 4.</div>
  <div class="sunk small"><b>Grades:</b> written 75–66 sehr gut · 65–56 gut · 55–38 bestanden. Oral 25–22 · 21–19 · 18–12. You can take the written and oral modules separately and retake each.</div></div></details>`; }
function resourcesCard(){ return `<details class="acc"><summary>All official and free resources</summary><div class="in stack">${Object.values(LINKS).map(([t,u])=>`<a class="reslink" href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join("")}
  <p class="small muted">${ex("Official ÖSD files are for your personal study. YouTube may need a VPN in Iran.","فایل‌های رسمی ÖSD فقط برای مطالعه شخصی‌اند. یوتیوب در ایران ممکن است فیلتر باشد.")}</p></div></details>`; }
function vExam(){ return `<div><h1>Exam centre</h1><p class="muted">ÖSD Zertifikat A1 · Saturday 14 November 2026 · Divan Institute, Tehran</p></div>
  ${mockList()}${prepChecklist()}${scoringCard()}${resourcesCard()}${examFacts()}`; }

/* ---------- Review ---------- */
async function vReview(){
  if(S.fc) return await flashcardsView();
  if(S.mix) return `<div class="row between"><div><div class="label">Review</div><h1>Mixed review</h1></div><button class="btn sm" data-act="mix-end">Done</button></div>
    <p class="small muted">${ex("Questions from all your days, mixed. Mixing topics makes you choose the right rule, like in the exam.","سؤال‌ها از همه روزها، مخلوط. مخلوط کردن موضوع‌ها تو را مجبور می‌کند قانون درست را انتخاب کنی، مثل آزمون.")}</p>${stExercises("R", S.mix, "mix")}`;
  const deck = S.austria ? `<div class="card stack"><div class="row between"><h2>Austrian words</h2><button class="btn sm ${S.st.decks.austria?"":"primary"}" data-act="deck-austria">${S.st.decks.austria?"Remove from my cards":"Add to my cards"}</button></div><p class="small">${esc(S.austria.note_en)} ${S.austria.cards.length} words: ${S.austria.cards.slice(0,6).map(c=>esc(c.de)).join(", ")} …</p></div>` : "";
  const mix = `<div class="card stack"><h2>Mixed review</h2><p class="small">${ex("15 random questions from every day you've studied. Best on Sundays and review days.","۱۵ سؤال تصادفی از همه روزهایی که خوانده‌ای. بهترین زمان: روزهای مرور.")}</p><div><button class="btn primary" data-act="mix-start">Start mixed review</button></div></div>`;
  return (await flashcardsView()) .replace('<div class="card stack"><div class="row between"><h2>My mistakes</h2>', mix + deck + '<div class="card stack"><div class="row between"><h2>My mistakes</h2>');
}
async function startMix(){ const items=[]; for(let n=1;n<=currentDay();n++){ if(!hasDay(n)) continue; const d=await getDay(n); if(!d) continue;
    (d.exercises||[]).forEach(e=>items.push(Object.assign({},e)));
    (d.review_quiz||[]).forEach(q=>items.push({type:"mcq",prompt:q.q,options:q.options,answer:q.answer,explain_en:q.explain_en})); }
  if(!items.length){ toast("Study at least one day first"); return; }
  Object.keys(S.ex).forEach(k=>{ if(k.startsWith("R:mix:")) delete S.ex[k]; }); Object.keys(S.wo).forEach(k=>{ if(k.startsWith("R:mix:")) delete S.wo[k]; });
  S.mix=shuffled(items, "mix"+Date.now()).slice(0,15); render(); window.scrollTo(0,0); }

/* ---------- Progress ---------- */
function studyDates(){ const set=new Set(); Object.entries(S.st.done).forEach(([k,v])=>{ if(typeof v==="number" && !k.startsWith("prep:")){ const d=new Date(v); set.add(d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()); } }); return set; }
function streak(){ const set=studyDates(); let s=0; const t=todayMid(); let i=set.has(t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate())?0:1; let miss=0;
  for(;i<60;i++){ const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); if(set.has(d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate())) s++; else { miss++; if(miss>1) break; } } return s; }
async function vProgress(){
  const cur=currentDay(); for(let n=1;n<=cur;n++) if(hasDay(n)) await getDay(n);
  let daysDone=0, mins=0, stepsDone=0;
  for(let n=1;n<=PLAN.length;n++){ const d=S.days[n]; if(!d) continue; const pr=dayProgress(n,d); mins+=pr.min; stepsDone+=pr.done; if(pr.total&&pr.done===pr.total) daysDone++; }
  const skill={Lesen:[0,0],"Hören":[0,0],"Grammar & words":[0,0]};
  Object.entries(S.st.results).forEach(([k,r])=>{ const t=k.split(":").pop(); const b=t.startsWith("lesen")?"Lesen":t.startsWith("hoeren")?"Hören":"Grammar & words"; skill[b][0]+=r.score; skill[b][1]+=r.total; });
  const grades=Object.values(S.st.grades||{}).map(g=>g.score).filter(x=>x!=null);
  const sessions=Object.values(S.st.live||{}).flat(); const sc=sessions.filter(x=>x.score_25!=null).map(x=>+x.score_25);
  const mocks=Object.entries(S.st.mocks||{}).sort((a,b)=>b[1].at-a[1].at); const last=mocks[0];
  const c=srsCounts(); const pct=Math.round(Math.min(cur,PLAN.length)/PLAN.length*100);
  const tile=(v,l)=>`<div class="tile"><b class="tnum">${v}</b><span>${l}</span></div>`;
  return `<div><h1>Fortschritt</h1><p class="muted">Day ${cur} of ${PLAN.length} · ${daysLeft()} days to the exam</p></div>
  <div class="card stack"><div class="meter"><i style="width:${pct}%"></i></div>
    <div class="tiles">${tile(streak(),"day streak")}${tile(daysDone,"days complete")}${tile(Math.round(mins/60*10)/10+" h","studied")}${tile(c.learned+c.due,"cards in memory")}${tile((S.st.mistakes||[]).length,"mistakes logged")}${tile(sessions.length,"tutor sessions")}</div></div>
  <section class="card stack"><h2>Latest mock</h2>${last?`<div class="small muted">${esc((MOCKS.find(m=>m.id===last[0])||{}).title||last[0])}</div>${resultBlock(last[1])}`:`<p class="small muted">${ex("No mock yet. Try Übungstest A in the Exam tab any time; the official mocks are on Days 22, 27, 29 and 31.","هنوز آزمون آزمایشی نداده‌ای. Übungstest A را هر وقت خواستی در تب Exam امتحان کن.")}</p><div><button class="btn sm" data-act="mock-open" data-id="ta">Start Übungstest A</button></div>`}</section>
  <section class="card stack"><h2>Accuracy by skill</h2>
    ${Object.entries(skill).map(([k,[a,t]])=>t?barRow(k, Math.round(a/t*100), 100, 60, "%"):`<div class="small muted">${k}: no data yet</div>`).join("")}
    ${grades.length?barRow("Schreiben (avg. email score)", Math.round(grades.reduce((x,y)=>x+y,0)/grades.length*10)/10, 10, 4):""}
    ${sc.length?barRow("Sprechen (avg. tutor score)", Math.round(sc.reduce((x,y)=>x+y,0)/sc.length), 25, 12):""}
    <p class="small muted">Red line = the level you need. Green bars are at or above it.</p></section>
  <section class="card stack"><h2>Days</h2><div class="dots">${PLAN.map((p,i)=>{ const n=i+1, d=S.days[n], pr=d?dayProgress(n,d):null; const cls=pr&&pr.total&&pr.done===pr.total?"ok":pr&&pr.done?"part":n<cur?"miss":n===cur?"cur":""; return `<button class="dot ${cls}" data-act="day" data-v="${n}" title="Day ${n}: ${attr(p.t)}">${n}</button>`; }).join("")}</div>
    <p class="small muted">Green = all steps done · half = started · outlined = today</p></section>`;
}

/* ---------- record & compare ---------- */
function recBtns(k, text){ const has=S.rec[k]; const active=S.recActive&&S.recActive.k===k; const i=SAY_BANK.push({text})-1;
  return `<button class="say ${active?"recording":""}" data-act="rec" data-k="${k}" title="${active?"Stop recording":"Record yourself"}" aria-label="${active?"Stop recording":"Record yourself"}">${ICONS.rec}</button>${has?`<button class="say slow" data-act="cmp" data-k="${k}" data-i="${i}" title="Model voice, then your recording">compare</button>`:""}`; }
async function toggleRec(k){
  if(S.recActive){ const r=S.recActive; try{ r.mr.stop(); }catch(e){} return; }
  if(!navigator.mediaDevices||!window.MediaRecorder){ toast("Recording isn't supported in this browser"); return; }
  try{ stopSpeech(); const stream=await navigator.mediaDevices.getUserMedia({audio:true}); const mr=new MediaRecorder(stream); const chunks=[];
    mr.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
    mr.onstop=()=>{ stream.getTracks().forEach(t=>t.stop()); if(S.rec[k]) URL.revokeObjectURL(S.rec[k]); S.rec[k]=URL.createObjectURL(new Blob(chunks,{type:mr.mimeType||"audio/webm"})); S.recActive=null; render(); };
    mr.start(); S.recActive={k,mr}; render(); setTimeout(()=>{ if(S.recActive&&S.recActive.mr===mr) toggleRec(k); }, 15000);
  }catch(e){ toast("Allow the microphone to record yourself"); } }
async function compareRec(k, text){ if(!S.rec[k]) return; stopSpeech(); await speak(text); await new Promise(r=>setTimeout(r,400)); try{ await new Audio(S.rec[k]).play(); }catch(e){} }
async function loadExtras(){ try{ const r=await fetch("days/austria.json"); if(r.ok) S.austria=await r.json(); }catch(e){} }


/* ---------- Exam ---------- */
/* ---------- auth ---------- */
function vAuth(){
  const up=S.authMode==="signup";
  return `<div class="hero stack" style="max-width:460px;margin:20px auto 0">
    <h1>${up?"Create your account":"Sign in"}</h1>
    <p class="muted small">${ex("Your progress, imported days and NotebookLM files sync between your phone and your PC.","پیشرفت، روزهای واردشده و فایل‌های NotebookLM بین گوشی و کامپیوتر همگام می‌شوند.")}</p>
    <form id="authForm" class="stack" autocomplete="on">
      <div class="field"><label for="authEmail">Email</label><input type="text" id="authEmail" inputmode="email" autocomplete="email" required></div>
      <div class="field"><label for="authPass">Password</label><input type="password" id="authPass" autocomplete="${up?"new-password":"current-password"}" minlength="6" required style="font:inherit;padding:9px 11px;border:1.5px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink)"></div>
      <button class="btn primary" type="submit" ${S.authBusy?"disabled":""} style="justify-content:center">${S.authBusy?"Please wait…":up?"Create account":"Sign in"}</button>
    </form>
    ${S.authMsg?`<div class="banner info">${esc(S.authMsg)}</div>`:""}
    <div class="row between"><button class="btn sm ghost" data-act="auth-toggle">${up?"I already have an account":"Create an account"}</button><button class="btn sm ghost" data-act="auth-offline">Use without account</button></div>
  </div>`;
}
async function submitAuth(){
  const email=($("#authEmail")||{}).value.trim(), password=($("#authPass")||{}).value;
  if(!email||!password){ S.authMsg="Enter your email and a password."; render(); return; }
  S.authBusy=true; S.authMsg=""; render();
  try{
    if(S.authMode==="signup"){
      const { data, error } = await sb.auth.signUp({ email, password, options:{ emailRedirectTo: location.origin } });
      if(error) throw error;
      S.authMsg = data.session ? "" : "Account created. Open the confirmation email, tap the link, then sign in here.";
      if(!data.session) S.authMode="signin";
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if(error) throw error;
      S.offline=false; lsSet("osd-a1-offline","0");
    }
  }catch(e){ S.authMsg = /confirm/i.test(e.message) ? "Confirm your email first (check your inbox), then sign in." : e.message; }
  S.authBusy=false; render();
}

/* ---------- install ---------- */
window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); S.installEvt=e; if(!S.live) render(); });
function isStandalone(){ return matchMedia("(display-mode: standalone)").matches || navigator.standalone; }
function installHint(){ return S.installEvt && !isStandalone() ? `<button class="btn sm" data-act="install">Install app</button>` : ""; }

/* ---------- pronunciation ---------- */
function simScore(target, heard){ const A=norm(target).split(" ").filter(Boolean), B=norm(heard).split(" ").filter(Boolean); if(!A.length) return 0;
  const L=Array.from({length:A.length+1},()=>new Array(B.length+1).fill(0));
  for(let i=A.length-1;i>=0;i--) for(let j=B.length-1;j>=0;j--) L[i][j]=A[i]===B[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  return Math.round(L[0][0]/A.length*100); }
function pronCheck(key, target){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ toast("Speech recognition needs Chrome or Edge."); return; }
  stopSpeech();
  const r=new SR(); r.lang="de-DE"; r.interimResults=false; r.maxAlternatives=4;
  S.pron[key]={listening:true}; render();
  r.onresult=e=>{ const alts=[...e.results[0]].map(a=>a.transcript); const best=alts.map(a=>({a,s:simScore(target,a)})).sort((x,y)=>y.s-x.s)[0]; S.pron[key]={heard:best.a, score:best.s}; render(); };
  r.onerror=e=>{ S.pron[key]={error:e.error==="not-allowed"?"Allow the microphone for this site.":e.error==="no-speech"?"I didn't hear anything. Try again.":e.error}; render(); };
  r.onend=()=>{ if(S.pron[key]&&S.pron[key].listening){ S.pron[key]={error:"I didn't hear anything. Try again."}; render(); } };
  try{ r.start(); }catch(e){ S.pron[key]={error:e.message}; render(); }
}
function pronView(k){ const p=S.pron[k]; if(!p) return "";
  if(p.listening) return `<div class="small" style="color:var(--accent)">Listening… speak now</div>`;
  if(p.error) return `<div class="small" style="color:var(--bad)">${esc(p.error)}</div>`;
  return `<div class="small"><span class="chip ${p.score>=85?"ok":p.score>=60?"warn":"bad"} tnum">${p.score}%</span> I heard: <i>${esc(p.heard)}</i></div>`; }

/* ---------- Gemini Live tutor ---------- */
function tutorCard(n){
  const sessions=S.st.live[n]||[]; const last=sessions[sessions.length-1];
  const ready=S.ai&&S.uid;
  return `<section class="card stack tutor-card"><div class="label">Live tutor · Gemini · 10–15 min</div><h2>Talk to your tutor</h2>
    <p class="small">${ex("The tutor already knows which day you're on, today's words and script, your recent mistakes and the notes from your last session. Use headphones.","مربی می‌داند روز چندم هستی، لغات و متن امروز، اشتباهات اخیر و یادداشت‌های جلسه قبل را. از هدفون استفاده کن.")}</p>
    <div class="row">${[["coach","Coach: teach and correct"],["exam","Exam simulation"]].map(([v,l])=>`<button class="opt ${S.liveMode===v?"sel":""}" data-act="live-mode" data-v="${v}">${l}</button>`).join("")}</div>
    ${ready?`<div><button class="btn primary" data-act="live-start" data-n="${n}">${ICONS.mic}Start speaking session</button></div>`:`<div class="banner"><div>${S.uid?"The tutor needs GEMINI_API_KEY in Vercel → Settings → Environment Variables.":"Sign in to use the tutor."}</div></div>`}
    ${last?`<div class="sunk stack" style="gap:4px"><div class="label">Last session · ${new Date(last.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}${last.score_25!=null?` · ${esc(last.score_25)}/25`:""}</div><div class="small">${esc(last.summary_en||"")}</div>
      ${(last.errors||[]).slice(0,4).map(e=>`<div class="small"><span style="color:var(--bad);text-decoration:line-through">${esc(e.wrong)}</span> → <b style="color:var(--ok)">${esc(e.right)}</b></div>`).join("")}
      ${(last.next_focus||[]).length?`<div class="small"><b>Next:</b> ${esc(last.next_focus.join("; "))}</div>`:""}</div>`:""}
  </section>`;
}
function weakSpots(){ const out=[]; Object.entries(S.st.results).forEach(([k,r])=>{ if(r.total&&r.score/r.total<0.6) out.push(`${k} (${r.score}/${r.total})`); }); return out.slice(-6); }
function buildTutorBrief(n, d, mode){
  const p=PLAN[n-1]; const left=daysLeft();
  const done=PLAN.slice(0,n-1).filter(x=>x.k==="lesson").map(x=>x.t);
  const next=PLAN[n]?PLAN[n].t:"exam";
  const L=[];
  L.push(`You are Frau Berger, a friendly Austrian ÖSD examiner and Raam's personal German tutor. You run a ${mode==="exam"?"strict exam simulation":"coaching session"} by voice.`);
  L.push(`LEARNER: Raam, 30, from Tehran, native Persian, English B2, absolute beginner who started German on 11 October 2026. Goal: pass ÖSD Zertifikat A1 on Saturday 14 November 2026 at Divan Institute, Tehran (${left} days left).`);
  L.push(`PLAN POSITION: Day ${n} of 34 — "${p.t}"${p.g?` (grammar: ${p.g})`:""}. Earlier days covered: ${done.join("; ")||"nothing yet"}. Tomorrow: ${next}.`);
  if(d){
    if(d.vocab&&d.vocab.length) L.push("TODAY'S WORDS: "+d.vocab.map(v=>`${v.article&&v.article!=="-"?v.article+" ":""}${v.de}${v.plural&&v.plural!=="-"?` (${v.plural})`:""} = ${v.en}`).join("; ")+".");
    if(d.phrases&&d.phrases.length) L.push("TODAY'S PHRASES: "+d.phrases.map(x=>x.de).join(" | "));
    if(d.grammar&&d.grammar.length) L.push("TODAY'S GRAMMAR: "+d.grammar.map(g=>`${g.topic}: ${g.explain_en}`).join(" "));
    if(d.pronunciation&&d.pronunciation.length) L.push("PRONUNCIATION FOCUS: "+d.pronunciation.map(x=>`${x.focus} (${(x.words||[]).join(", ")})`).join("; "));
    const sp=d.sprechen||{};
    if(sp.teil1) L.push("HIS SPEAKING SCRIPT (Teil 1): "+sp.teil1.my_script.map(x=>x.de).join(" ")+" Examiner questions to ask: "+(sp.teil1.examiner_questions_de||[]).join(" | "));
    if(sp.teil2) L.push("PHOTO FOR TEIL 2: "+sp.teil2.photo_scene_en);
    if(sp.teil3) L.push("ROLE-PLAY FOR TEIL 3: "+sp.teil3.roleplay_en+" "+(sp.teil3.examiner_role_de||""));
  } else {
    L.push("Today has no new lesson (review, mock or buffer day). Revise everything from the earlier days, with most time on Sprechen Teil 1–3.");
  }
  const mis=S.st.mistakes.slice(0,8).map(m=>`${m.q} → ${m.right} (he said: ${m.your||"–"})`);
  if(mis.length) L.push("RECENT MISTAKES TO RECYCLE: "+mis.join(" | "));
  const ws=weakSpots(); if(ws.length) L.push("WEAK EXERCISE SCORES: "+ws.join(", "));
  const notes=Object.entries(S.st.live).flatMap(([day,arr])=>arr.map(x=>({day:+day,...x}))).sort((a,b)=>a.at-b.at).slice(-3);
  if(notes.length) L.push("NOTES FROM EARLIER TUTOR SESSIONS: "+notes.map(x=>`Day ${x.day}: ${x.summary_en||""} Errors: ${(x.errors||[]).map(e=>e.wrong+" → "+e.right).join(", ")}. Next focus: ${(x.next_focus||[]).join("; ")}`).join(" || "));
  if(mode==="exam"){
    L.push("SESSION: Simulate the ÖSD A1 oral exam exactly. Teil 1: ask him to introduce himself on 4 of: Sprachen, Hobbys, Sport, Familie, Beruf, Lieblingsessen; ask one or two follow-ups (e.g. spell the surname, phone number). Teil 2: describe the photo (Was sehen Sie? Wie viele Personen? Wo? Was machen sie?). Teil 3: short role-play about that photo. Use Sie. Do NOT correct during the exam. Afterwards switch to English and give a score out of 25 (task, vocabulary, grammar, pronunciation) with his 3 most important errors.");
  } else {
    L.push("SESSION PLAN (about 12 minutes): 1) Greet him and say in English what today's session covers. 2) Vocabulary recall: say an English word from today, he answers in German with article; also recycle 2–3 earlier mistakes. 3) Sprechen Teil 1 drill with his script; ask him to spell his name. 4) "+(n>=8?"A short Teil 2 photo description and a Teil 3 role-play. ":"A tiny dialogue using today's phrases (switch between du and Sie). ")+"5) Finish with 3 things he did well and 3 corrections.");
  }
  L.push("RULES: Speak slow, clear Austrian standard German (Grüß Gott, Jänner) in very short A1 sentences. Use only today's and earlier vocabulary. Explain in short simple English; use Persian only if he asks. In coaching mode, correct every mistake immediately: say the correct sentence once, ask him to repeat it, then continue. If he is silent or lost, give him the first words. Keep your turns short so he speaks more than you.");
  return L.join("\n");
}
async function startLive(n){
  if(!S.ai||!S.uid){ toast(S.uid?"Add GEMINI_API_KEY in Vercel first":"Sign in first"); return; }
  stopSpeech();
  const d=await getDay(n).catch(()=>null);
  let outCtx, inCtx;
  try{ outCtx=new AudioContext({sampleRate:24000}); inCtx=new AudioContext(); }catch(e){ toast("Audio is not available: "+e.message); return; }
  S.live={ n, status:"starting", log:[], partial:null, started:Date.now(), mode:S.liveMode, muted:false, error:"" };
  render();
  try{
    const tk=await api("/api/live-token");
    const sess=new LiveSession({ token:tk.token, apiVersion:tk.apiVersion, model:tk.model, systemText:buildTutorBrief(n,d,S.liveMode), voice:S.st.tutorVoice||"Kore", outCtx, inCtx,
      onStatus:st=>{ if(!S.live) return; S.live.status=st; const el=$("#liveStatus"); if(el) el.textContent=liveStatusText(); if(st==="ended") render(); },
      onTranscript:(role,text,final)=>{ if(!S.live) return; if(final){ S.live.log.push({role,text}); S.live.partial=null; } else S.live.partial={role,text}; drawLiveLog(); },
      onError:msg=>{ if(!S.live) return; S.live.error=msg; const el=$("#liveErr"); if(el){ el.textContent=msg; el.hidden=false; } },
      onLevel:v=>{ const el=$("#liveLevel"); if(el) el.style.width=Math.min(100,Math.round(v*400))+"%"; } });
    S.live.sess=sess;
    await sess.start();
  }catch(e){ if(S.live){ S.live.status="error"; S.live.error=e.message; } try{ outCtx.close(); inCtx.close(); }catch(_){} render(); }
}
function liveStatusText(){ const L=S.live; if(!L) return ""; return {starting:"Getting a secure connection…",connecting:"Connecting to Gemini…",live:L.muted?"Microphone muted":"Live · speak any time",ended:"Session ended",error:"Couldn't start",summarizing:"Saving session notes…"}[L.status]||L.status; }
function vLive(){
  const L=S.live; const p=PLAN[L.n-1];
  const over = L.status==="ended"||L.status==="error";
  return `<div class="live">
    <div class="row between"><div><div class="label">Day ${L.n} · ${L.mode==="exam"?"Exam simulation":"Coaching"}</div><h2>${esc(p.t)}</h2></div><span class="chip ${L.status==="live"?"ok":L.status==="error"?"bad":"acc"}" id="liveStatus">${liveStatusText()}</span></div>
    <div class="meter" aria-hidden="true"><i id="liveLevel" style="width:0%"></i></div>
    <div class="banner" id="liveErr" ${L.error?"":"hidden"}>${esc(L.error)}</div>
    <div class="live-log" id="liveLog" aria-live="polite"></div>
    <form id="liveText" class="row" style="flex-wrap:nowrap"><input type="text" id="liveTextIn" placeholder="Type instead of speaking…" autocomplete="off" ${L.status!=="live"?"disabled":""}><button class="btn" type="submit" ${L.status!=="live"?"disabled":""}>Send</button></form>
    <div class="row between">
      ${over?`<span></span>`:`<button class="btn" data-act="live-mute">${L.muted?"Unmute mic":"Mute mic"}</button>`}
      <button class="btn primary" data-act="live-end" ${L.status==="summarizing"?"disabled":""}>${over?"Save & close":"End session"}</button>
    </div>
    <p class="small muted">${ex("Speak German freely; the tutor waits about a second of silence before answering. Say „Wie bitte?“ if you don't understand.","آزادانه آلمانی صحبت کن؛ مربی بعد از حدود یک ثانیه سکوت جواب می‌دهد. اگر متوجه نشدی بگو «Wie bitte?».")}</p>
  </div>`;
}
function drawLiveLog(){ const el=$("#liveLog"); if(!el||!S.live) return; const items=[...S.live.log, ...(S.live.partial?[S.live.partial]:[])];
  el.innerHTML = items.length ? items.map(x=>`<div class="lmsg ${x.role}"><span class="label">${x.role==="you"?"You":"Frau Berger"}</span><div>${esc(x.text)}</div></div>`).join("") : `<p class="muted small" style="text-align:center;padding:30px 0">${S.live.status==="live"?"Frau Berger is about to start…":"…"}</p>`;
  el.scrollTop=el.scrollHeight; }
async function endLive(){
  const L=S.live; if(!L) return;
  try{ L.sess&&L.sess.stop(); }catch(e){}
  const transcript=L.log.map(x=>(x.role==="you"?"Raam: ":"Tutor: ")+x.text).join("\n");
  if(transcript.length>60 && S.ai){
    L.status="summarizing"; render();
    try{ const r=await api("/api/ai",{mode:"summarize", payload:{day:L.n, transcript}}); const s=r.result||{}; s.at=Date.now(); s.minutes=Math.max(1,Math.round((Date.now()-L.started)/60000)); s.mode=L.mode;
      const arr=S.st.live[L.n]=(S.st.live[L.n]||[]); arr.push(s); if(arr.length>5) arr.shift(); save(); toast("Session notes saved"); }
    catch(e){ toast("Couldn't save notes: "+e.message); }
  }
  S.live=null; render();
}

/* ---------- Gemini app context ---------- */
async function copyContext(n){ const d=await getDay(n).catch(()=>null); copyText(buildTutorBrief(n,d,S.liveMode)+"\n\nStart now: greet me and begin the session."); }

function examFacts(){
  const mod=(title, mins, pts, pass, rows, note)=>`<section class="card stack"><div class="row between"><h2>${title}</h2><span class="chip tnum">${mins} · ${pts}</span></div>${pass?`<p class="small"><b>Minimum:</b> ${pass}</p>`:""}
    <div class="tablewrap"><table class="gram"><tr><td>Part</td><td>Task</td><td>Items</td><td>Notes</td></tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>${note?`<p class="small muted">${note}</p>`:""}</section>`;
  return `<div style="padding-top:8px"><h2>Exam facts</h2><p class="muted small">Checked against the official ÖSD ZA1 rules (10/2023) and Modellsatz.</p></div>
  <div class="hero"><div class="dayline"><span class="chip at">Exam day</span><span>Saturday 14 November 2026</span><span class="fa">شنبه ۲۳ آبان ۱۴۰۵</span></div>
    <p><b>Divan Institute, Tehran.</b> Written part (Lesen, Hören, Schreiben) as a group, then the oral part (Sprechen) one-to-one with an examiner. No dictionary allowed.</p>
    <div class="grid2"><div class="sunk"><div class="label">Written · 75 points</div><b>Pass: 38</b> and the minimum in each part</div><div class="sunk"><div class="label">Oral · 25 points</div><b>Pass: 12</b></div></div>
    <p class="small muted">${ex("The two modules are graded separately and can be taken or retaken separately.","دو بخش جداگانه نمره‌دهی می‌شوند و می‌توان جداگانه آن‌ها را داد یا تکرار کرد.")}</p></div>
  ${mod("Lesen","25 min","30 pts","6 of 30",[["1","Match 5 situations (A–E) to 6 ads","5 × 2 pts","one ad is extra"],["2","3 short texts, 2 statements each","6 items, 10 pts","answer <b>JA</b> or <b>NEIN</b>"],["3","Match 5 short notices to 6 pictures","5 × 2 pts","one picture is extra"]])}
  ${mod("Hören","≈ 10 min","30 pts","6 of 30",[["1","5 short texts → 6 pictures","5 × 2 pts","played <b>once</b>; 30 s to look at the pictures first"],["2","1 answering-machine message → note sheet","5 × 2 pts","played <b>twice</b>; spelled names and numbers must be fully correct"],["3","5 short interviews → tick one answer per person","5 × 2 pts","played <b>once</b>; 10 s to read"]])}
  ${mod("Schreiben","20 min","15 pts","4 of 10 in Teil 2",[["1","Fill in a form for a friend","10 fields × 0.5","copy information exactly"],["2","Reply to a personal email","10 pts","≈ 30 words, 3 guiding points, greeting + sign-off"]])}
  ${mod("Sprechen","≈ 10 min + 10 min prep","25 pts","12 of 25",[["1","Introduce yourself: pick 4 of 6 topics (Sprachen, Hobbys, Sport, Familie, Beruf, Lieblingsessen)","","examiner asks follow-ups, e.g. spelling your name"],["2","Choose 1 of 3 photos: Was sehen Sie? Wie viele Personen? Wo? Was machen sie?","",""],["3","Role-play with the examiner about your photo","","du/Sie, taking turns"]],"One-to-one with the examiner; recorded.")}
  <section class="card stack"><h2>Strategy</h2>${[
    ["Do Schreiben Teil 2 early enough. It is the only part with a hard minimum (4/10), and it's where most beginners lose the written module.","بخش ۲ نوشتن را دیر شروع نکن؛ تنها بخش با حداقل نمره سخت است (۴ از ۱۰)."],
    ["Never leave an answer blank. There is no penalty for a wrong guess.","هیچ جوابی را خالی نگذار؛ جواب غلط نمره منفی ندارد."],
    ["In Hören Teil 1 and 3 you hear each text once. Read the pictures and options during the pause before it starts.","در شنیدن بخش ۱ و ۳ فقط یک بار پخش می‌شود؛ قبل از شروع تصاویر و گزینه‌ها را بخوان."],
    ["Numbers: German says the ones before the tens (vierundzwanzig = 24). Write digits as you hear them.","اعداد: آلمانی یکان را قبل از دهگان می‌گوید (vierundzwanzig = ۲۴)."],
    ["If you don't understand the examiner, say: „Wie bitte? Können Sie das bitte wiederholen?“","اگر متوجه نشدی بگو: «Wie bitte? Können Sie das bitte wiederholen?»"],
    ["Short, correct sentences beat long, broken ones.","جمله‌های کوتاه و درست بهتر از جمله‌های بلند و غلط‌اند."]
  ].map(([en,fa])=>`<div class="sunk">${ex(en,fa)}</div>`).join("")}
  <a class="btn sm" href="${MODELSATZ_URL}" target="_blank" rel="noopener">Official ZA1 model test (PDF)</a></section>`;
}

/* ---------- Settings ---------- */
function vSettings(){
  const syncTxt = !S.uid ? "Using the app without an account: progress stays on this device." : S.sync==="synced" ? "Progress, imported days and files sync across your devices." : S.sync==="error" ? "Last sync failed. Your progress is safe on this device and will sync when the connection is back." : "Syncing…";
  return `<div><h1>Einstellungen</h1></div>
  <section class="card stack"><h2>Voice</h2>
    ${TTS.voices.length?`<div class="field"><label for="voiceSel">German voice</label><select id="voiceSel" data-set="voice">${TTS.voices.map(v=>`<option value="${attr(v.name)}" ${v.name===S.st.voice?"selected":""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select></div>`
      :`<div class="banner"><div>${ex("No German voice found on this device.","هیچ صدای آلمانی روی این دستگاه پیدا نشد.")}<br><b>Android:</b> Settings › System › Languages › Text-to-speech › Google › install German.<br><b>Windows:</b> use Microsoft Edge (it has natural Austrian voices: Ingrid, Jonas), or Settings › Time &amp; language › Speech › Add voices › Deutsch (Österreich).</div></div>`}
    <div class="field"><label for="rateIn">Speed: <span class="tnum">${(S.st.rate||0.9).toFixed(2)}×</span></label><input type="range" id="rateIn" min="0.6" max="1.1" step="0.05" value="${S.st.rate||0.9}" data-set="rate"></div>
    <div class="row"><button class="btn sm" data-act="sayw" data-v="Grüß Gott! Ich heiße Raam. Ich lerne Deutsch.">${ICONS.speaker}Test voice</button></div>
    <p class="small muted">${ex("Tip: on Windows, open this page in Edge for the best Austrian voices. On Android, Chrome with Google's German voice works well.","نکته: در ویندوز برای بهترین صدای اتریشی از Edge استفاده کن. در اندروید Chrome با صدای آلمانی گوگل خوب است.")}</p></section>
  <section class="card stack"><h2>Explanations</h2><div class="row">${[["both","English + فارسی"],["en","English"],["fa","فارسی"]].map(([v,l])=>`<button class="opt ${S.st.lang===v?"sel":""}" data-act="lang" data-v="${v}">${l}</button>`).join("")}</div></section>
  <section class="card stack"><h2>Exam mode for Hören</h2><label class="row"><input type="checkbox" data-set="strict" ${S.st.strict?"checked":""}> Limit audio plays like the real exam</label></section>
  <section class="card stack"><h2>Plan</h2><div class="field"><label for="startIn">Day 1 date</label><input type="text" id="startIn" value="${attr(S.st.start)}" data-set="start" placeholder="YYYY-MM-DD" inputmode="numeric"></div><p class="small muted">Exam: Saturday 14 November 2026 (23 Aban 1405).</p></section>
  <section class="card stack"><h2>Account &amp; sync</h2><p class="small">${syncTxt}</p>
    ${S.uid?`<div class="row between"><span class="small">Signed in as <b>${esc(S.email)}</b></span><button class="btn sm" data-act="signout">Sign out</button></div>`:`<button class="btn sm" data-act="auth-show">Sign in to sync</button>`}
    ${installHint()?`<div class="row">${installHint()}<span class="small muted">Adds the app to your home screen or Start menu.</span></div>`:isStandalone()?`<span class="chip ok">Installed</span>`:`<p class="small muted">To install: Chrome on Android → ⋮ → Install app. Edge on Windows → … → Apps → Install this site as an app.</p>`}</section>
  <section class="card stack"><h2>Live tutor</h2>
    <p class="small">${S.ai?`Ready · model ${esc(S.liveModel)}`:"Not set up: add GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy."}</p>
    <div class="field"><label for="tutorVoice">Tutor voice</label><select id="tutorVoice" data-set="tutorVoice">${["Kore","Aoede","Puck","Charon","Fenrir"].map(v=>`<option ${S.st.tutorVoice===v?"selected":""}>${v}</option>`).join("")}</select></div>
    <div><button class="btn sm" data-act="copy-context" data-n="${currentDay()}">${ICONS.copy}Copy today's context for the Gemini app</button></div></section>
  <section class="card stack"><h2>Reset</h2>${S.confirmReset?`<p class="small">This deletes all progress, cards and mistakes. Are you sure?</p><div class="row"><button class="btn" data-act="reset-no">Keep my progress</button><button class="btn primary" style="background:var(--bad);border-color:var(--bad)" data-act="reset-yes">Delete everything</button></div>`:`<div><button class="btn sm" data-act="reset">Reset progress…</button></div>`}</section>`;
}

/* ---------- events ---------- */
document.addEventListener("click", async e=>{
  const b=e.target.closest("[data-act]"); if(!b) return;
  const a=b.dataset.act;
  if(a==="tab"){ S.view=b.dataset.v; S.step=null; S.fc=null; S.mix=null; if(S.view==="today") S.dayN=S.dayN||currentDay(); render(); window.scrollTo(0,0); }
  else if(a==="day"){ const n=+b.dataset.v; if(n<1||n>PLAN.length) return; S.dayN=n; S.view="today"; S.step=null; render(); window.scrollTo(0,0); }
  else if(a==="step"){ S.step=b.dataset.v; render(); window.scrollTo(0,0); }
  else if(a==="back"){ S.step=null; stopSpeech(); render(); window.scrollTo(0,0); }
  else if(a==="done"){ const k=b.dataset.key; if(S.st.done[k]) delete S.st.done[k]; else S.st.done[k]=Date.now(); save(); if(S.st.done[k]){ S.step=null; toast("Step done. Weiter so!"); window.scrollTo(0,0); } render(); }
  else if(a==="timer"){ const k=b.dataset.key; const min=+b.dataset.min; if(!S.timer||S.timer.key!==k) S.timer={key:k,running:false,left:min*60000};
    if(S.timer.running){ S.timer.left=Math.max(0,S.timer.endAt-Date.now()); S.timer.running=false; } else { S.timer.endAt=Date.now()+(S.timer.left||min*60000); S.timer.running=true; } render(); }
  else if(a==="say"){ const it=SAY_BANK[+b.dataset.i]; if(!it) return; stopSpeech(); if(it.lines) speakLines(it.lines, !!b.dataset.slow); else speak(it.text,{voice:it.voice, slow:!!b.dataset.slow}); }
  else if(a==="sayall"){ const it=SAY_BANK[+b.dataset.i]; if(it) speakLines(it.lines,false); }
  else if(a==="sayw"){ stopSpeech(); speak(b.dataset.v); }
  else if(a==="letter"){ stopSpeech(); speak(LETTER_TTS[b.dataset.v]||b.dataset.v); }
  else if(a==="spell"){ spellOut(($("#spellIn")||{}).value||"Raam"); }
  else if(a==="play"){ const k=b.dataset.key; const max=+b.dataset.max; const g=k.split("|")[0]; const unlimited=(!S.st.strict&&!isTest(g))||S.checked[g];
    const used=S.plays[k]||0; if(!unlimited&&used>=max) return; S.plays[k]=used+1; const it=SAY_BANK[+b.dataset.i]; render(); if(it) speakLines(it.lines,false); }
  else if(a==="pick"){ const k=b.dataset.key; if(S.ex[k]) return; const items=itemsFor(b.dataset.src); const it=items[+b.dataset.i]; const ok=b.dataset.v===it.answer; S.ex[k]={pick:b.dataset.v, ok};
    if(!ok) logMistake(S.dayN||currentDay(), b.dataset.src, it.prompt, b.dataset.v, it.answer); render(); }
  else if(a==="wo-add"){ const k=b.dataset.key; (S.wo[k]=S.wo[k]||[]).push(+b.dataset.ix); render(); }
  else if(a==="wo-del"){ const k=b.dataset.key; if(S.ex[k]) return; S.wo[k]=(S.wo[k]||[]).filter(x=>x!==+b.dataset.ix); render(); }
  else if(a==="wo-check"){ const k=b.dataset.key; const it=itemsFor(b.dataset.src)[+b.dataset.i]; const words=shuffled(it.prompt.split(/\s*·\s*/),k); const built=(S.wo[k]||[]).map(ix=>words[ix]).join(" ");
    const ok=norm(built)===norm(it.answer); S.ex[k]={pick:built, ok}; if(!ok) logMistake(S.dayN||currentDay(), b.dataset.src, it.prompt, built, it.answer); render(); }
  else if(a==="tr-check"){ const k=b.dataset.key; const it=itemsFor(b.dataset.src)[+b.dataset.i]; const v=S.ans[k]||""; const acc=it.accept&&it.accept.length?it.accept:String(it.answer).split(" / ");
    const ok=acc.some(x=>norm(x)===norm(v)); S.ex[k]={pick:v, ok}; if(!ok) logMistake(S.dayN||currentDay(), b.dataset.src, it.prompt, v, it.answer); render(); }
  else if(a==="ex-reset"){ const pre=b.dataset.pre; Object.keys(S.ex).forEach(k=>{ if(k.startsWith(pre)) delete S.ex[k]; }); Object.keys(S.wo).forEach(k=>{ if(k.startsWith(pre)) delete S.wo[k]; }); Object.keys(S.ans).forEach(k=>{ if(k.startsWith(pre)) delete S.ans[k]; }); render(); }
  else if(a==="set"){ S.ans[b.dataset.k]=b.dataset.v; render(); }
  else if(a==="check"){ S.checked[b.dataset.g]=true; render(); }
  else if(a==="uncheck"){ const g=b.dataset.g; delete S.checked[g]; Object.keys(S.ans).forEach(k=>{ if(k.startsWith(g+":")) delete S.ans[k]; }); Object.keys(S.plays).forEach(k=>{ if(k.startsWith(g+"|")) delete S.plays[k]; }); render(); }
  else if(a==="uncheck-pre"){ const pre=b.dataset.g; Object.keys(S.checked).forEach(k=>{ if(k.startsWith(pre)) delete S.checked[k]; }); Object.keys(S.ans).forEach(k=>{ if(k.startsWith(pre)) delete S.ans[k]; }); render(); }
  else if(a==="grade"){ gradeEmail(+b.dataset.n); }
  else if(a==="copy"){ copyText(b.dataset.txt); }
  else if(a==="import"){ importDay(+b.dataset.n); }
  else if(a==="fc-start"){ startFc(b.dataset.mode); render(); }
  else if(a==="fc-show"){ S.fc.show=true; render(); const c=S.fc.queue[0]; if(S.fc.mode==="en"&&c) speak((c.article&&c.article!=="-"?c.article+" ":"")+c.de); }
  else if(a==="fc-grade"){ const q=+b.dataset.q; const c=S.fc.queue.shift(); grade(c,q); S.fc.seen++; if(q<3) S.fc.queue.splice(Math.min(4,S.fc.queue.length),0,c); S.fc.show=false; render();
    const nx=S.fc.queue[0]; if(nx&&S.fc.mode==="de") speak((nx.article&&nx.article!=="-"?nx.article+" ":"")+nx.de); }
  else if(a==="fc-end"){ S.fc=null; render(); }
  else if(a==="clear-mist"){ S.st.mistakes=[]; save(); render(); }
  else if(a==="lang"){ S.st.lang=b.dataset.v; save(); render(); }
  else if(a==="reset"){ S.confirmReset=true; render(); }
  else if(a==="reveal"){ b.classList.toggle("shown"); }
  else if(a==="cover"){ S.cover=b.dataset.v||null; render(); }
  else if(a==="ex-retry"){ const pre=b.dataset.pre; Object.keys(S.ex).forEach(k=>{ if(k.startsWith(pre)&&!S.ex[k].ok){ delete S.ex[k]; delete S.wo[k]; delete S.ans[k]; } }); render(); }
  else if(a==="rec"){ toggleRec(b.dataset.k); }
  else if(a==="cmp"){ const it=SAY_BANK[+b.dataset.i]; compareRec(b.dataset.k, it?it.text:""); }
  else if(a==="mix-start"){ startMix(); }
  else if(a==="mix-end"){ S.mix=null; render(); }
  else if(a==="deck-austria"){ S.st.decks=S.st.decks||{}; S.st.decks.austria=!S.st.decks.austria; save(); toast(S.st.decks.austria?"Austrian words added to your cards":"Removed"); render(); }
  else if(a==="mock-open"){ openMock(b.dataset.id); }
  else if(a==="mock-next"){ mockNext(); }
  else if(a==="mock-goto"){ mockGo(b.dataset.ph, true); S.mock.endAt=0; }
  else if(a==="mock-flag"){ const f=b.dataset.f; S.mock.flags[f]=!S.mock.flags[f]; render(); }
  else if(a==="mock-submit"){ submitApp(); }
  else if(a==="mock-prep"){ S.mock.endAt=Date.now()+10*60000; render(); }
  else if(a==="mock-photo"){ S.mock.photo=+b.dataset.i; render(); }
  else if(a==="mock-tutor"){ S.liveMode="exam"; startLive(currentDay()); }
  else if(a==="mock-use-tutor"){ S.mock.spOverride=b.dataset.v===""?null:+b.dataset.v; render(); }
  else if(a==="mock-a2-self"){ S.mock.sa2=null; S.mock.sa2Detail=null; render(); }
  else if(a==="mock-grade"){ gradePaperEmail(); }
  else if(a==="mock-result"){ mockGo("result"); }
  else if(a==="mock-exit"){ S.mock=null; S.testPrefix=""; render(); window.scrollTo(0,0); }
  else if(a==="auth-toggle"){ S.authMode=S.authMode==="signup"?"signin":"signup"; S.authMsg=""; render(); }
  else if(a==="auth-offline"){ S.offline=true; lsSet("osd-a1-offline","1"); render(); }
  else if(a==="auth-show"){ S.offline=false; lsSet("osd-a1-offline","0"); render(); }
  else if(a==="signout"){ await sb.auth.signOut(); S.uid=null; S.offline=false; lsSet("osd-a1-offline","0"); render(); }
  else if(a==="install"){ if(S.installEvt){ S.installEvt.prompt(); const r=await S.installEvt.userChoice; if(r.outcome==="accepted") S.installEvt=null; render(); } }
  else if(a==="att-del"){ S.confirmDel=b.dataset.path; render(); }
  else if(a==="att-del-no"){ S.confirmDel=null; render(); }
  else if(a==="att-del-yes"){ const path=b.dataset.path, n=+b.dataset.n; S.confirmDel=null; const { error } = await sb.storage.from("media").remove([path]); if(error) toast("Couldn't delete: "+error.message); else toast("Removed"); delete S.att[n]; render(); }
  else if(a==="cards-import"){ const n=+b.dataset.n; const cards=parseCards(S.cardText[n]); if(!cards.length){ toast("No cards found. Paste two or more columns."); return; }
    if(cards.length>60 && !confirm(cards.length+" cards is a lot for one day (25–40 is ideal). The table probably pulled words from the whole notebook. Add them anyway?")) return;
    const ov=Object.assign({day:n}, S.imported[n]||{}); const seen=new Set((ov.flashcards||[]).map(c=>c.front)); ov.flashcards=[...(ov.flashcards||[]), ...cards.filter(c=>!seen.has(c.front))];
    await saveOverlay(n, ov); S.cardText[n]=""; S.st.intro[n]=S.st.intro[n]||Date.now(); save(); toast(cards.length+" cards added"); render(); }
  else if(a==="cards-clear"){ const n=+b.dataset.n; const ov=Object.assign({}, S.imported[n]||{}); delete ov.flashcards; await saveOverlay(n, ov); render(); }
  else if(a==="pron"){ pronCheck(b.dataset.k, b.dataset.t); }
  else if(a==="live-mode"){ S.liveMode=b.dataset.v; render(); }
  else if(a==="live-start"){ startLive(+b.dataset.n); }
  else if(a==="live-mute"){ if(S.live&&S.live.sess){ S.live.muted=!S.live.muted; S.live.sess.setMuted(S.live.muted); render(); } }
  else if(a==="live-end"){ endLive(); }
  else if(a==="copy-context"){ copyContext(+b.dataset.n); }
  else if(a==="reset-no"){ S.confirmReset=false; render(); }
  else if(a==="reset-yes"){ const keep={lang:S.st.lang,voice:S.st.voice,rate:S.st.rate,start:S.st.start}; S.st=Object.assign(defaultState(),keep); S.confirmReset=false; S.ex={}; S.ans={}; S.checked={}; save(); toast("Progress reset"); render(); }
});
function itemsFor(src){ if(src==="mix") return S.mix||[]; const d=S.days[S.dayN||currentDay()]; if(src==="check") return d.exercises; if(src==="quiz") return d.review_quiz.map(q=>({type:"mcq",prompt:q.q,options:q.options,answer:q.answer})); return d.exercises; }
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.dataset.store && t.type!=="radio") S.ans[t.dataset.store]=t.value;
  if(t.dataset.draft){ S.st.drafts[t.dataset.draft]=t.value; const wc=wordCount(t.value); const el=$("#wc"); if(el){ el.textContent=wc+" words · aim for 30, at least 25"; el.style.color=wc>=25?"var(--ok)":"var(--muted)"; } const wk=$("#wcheck"); if(wk) wk.innerHTML=writeCheckHtml(t.value); clearTimeout(t._s); t._s=setTimeout(save,800); }
  if(t.dataset.imp) S.importText[t.dataset.imp]=t.value;
  if(t.dataset.cards) S.cardText[t.dataset.cards]=t.value;
  if(t.dataset.mtask&&S.mock) S.mock.task=t.value;
  if(t.dataset.set==="rate"){ S.st.rate=+t.value; const l=t.previousElementSibling; if(l) l.querySelector("span").textContent=(+t.value).toFixed(2)+"×"; clearTimeout(t._s); t._s=setTimeout(save,500); }
});
document.addEventListener("submit", e=>{
  if(e.target.id==="authForm"){ e.preventDefault(); submitAuth(); }
  if(e.target.id==="liveText"){ e.preventDefault(); const i=$("#liveTextIn"); const v=i&&i.value.trim(); if(v&&S.live&&S.live.sess){ S.live.sess.sendText(v); S.live.log.push({role:"you",text:v}); i.value=""; drawLiveLog(); } }
});
document.addEventListener("change", e=>{
  const t=e.target;
  if(t.dataset.count&&S.mock){ S.mock.counts[t.dataset.count]=+t.value; }
  if(t.dataset.rub&&S.mock){ S.mock.rub[t.dataset.rub]=+t.value; render(); }
  if(t.dataset.spr&&S.mock){ S.mock.sp[t.dataset.spr]=+t.value; S.mock.spOverride=null; render(); }
  if(t.dataset.pt){ const i=t.dataset.pt.lastIndexOf(":"); S.st.drafts[t.dataset.pt.slice(0,i)+":p"+t.dataset.pt.slice(i+1)]=t.checked; save(); }
  if(t.dataset.upload){ const files=[...t.files]; if(files.length) uploadFiles(+t.dataset.upload, files); }
  if(t.dataset.set==="tutorVoice"){ S.st.tutorVoice=t.value; save(); }
  if(t.dataset.store && (t.type==="radio"||t.tagName==="SELECT")) S.ans[t.dataset.store]=t.value;
  if(t.dataset.multi){ const k=t.dataset.multi; const arr=new Set(S.ans[k]||[]); t.checked?arr.add(t.value):arr.delete(t.value); S.ans[k]=[...arr]; }
  if(t.dataset.chk){ if(t.checked) S.st.done[t.dataset.chk]=Date.now(); else delete S.st.done[t.dataset.chk]; save(); }
  if(t.dataset.set==="voice"){ S.st.voice=t.value; save(); speak("Grüß Gott!"); }
  if(t.dataset.set==="strict"){ S.st.strict=t.checked; save(); }
  if(t.dataset.set==="start"){ if(/^\d{4}-\d{2}-\d{2}$/.test(t.value)){ S.st.start=t.value; save(); render(); } else toast("Use the format YYYY-MM-DD"); }
});

/* ---------- boot ---------- */
(async function boot(){
  S.dayN=currentDay();
  render();
  await Promise.all([loadIndex(), initHealth(), loadExtras()]);
  await initAuth();
  for(const n of S.published) if(n<=currentDay()+1) getDay(n);
  await getDay(S.dayN);
  render();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
})();
