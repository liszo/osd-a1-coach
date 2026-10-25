import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { CONFIG } from "./config.js";
import { LiveSession } from "./live.js";
/* ---------- constants ---------- */
const DEFAULT_EXAM = "2026-12-12";             // Sat 12 Dec 2026 = 21 Azar 1405 (changeable in Settings)
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
 {t:"Review + mini-test 3", fa:"مرور و آزمونک ۳", g:"everything from Days 16–21", k:"review"},
 {t:"Übungstest A: first full practice exam", fa:"Übungstest A: اولین آزمون کامل تمرینی", g:"all four skills, in the app", k:"mock"},
 {t:"Fix Übungstest A + Lesen strategies", fa:"رفع اشکال Übungstest A + استراتژی خواندن", g:"", k:"review"},
 {t:"Hören strategies: numbers, spelling, announcements", fa:"استراتژی شنیدن: اعداد، هجی، اطلاعیه", g:"", k:"review"},
 {t:"Schreiben drill: forms + emails", fa:"تمرین نوشتن: فرم و ایمیل", g:"", k:"review"},
 {t:"Sprechen: all three parts with the tutor", fa:"صحبت: هر سه بخش با مربی", g:"", k:"review"},
 {t:"Buffer: weakest skill", fa:"روز جبرانی: ضعیف‌ترین مهارت", g:"", k:"buffer"},
 {t:"MOCK 1: official ÖSD model test", fa:"آزمون آزمایشی ۱: نمونه رسمی ÖSD", g:"timed, all four skills", k:"mock"},
 {t:"Fix mock 1", fa:"رفع اشکال آزمون ۱", g:"", k:"review"},
 {t:"Vocabulary sweep 1: Days 1–13", fa:"مرور کامل لغات ۱: روزهای ۱ تا ۱۳", g:"", k:"review"},
 {t:"Vocabulary sweep 2: Days 16–21", fa:"مرور کامل لغات ۲: روزهای ۱۶ تا ۲۱", g:"", k:"review"},
 {t:"Grammar review: verb endings, articles, question words", fa:"مرور دستور: پایانه فعل، حروف تعریف، کلمات پرسشی", g:"", k:"review"},
 {t:"Lesen + Hören timed sets", fa:"خواندن و شنیدن زمان‌دار", g:"", k:"review"},
 {t:"Schreiben + Sprechen bootcamp", fa:"اردوی نوشتن و صحبت", g:"", k:"review"},
 {t:"Buffer: catch up", fa:"روز جبرانی", g:"", k:"buffer"},
 {t:"MOCK 2: official ZA1/Österreich model test", fa:"آزمون آزمایشی ۲: نمونه رسمی اتریش", g:"timed", k:"mock"},
 {t:"Fix mock 2", fa:"رفع اشکال آزمون ۲", g:"", k:"review"},
 {t:"Sprechen exam simulation day", fa:"روز شبیه‌سازی آزمون شفاهی", g:"", k:"review"},
 {t:"Hören intensive: notes, numbers, spelling", fa:"تمرین فشرده شنیدن: یادداشت، اعداد، هجی", g:"", k:"review"},
 {t:"Schreiben email bootcamp", fa:"اردوی ایمیل‌نویسی", g:"", k:"review"},
 {t:"Buffer: weakest skill", fa:"روز جبرانی: ضعیف‌ترین مهارت", g:"", k:"buffer"},
 {t:"MOCK 3: Übungssatz 1", fa:"آزمون آزمایشی ۳", g:"timed", k:"mock"},
 {t:"Fix mock 3 + weak spots", fa:"رفع اشکال آزمون ۳ + نقاط ضعف", g:"", k:"review"},
 {t:"Full vocabulary + phrases sweep", fa:"مرور کامل لغات و عبارات", g:"", k:"review"},
 {t:"Lesen + Hören mixed practice", fa:"تمرین ترکیبی خواندن و شنیدن", g:"", k:"review"},
 {t:"FINAL timed mock", fa:"آزمون نهایی زمان‌دار", g:"exam conditions", k:"mock"},
 {t:"Fix final mock: targeted repair", fa:"رفع اشکال آزمون نهایی", g:"", k:"review"},
 {t:"Buffer: targeted repair", fa:"روز جبرانی", g:"", k:"buffer"},
 {t:"Sprechen warm-up + light review", fa:"گرم کردن صحبت + مرور سبک", g:"", k:"buffer"},
 {t:"Light review + exam logistics", fa:"مرور سبک + آماده‌سازی روز آزمون", g:"", k:"buffer"},
 {t:"Rest", fa:"استراحت", g:"", k:"rest"}
];

const STEPS = [   // minutes for a 3-hour day; scaled by Settings → daily study time
 {id:"review",     en:"Review cards",   de:"Wiederholen", min:15, has:()=>true},
 {id:"media",      en:"Listen & watch", de:"Einstimmen",  min:10, has:d=>d.media||d.watch},
 {id:"learn",      en:"Learn",          de:"Lernen",      min:25, has:d=>d.vocab||d.grammar||d.alphabet},
 {id:"practice",   en:"Practice",       de:"Üben",        min:15, has:d=>d.exercises&&d.exercises.length},
 {id:"drill",      en:"Grammar gym",    de:"Grammatik",   min:10, has:d=>!!(d.vocab||d.exercises)},
 {id:"hoertrainer",en:"Hör-Trainer",    de:"Zahlen & Namen", min:10, has:()=>true},
 {id:"hoeren",     en:"Listening",      de:"Hören",       min:20, has:d=>d.hoeren},
 {id:"diktat",     en:"Dictation",      de:"Diktat",      min:10, has:d=>d.diktat&&d.diktat.length},
 {id:"lesen",      en:"Reading",        de:"Lesen",       min:10, has:d=>d.lesen},
 {id:"schreiben",  en:"Writing",        de:"Schreiben",   min:15, has:d=>d.schreiben},
 {id:"sprechen",   en:"Speaking",       de:"Sprechen",    min:10, has:d=>d.sprechen},
 {id:"quiz",       en:"Daily quiz",     de:"Quiz",        min:5,  has:d=>d.review_quiz&&d.review_quiz.length},
 {id:"tutor",      en:"Tutor session",  de:"Mit der Tutorin", min:25, has:()=>true}
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
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
 home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 3l9 8"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 flame:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c.6 3.2 2.5 4.8 4.2 6.6C18 10.5 19 12.6 19 15a7 7 0 0 1-14 0c0-2.4 1.1-4.2 2.6-5.6.3 1.6 1 2.8 2.2 3.4C9.3 9.3 10.4 5.2 12 2z"/><path fill="#fff" fill-opacity=".55" d="M12 13c.4 1.4 1.4 2.1 2.1 3a3 3 0 0 1-2.1 5 3 3 0 0 1-3-3c0-1.6 1-2.7 3-5z"/></svg>',
 bolt:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 2 4.5 13.5H11L9.8 22l9.7-12.3H13z"/></svg>',
 cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 flagAT:'<svg viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#c8102e"/><rect y="6.67" width="30" height="6.67" fill="#fff"/></svg>',
 book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h14v14H6.5A2.5 2.5 0 0 0 4 19.5zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
 star:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
 headph:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path fill="currentColor" d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>',
 pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
 bookopen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>',
 mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
 trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4"/><path fill="currentColor" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a4 4 0 0 1-4 4M7 5H4v2a4 4 0 0 0 4 4"/></svg>',
 chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
 bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
 cup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>',
 turtle:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 15c0-4 3.6-7 8-7s8 3 8 7z"/><circle cx="20.5" cy="12.5" r="2.2" fill="currentColor"/><rect x="4.5" y="15" width="3.2" height="3.6" rx="1.2" fill="currentColor"/><rect x="13.5" y="15" width="3.2" height="3.6" rx="1.2" fill="currentColor"/><path d="M7 11.5h8M9 9l-1 5M13 9l1 5" stroke="#fff" stroke-opacity=".45" stroke-width="1.3"/></svg>',
 target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
 abc:'<span class="glyph">Aa</span>',
 chest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path fill="currentColor" fill-opacity=".25" d="M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2zM3 10h18"/><rect x="10" y="9" width="4" height="5" rx="1" fill="currentColor"/></svg>'
};

/* ---------- state ---------- */
function defaultState(){ return {v:1, updatedAt:0, start:DEFAULT_START, lang:"both", strict:true, rate:0.9, voice:"", tutorVoice:"Kore", decks:{}, mocks:{}, xp:{}, sfx:true, goal:100, coins:0, freezes:1, freezeDays:[], boostUntil:0, badges:{}, stats:{}, daily:{}, league:{tier:0,week:""}, blitzBest:0, done:{}, results:{}, srs:{}, intro:{}, mistakes:[], drafts:{}, grades:{}, live:{}}; }
const S = { st: defaultState(), uid:null, email:"", sync:"local", ai:false, liveModel:"",
  published:new Set(), imported:{}, days:{}, view:"today", dayN:null, step:null,
  ans:{}, checked:{}, plays:{}, wo:{}, ex:{}, fc:null, timer:null, gradeBusy:false, checkBusy:false, importText:{},
  authMode:"signin", authBusy:false, authMsg:"", offline:false, att:{}, attBusy:false, cardText:{}, pron:{}, live:null, liveMode:"coach", installEvt:null, confirmDel:null, mock:null, mockData:{}, austria:null, mix:null, rec:{}, recActive:null, testPrefix:"", les:null, fin:null, cel:[], report:null, sess:null, transcript:null, saveBusy:false, blitz:null, pop:null, brk:null, fcFrom:null, stepAt:0 };

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
  if(uid && changed){ S.att={}; await pullRemote(); await pullLibrary(); }
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
  S.imported[n]=content; delete S.days[n]; Object.keys(S.days).forEach(k=>{ if(S.days[k]&&S.days[k].synthetic) delete S.days[k]; });
  lsSet("osd-a1-imported", JSON.stringify(S.imported));
  if(S.uid){ const { error } = await sb.from("days").upsert({ user_id:S.uid, day:n, content, updated_at:new Date().toISOString() }); if(error) toast("Saved on this device. Sync failed: "+error.message); }
}
/* ---------- utilities ---------- */
const $ = s=>document.querySelector(s);
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function attr(s){ return esc(s); }
function pad(n){ return String(n).padStart(2,"0"); }
function todayMid(){ const t=new Date(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()); }
function startDate(){ const [y,m,d]=(S.st.start||DEFAULT_START).split("-").map(Number); return new Date(y,m-1,d); }
const SKIP_ORDER = [49, 42, 36, 28, 15, 50, 45, 32, 31];   // buffers first, then sweeps, when time runs short
function examDate(){ const [y,m,d]=(S.st.exam||DEFAULT_EXAM).split("-").map(Number); return new Date(y,m-1,d); }
function examEve(){ const e=examDate(); return new Date(e.getFullYear(),e.getMonth(),e.getDate()-1); }
function examShort(){ return examDate().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }
function examLong(){ return examDate().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
function examFa(){ try{ return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(examDate()); }catch(e){ return ""; } }
function dayHours(){ return +S.st.dayHours||3; }
function anchorInfo(){ const a=S.st.anchor; if(a&&a.n&&a.date){ const [y,m,d]=a.date.split("-").map(Number); return {n:a.n, date:new Date(y,m-1,d)}; } return {n:1, date:startDate()}; }
function schedule(){ const key=[S.st.start||DEFAULT_START, S.st.anchor?S.st.anchor.n+"@"+S.st.anchor.date:"", S.st.exam||""].join("|"); if(schedule._k===key) return schedule._v;
  const A=anchorInfo(); const span=Math.round((examEve()-A.date)/DAY_MS)+1; const remaining=PLAN.length-A.n+1;
  const cand=SKIP_ORDER.filter(n=>n>=A.n); const extra=Math.max(0, Math.min(cand.length, remaining-span)); const drop=cand.slice(0,extra);
  const list=[]; for(let n=A.n;n<=PLAN.length;n++) if(!drop.includes(n)) list.push(n);
  schedule._k=key; schedule._v={list, drop, anchorN:A.n, anchorDate:A.date, short:Math.max(0,remaining-span-extra), spare:Math.max(0,span-remaining)}; return schedule._v; }
function isSkipped(n){ return schedule().drop.includes(n); }
function dateOf(n){ const P=schedule(); if(n<P.anchorN){ const s=startDate(); return new Date(s.getFullYear(), s.getMonth(), s.getDate()+n-1); }
  let i=P.list.indexOf(n); if(i<0){ i=P.list.findIndex(x=>x>n); if(i<0) i=P.list.length-1; } const a=P.anchorDate; return new Date(a.getFullYear(), a.getMonth(), a.getDate()+i); }
function currentDay(){ const P=schedule(); const t=todayMid();
  if(t<P.anchorDate){ const n=Math.floor((t-startDate())/DAY_MS)+1; return Math.max(1,Math.min(Math.max(1,P.anchorN-1),n)); }
  const i=Math.floor((t-P.anchorDate)/DAY_MS); return P.list[Math.max(0,Math.min(P.list.length-1,i))]; }
function replanTo(n){ S.st.anchor={n, date:dk(new Date())}; schedule._k=null; S.dayN=currentDay(); save(); }
function daysLeft(){ return Math.round((examDate() - todayMid())/DAY_MS); }
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
function hasDay(n){ const o=S.imported[n]; if(PLAN[n-1]&&PLAN[n-1].k!=="lesson") return true; return S.published.has(n) || !!(o && (o.vocab||o.lesen||o.hoeren||o.schreiben)); }
async function getDay(n){
  if(S.days[n]) return S.days[n];
  let base=null;
  if(S.published.has(n)){ try{ const r=await fetch(`days/day${pad(n)}.json`); if(r.ok) base=await r.json(); }catch(e){} }
  const ov=S.imported[n];
  if(!base && !(ov && (ov.vocab||ov.lesen||ov.hoeren||ov.schreiben))){ if(PLAN[n-1]&&PLAN[n-1].k!=="lesson"){ const sd=await buildSynthetic(n); S.days[n]=sd; return sd; } return null; }
  S.days[n]=Object.assign({}, base||{}, ov||{});
  return S.days[n];
}
function stepsFor(d){ return STEPS.filter(s=>s.has(d)); }
function dayProgress(n, d){ if(!d) return {done:0,total:0,min:0,minTotal:0};
  if(d.synthetic){ const N=synthNodes(n,d); let done=0,min=0,minT=0; N.forEach(nd=>{ minT+=nd.min; if(nodeDone(n,nd)){ done++; min+=nd.min; } }); return {done,total:N.length,min,minTotal:minT}; }
  const st=stepsFor(d); let done=0,min=0,minT=0; st.forEach(s=>{ minT+=s.min; if(S.st.done[n+":"+s.id]){ done++; min+=s.min; }
    else if(s.id==="learn"||s.id==="practice"){ const parts=s.id==="learn"?learnParts(d):practiceParts(d); if(parts.length>1){ const k=parts.filter((p,pi)=>S.st.done[`${n}:${s.id}#${pi}`]).length; min+=Math.round(s.min*k/parts.length); } } });
  return {done,total:st.length,min,minTotal:minT}; }

/* ---------- SRS ---------- */
function cardsForDay(n, d){ const out=[]; (d.vocab||[]).forEach(v=>out.push({id:"v:"+v.de, day:n, kind:"v", ...v})); (d.phrases||[]).forEach(p=>out.push({id:"p:"+p.de, day:n, kind:"p", ...p}));
  (d.flashcards||[]).forEach(c=>out.push({id:"x:"+c.front, day:n, kind:"x", de:c.front, en:c.back, fa:c.fa||"", plural:c.plural||"", example_de:c.example||"", article:"-"})); return out; }
function allCards(){ const out=[]; Object.keys(S.st.intro).forEach(k=>{ const n=+k; const d=S.days[n]; if(d) out.push(...cardsForDay(n,d)); });
  if(S.st.decks&&S.st.decks.austria&&S.austria) S.austria.cards.forEach(c=>out.push({id:"a:"+c.de, kind:"a", ...c}));
  const seenQ=new Set(); (S.st.mistakes||[]).forEach(m=>{ if(m.q&&m.right&&!["number","phone","time","price","day","spelled_name"].includes(m.kind)&&!seenQ.has(m.q)&&seenQ.size<80){ seenQ.add(m.q); out.push({id:"m:"+m.q, kind:"m", de:m.kind==="speaking"?"Say it correctly: "+m.q:m.q, en:m.right, article:"-", fa:""}); } }); const seen=new Set(); return out.filter(c=>!seen.has(c.id)&&seen.add(c.id)); }
function srsCounts(){ const now=Date.now(); let due=0,fresh=0,learned=0; allCards().forEach(c=>{ const r=S.st.srs[c.id]; if(!r) fresh++; else if(r.due<=now) due++; else learned++; }); return {due,fresh,learned}; }
function grade(card, q){ const now=Date.now(); const r=S.st.srs[card.id]||{ef:2.5,ivl:0,reps:0,lapses:0,due:now};
  if(q<3){ r.reps=0; r.ivl=0; r.lapses++; r.due=now+10*60000; }
  else { r.reps++; r.ivl = r.reps===1 ? (q===5?3:1) : r.reps===2 ? (q===3?2:q===5?6:4) : Math.max(1,Math.round(r.ivl*r.ef*(q===3?0.8:q===5?1.3:1)));
         r.ef=Math.max(1.3, r.ef+0.1-(5-q)*(0.08+(5-q)*0.02)); r.due=now+r.ivl*DAY_MS; }
  S.st.srs[card.id]=r; save(); }
function nextLabel(card,q){ const r=S.st.srs[card.id]; if(q<3) return "10 min"; const reps=(r?r.reps:0)+1; const ivl=reps===1?(q===5?3:1):reps===2?(q===3?2:q===5?6:4):Math.max(1,Math.round((r?r.ivl:1)*(r?r.ef:2.5)*(q===3?0.8:q===5?1.3:1))); return ivl+" d"; }

/* ---------- mistakes ---------- */
function logMistake(day, src, q, your, right, kind){ S.st.mistakes.unshift({day,src,q,your,right,kind:kind||undefined,at:Date.now()}); if(S.st.mistakes.length>300) S.st.mistakes.length=300; save(); }

/* ---------- rendering: shell ---------- */
const TABS=[["today","Learn","home"],["plan","Plan","plan"],["review","Review","review"],["exam","Exam","exam"],["progress","Progress","progress"]];
function renderTabs(){ if(!S.uid && !S.offline){ $("#tabs").innerHTML=""; return; } $("#tabs").innerHTML = `<div class="brand">ÖSD <b>A1</b></div>`+TABS.map(([id,nm,ic])=>`<button data-act="tab" data-v="${id}" ${S.view===id?'aria-current="page"':""}>${ICONS[ic]}<span>${nm}</span></button>`).join("")+`<button data-act="tab" data-v="shop" class="side-only" ${S.view==="shop"?'aria-current="page"':""}>${COIN}<span>Shop</span></button>`+`<button data-act="tab" data-v="settings" class="side-only" ${S.view==="settings"?'aria-current="page"':""}>${ICONS.settings}<span>Settings</span></button>`; }
function renderCountdown(){ const top=$("#top"); if(!top) return; top.hidden=!S.uid&&!S.offline; if(top.hidden) return;
  const n=daysLeft(), st=streak(), xp=xpToday(), studied=studiedToday();
  top.innerHTML = `<button class="stat day" data-act="day" data-v="${currentDay()}" title="Day ${currentDay()} of ${PLAN.length}">${ICONS.flagAT}<span><i class="tag">Tag </i>${currentDay()}</span></button>
    <button class="stat streak ${studied?"on":""}" data-act="tab" data-v="progress" title="${st}-day streak" aria-label="${st}-day streak">${ICONS.flame}<span class="tnum">${st}</span></button>
    <button class="stat xp ${xp?"on":""}" data-act="tab" data-v="progress" title="XP today (goal ${goalXp()})" aria-label="${xp} XP today">${ICONS.bolt}<span class="tnum">${xp}</span>${boostOn()?`<em class="boost">2×</em>`:""}</button>
    <button class="stat coins" data-act="tab" data-v="shop" title="Schilling · open the shop" aria-label="${S.st.coins||0} Schilling, open shop">${COIN}<span class="tnum">${S.st.coins||0}</span></button>
    <button class="stat cd" data-act="tab" data-v="exam" title="Days to the exam, ${examShort()} · ${fmtFa(examDate())}" aria-label="${n} days to the exam">${ICONS.cal}<span class="tnum">${n>0?n:n===0?"Heute":"✓"}</span></button>
    <button class="stat gear" data-act="tab" data-v="settings" aria-label="Settings" title="Settings">${ICONS.settings}</button>`; }

async function render(){
  SAY_BANK.length=0;
  renderTabs(); renderCountdown();
  const app=$("#app");
  let html="";
  const authed=!!(S.uid||S.offline);
  if(authed && !S.les && !S.blitz && !S.live && !(S.mock&&S.view==="exam")) checkBadges();
  const showCel = authed && !S.live && !S.les && !S.blitz && !S.fin && S.cel && S.cel.length && !(S.mock&&S.view==="exam");
  const lesson = authed && !S.live && !!(S.eye || S.les || S.blitz || S.fin || showCel || S.report || (S.view==="today" && S.step) || (S.view==="review" && S.fc));
  document.body.classList.toggle("lesson-mode", lesson);
  try{
    if(!S.uid && !S.offline) html = vAuth();
    else if(S.live) html = vLive();
    else if(S.eye && eyeData()) html = vEye();
    else if(S.les) html = vLesson();
    else if(S.blitz) html = vBlitz();
    else if(S.fin) html = vFinish();
    else if(showCel) html = vCel();
    else if(S.report) html = vReport();
    else if(S.view==="shop") html = vShop();
    else if(S.view==="speaking") html = vSpeaking();
    else if(S.view==="today") html = await vToday();
    else if(S.view==="plan") html = vPlan();
    else if(S.mock && S.view==="exam") html = await vMock();
    else if(S.view==="review") html = await vReview();
    else if(S.view==="exam") html = vExam();
    else if(S.view==="progress") html = await vProgress();
    else if(S.view==="settings") html = vSettings();
  }catch(e){ html = `<div class="banner">Something went wrong while drawing this page: ${esc(e.message)}</div>`; }
  app.innerHTML = html + (S.brk ? breakSheet() : "");
  if(S.live) drawLiveLog();
  if(S.les) lesAfterRender();
  if(S.brk) tickBreak();
  tickTimer(); tickMock();
}

/* ---------- Today / day view ---------- */
async function vToday(){
  const n = S.dayN || currentDay();
  const p = PLAN[n-1];
  const d = await getDay(n);
  if(d && S.step) return vStep(n,d,S.step);
  const date=dateOf(n); const pr=d?dayProgress(n,d):null; const pct=pr&&pr.minTotal?Math.round(pr.min/pr.minTotal*100):0;
  const banner = `<section class="unit" style="${uStyle(n)}">
    <div class="unit-row"><button class="navb" data-act="day" data-v="${n-1}" ${n<=1?"disabled":""} aria-label="Previous day">${ICONS.back}</button>
      <div class="grow"><div class="ul">Unit ${unitOf(n).i} · Day ${n} of ${PLAN.length} · ${fmtDate(date)}${n===currentDay()?" · today":""}</div><h1>${esc(d&&d.title||p.t)}</h1>${S.st.lang!=="en"?`<div class="fa">${esc(d&&d.title_fa||p.fa)} · ${fmtFa(date)}</div>`:""}</div>
      <button class="navb" data-act="day" data-v="${n+1}" ${n>=PLAN.length?"disabled":""} aria-label="Next day">${ICONS.next}</button></div>
    ${d?`<div class="row" style="gap:12px;flex-wrap:nowrap"><div class="grow"><div class="ubar" role="progressbar" aria-label="Day progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="small tnum" style="margin-top:4px;opacity:.92">${pr.done}/${pr.total} steps · ${pr.min} / ${pr.minTotal} min</div></div>${d.synthetic?"":`<button class="guide" data-act="step" data-v="guide">${ICONS.book}Guidebook</button>`}</div>`:""}
    ${p.g?`<div class="ug"><b>${p.k==="lesson"?"Grammar":"Focus"}:</b> ${esc(p.g)}</div>`:""}
    ${n!==currentDay()?`<div><button class="guide" data-act="day" data-v="${currentDay()}">Back to today</button></div>`:""}
  </section>`;
  if(!d) return banner + mockCta(n) + resCard(n) + pendingPanel(n);
  if(S.uid&&S.ai&&!S.varBusy) setTimeout(()=>ensureVariants(n),1500);
  const cb = n===currentDay() ? comebackCard(n) : "";
  return draftBanner() + cb + (n===currentDay()?replanCard(n):"") + banner + (n===currentDay()&&!cb?ediSays(n):"") + (d.synthetic?synthIntro(n,d):"") + pathHtml(n,d) + recapCard(n) + reportCard(n) + questsCard(n,d) + leagueCard(true) + mockCta(n) + tutorMini(n) + resCard(n) + (installHint()?`<div class="row">${installHint()}<span class="small muted">Add the app to your home screen.</span></div>`:"");
}
function progressBar(n,d){ const pr=dayProgress(n,d); const pct=pr.minTotal?Math.round(pr.min/pr.minTotal*100):0;
  return `<div class="stack" style="gap:6px"><div class="row between small"><span>${pr.done}/${pr.total} steps</span><span class="tnum muted">${pr.min} / ${pr.minTotal} min</span></div><div class="meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>`; }

function stepShell(n, d, s, body){
  const key=n+":"+s.id, done=S.st.done[key];
  const t=S.timer&&S.timer.key===key?S.timer:null;
  const remaining = t ? (t.running? Math.max(0,t.endAt-Date.now()) : t.left) : s.min*60000;
  const I=NODE_INFO[s.id]||[s.en];
  return `<div class="les"><div class="les-top"><button class="xbtn" data-act="back" aria-label="Close">${ICONS.x}</button>
      <div class="grow"><div class="label">Day ${n} · ${s.de}</div><h2>${esc(I[0])}</h2></div>
      <button class="tpill" data-act="timer" data-key="${key}" data-min="${s.min}" aria-label="${t&&t.running?"Pause timer":"Start timer"}">${t&&t.running?ICONS.pause:ICONS.play}<span id="timerTxt" data-key="${key}">${fmtMs(remaining)}</span></button></div>
    <div class="les-body">${body}</div>
    <div class="les-foot"><div class="in">${done?`<button class="btn" data-act="done" data-key="${key}">Mark as not done</button><button class="btn primary big" id="lesBtn" data-act="back">Continue</button>`
      :`<span class="small muted">${ex("Work through every part, then complete the step.","همه بخش‌ها را انجام بده و بعد مرحله را تمام کن.")}</span><button class="btn primary big" data-act="task-done" data-key="${key}" data-step="${s.id}">Complete +15 XP</button>`}</div></div></div>`;
}
function fmtMs(ms){ const t=Math.ceil(ms/1000); return pad(Math.floor(t/60))+":"+pad(t%60); }
function tickTimer(){ clearInterval(tickTimer._i); if(!S.timer||!S.timer.running) return; tickTimer._i=setInterval(()=>{ const el=$("#timerTxt"); if(!S.timer||!S.timer.running){ clearInterval(tickTimer._i); return; } const left=S.timer.endAt-Date.now();
  if(el && el.dataset.key===S.timer.key) el.textContent=fmtMs(Math.max(0,left));
  if(left<=0){ S.timer.running=false; S.timer.left=0; clearInterval(tickTimer._i); toast("Time's up for this step"); } }, 500); }

async function vStep(n, d, id){
  if(id==="guide") return guideShell(n,d);
  const s=STEPS.find(x=>x.id===id); if(!s){ S.step=null; return vToday(); }
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
  return `<button class="btn sm ${dis?"":"primary"}" data-act="play" data-key="${key}" data-i="${i}" data-max="${max}" ${dis?"disabled":""}>${ICONS.play}${esc(label||"Play")}${left}</button>`+(unlimited?`<button class="btn sm" data-act="play" data-key="${key}" data-i="${i}" data-max="${max}" data-slow="1" title="Play slowly">${ICONS.turtle}slow</button>`:"");
}
function stHoeren(n,d){
  const H=d.hoeren; let h=`<div class="banner info"><div>${ex(`Exam mode is ${S.st.strict?"ON":"OFF"}: the audio plays exactly as often as in the real exam (Teil 1 and 3 once, Teil 2 twice). After you check your answers you can replay freely and read the transcript.`,"در حالت آزمون، صدا دقیقاً به تعداد آزمون واقعی پخش می‌شود (بخش ۱ و ۳ یک بار، بخش ۲ دو بار). بعد از تصحیح، می‌توانی آزادانه گوش کنی و متن را ببینی.")}</div></div>`;
  if(H.teil1){ const g=n+":h1"; const T=H.teil1; const chk=S.checked[g];
    let sc=0; T.texts.forEach(t=>{ if(S.ans[g+":"+t.n]===t.answer) sc++; });
    h+=`<section class="card stack"><div class="label">Hören · Teil 1 · played once</div><h2>Welches Bild passt?</h2>
      <p class="small">${ex("You hear 5 short texts. Match each text to a picture. One picture is extra.","۵ متن کوتاه می‌شنوی. هر متن را به یک تصویر وصل کن. یک تصویر اضافه است.")}</p>
      ${T.audio?offPlayer(g,d.set,T.audio):""}
      ${pics(T.pictures, d.set)}
      ${T.texts.map(t=>`<div class="row" style="padding-top:8px;border-top:1px solid var(--line)"><b style="width:56px">Text ${t.n}</b>${T.audio?"":playBtn(g+"|"+t.n, t.script, 1)}
        <select data-store="${g}:${t.n}" aria-label="Picture for text ${t.n}" style="width:auto;min-width:90px" class="${chk?(S.ans[g+":"+t.n]===t.answer?"inp-ok":"inp-bad"):""}" ${chk?"disabled":""}><option value="">–</option>${T.pictures.map(p=>`<option ${S.ans[g+":"+t.n]===p.id?"selected":""}>${esc(p.id)}</option>`).join("")}</select>
        ${chk&&S.ans[g+":"+t.n]!==t.answer?`<span class="chip ok">${esc(t.answer)}</span>`:""}</div>
        ${chk&&t.script?`<div class="sunk small">${t.script.map(l=>esc(l.text_de)).join("<br>")}</div>`:""}`).join("")}
      ${checkRow(g, chk, sc, T.texts.length, n, "hoeren-1")}</section>`; }
  if(H.teil2){ const g=n+":h2"; const T=H.teil2; const chk=S.checked[g]; let sc=0;
    const okField=(f,i)=>noteOk(f, S.ans[g+":"+i]||"");
    T.note_fields.forEach((f,i)=>{ if(okField(f,i)) sc++; });
    h+=`<section class="card stack"><div class="label">Hören · Teil 2 · played twice</div><h2>Notizen</h2>
      <p class="small">${ex((T.intro_de?T.intro_de+" ":"")+"Write the key information on the note sheet. Spelled names and phone numbers must be 100% correct, or the line gets 0 points.","اطلاعات مهم را روی برگه یادداشت بنویس. اسم‌های هجی‌شده و شماره تلفن باید کاملاً درست باشند، وگرنه آن خط صفر می‌گیرد.")}</p>
      ${T.audio?offPlayer(g,d.set,T.audio):`<div>${playBtn(g+"|msg", T.script, 2, "Play message")}</div>`}
      <div class="sunk stack"><div class="label">Notizblatt</div>${T.given?`<div class="small"><i>${esc(T.given)}</i> <span class="muted">(example, already filled in)</span></div>`:""}${T.note_fields.map((f,i)=>`<div class="field"><label for="nf${i}">${esc(f.label_de)}${f.exact?' <span class="chip warn">exact</span>':""}</label>
        <input type="text" id="nf${i}" data-store="${g}:${i}" value="${attr(S.ans[g+":"+i]||"")}" ${chk?"disabled":""} class="${chk?(okField(f,i)?"inp-ok":"inp-bad"):""}" autocomplete="off" spellcheck="false">
        ${chk&&!okField(f,i)?`<span class="small" style="color:var(--ok)">→ ${esc(f.answer)}</span>`:""}</div>`).join("")}</div>
      ${chk&&T.script?`<div class="sunk small">${T.script.map(l=>esc(l.text_de)).join("<br>")}</div>`:""}
      ${checkRow(g, chk, sc, T.note_fields.length, n, "hoeren-2")}</section>`; }
  if(H.teil3){ const g=n+":h3"; const T=H.teil3; const chk=S.checked[g]; let sc=0; T.people.forEach((p,i)=>{ if(S.ans[g+":"+i]===p.answer) sc++; });
    const allLines = T.audio?[]:T.people.map(p=>({voice:p.voice, text_de:p.name.replace(/Person/,"Person")+". "+p.text_de}));
    h+=`<section class="card stack"><div class="label">Hören · Teil 3 · played once</div><h2>${esc(T.question_de)}</h2>
      <p class="small">${ex("Five people answer the same question. Tick one answer per person. Watch out: people sometimes mention an option and then reject it.","پنج نفر به یک سؤال جواب می‌دهند. برای هر نفر فقط یک گزینه علامت بزن. مراقب باش: گاهی کسی گزینه‌ای را نام می‌برد ولی ردش می‌کند.")}</p>
      ${T.audio?offPlayer(g,d.set,T.audio):`<div>${playBtn(g+"|all", allLines, 1, "Play all 5")}</div>`}
      <div class="matrix"><table><tr><th></th>${T.options.map(o=>`<th>${esc(o)}</th>`).join("")}</tr>
      ${T.people.map((p,i)=>`<tr><td><b>${esc(p.name)}</b>${chk&&p.text_de?`<div class="small muted" style="max-width:220px">${esc(p.text_de)}</div>`:""}</td>${T.options.map(o=>{ const sel=S.ans[g+":"+i]===o; const mark=chk?(o===p.answer?"background:var(--ok-soft)":sel?"background:var(--bad-soft)":""):"";
        return `<td style="${mark}"><input type="radio" name="${g}-${i}" data-store="${g}:${i}" value="${attr(o)}" ${sel?"checked":""} ${chk?"disabled":""} aria-label="${attr(p.name+": "+o)}"></td>`; }).join("")}</tr>`).join("")}</table></div>
      ${checkRow(g, chk, sc, T.people.length, n, "hoeren-3")}</section>`; }
  return h;
}
function pics(list, set){ return `<div class="pics ${set?"real":""}">${list.map(p=>{ const im=picImg(p,set); return `<div class="pic"><div class="id">${esc(p.id)}</div>${im||`<div class="e" aria-hidden="true">${esc(p.emoji||"▢")}</div>`}${im?"":`<div class="lb">${esc(p.label_en||"")}</div>`}</div>`; }).join("")}</div>`; }
function isTest(g){ return S.testPrefix && String(g).startsWith(S.testPrefix); }
function checkRow(g, chk, sc, total, n, rk){
  if(isTest(g) && !chk) return "";
  if(chk){ const k=n+":"+rk; if(!S.st.results[k]||S.st.results[k].score!==sc){ S.st.results[k]={score:sc,total,at:Date.now()}; save(); } }
  const tp=taskPts(sc,total);
  return `<div class="row">${chk?`<span class="chip ${sc>=total*0.6?"ok":"bad"} tnum">${sc} / ${total}${tp!=null?` · ${tp} of 10 pts`:""}</span><button class="btn sm" data-act="uncheck" data-g="${g}">Try again</button>`:`<button class="btn primary" data-act="check" data-g="${g}">Check answers</button>`}</div>`;
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
        ${chk&&String(S.ans[g+":"+s.id])!==String(T.answers[s.id])?`<span class="chip ok">${esc(T.answers[s.id])}</span>`:""}</div>${chk&&T.why&&T.why[s.id]?`<div class="small muted" style="margin:-2px 0 4px 22px">${esc(T.why[s.id])}</div>`:""}`).join("")}
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
      ${pics(T.pictures, d.set)}
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
    const fOk=f=>formOk(f,S.ans[g+":"+f.id]);
    T.fields.forEach(f=>{ sc+=formPts(f,S.ans[g+":"+f.id]); }); const tot=T.fields.reduce((s,f)=>s+formMax(f),0);
    if(chk&&!isTest(g)){ const rk=n+":schreiben-1"; if(!S.st.results[rk]||S.st.results[rk].score!==sc){ S.st.results[rk]={score:sc,total:tot,at:Date.now()}; save(); } }
    h+=`<section class="card stack"><div class="label">Schreiben · Teil 1 · Formular</div><h2>${esc(T.title||"Formular ausfüllen")}</h2>
      <p>${esc(T.situation_de)}</p><p class="small muted">${esc(T.situation_en||"")}</p>
      <div class="notice">${esc(T.profile_de)}</div>
      <div class="grid2">${T.fields.map(f=>{ const v=S.ans[g+":"+f.id]; const cls=chk?(fOk(f)?"inp-ok":"inp-bad"):"";
        let ctl="";
        if(f.type==="given") ctl=`<input type="text" value="${attr(f.answer)}" disabled aria-label="${attr(f.label_de)}">`;
        else if(f.type==="text") ctl=`<input type="text" id="${g}-${f.id}" data-store="${g}:${f.id}" value="${attr(v||"")}" ${chk?"disabled":""} class="${cls}" autocomplete="off">`;
        else if(f.type==="choice") ctl=`<div class="checks ${cls}" style="padding:6px;border-radius:8px">${f.options.map(o=>`<label><input type="radio" name="${g}-${f.id}" data-store="${g}:${f.id}" value="${attr(o)}" ${v===o?"checked":""} ${chk?"disabled":""}> ${esc(o)}</label>`).join("")}</div>`;
        else ctl=`<div class="checks ${cls}" style="padding:6px;border-radius:8px">${f.options.map(o=>`<label><input type="checkbox" data-multi="${g}:${f.id}" value="${attr(o)}" ${(v||[]).includes(o)?"checked":""} ${chk?"disabled":""}> ${esc(o)}</label>`).join("")}</div>`;
        return `<div class="field"><span class="lb">${esc(f.label_de)}</span>${ctl}${chk&&!fOk(f)?`<span class="small" style="color:var(--ok)">→ ${esc(Array.isArray(f.answer)?f.answer.join(", "):f.answer)}</span>`:""}</div>`; }).join("")}</div>
      <div class="row">${chk?`<span class="chip ${sc>=tot*0.6?"ok":"bad"} tnum">${sc}/${tot}${tot===10?` · ${PSA1(sc)} of 5 pts`:""}</span><button class="btn sm" data-act="uncheck" data-g="${g}">Try again</button>`:isTest(g)?"":`<button class="btn primary" data-act="check" data-g="${g}">Check form</button>`}</div></section>`; }
  if(W.teil2){ const T=W.teil2; const dk=n+":email"; const txt=S.st.drafts[dk]||""; const wc=(txt.match(/[A-Za-zÄÖÜäöüß0-9-]+/g)||[]).length; const gr=S.st.grades[dk];
    h+=`<section class="card stack"><div class="label">Schreiben · Teil 2 · E-Mail · 10 points, you need 4</div><h2>Antworten Sie ${esc(T.email_from||"")}</h2>
      ${T.situation_de?`<p class="small">${esc(T.situation_de)}</p>`:""}
      <div class="mail"><div class="hd">Von: ${esc(T.email_from||"")}${T.subject?` · Betreff: ${esc(T.subject)}`:""}</div><div class="bd">${esc(T.email_de)}</div></div>
      <p><b>${esc(T.task_de)}</b></p><p class="small muted">${esc(T.task_en||"")}</p>
      <div class="row">${(T.points_de||[]).map(p=>`<span class="chip acc">${esc(p)}</span>`).join("")}</div>
      ${T.intro_de?`<div class="mail preprint"><div class="bd">${esc(T.intro_de)}</div><div class="small muted">${ex("Printed on the answer sheet. Not counted: write about 30 words of your own below, then a sign-off.","روی برگه چاپ شده و شمرده نمی‌شود: حدود ۳۰ کلمه خودت زیرش بنویس و بعد خداحافظی.")}</div></div>`:""}
      <textarea id="emailTxt" data-draft="${dk}" ${T.intro_de?'data-intro="1"':""} aria-label="Your email" placeholder="${T.intro_de?"Ich …":"Hallo "+attr(T.email_from||"")+", …"}" spellcheck="false">${esc(txt)}</textarea>
      <div id="wcheck" class="wcheck">${writeCheckHtml(txt, T.intro_de)}</div>
      <div class="checks">${(T.points_de||[]).map((p,pi)=>`<label><input type="checkbox" data-pt="${dk}:${pi}" ${S.st.drafts[dk+":p"+pi]?"checked":""}> ${esc(p)} answered</label>`).join("")}</div>
      <div class="row between"><span class="small tnum" id="wc" style="color:${wc>=25?"var(--ok)":"var(--muted)"}">${wc} words · aim for 30, at least 25</span>
        <div class="row">${isTest(dk)?"":S.ai&&S.uid?`<button class="btn primary" data-act="grade" data-n="${n}" ${S.gradeBusy?"disabled":""}>${S.gradeBusy?"The examiner is reading…":"Get examiner feedback"}</button>`:`<span class="small muted">${S.uid?"Feedback needs GEMINI_API_KEY on the server.":"Sign in to get feedback."}</span>`}</div></div>
      ${gr&&!isTest(dk)?gradeView(gr):""}
      ${isTest(dk)?"":`<details class="acc"><summary>Useful phrases</summary><div class="in stack">${(T.useful_phrases||[]).map(p=>`<div class="row" style="flex-wrap:nowrap">${sayBtn(p.replace(/…/g,""))}<span>${esc(p)}</span></div>`).join("")}</div></details>
      <details class="acc"><summary>Model answer (try first!)</summary><div class="in stack"><div class="mail"><div class="bd">${esc(T.intro_de&&/^(hallo|hi|liebe|lieber)\b/i.test(T.model_answer_de||"")?String(T.model_answer_de).split("\n").slice(1).join("\n"):T.model_answer_de)}</div></div>${ex(T.notes_en,T.notes_fa)}</div></details>`}
    </section>`; }
  return h;
}
function wordCount(t){ return (String(t||"").match(/[A-Za-zÄÖÜäöüß0-9-]+/g)||[]).length; }
function writeCheckHtml(txt, intro){
  const lines=String(txt||"").trim().split(/\n+/).filter(Boolean); const wc=wordCount(txt);
  const greet=!!intro||/^(hallo|hi|liebe|lieber|sehr geehrte|grüß|servus)/i.test(lines[0]||"");
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
    const r=await api("/api/ai",{mode:"grade", payload:{from:T.email_from, email:T.email_de, task:T.task_de, points:T.points_de, wordTarget:T.word_target||30, text:txt, intro:T.intro_de||"", day:n}});
    const g=r.result; if(g && typeof g==="object"){ g.score=Number(g.score)||0; S.st.grades[dk]=g; save(); }
  }catch(e){ toast("Feedback failed: "+e.message); }
  S.gradeBusy=false; render();
}
/* Sprechen */
function stSprechen(n,d){
  const P=d.sprechen; let h=tutorCard(n)+oralVideoCard(n===27||n===39);
  if(P.teil1){ const T=P.teil1;
    h+=`<section class="card stack"><div class="label">Sprechen · Teil 1 · Sich vorstellen</div><h2>Introduce yourself</h2>
      <p class="small">${ex("In the exam you pick 4 of these 6 topics and say a few sentences about each. The examiner may then ask follow-up questions, often 'please spell your name'. The sentences below are a model, not a text to memorise: under the 2026 ÖSD rules a memorised ready-made text counts as plagiarism. Practise saying it in your own words from the keywords.","در آزمون ۴ موضوع از این ۶ موضوع را انتخاب می‌کنی و درباره هر کدام چند جمله می‌گویی. ممتحن بعد سؤال می‌پرسد، معمولاً «اسمتان را هجی کنید». جمله‌های زیر نمونه‌اند، نه متنی برای حفظ کردن: طبق قوانین ۲۰۲۶ ÖSD، متن آماده حفظ‌شده سرقت ادبی حساب می‌شود. با کلیدواژه‌ها و با جمله‌های خودت تمرین کن.")}</p>
      <div class="row">${T.topics.map(t=>`<span class="chip ${(T.today_topics||[]).includes(t)?"acc":""}">${esc(t)}</span>`).join("")}</div>
      <div class="sunk stack"><div class="row between"><div class="label">Model sentences</div>${(()=>{const i=SAY_BANK.push({lines:T.my_script.map(l=>({text_de:l.tts||l.de}))})-1; return `<button class="btn sm primary" data-act="sayall" data-i="${i}">${ICONS.play}Play all</button>`;})()}</div>
        ${T.my_script.map((l,li)=>{ const pk=n+":pron:"+li; return `<div class="stack" style="gap:4px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(l.tts||l.de,{slow:true})}<button class="say" data-act="pron" data-k="${pk}" data-t="${attr(l.de)}" title="Say it and check" aria-label="Say it and check">${ICONS.mic}</button>${recBtns(pk, l.tts||l.de)}<div><b>${esc(l.de)}</b><br><span class="small muted">${esc(l.en)}</span></div></div>${pronView(pk)}</div>`; }).join("")}</div>
      ${speakKeywords(T.my_script).length?`<div class="sunk small"><b>${ex("Your keywords","کلیدواژه‌های تو")}:</b> ${speakKeywords(T.my_script).map(esc).join(" · ")}</div>`:""}
      <p class="small">${ex("1) Shadow each model sentence twice. 2) Hide the sentences and talk about each topic from the keywords only, with your own words. 3) Change one detail each time (another hobby, another time), the way the examiner's follow-up questions will push you.","۱) هر جمله نمونه را دو بار سایه‌خوانی کن. ۲) جمله‌ها را نبین و فقط با کلیدواژه‌ها و جمله‌های خودت درباره هر موضوع حرف بزن. ۳) هر بار یک جزئیات را عوض کن، همان‌طور که سؤال‌های ممتحن تو را وادار می‌کند.")}</p>
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
const KIND_DESC={conjugation:"verb endings (ich -e, du -st, er/sie -t; the forms of sein and haben)",article:"der/die/das",question_word:"question words (wo / woher / wohin, wie / was / wer)",word_order:"word order (verb in position 2; verb first in yes/no questions)",gap:"choosing the right word or verb form in a sentence",translate:"translating short sentences into German",write:"writing words from memory with their article","hoeren-notes":"catching names, numbers and times in Hören Teil 2",number:"numbers",phone:"phone numbers",time:"clock times",price:"prices",day:"days of the week",spelled_name:"spelled names",speaking:"speaking accuracy",mcq:"recognising meanings",form:"filling in forms"};
function weakForPrompt(){ const since=Date.now()-28*DAY_MS; const mis=(S.st.mistakes||[]).filter(m=>(m.at||0)>=since); const c={}; mis.forEach(m=>{ const k=mistakeKind(m); c[k]=(c[k]||0)+1; });
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k])=>KIND_DESC[k]||k); const rights=[...new Set(mis.filter(m=>m.right&&String(m.right).length<50&&m.kind!=="speaking").map(m=>m.right))].slice(0,10);
  return {top: top.length?top:["verb endings","der/die/das","wo / woher","word order"], rights}; }
function planLine(n){ return `Day ${n} of my ${PLAN.length}-day ÖSD Zertifikat A1 plan (${dayHours()} hours of study a day; exam on ${examLong()})`; }
function prevThemes(n){ return PLAN.slice(0,n-1).filter(p=>p.k==="lesson").map(p=>p.t).join("; ") || "nothing yet"; }
function prompt2A(n){ const p=PLAN[n-1]; const W=weakForPrompt(); return `${planLine(n)}. Theme: ${p.t}. Grammar: ${p.g||"review"}. Already covered: ${prevThemes(n)}.
My weak points so far: ${W.top.join("; ")}.${W.rights.length?` Things I recently got wrong (correct versions): ${W.rights.join(" | ")}.`:""}
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
Rules: I study ${dayHours()} hours a day, so keep it focused. vocab ${dayHours()>=4?"20–24":dayHours()>=3?"14–18":"10–12"} high-frequency A1 items for this theme (only words the ÖSD A1 exam really uses). phrases ${dayHours()>=3?"8–12":"6–8"} ready-to-use chunks. pronunciation 1 item. grammar 1–2 short topics. exercises exactly ${dayHours()>=3?16:12}: ${dayHours()>=3?"8":"6"} on today's theme, ${dayHours()>=3?"5":"4"} that train my weak points above using today's words (verb endings and der/die/das first), and ${dayHours()>=3?"3":"2"} revising earlier days. For word_order, the prompt is the words separated by " · " and options is []. For translate, options is [] and accept lists every correct version.`; }
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
- hoeren.teil2: ONE answering-machine message with 5 note fields (what, day, time, place, phone number or a spelled name). Played twice. Set "exact": true for spelled names and numbers, and "digits": true for phone numbers. In "tts", write spelled letters as letter names (Pe. Ö. El.) and digits as words; read phone numbers in pairs, the way Austrians do (null sechs sechs vier, zwölf, vierunddreißig …). This is my weakest part, so keep the message slow and clear.
- hoeren.teil3: 5 people answer one question; 4 options; at least one person mentions an option and then rejects it. Played once.
- diktat: 5 short sentences (5–8 words) using today's words and verb forms.`; }
function prompt2C(n){ return `Now create the Schreiben, Sprechen and review quiz for Day ${n} in the EXACT ÖSD Zertifikat A1 formats below, using only language from Days 1–${n}. About me: my name is Raam, I'm from Tehran, Iran, I speak Persian and English, I'm married, I work as a web developer.
Output ONLY one JSON code block:
{
 "day": ${n},
 "schreiben": {
   "teil1": {"situation_de":"","situation_en":"","profile_de":"","fields":[{"id":"f1","label_de":"","type":"text|choice|multi","options":[""],"answer":"","accept":[""]}]},
   "teil2": {"email_from":"","email_de":"","task_de":"Antworten Sie … Schreiben Sie circa 30 Wörter.","task_en":"","points_de":["","",""],"word_target":30,"intro_de":"","model_answer_de":"","useful_phrases":[""],"notes_en":"","notes_fa":""}
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
- schreiben.teil2: reply to a short PERSONAL email (informal, du) with exactly 3 questions, like the official ÖSD task. intro_de is the opening the exam prints on the answer sheet, e.g. "Liebe Anna,\nvielen Dank für dein E-Mail. …" (one short sentence). model_answer_de continues after intro_de: about 30 words, one sentence per question, then a sign-off (Liebe Grüße + name).
- sprechen.teil1.my_script: 4–6 short MODEL sentences about ME on today's topics (simple patterns I can vary). The 2026 ÖSD rules treat memorised ready-made texts as plagiarism, so keep them flexible, not a speech.
- live_brief: an English prompt for Gemini Live: act as my ÖSD A1 examiner, today's topics, slow A1 German, ask follow-up questions so I can't just recite, correct my mistakes, give a score out of 25 at the end.
- review_quiz: 8 items, 5 from today and 3 from earlier days.`; }
function promptCards(n){ const p=PLAN[n-1]; return `DATA TABLE (Studio → Data Table → describe):
Flashcards for Day ${n} of my ÖSD A1 plan: ${p.t}. ${dayHours()>=3?20:15} rows, A1 high-frequency only. Columns: German (nouns with der/die/das) | Plural | English | Persian | Example (short A1 sentence).
Then: ⋮ → Export to Google Sheets → select the cells → copy → paste into the app (Day ${n} → Listen & watch → Add flashcards).`; }
function promptStudio(n){ const p=PLAN[n-1]; return `AUDIO OVERVIEW (Brief, English):
Day ${n}: ${p.t}${p.g?" + "+p.g:""}, for an absolute beginner (Persian native, English B2) preparing for ÖSD A1 on ${examLong()}. Keep it under 8 minutes. Say every German word slowly, twice. Cover only this topic. End with 5 phrases for me to repeat.

VIDEO OVERVIEW (Explainer):
Explain ${p.g||p.t} to an absolute beginner. Colour-code der = blue, die = red, das = green. 6 examples with English. Common mistakes.

INFOGRAPHIC (Portrait):
One-page cheat sheet for ${p.g||p.t} at A1 level, with a table and examples.`; }
function promptMock(n){ return `Create a COMPLETE ÖSD Zertifikat A1 mock exam (mock for Day ${n} of ${PLAN.length}), using only A1 language. Use the exact JSON shape from my Prompt 2B and 2C, but with full exam item counts: Lesen Teil 1 = 5 situations + 6 ads, Teil 2 = 3 texts × 2, Teil 3 = 5 texts + 6 pictures; Hören Teil 1 = 5 texts, Teil 2 = 1 message with 5 fields, Teil 3 = 5 people; Schreiben Teil 1 = 10 fields, Teil 2 = 1 email; Sprechen Teil 1–3 including the photo scene and a role-play. Skip vocab/exercises. Make it different from all earlier days.`; }

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
  const row=(p,n)=>{ const d=S.days[n]; const av=hasDay(n); const pr=d?dayProgress(n,d):null; const dt=dateOf(n);
    const isDone=!!(pr&&pr.total&&pr.done===pr.total), part=!!(pr&&pr.done&&!isDone); const pct=pr&&pr.minTotal?Math.round(pr.min/pr.minTotal*100):0;
    const chip = isSkipped(n) ? `<span class="chip">optional</span>` : p.k==="mock" ? `<span class="chip at">mock</span>` : p.k==="buffer"||p.k==="rest" ? `<span class="chip warn">${p.k}</span>` : av ? (isDone?`<span class="chip gold">done</span>`:part?`<span class="chip acc tnum">${pct}%</span>`:`<span class="chip ok">ready</span>`) : `<span class="chip">prompts</span>`;
    return `<button class="pday ${n===cur?"today":""} ${isDone?"isdone":part?"part":""} kind-${p.k}" data-act="day" data-v="${n}"><span class="dn tnum">${isDone?ICONS.check.replace('<svg','<svg width="22" height="22"'):n}</span>
      <span style="min-width:0"><span class="dt">${dt.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}${n===cur?" · TODAY":""}${S.st.lang!=="en"?` · <span class="fa">${fmtFa(dt)}</span>`:""}</span><br><b>${esc(p.t)}</b>${p.g?`<br><span class="small muted">${esc(p.g)}</span>`:""}</span>${chip}</button>`; };
  return `<div><h1>${PLAN.length} days to A1</h1><p class="muted">${ex(`Five units: ${PLAN.filter(p=>p.k==="lesson").length} lesson days, ${PLAN.filter(p=>p.k==="mock").length} mock exams, review and buffer days, about ${dayHours()} hours a day. Review, buffer and mock days build themselves from what you have learned.`,`پنج بخش: ${PLAN.filter(p=>p.k==="lesson").length} روز درس، ${PLAN.filter(p=>p.k==="mock").length} آزمون آزمایشی و روزهای مرور، روزی حدود ${dayHours()} ساعت.`)}</p></div>
  ${UNITS.map(u=>`<section class="stack" style="--u:${u.c};--ud:${u.cd}"><div class="unit"><div class="ul">Unit ${u.i} · Days ${u.a}–${u.b}</div><h2>${esc(u.t)}</h2><div class="small" style="opacity:.92">${esc(u.d)}</div></div>
    <div class="plan">${PLAN.slice(u.a-1,u.b).map((p,j)=>row(p,u.a+j)).join("")}</div></section>`).join("")}
  <div class="pday exam"><span class="dn">${ICONS.trophy.replace('<svg','<svg width="24" height="24"')}</span><span><span class="dt">${examShort()}${S.st.lang!=="en"?` · <span class="fa">${examFa()}</span>`:""}</span><br><b>ÖSD Zertifikat A1</b><br><span class="small muted">Divan Institute, Tehran</span></span><span class="chip at">exam</span></div>`;
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
  const pct=Math.round(f.seen/(f.seen+f.queue.length)*100);
  return `<div class="les"><div class="les-top"><button class="xbtn" data-act="fc-end" aria-label="End session">${ICONS.x}</button><div class="grow"><div class="lbar"><i style="width:${Math.max(3,pct)}%"></i></div></div><span class="small muted tnum">${f.queue.length} left</span></div>
    <div class="les-body"><h1 class="les-h">${f.mode==="de"?"Do you know this?":"How do you say this in German?"}</h1>
    <div class="card fcard">${f.mode==="de"||f.show?`<div>${sayBtn(deFull,{slow:true})}</div>`:""}${front}${f.show?back:""}</div>
    ${card.kind==="m"?`<p class="small muted">${ex("From your mistakes list.","از فهرست اشتباهاتت.")}</p>`:""}</div>
    <div class="les-foot"><div class="in">${f.show?`<div class="grades">${[["Again",1],["Hard",3],["Good",4],["Easy",5]].map(([nm,q])=>`<button class="btn q${q}" data-act="fc-grade" data-q="${q}">${nm}<small>${nextLabel(card,q)}</small></button>`).join("")}</div>`
      :`<span class="small muted">${ex("Say the answer out loud first.","اول جواب را بلند بگو.")}</span><button class="btn blue big" id="lesBtn" data-act="fc-show">Show answer</button>`}</div></div></div>`;
}
function mistakesView(){ const m=S.st.mistakes; return `<div class="card stack"><div class="row between"><h2>My mistakes</h2>${m.length?`<button class="btn sm" data-act="clear-mist">Clear</button>`:""}</div>
  ${m.length?m.filter(x=>x.q&&x.right).slice(0,40).map(x=>`<div class="sunk small"><span class="label">Day ${x.day} · ${esc(x.src)}</span><br><b>${esc(x.q)}</b><br><span style="color:var(--bad)">${esc(x.your||"–")}</span> → <span style="color:var(--ok)">${esc(x.right)}</span></div>`).join(""):`<p class="small muted">Wrong answers from Practice, Quiz and Mixed review collect here and become flashcards automatically.</p>`}</div>`; }
function startFc(mode){ const now=Date.now(); const all=allCards(); const due=all.filter(c=>S.st.srs[c.id]&&S.st.srs[c.id].due<=now).sort((a,b)=>S.st.srs[a.id].due-S.st.srs[b.id].due); const fresh=all.filter(c=>!S.st.srs[c.id]).slice(0,25); S.fc={mode, queue:[...due,...fresh], show:false, seen:0, good:0, at:Date.now()}; }

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
 22:{t:"Mini-test 3 covers Days 16–21. Clear My mistakes in Review first.",k:[]},
 23:{t:"Übungstest A: the full interactive practice exam in the app (Exam → Übungstest A). Do it in one sitting, like the real exam.",k:[]},
 24:{t:"Lesen strategies: read the task first, find the keyword, one ad is always a distractor.",k:[]},
 25:{t:"Hören strategies: read the note sheet first and predict what kind of word goes in each line (day, time, number, name).",k:["ythoeren","kurs"]},
 26:{t:"Write 3 messages of ~30 words. Then mark the real learner emails in Examiner's eye (Exam tab) to see what examiners reward.",k:["muster"]},
 27:{t:"Official oral video + 2 samples. Then a 25-minute exam-mode session with the tutor.",k:["oral","ytsprech","ytsprech2","sprechpdf"]},
 28:{t:"Buffer: repeat your weakest exam part from an earlier day, then clear My mistakes.",k:[]},
 29:{t:"MOCK 1: the official ÖSD ZA1 Modellsatz with its real recordings, marked automatically. Add the ZIP files once in Exam → Official ÖSD model tests. Afterwards: Examiner's eye E-Mails A–C (same task).",k:["osd"]},
 30:{t:"Work only on what mock 1 showed: redo the wrong items and drill the weakest part.",k:[]},
 31:{t:"Vocabulary sweep: Review cards in both directions, then Wörter-Blitz until 20+.",k:[]},
 32:{t:"Vocabulary sweep: the Austrian words deck plus Days 16–21.",k:["kurs"]},
 33:{t:"Grammar review: verb endings (ich/du/er), der/die/das, wo/woher/wohin, word order.",k:["nicos"]},
 34:{t:"Timed Lesen and Hören sets: Sprachportal practice tests.",k:["sptests"]},
 35:{t:"Write two emails, then speak Teil 1–3 with the tutor in exam mode.",k:["muster","oral"]},
 36:{t:"Buffer day: catch up first, then rest.",k:[]},
 37:{t:"MOCK 2: the official ÖSD ZA1/Österreich Modellsatz (different content) with its real recordings. From now on Hören days replay both official recordings slowly with transcripts.",k:["osd"]},
 38:{t:"Fix mock 2: redo the wrong items, drill the weakest part.",k:[]},
 39:{t:"Speaking day: 10-minute prep → oral with the tutor, three times.",k:["oral","ytsprech","ytsprech2"]},
 40:{t:"Hören intensive: notes, numbers, spelled names.",k:["goethe","ythoeren"]},
 41:{t:"Email bootcamp: 4 short emails, each checked by the examiner AI.",k:["muster"]},
 42:{t:"Buffer day.",k:[]},
 43:{t:"MOCK 3: ÖSD Übungsmaterialien Band 1, Übungssatz 1. No book? Redo Übungstest A, or modellsatz.de.",k:["testsam","modell"]},
 44:{t:"Weak spots: work from My mistakes and your mock results.",k:[]},
 45:{t:"Full sweep: all cards, all phrases, your Sprechen script.",k:[]},
 46:{t:"Mixed Lesen + Hören practice.",k:["sptests"]},
 47:{t:"FINAL MOCK: Übungssatz 2, or the ÖSD Digital Test-Training, at the same time of day as your exam.",k:["testsam","digital"]},
 48:{t:"Redo only the items you got wrong.",k:[]},
 49:{t:"Buffer: targeted repair.",k:[]},
 50:{t:"Cards only, plus listening to your Sprechen script.",k:[]},
 51:{t:"Pack passport/ID and a non-erasable pen; check the route to Divan.",k:[]},
 52:{t:"Rest. Sleep well.",k:[]}
};
function resCard(n){ const r=DAYRES[n]; if(!r) return "";
  return `<details class="acc" ${PLAN[n-1].k!=="lesson"?"open":""}><summary>Extra resources for Day ${n}</summary><div class="in stack"><p class="small">${esc(r.t)}</p>${r.k.map(k=>`<a class="reslink" href="${LINKS[k][1]}" target="_blank" rel="noopener">${esc(LINKS[k][0])}</a>`).join("")}</div></details>`; }

/* ---------- mock exams (ÖSD scoring) ---------- */
const MOCKS=[
 {id:"m1", day:29, short:"Mock 1", title:"Mock 1 · Official ÖSD ZA1 Modellsatz", kind:"paper", official:"za1", how:"The official ZA1 model test with the real recordings, marked with the official key. Add the ZIP files once in the Exam tab; without them you can do it on paper and enter your results.", links:["osd"]},
 {id:"m2", day:37, short:"Mock 2", title:"Mock 2 · Official ÖSD ZA1/Österreich Modellsatz", kind:"paper", official:"za1oe", how:"The second official set (Austrian variant, different content), with its real recordings and official marking.", links:["osd"]},
 {id:"m3", day:43, short:"Mock 3", title:"Mock 3 · ÖSD Übungsmaterialien Band 1, Übungssatz 1", kind:"paper", alt:true, how:"From the ÖSD practice book (audio on testsam.at). No book? Take Übungstest A in the app instead.", links:["testsam","modell"]},
 {id:"m4", day:47, short:"Final mock", title:"Final mock · Übungssatz 2 or ÖSD Digital Test-Training", kind:"paper", how:"Do it at the same time of day as your exam, without breaks except after Hören.", links:["testsam","digital"]},
 {id:"ta", day:23, short:"Übungstest A", title:"Übungstest A · interactive, in the app", kind:"app", file:"days/mock-a.json", how:"An original practice test written for this app in the exact ZA1 format, marked automatically."}
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
function noteOk(f,v){ v=String(v||""); const acc=(f.accept&&f.accept.length?f.accept:[f.answer]); if(f.digits){ const d=v.replace(/\D/g,""); if(d!=="") return acc.concat([f.answer]).some(x=>String(x).replace(/\D/g,"")===d); return acc.some(x=>!/\d/.test(x)&&norm(x)===norm(v)&&norm(v)!==""); } if(f.exact) return acc.some(x=>normKeepUml(x)===normKeepUml(v)); return acc.some(x=>closeEnough(x,v)); }
function countApp(id, D){ const a=S.ans, c={}; const L=D.lesen, H=D.hoeren;
  c.la1=L.teil1.situations.filter(s=>String(a[id+":l1:"+s.id])===String(L.teil1.answers[s.id])).length;
  c.la2=0; L.teil2.forEach((t,ti)=>t.items.forEach((it,ii)=>{ if(a[id+":l2:"+ti+":"+ii]===it.answer) c.la2++; }));
  c.la3=L.teil3.texts.filter(t=>a[id+":l3:"+t.n]===L.teil3.answers[t.n]).length;
  c.ha1=H.teil1.texts.filter(t=>a[id+":h1:"+t.n]===t.answer).length;
  c.ha2=H.teil2.note_fields.filter((f,i)=>noteOk(f,a[id+":h2:"+i])).length;
  c.ha3=H.teil3.people.filter((p,i)=>a[id+":h3:"+i]===p.answer).length;
  c.sa1=D.schreiben.teil1.fields.reduce((s,f)=>s+formPts(f,a[id+":s1:"+f.id]),0);
  return c; }
function answeredApp(id, D){ const a=S.ans, out={};
  out.lesen=[D.lesen.teil1.situations.filter(s=>a[id+":l1:"+s.id]).length+"/5", D.lesen.teil2.reduce((n,t,ti)=>n+t.items.filter((x,ii)=>a[id+":l2:"+ti+":"+ii]).length,0)+"/6", D.lesen.teil3.texts.filter(t=>a[id+":l3:"+t.n]).length+"/5"];
  out.hoeren=[D.hoeren.teil1.texts.filter(t=>a[id+":h1:"+t.n]).length+"/5", D.hoeren.teil2.note_fields.filter((f,i)=>(a[id+":h2:"+i]||"").trim()).length+"/5", D.hoeren.teil3.people.filter((p,i)=>a[id+":h3:"+i]).length+"/5"];
  const sf=D.schreiben.teil1.fields.filter(f=>f.type!=="given"); out.schreiben=[sf.filter(f=>{ const v=a[id+":s1:"+f.id]; return Array.isArray(v)?v.length:v; }).length+"/"+sf.length, wordCount(S.st.drafts[id+":email"])+" words"];
  return out; }

function mk(m){ return m.official&&offReady(m.official)?"app":m.kind; }
async function openMock(id){ const m=MOCKS.find(x=>x.id===id); if(!m) return; stopOffAudio();
  if(m.official&&S.uid){ if(!offData(m.official)) await pullLibrary(); await offStatus(m.official); if(offReady(m.official)){ S.mockData[id]=offData(m.official); await offUrls(m.official); } }
  if(mk(m)==="app"&&!S.mockData[id]){ try{ const r=await fetch(m.file); S.mockData[id]=await r.json(); }catch(e){ toast("Couldn't load the test. Check your connection."); return; } }
  const pre=id+":"; [S.ans,S.checked,S.plays].forEach(o=>Object.keys(o).forEach(k=>{ if(k.startsWith(pre)) delete o[k]; }));
  if(mk(m)==="app") delete S.st.drafts[id+":email"];
  S.mock={id, phase:"intro", flags:{}, counts:{la1:0,la2:0,la3:0,ha1:0,ha2:0,ha3:0,sa1:0}, rub:{k:1,t:1,l:2,f:2,points:3,len:30}, sp:{a1:2,a2:2,a3:2,lex:3,aus:2,form:2}, spOverride:null, sa2:null, photo:0, endAt:0, startedAt:Date.now()};
  S.testPrefix = mk(m)==="app" ? pre : "";
  S.view="exam"; render(); window.scrollTo(0,0); }
const ORDER={app:["intro","lesen","hoeren","schreiben","sheet","sprechen","result"], paper:["intro","lesen","hoeren","schreiben","enter","sprechen","result"]};
function mockGo(phase, keepTime){ const M=S.mock; M.phase=phase; if(!keepTime) M.endAt = PH_MIN[phase]? Date.now()+PH_MIN[phase]*60000 : 0;
  if(phase==="result") saveMockResult(); render(); window.scrollTo(0,0); }
function mockNext(){ const M=S.mock, m=MOCKS.find(x=>x.id===M.id), o=ORDER[mk(m)]; const i=o.indexOf(M.phase); if(i<o.length-1) mockGo(o[i+1]); }
function tickMock(){ clearInterval(tickMock._i); if(!S.mock||!S.mock.endAt) return;
  tickMock._i=setInterval(()=>{ const M=S.mock; const el=$("#mockTimer"); if(!M||!M.endAt){ clearInterval(tickMock._i); return; }
    const left=M.endAt-Date.now(); if(el) el.textContent=fmtMs(Math.max(0,left));
    if(left<=0){ clearInterval(tickMock._i); M.endAt=0; toast("Time is up for this part"); if(["lesen","hoeren","schreiben"].includes(M.phase)) mockNext(); else render(); } }, 500); }
function mockSa2(){ const M=S.mock; if(M.sa2!=null) return {score:M.sa2, ded:(M.sa2Detail&&M.sa2Detail.deductions)||[]}; const txt=S.st.drafts[M.id+":email"]||""; const words=txt.trim()?wordCount(txt):+M.rub.len; return sa2Score(M.rub, words); }
function mockSp(){ const M=S.mock; if(M.spOverride!=null) return M.spOverride; const s=M.sp; return (+s.a1)+(+s.a2)+(+s.a3)+(+s.lex)+(+s.aus)+(+s.form); }
function saveMockResult(){ const M=S.mock; const c=Object.assign({}, M.counts, {sa2:mockSa2().score, sp:mockSp()}); const r=computeResult(c);
  S.st.mocks[M.id]=Object.assign({at:Date.now(), counts:c}, r); { const mm=MOCKS.find(x=>x.id===M.id); if(mm&&mm.day) S.st.done[mm.day+":mock"]=S.st.done[mm.day+":mock"]||Date.now(); } save(); }
async function submitApp(){ const M=S.mock, D=S.mockData[M.id];
  ["l1","l2","l3","h1","h2","h3","s1"].forEach(g=>S.checked[M.id+":"+g]=true);
  M.counts=countApp(M.id, D); const txt=(S.st.drafts[M.id+":email"]||"").trim();
  mockGo("sprechen");
  if(S.ai&&S.uid&&txt.length>10){ M.grading=true; render();
    try{ const T=D.schreiben.teil2; const r=await api("/api/ai",{mode:"grade",payload:{from:T.email_from,email:T.email_de,task:T.task_de,points:T.points_de,wordTarget:30,text:txt,intro:T.intro_de||"",day:currentDay()}}); M.sa2=Math.max(0,Math.min(10,Number(r.result.score)||0)); M.sa2Detail=r.result; }
    catch(e){ toast("Writing grade failed: "+e.message+". Rate it yourself below."); }
    M.grading=false; render(); } }
async function gradePaperEmail(){ const M=S.mock; const txt=(S.st.drafts[M.id+":email"]||"").trim(); const task=(M.task||"").trim();
  if(txt.length<10){ toast("Type your email first"); return; }
  M.grading=true; render();
  try{ const r=await api("/api/ai",{mode:"grade",payload:{from:"the writer of the prompt email",email:task||"(task text not provided; judge whether 3 guiding points seem answered)",task:"Antworten Sie. Schreiben Sie circa 30 Wörter. Schreiben Sie zu allen drei Punkten.",points:[],wordTarget:30,text:txt,day:currentDay()}}); M.sa2=Math.max(0,Math.min(10,Number(r.result.score)||0)); M.sa2Detail=r.result; }
  catch(e){ toast("Grading failed: "+e.message); }
  M.grading=false; render(); }
function phaseBar(M, m){ const labels={intro:"Start",lesen:"Lesen",hoeren:"Hören",schreiben:"Schreiben",sheet:"Check",enter:"Enter score",sprechen:"Sprechen",result:"Results"}; const o=ORDER[mk(m)]; const cur=o.indexOf(M.phase);
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
      ${m.official&&!offReady(m.official)&&S.uid?`<div class="banner"><div>${ex("To take this test with the real recordings, add the official ZIP files once in the Exam tab (Official ÖSD model tests). Until then you can do it on paper.","برای انجام این آزمون با فایل‌های صوتی واقعی، یک بار فایل‌های ZIP رسمی را در تب Exam اضافه کن. تا آن موقع می‌توانی روی کاغذ انجامش بدهی.")}</div></div>`:""}
      ${mk(m)==="paper"?`<div class="banner info"><div>${esc(m.how)}<br>${ex("Write your answers on paper. After Schreiben you check with the answer key and enter how many you got right; the app converts them into official points.","جواب‌ها را روی کاغذ بنویس. بعد از نوشتن با کلید جواب چک کن و تعداد درست‌ها را وارد کن؛ اپ آن‌ها را به امتیاز رسمی تبدیل می‌کند.")}</div></div>
        <div class="stack">${(m.links||[]).map(k=>`<a class="reslink" href="${LINKS[k][1]}" target="_blank" rel="noopener">${esc(LINKS[k][0])}</a>`).join("")}</div>`
      :`<div class="banner info"><div>${esc(m.how)} ${ex("In test mode you get no feedback until you submit, exactly like the exam.","در حالت آزمون تا پایان هیچ بازخوردی نمی‌گیری، مثل آزمون واقعی.")}</div></div>`}
      <div><button class="btn primary" data-act="mock-next">Start Lesen (25:00)</button></div></section>`;
  } else if(M.phase==="lesen"){
    body = mk(m)==="app" ? stLesen(M.id, D)+`<section class="card stack"><div class="label">Flag for review</div>${flagRow("L",3)}<div><button class="btn primary" data-act="mock-next">Next: Hören</button></div></section>`
      : `<section class="card stack center-card"><h2>Lesen · 25 minutes</h2><p>${ex("Work through Lesen Aufgabe 1–3 in the PDF. Write answers on paper.","خواندن بخش ۱ تا ۳ را در PDF انجام بده و جواب‌ها را روی کاغذ بنویس.")}</p><div><button class="btn primary" data-act="mock-next">Done · go to Hören</button></div></section>`;
  } else if(M.phase==="hoeren"){
    body = mk(m)==="app" ? stHoeren(M.id, D)+`<section class="card stack"><div class="label">Flag for review</div>${flagRow("H",3)}<div><button class="btn primary" data-act="mock-next">Next: Schreiben</button></div></section>`
      : `<section class="card stack center-card"><h2>Hören · about 10 minutes</h2><p>${ex("Play the Modellsatz MP3 files in order without pausing. Teil 1 and 3 once, Teil 2 twice. 30 seconds to look at the tasks before each part.","فایل‌های صوتی را به ترتیب و بدون توقف پخش کن. بخش ۱ و ۳ یک بار، بخش ۲ دو بار.")}</p><div><button class="btn primary" data-act="mock-next">Done · go to Schreiben</button></div></section>`;
  } else if(M.phase==="schreiben"){
    body = mk(m)==="app" ? stSchreiben(M.id, D)+`<section class="card stack"><div><button class="btn primary" data-act="mock-next">Review my answers</button></div></section>`
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
    body=`${mk(m)==="app"&&M.sa2==null&&!M.grading?a2Panel(M,false):M.grading?`<div class="banner info">Gemini is grading your email…</div>`:""}
      <section class="card stack"><div class="row between"><h2>Sprechen · 10 minutes preparation</h2>${M.endAt?"":`<button class="btn sm" data-act="mock-prep">Start prep timer</button>`}</div>
      <p class="small">${ex("Prepare keywords (not full sentences). You may use your notes during the exam.","کلیدواژه آماده کن، نه جمله کامل. در آزمون می‌توانی از یادداشت‌ها استفاده کنی.")}</p>
      <div><b>Aufgabe 1</b> · pick 4: ${((D&&D.sprechen&&D.sprechen.teil1&&D.sprechen.teil1.topics)||["Sprachen","Hobbys","Sport","Familie","Beruf","Lieblingsessen"]).map(t=>`<span class="chip">${esc(t)}</span>`).join(" ")}</div>
      <div><b>Aufgabe 2</b> · ${photos?ex("choose one photo:","یک عکس انتخاب کن:"):ex("choose one of the three photos in your Modellsatz.","یکی از سه عکس Modellsatz را انتخاب کن.")} Was sehen Sie? · Wie viele Personen? · Wo? · Was machen sie?</div>
      ${photos?`<div class="grid3">${photos.map((p,i)=>`<button class="photo ${M.photo===i?"sel":""}" data-act="mock-photo" data-i="${i}">${picImg(p,D.set)||`<span class="e">${esc(p.emoji)}</span><span class="small">${esc(p.scene_en)}</span>`}</button>`).join("")}</div>
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
      ${mk(m)==="app"?`<details class="acc" data-keep="corr" ${S.keep.corr?"open":""}><summary>Show corrected answers</summary><div class="in stack">${stLesen(M.id,D)}${stHoeren(M.id,D)}${stSchreiben(M.id,D)}</div></details>`:""}
      <div class="row"><button class="btn primary" data-act="mock-exit">Done</button><button class="btn" data-act="mock-open" data-id="${M.id}">Take it again</button></div>`;
  }
  return head + body;
}

/* ---------- Exam centre ---------- */
function mockList(){ return `<section class="stack"><div class="row between"><h2>Mock exams</h2><span class="small muted">scored like the real ÖSD</span></div>
  ${MOCKS.map(m=>{ const r=S.st.mocks[m.id]; return `<div class="card stack"><div class="row between"><div style="min-width:0"><div class="label">${m.day?`Day ${m.day} · ${dateOf(m.day).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}`:"Any time"}</div><b>${esc(m.title)}</b></div><button class="btn ${r?"":"primary"} sm" data-act="mock-open" data-id="${m.id}">${r?"Retake":"Start"}</button></div><p class="small muted">${esc(m.how)}</p>${r?resultMini(r):""}</div>`; }).join("")}</section>`; }
function prepChecklist(){ const items=[
  ["Add both official Modellsatz ZIPs (ZA1 and ZA1/Österreich) in “Official ÖSD model tests” above","هر دو فایل ZIP نمونه آزمون رسمی را در بخش «Official ÖSD model tests» بالا اضافه کن","osd"],
  ["Download the Mustertexte ZA1 and the exam rules (Durchführungsbestimmungen)","نمونه نوشته‌ها و قوانین آزمون را دانلود کن","muster"],
  ["Check osd.at for the new 2026 Modellsatz brochure and note any changes","بروشور جدید ۲۰۲۶ را در osd.at بررسی کن","osdpage"],
  [`Ask Divan: is ${examLong()} on paper or digital? Is the oral exam the same day?`,"از مؤسسه دیوان بپرس: آزمون کاغذی است یا دیجیتال؟ شفاهی همان روز است؟",""],
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
function vExam(){ return `<div><h1>Exam centre</h1><p class="muted">ÖSD Zertifikat A1 · ${examLong()} · <span class="fa">${examFa()}</span> · Divan Institute, Tehran</p></div>
  ${officialCard()}${mockList()}${eyeCard()}${prepChecklist()}${oralVideoCard(false)}${examDayCard()}${scoringCard()}${resourcesCard()}${examFacts()}`; }

/* ---------- Review ---------- */
async function vReview(){
  if(S.fc) return await flashcardsView();
  if(S.mix) return `<div class="row between"><div><div class="label">Review</div><h1>Mixed review</h1></div><button class="btn sm" data-act="mix-end">Done</button></div>
    <p class="small muted">${ex("Questions from all your days, mixed. Mixing topics makes you choose the right rule, like in the exam.","سؤال‌ها از همه روزها، مخلوط. مخلوط کردن موضوع‌ها تو را مجبور می‌کند قانون درست را انتخاب کنی، مثل آزمون.")}</p>${stExercises("R", S.mix, "mix")}`;
  const deck = S.austria ? `<div class="card stack"><div class="row between"><h2>Austrian words</h2><button class="btn sm ${S.st.decks.austria?"":"primary"}" data-act="deck-austria">${S.st.decks.austria?"Remove from my cards":"Add to my cards"}</button></div><p class="small">${esc(S.austria.note_en)} ${S.austria.cards.length} words: ${S.austria.cards.slice(0,6).map(c=>esc(c.de)).join(", ")} …</p></div>` : "";
  const blitz = `<div class="card row blitz-card" style="flex-wrap:nowrap;gap:14px"><div style="color:var(--gold);flex:none">${ICONS.bolt.replace('<svg','<svg width="44" height="44"')}</div><div class="grow"><h2>Wörter-Blitz</h2><p class="small muted">${ex("60 seconds, as many words as you can. Best: "+(S.st.blitzBest||0),"۶۰ ثانیه، هر چند کلمه که می‌توانی.")}</p></div><button class="btn gold" data-act="blitz-start">Play</button></div>`;
  const mix = blitz + `<div class="card stack"><h2>Mixed review</h2><p class="small">${ex("15 random questions from every day you've studied. Best on Sundays and review days.","۱۵ سؤال تصادفی از همه روزهایی که خوانده‌ای. بهترین زمان: روزهای مرور.")}</p><div><button class="btn primary" data-act="mix-start">Start mixed review</button></div></div>`;
  return (await flashcardsView()) .replace('<div class="card stack"><div class="row between"><h2>My mistakes</h2>', mix + deck + '<div class="card stack"><div class="row between"><h2>My mistakes</h2>');
}
async function startMix(){ const items=[]; for(let n=1;n<=currentDay();n++){ if(!hasDay(n)) continue; const d=await getDay(n); if(!d) continue;
    (d.exercises||[]).forEach(e=>items.push(Object.assign({},e)));
    (d.review_quiz||[]).forEach(q=>items.push({type:"mcq",prompt:q.q,options:q.options,answer:q.answer,explain_en:q.explain_en})); }
  if(!items.length){ toast("Study at least one day first"); return; }
  const seed="mix"+Date.now(); startLesson({src:"mix", n:null, title:"Mixed review", screens:shuffled(items,seed).slice(0,15).map((it,i)=>exScreen(it,seed+i))}); }

/* ---------- Progress ---------- */
function studyDates(){ const set=new Set(); Object.entries(S.st.done).forEach(([k,v])=>{ if(typeof v==="number" && !k.startsWith("prep:")){ const d=new Date(v); set.add(d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()); } });
  Object.entries(S.st.xp||{}).forEach(([k,v])=>{ if(v>0){ const [y,m,dd]=k.split("-").map(Number); set.add(y+"-"+m+"-"+dd); } }); return set; }
function streak(){ const set=studyDates(); const fz=new Set(S.st.freezeDays||[]); const t=todayMid(); let s=0; let i=set.has(sdKey(t))?0:1;
  for(;i<400;i++){ const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); const k=sdKey(d); if(set.has(k)) s++; else if(fz.has(k)) continue; else break; } return s; }
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
  const tile=(ic,col,v,l)=>`<div class="tile"><div class="ti" style="color:${col}">${ICONS[ic]}</div><b class="tnum">${v}</b><span>${l}</span></div>`;
  const totalXp=Object.values(S.st.xp||{}).reduce((a,b)=>a+b,0);
  const wk=[...Array(7)].map((_,i)=>{ const t=new Date(); const dd=new Date(t.getFullYear(),t.getMonth(),t.getDate()-6+i); return {lb:dd.toLocaleDateString("en-GB",{weekday:"short"}), v:(S.st.xp||{})[dk(dd)]||0, today:i===6}; });
  const mx=Math.max(goalXp(), ...wk.map(x=>x.v));
  return `<div><h1>Fortschritt</h1><p class="muted">Day ${cur} of ${PLAN.length} · ${daysLeft()} days to the exam</p></div>
  <div class="card stack"><div class="meter"><i style="width:${pct}%"></i></div>
    <div class="tiles">${tile("flame","var(--orange)",streak(),"day streak")}${tile("bolt","var(--gold)",totalXp,"total XP")}${tile("trophy","var(--gold)",daysDone,"days complete")}${tile("clock","var(--blue)",Math.round(mins/60*10)/10+" h","studied")}${tile("cards","var(--purple)",c.learned+c.due,"cards in memory")}${tile("mic","var(--blue)",sessions.length,"tutor sessions")}</div></div>
  ${draftBanner()}${readinessCard()}${speakingCard()}${levelCard()}${leagueCard(false)}
  <section class="card stack"><div class="row between"><h2>XP this week</h2><span class="chip gold tnum">${wk.reduce((a,x)=>a+x.v,0)} XP</span></div>
    <div class="xpchart">${wk.map(x=>`<div class="xpcol ${x.today?"today":""}"><span class="tnum">${x.v||""}</span><i style="height:${Math.round(x.v/mx*100)}%"></i><b>${x.lb}</b></div>`).join("")}</div>
    <p class="small muted">Daily goal: ${goalXp()} XP · change it in Settings</p></section>
  <section class="card stack"><h2>Latest mock</h2>${last?`<div class="small muted">${esc((MOCKS.find(m=>m.id===last[0])||{}).title||last[0])}</div>${resultBlock(last[1])}`:`<p class="small muted">${ex("No mock yet. Try Übungstest A in the Exam tab any time; the official mocks are on Days 23, 29, 37, 43 and 47.","هنوز آزمون آزمایشی نداده‌ای. Übungstest A را هر وقت خواستی در تب Exam امتحان کن.")}</p><div><button class="btn sm" data-act="mock-open" data-id="ta">Start Übungstest A</button></div>`}</section>
  ${(()=>{ const reps=Object.entries(S.st.reports||{}).sort((a,b)=>b[0]-a[0]); if(!reps.length) return ""; return `<section class="card stack"><h2>Day reports</h2>${reps.map(([k,r])=>`<button class="prow rbtn" data-act="rep-show" data-n="${k}"><div><b>Day ${k}</b><div class="small muted">${r.weak&&r.weak.length?"Weak: "+esc(r.weak.slice(0,3).join(" · ")):"no weak spots recorded"}</div></div><div class="row" style="gap:6px;justify-content:flex-end">${r.W!=null?`<span class="chip ${r.wPass?"ok":"bad"} tnum">W ${r.W}/75</span>`:r.L!=null||r.H!=null?`<span class="chip tnum">L ${r.L??"–"} · H ${r.H??"–"}</span>`:""}${r.sp!=null?`<span class="chip ${r.sp>=12?"ok":"bad"} tnum">S ${r.sp}/25</span>`:""}</div></button>`).join("")}</section>`; })()}
  ${badgesCard()}
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
  r.onresult=e=>{ const alts=[...e.results[0]].map(a=>a.transcript); const best=alts.map(a=>({a,s:simScore(target,a)})).sort((x,y)=>y.s-x.s)[0]; S.pron[key]={heard:best.a, score:best.s};
    const pm=String(key).match(/^(\d+):pron:(\d+)$/); if(pm){ S.st.pronLog=S.st.pronLog||{}; const P=S.st.pronLog[pm[1]]=S.st.pronLog[pm[1]]||{}; P[pm[2]]={score:best.s, heard:best.a, text:target}; save(); } render(); };
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
  return `<section class="card stack tutor-card"><div class="label">Live tutor · Gemini · about ${tutorMinutes()} min, guided in phases</div><h2>Talk to your tutor</h2>
    <p class="small">${ex("The tutor already knows which day you're on, today's words and script, your recent mistakes and the notes from your last session. Use headphones.","مربی می‌داند روز چندم هستی، لغات و متن امروز، اشتباهات اخیر و یادداشت‌های جلسه قبل را. از هدفون استفاده کن.")}</p>
    <div class="row">${[["review","Fix my weak spots"],["coach","Coach: teach today"],["exam","Exam simulation"]].map(([v,l])=>`<button class="opt ${S.liveMode===v?"sel":""}" data-act="live-mode" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="row"><span class="small muted">Talking</span>${[["ptt","Hold to talk · fastest"],["auto","Hands-free"]].map(([v,l])=>`<button class="opt ${(S.st.talkMode||"ptt")===v?"sel":""}" data-act="talk-mode" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="row"><span class="small muted">Length</span>${[15,25,30].map(m=>`<button class="opt ${tutorMinutes()===m?"sel":""}" data-act="tutor-min" data-v="${m}">${m} min</button>`).join("")}</div>
    ${ready?`<div><button class="btn primary" data-act="live-start" data-n="${n}">${ICONS.mic}Start speaking session</button></div>`:`<div class="banner"><div>${S.uid?"The tutor needs GEMINI_API_KEY in Vercel → Settings → Environment Variables.":"Sign in to use the tutor."}</div></div>`}
    ${last?`<div class="sunk stack" style="gap:4px"><div class="label">Last session · ${new Date(last.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}${last.score_25!=null?` · ${esc(last.score_25)}/25`:""}</div><div class="small">${esc(last.summary_en||"")}</div>
      ${(last.errors||[]).slice(0,4).map(e=>`<div class="small"><span style="color:var(--bad);text-decoration:line-through">${esc(e.wrong)}</span> → <b style="color:var(--ok)">${esc(e.right)}</b></div>`).join("")}
      ${(last.next_focus||[]).length?`<div class="small"><b>Next:</b> ${esc(last.next_focus.join("; "))}</div>`:""}</div>`:""}
  </section>`;
}
function weakSpots(){ const out=[]; Object.entries(S.st.results).forEach(([k,r])=>{ if(r.total&&r.score/r.total<0.6) out.push(`${k} (${r.score}/${r.total})`); }); return out.slice(-6); }
function buildTutorBrief(n, d, mode, plan){ plan=plan||sessionPlan(n, mode, tutorMinutes());
  const p=PLAN[n-1]; const left=daysLeft();
  const done=PLAN.slice(0,n-1).filter(x=>x.k==="lesson").map(x=>x.t);
  const next=PLAN[n]?PLAN[n].t:"exam";
  const L=[];
  L.push(`You are Frau Berger, a friendly Austrian ÖSD examiner and Raam's personal German tutor. You run a ${mode==="exam"?"strict exam simulation":mode==="review"?"personal review session that repairs his weak points from today":"coaching session"} by voice.`);
  L.push(`LEARNER: Raam, 30, from Tehran, native Persian, English B2, beginner who started German on 12 October 2026. Goal: pass ÖSD Zertifikat A1 on ${examLong()} at Divan Institute, Tehran (${left} days left).`);
  L.push(`PLAN POSITION: Day ${n} of ${PLAN.length} — "${p.t}"${p.g?` (grammar: ${p.g})`:""}. Earlier days covered: ${done.join("; ")||"nothing yet"}. Tomorrow: ${next}.`);
  if(d&&!d.synthetic){
    if(d.vocab&&d.vocab.length) L.push("TODAY'S WORDS: "+d.vocab.slice(0,28).map(v=>`${v.article&&v.article!=="-"?v.article+" ":""}${v.de}${v.plural&&v.plural!=="-"?` (${v.plural})`:""} = ${v.en}`).join("; ")+".");
    if(d.phrases&&d.phrases.length) L.push("TODAY'S PHRASES: "+d.phrases.slice(0,12).map(x=>x.de).join(" | "));
    if(d.grammar&&d.grammar.length) L.push("TODAY'S GRAMMAR: "+d.grammar.map(g=>`${g.topic}: ${g.explain_en}`).join(" "));
    if(d.pronunciation&&d.pronunciation.length) L.push("PRONUNCIATION FOCUS: "+d.pronunciation.map(x=>`${x.focus} (${(x.words||[]).join(", ")})`).join("; "));
    const sp=d.sprechen||{};
    if(sp.teil1) L.push("HIS SPEAKING SCRIPT (Teil 1): "+sp.teil1.my_script.map(x=>x.de).join(" ")+" Examiner questions to ask: "+(sp.teil1.examiner_questions_de||[]).join(" | "));
    if(sp.teil2) L.push("PHOTO FOR TEIL 2: "+sp.teil2.photo_scene_en);
    if(sp.teil3) L.push("ROLE-PLAY FOR TEIL 3: "+sp.teil3.roleplay_en+" "+(sp.teil3.examiner_role_de||""));
  } else {
    L.push("Today has no new lesson (review, mock or buffer day). Revise everything from the earlier days, with most time on Sprechen Teil 1–3.");
    const LB=learnedBefore(n); if(LB.vocab.length){ L.push("WORDS FROM EARLIER DAYS TO RECYCLE (TODAY'S WORDS for this session): "+shuffled(LB.vocab,"tb"+n).slice(0,30).map(v=>`${vfull(v)} = ${v.en}`).join("; ")+"."); L.push("PHRASES FROM EARLIER DAYS: "+shuffled(LB.phrases,"tp"+n).slice(0,10).map(x=>x.de).join(" | ")); }
    const sc=[]; for(let k=n-1;k>=1&&sc.length<1;k--){ const x=S.days[k]; if(x&&x.sprechen&&x.sprechen.teil1) sc.push(x.sprechen.teil1); } if(sc[0]) L.push("HIS SPEAKING SCRIPT (Teil 1): "+sc[0].my_script.map(x=>x.de).join(" "));
  }
  const TR=tutorResults(n); if(TR.text) L.push(TR.text);
  const mis=S.st.mistakes.filter(m=>m.day!==n).slice(0,6).map(m=>`${m.q} → ${m.right} (he said: ${m.your||"–"})`);
  if(mis.length) L.push("OLDER MISTAKES TO RECYCLE: "+mis.join(" | "));
  const ws=weakSpots(); if(ws.length) L.push("WEAK EXERCISE SCORES: "+ws.join(", "));
  const notes=Object.entries(S.st.live).flatMap(([day,arr])=>arr.map(x=>({day:+day,...x}))).sort((a,b)=>a.at-b.at).slice(-2);
  if(notes.length) L.push("NOTES FROM EARLIER TUTOR SESSIONS: "+notes.map(x=>`Day ${x.day}: Errors: ${(x.errors||[]).slice(0,4).map(e=>e.wrong+" → "+e.right).join(", ")}. Next focus: ${(x.next_focus||[]).slice(0,3).join("; ")}`).join(" || "));
  const gap=S.st.comeback&&S.st.comeback.date===dk(new Date())?S.st.comeback.gap:0; if(gap>=3) L.push(`He was away for ${gap} days and is just coming back: start gently, recycle older words, and praise him for coming back.`);
  const total=plan.reduce((x,p)=>x+p.min,0);
  L.push(`SESSION LENGTH: about ${total} minutes, run by the app in ${plan.length} phases: `+plan.map((p,i)=>`${i+1}) ${p.t} (${p.min} min)`).join("; ")+". The app sends you a note that starts with [APP NOTE] at the start of every phase with the exact instructions. Those notes come from the app, not from Raam: never read them aloud or mention them, just move on smoothly.");
  L.push("SPEED MATTERS: answer immediately; never think aloud. "+(S.st.talkMode==="auto"?"He speaks hands-free and may pause while searching for a word: if his sentence sounds unfinished, wait.":"He holds a button while he speaks, so every turn you get is complete: reply straight away.")+" If you could not understand him, say „Wie bitte?“ and repeat your question more slowly.");
  L.push("YOUR ROLE: an energetic, demanding but kind personal trainer, not a chat partner. You lead all the time. Keep each turn short (at most 2 sentences) and end almost every turn with a question or task for him. After every answer: quick feedback (richtig / fast / nein), the correct form if needed, and he repeats it; then the next item. Aim for 40–60 questions in a session. Use spaced retrieval: anything he gets wrong comes back 2–3 minutes later in a new sentence. Raise the difficulty after 3 correct answers in a row (full sentences, faster, new context); simplify when he struggles. If he answers in English, help him say it in German. Never end the session, summarise it or say goodbye before the final phase. If the app has not sent a new note yet, keep drilling the current phase with new items.");
  L.push("NO RECITATION: under the 2026 ÖSD rules a memorised ready-made text counts as plagiarism. If he recites his script, interrupt kindly with a follow-up question or a changed detail so he must build his own sentences.");
  L.push("RULES: Speak slow, clear Austrian standard German (Grüß Gott, Jänner) in very short A1 sentences. Use only today's and earlier vocabulary. Explain in short simple English; use Persian only if he asks. In coaching mode, correct every mistake immediately: say the correct sentence once, ask him to repeat it, then continue. If he is silent or lost, give him the first words. Keep your turns short so he speaks more than you.");
  return L.join("\n");
}
async function startLive(n){
  if(!S.ai||!S.uid){ toast(S.uid?"Add GEMINI_API_KEY in Vercel first":"Sign in first"); return; }
  stopSpeech();
  const d=await getDay(n).catch(()=>null);
  let outCtx, inCtx;
  try{ outCtx=new AudioContext({sampleRate:24000}); inCtx=new AudioContext(); }catch(e){ toast("Audio is not available: "+e.message); return; }
  const plan=sessionPlan(n, S.liveMode, tutorMinutes());
  S.live={ n, status:"starting", log:[], partial:null, started:Date.now(), mode:S.liveMode, muted:false, error:"", plan, phase:0, phaseUsed:0, phaseTurns:0, lastTick:0, complete:false, ptt:(S.st.talkMode||"ptt")!=="auto", waiting:0, lat:[], note:null, holding:false };
  render();
  try{
    const tk=await api("/api/live-token");
    const LL=S.live;
    const sess=new LiveSession({ token:tk.token, apiVersion:tk.apiVersion, model:tk.model, systemText:buildTutorBrief(n,d,S.liveMode,plan), voice:S.st.tutorVoice||"Kore", outCtx, inCtx, talkMode:S.st.talkMode||"ptt",
      onMode:m=>{ if(S.live!==LL) return; const ch=LL.ptt!==m.ptt; LL.ptt=m.ptt; if(ch) render(); },
      onWaiting:t=>{ if(S.live!==LL) return; LL.waiting=t; drawWait(); },
      onLatency:ms=>{ if(S.live!==LL) return; LL.lat.push(ms); if(LL.lat.length>200) LL.lat.shift(); },
      onTurnComplete:()=>{ if(S.live!==LL) return; if(LL.note) setTimeout(()=>flushNote(LL),250); },
      starter: regie(LL,0,"Begin now."), getToken:()=>api("/api/live-token"),
      onResumed:kept=>{ if(S.live!==LL) return; if(!kept) try{ LL.sess.sendText(regie(LL,LL.phase,"The connection was renewed. Continue naturally from where you were; do not greet him again.")); }catch(e){} },
      onGoAway:()=>{},
      onStatus:st=>{ if(!S.live) return; S.live.status=st; const el=$("#liveStatus"); if(el) el.textContent=liveStatusText(); if(st==="ended"||(st==="live"&&!S.live.holding)) render(); },
      onTranscript:(role,text,final)=>{ if(!S.live) return; if(final){ S.live.log.push({role,text}); S.live.partial=null; if(role==="you") S.live.phaseTurns++; saveDraft(); } else S.live.partial={role,text}; drawLiveLog(); },
      onError:msg=>{ if(!S.live) return; S.live.error=msg; const el=$("#liveErr"); if(el){ el.textContent=msg; el.hidden=false; } },
      onLevel:v=>{ const el=$("#liveLevel"); if(el) el.style.width=Math.min(100,Math.round(v*400))+"%"; } });
    S.live.sess=sess;
    await sess.start(); LL.lastTick=Date.now(); livePhaseTick();
  }catch(e){ if(S.live){ S.live.status="error"; S.live.error=e.message; } try{ outCtx.close(); inCtx.close(); }catch(_){} render(); }
}
function liveStatusText(){ const L=S.live; if(!L) return ""; return {starting:"Getting a secure connection…",connecting:"Connecting to Gemini…",live:L.muted?"Microphone muted":L.ptt?"Live · hold to talk":"Live · speak any time",reconnecting:"Reconnecting… (keeps your conversation)",ended:"Session ended",error:"Couldn't start",summarizing:"Saving session notes…"}[L.status]||L.status; }
function vLive(){
  const L=S.live; const p=PLAN[L.n-1];
  const over = L.status==="ended"||L.status==="error";
  return `<div class="live">
    <div class="row between"><div><div class="label">Day ${L.n} · ${L.mode==="exam"?"Exam simulation":L.mode==="review"?"Fixing your weak spots":"Coaching"} · saved automatically</div><h2>${esc(p.t)}</h2></div><span class="chip ${L.status==="live"?"ok":L.status==="error"?"bad":"acc"}" id="liveStatus">${liveStatusText()}</span></div>
    ${phaseBlock(L)}
    <div class="banner" id="liveErr" ${L.error?"":"hidden"}>${esc(L.error)}</div>
    <div class="live-log" id="liveLog" aria-live="polite"></div>
    <div class="waitline" id="liveWait" ${L.waiting?"":"hidden"} role="status"></div>
    ${!over&&L.ptt?`<button class="pttbtn ${L.holding?"on":""}" id="pttBtn" ${L.status!=="live"?"disabled":""} aria-label="Hold to talk">${ICONS.mic}<span id="pttLbl">${L.holding?"Speak now · let go when you're done":"Hold to talk"}</span><span class="pttlevel" aria-hidden="true"><i id="liveLevel" style="width:0%"></i></span></button><p class="small muted" style="text-align:center;margin:-4px 0 0">${ex("Hold the button (or the Space bar) while you speak. Let go and the tutor answers at once.","دکمه (یا Space) را نگه دار و صحبت کن. رها کنی، مربی فوراً جواب می‌دهد.")}</p>`
      :`<div class="meter" aria-hidden="true"><i id="liveLevel" style="width:0%"></i></div>`}
    <form id="liveText" class="row" style="flex-wrap:nowrap"><input type="text" id="liveTextIn" placeholder="Type instead of speaking…" autocomplete="off" ${L.status!=="live"?"disabled":""}><button class="btn" type="submit" ${L.status!=="live"?"disabled":""}>Send</button></form>
    <div class="row between">
      ${over||L.ptt?`<span></span>`:`<button class="btn" data-act="live-mute">${L.muted?"Unmute mic":"Mute mic"}</button>`}
      <button class="btn primary" data-act="live-end" ${L.status==="summarizing"?"disabled":""}>${over?"Save & close":"End session"}</button>
    </div>
    <p class="small muted">${L.ptt?ex("Phases move on by the number of answers you give; the clock stops while the tutor is thinking. Say „Wie bitte?“ if you don't understand.","مراحل با تعداد جواب‌هایت جلو می‌روند و وقتی مربی فکر می‌کند، زمان متوقف است. اگر متوجه نشدی بگو «Wie bitte?».")
      :ex("Hands-free: the tutor answers after about a second of silence. Use headphones, and switch to Hold to talk if the room is noisy. Say „Wie bitte?“ if you don't understand.","حالت بدون دکمه: مربی بعد از حدود یک ثانیه سکوت جواب می‌دهد. از هدفون استفاده کن و اگر محیط شلوغ است، Hold to talk را انتخاب کن.")}</p>
  </div>`;
}
function drawWait(){ const el=$("#liveWait"); const L=S.live; if(!el||!L) return; clearInterval(drawWait._i);
  if(!L.waiting){ el.hidden=true; return; }
  const upd=()=>{ if(!S.live||!S.live.waiting){ el.hidden=true; clearInterval(drawWait._i); return; } const s=Math.floor((Date.now()-S.live.waiting)/1000); el.hidden=false;
    el.innerHTML=`<span class="dots"><i></i><i></i><i></i></span> Frau Berger is thinking… <span class="tnum">${s}s</span>${s>=12?` · <span class="small">${S.live.ptt?"no answer yet: hold the button and say it again":"no answer yet: say „Hallo?“ or type below"}</span>`:""}`; };
  upd(); drawWait._i=setInterval(upd,250); }
function pttDown(){ const L=S.live; if(!L||!L.sess||!L.ptt||L.holding) return; if(L.sess.pttDown()){ L.holding=true; const b=$("#pttBtn"), l=$("#pttLbl"); if(b) b.classList.add("on"); if(l) l.textContent="Speak now · let go when you're done"; vib(); } }
function pttUp(){ const L=S.live; if(!L||!L.holding) return; L.holding=false; try{ L.sess.pttUp(); }catch(e){} const b=$("#pttBtn"), l=$("#pttLbl"); if(b) b.classList.remove("on"); if(l) l.textContent="Hold to talk"; }
document.addEventListener("pointerdown", e=>{ if(e.target.closest&&e.target.closest("#pttBtn")){ e.preventDefault(); try{ e.target.closest("#pttBtn").setPointerCapture(e.pointerId); }catch(_){} pttDown(); } });
["pointerup","pointercancel"].forEach(t=>document.addEventListener(t, ()=>{ if(S.live&&S.live.holding) pttUp(); }));
document.addEventListener("contextmenu", e=>{ if(e.target.closest&&e.target.closest("#pttBtn")) e.preventDefault(); });
document.addEventListener("keydown", e=>{ if(!S.live||e.code!=="Space"||e.repeat) { if(S.live&&e.code==="Space"&&e.repeat&&S.live.holding) e.preventDefault(); return; } const tag=e.target.tagName; if(tag==="INPUT"||tag==="TEXTAREA") return; e.preventDefault(); pttDown(); });
document.addEventListener("keyup", e=>{ if(S.live&&e.code==="Space"&&S.live.holding){ e.preventDefault(); pttUp(); } });
function sendNote(L, text){ L.note=text; flushNote(L); }
function flushNote(L){ if(!L||!L.note||!L.sess||S.live!==L) return; const s=L.sess; if(s.modelSpeaking||s.pttActive||s.waitSince||L.holding) return; const t=L.note; L.note=null; try{ s.sendText(t); }catch(e){} }
function drawLiveLog(){ const el=$("#liveLog"); if(!el||!S.live) return; const items=[...S.live.log, ...(S.live.partial?[S.live.partial]:[])];
  el.innerHTML = items.length ? items.map(x=>`<div class="lmsg ${x.role}"><span class="label">${x.role==="you"?"You":"Frau Berger"}</span><div>${esc(x.text)}</div></div>`).join("") : `<p class="muted small" style="text-align:center;padding:30px 0">${S.live.status==="live"?"Frau Berger is about to start…":"…"}</p>`;
  el.scrollTop=el.scrollHeight; }
async function endLive(){
  const L=S.live; if(!L) return;
  try{ L.sess&&L.sess.stop(); }catch(e){}
  const talk=L.log.map(x=>x.text).join(" ");
  if(talk.length>60 && S.ai && S.uid){
    L.status="summarizing"; render();
    try{ const {sess,xp}=await analyseSession({n:L.n, mode:L.mode, log:L.log, started:L.started, source:"live", lat:L.lat, ptt:L.ptt}); clearDraft();
      S.live=null; S.view="speaking"; S.sess={day:L.n, id:sess.id}; S.report=null; toast(`Session saved · +${xp} XP`); render(); window.scrollTo(0,0); return; }
    catch(e){ saveDraft(); toast("Couldn't analyse it right now. The session is kept; save it later from Progress."); }
  } else if(talk.length<=60) clearDraft();
  S.live=null; render();
}

/* ---------- Gemini app context ---------- */
async function copyContext(n){ const d=await getDay(n).catch(()=>null); const plan=sessionPlan(n,S.liveMode,tutorMinutes()); copyText(buildTutorBrief(n,d,S.liveMode,plan)+"\n\nIn this app there are no APP NOTES: follow the phases yourself by time, with these instructions:\n"+plan.map((p,i)=>`Phase ${i+1} (${p.min} min) ${p.t}: ${p.ins}`).join("\n")+"\n\nStart now with phase 1."); }

function examFacts(){
  const mod=(title, mins, pts, pass, rows, note)=>`<section class="card stack"><div class="row between"><h2>${title}</h2><span class="chip tnum">${mins} · ${pts}</span></div>${pass?`<p class="small"><b>Minimum:</b> ${pass}</p>`:""}
    <div class="tablewrap"><table class="gram"><tr><td>Part</td><td>Task</td><td>Items</td><td>Notes</td></tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>${note?`<p class="small muted">${note}</p>`:""}</section>`;
  return `<div style="padding-top:8px"><h2>Exam facts</h2><p class="muted small">Checked against the official ÖSD ZA1 rules (10/2023) and Modellsatz.</p></div>
  <div class="hero"><div class="dayline"><span class="chip at">Exam day</span><span>${examLong()}</span><span class="fa">${examFa()}</span></div>
    <p><b>Divan Institute, Tehran.</b> Written part (Lesen, Hören, Schreiben) as a group, then the oral part (Sprechen) one-to-one with an examiner. No dictionary allowed.</p>
    <div class="grid2"><div class="sunk"><div class="label">Written · 75 points</div><b>Pass: 38</b> and the minimum in each part</div><div class="sunk"><div class="label">Oral · 25 points</div><b>Pass: 12</b></div></div>
    <p class="small muted">${ex("The two modules are graded separately and can be taken or retaken separately.","دو بخش جداگانه نمره‌دهی می‌شوند و می‌توان جداگانه آن‌ها را داد یا تکرار کرد.")}</p></div>
  ${mod("Lesen","25 min","30 pts","6 of 30",[["1","Match 5 situations (A–E) to 6 ads","5 × 2 pts","one ad is extra"],["2","3 short texts, 2 statements each","6 items, 10 pts","answer <b>JA</b> or <b>NEIN</b>"],["3","Match 5 short notices to 6 pictures","5 × 2 pts","one picture is extra"]])}
  ${mod("Hören","≈ 10 min","30 pts","6 of 30",[["1","5 short texts → 6 pictures","5 × 2 pts","played <b>once</b>; 30 s to look at the pictures first"],["2","1 answering-machine message → note sheet","5 × 2 pts","played <b>twice</b>; spelled names and numbers must be fully correct"],["3","5 short interviews → tick one answer per person","5 × 2 pts","played <b>once</b>; 10 s to read"]])}
  ${mod("Schreiben","20 min","15 pts","4 of 10 in Teil 2",[["1","Fill in a form for a friend","10 answers → 5 pts (10 = 5, 9–8 = 4, 7–6 = 3, 5–4 = 2, 3–2 = 1)","names and streets spelled exactly; any clear date format"],["2","Reply to a personal email","10 pts","the greeting and first sentence are printed; you write ≈ 30 words (min. 25), answer all 3 questions, end with a sign-off"]])}
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
  <section class="card stack"><h2>Lessons</h2><label class="row"><input type="checkbox" data-set="sfx" ${S.st.sfx!==false?"checked":""}> Sound effects for right and wrong answers</label>
    <div class="field"><span class="lb">Daily XP goal</span><div class="row">${[[50,"Casual"],[100,"Regular"],[150,"Serious"],[200,"Intense"]].map(([v,l])=>`<button class="opt ${goalXp()===v?"sel":""}" data-act="goal" data-v="${v}">${l} · ${v} XP</button>`).join("")}</div>
    <p class="small muted">${ex("A full study day on the path earns about 150–200 XP.","یک روز کامل مطالعه حدود ۱۵۰ تا ۲۰۰ امتیاز می‌دهد.")}</p></div></section>
  <section class="card stack"><h2>Exam mode for Hören</h2><label class="row"><input type="checkbox" data-set="strict" ${S.st.strict?"checked":""}> Limit audio plays like the real exam</label></section>
  <section class="card stack"><h2>Plan</h2><div class="field"><label for="startIn">Day 1 date</label><input type="text" id="startIn" value="${attr(S.st.start)}" data-set="start" placeholder="YYYY-MM-DD" inputmode="numeric"></div>
    <div class="field"><label for="examIn">Exam date</label><input type="text" id="examIn" value="${attr(S.st.exam||DEFAULT_EXAM)}" data-set="exam" placeholder="YYYY-MM-DD" inputmode="numeric"></div>
    <p class="small muted">${examLong()} · <span class="fa">${examFa()}</span> · ${daysLeft()} days left</p>
    <div class="field"><span class="lb">Daily study time</span><div class="row">${[2,3,4].map(h=>`<button class="opt ${dayHours()===h?"sel":""}" data-act="day-hours" data-v="${h}">${h} hours</button>`).join("")}</div></div>
    ${schedule().anchorN>1?`<p class="small muted">${ex(`Your plan restarted at Day ${schedule().anchorN} on ${fmtDate(schedule().anchorDate)}. Day ${schedule().list[schedule().list.length-1]} falls on ${fmtDate(dateOf(schedule().list[schedule().list.length-1]))}, the day before the exam.`,"")}</p>`:""}
    ${schedule().drop.length?`<div class="banner info"><div>${ex(`To fit before the exam, ${schedule().drop.map(d=>"Day "+d).join(", ")} ${schedule().drop.length>1?"are":"is"} skipped (buffer days first). They stay open as optional practice.`,`برای جا شدن تا آزمون، ${schedule().drop.map(d=>"روز "+d).join("، ")} حذف شد.`)}</div></div>`:""}</section>
  <section class="card stack"><h2>Account &amp; sync</h2><p class="small">${syncTxt}</p>
    ${S.uid?`<div class="row between"><span class="small">Signed in as <b>${esc(S.email)}</b></span><button class="btn sm" data-act="signout">Sign out</button></div>`:`<button class="btn sm" data-act="auth-show">Sign in to sync</button>`}
    ${installHint()?`<div class="row">${installHint()}<span class="small muted">Adds the app to your home screen or Start menu.</span></div>`:isStandalone()?`<span class="chip ok">Installed</span>`:`<p class="small muted">To install: Chrome on Android → ⋮ → Install app. Edge on Windows → … → Apps → Install this site as an app.</p>`}</section>
  <section class="card stack"><h2>Live tutor</h2>
    <p class="small">${S.ai?`Ready · model ${esc(S.liveModel)}`:"Not set up: add GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy."}</p>
    <div class="field"><label for="tutorVoice">Tutor voice</label><select id="tutorVoice" data-set="tutorVoice">${["Kore","Aoede","Puck","Charon","Fenrir"].map(v=>`<option ${S.st.tutorVoice===v?"selected":""}>${v}</option>`).join("")}</select></div>
    <div><button class="btn sm" data-act="copy-context" data-n="${currentDay()}">${ICONS.copy}Copy today's context for the Gemini app</button></div></section>
  <section class="card stack"><h2>Reset</h2>${S.confirmReset?`<p class="small">This deletes all progress, cards and mistakes. Are you sure?</p><div class="row"><button class="btn" data-act="reset-no">Keep my progress</button><button class="btn primary" style="background:var(--bad);border-color:var(--bad)" data-act="reset-yes">Delete everything</button></div>`:`<div><button class="btn sm" data-act="reset">Reset progress…</button></div>`}</section>`;
}

/* ====================== v5: game-style path, lesson player, XP ====================== */
function dk(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function xpToday(){ return (S.st.xp||{})[dk(new Date())]||0; }
function goalXp(){ return +S.st.goal||100; }
function studiedToday(){ const t=new Date(); return studyDates().has(t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate()); }
function addXp(x){ if(boostOn()) x*=2; const k=dk(new Date()); S.st.xp=S.st.xp||{}; const before=S.st.xp[k]||0; const lv0=levelInfo(totalXp()).lvl;
  S.st.xp[k]=before+x; const lv1=levelInfo(totalXp()).lvl; const D=dayData();
  if(!D.streakShown && x>0){ D.streakShown=1; queueCel({type:"streak"}); }
  if(lv1>lv0){ addCoins(30); queueCel({type:"level", lvl:lv1, id:"l"+lv1}); }
  if(before<goalXp() && before+x>=goalXp()) setTimeout(()=>toast("Daily goal reached: "+goalXp()+" XP!"), 900);
  return x; }

/* sound effects (synthesised, no files) */
const SFX={ctx:null};
function sfx(kind){ if(S.st.sfx===false) return; try{
  const C=SFX.ctx||(SFX.ctx=new (window.AudioContext||window.webkitAudioContext)()); if(C.state==="suspended") C.resume(); const t=C.currentTime;
  const tone=(f,st,dur,type="triangle",vol=.16)=>{ const o=C.createOscillator(), g=C.createGain(); o.type=type; o.frequency.setValueAtTime(f,t+st);
    g.gain.setValueAtTime(0.0001,t+st); g.gain.exponentialRampToValueAtTime(vol,t+st+.015); g.gain.exponentialRampToValueAtTime(0.0001,t+st+dur); o.connect(g).connect(C.destination); o.start(t+st); o.stop(t+st+dur+.05); };
  if(kind==="ok"){ tone(880,0,.14); tone(1318,.08,.28); }
  else if(kind==="pair"){ tone(988,0,.12,"sine",.12); }
  else if(kind==="bad"){ tone(196,0,.2,"square",.05); tone(165,.11,.28,"square",.05); }
  else if(kind==="done"){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.09,.32)); }
  else if(kind==="tap"){ tone(700,0,.05,"sine",.05); }
}catch(e){} }
function vib(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms||90); }catch(e){} }

/* units = weeks; each has its own colour like a game world */
const UNITS=[
 {i:1,a:1,b:7,t:"Hallo! First steps",d:"Alphabet, introductions, numbers, verbs, family, jobs",c:"#58c322",cd:"#46a302"},
 {i:2,a:8,b:15,t:"Daily life",d:"Food, shopping, clock time, dates, free time, home",c:"#ce82ff",cd:"#a568cc"},
 {i:3,a:16,b:22,t:"Out and about",d:"City, health, clothes and weather, travel, Perfekt, forms",c:"#1db0f0",cd:"#1590cc"},
 {i:4,a:23,b:36,t:"Exam training",d:"Übungstest A, mock 1, strategies, vocabulary and grammar sweeps",c:"#ff9a1f",cd:"#e07c00"},
 {i:5,a:37,b:52,t:"Final sprint",d:"Mock 2, mock 3, the final mock, repair and rest",c:"#ff6fae",cd:"#e0498c"}];
function unitOf(n){ return UNITS.find(u=>n>=u.a&&n<=u.b)||UNITS[0]; }
function uStyle(n){ const u=unitOf(n); return `--u:${u.c};--ud:${u.cd}`; }

const NODE_INFO={
 review:["Review cards","Clear the flashcards that are due before anything new.","اول کارت‌هایی را که موعدشان رسیده مرور کن.","review"],
 media:["Listen & watch","Today's audio, video and NotebookLM files.","فایل‌های صوتی، ویدیو و NotebookLM امروز.","play"],
 hoeren:["Hören","Listening in the exact ÖSD exam format.","شنیدن دقیقاً با قالب آزمون ÖSD.","headph"],
 diktat:["Dictation","Listen and type each sentence.","گوش کن و هر جمله را بنویس.","pencil"],
 lesen:["Lesen","Reading in the exact ÖSD exam format.","خواندن دقیقاً با قالب آزمون ÖSD.","bookopen"],
 schreiben:["Schreiben","Fill in the form and write the email.","فرم را پر کن و ایمیل را بنویس.","mail"],
 sprechen:["Sprechen","Practise all three speaking parts out loud.","هر سه بخش صحبت را بلند تمرین کن.","mic"],
 quiz:["Daily quiz","Ten questions on everything from today.","ده سؤال از همه مطالب امروز.","trophy"],
 drill:["Grammar gym","Verb endings, der/die/das, question words and word order: your most frequent mistakes.","پایانه فعل، der/die/das، کلمات پرسشی و ترتیب کلمات: اشتباهات پرتکرار تو.","bulb"],
 hoertrainer:["Hör-Trainer","Numbers, phone numbers, times, days and spelled names: the skills for Hören Teil 2.","اعداد، شماره تلفن، ساعت، روزها و اسم‌های هجی‌شده: مهارت‌های بخش ۲ شنیدن.","headph"],
 tutor:["Tutor session","Speak with your tutor about today's weak spots. Push-to-talk keeps it fast.","با مربی درباره نقاط ضعف امروز صحبت کن.","mic"]
};
const PLAYER_STEPS=new Set(["learn","practice","quiz","diktat","drill","hoertrainer","mix","words","minitest","repair"]);
function chunk(arr, max){ if(!arr||!arr.length) return []; const k=Math.ceil(arr.length/max), size=Math.ceil(arr.length/k); const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }
function learnParts(d){ const P=[];
  if(d.alphabet&&d.alphabet.length) P.push({id:"abc",title:"Alphabet",icon:"abc",desc:["Hear every letter, then spell names like in Hören Teil 2.","حروف را بشنو و بعد اسم‌ها را هجی کن، مثل بخش ۲ شنیدن."]});
  if(d.pronunciation&&d.pronunciation.length) P.push({id:"sounds",title:"Sounds",icon:"speaker",desc:["The German sounds that are new for Persian speakers.","صداهای آلمانی که برای فارسی‌زبان‌ها تازه‌اند."]});
  chunk(d.vocab,8).forEach((c,i,a)=>P.push({id:"w"+i,title:a.length>1?`Words ${i+1}`:"Words",icon:"book",items:c,desc:[`${c.length} new words: ${c.slice(0,3).map(v=>v.de).join(", ")} …`,`${c.length} کلمه جدید`]}));
  chunk(d.phrases,8).forEach((c,i,a)=>P.push({id:"p"+i,title:a.length>1?`Phrases ${i+1}`:"Phrases",icon:"chat",items:c,desc:[`${c.length} phrases, starting with „${c[0].de}“`,`${c.length} جمله پرکاربرد`]}));
  if(d.grammar&&d.grammar.length) P.push({id:"gram",title:"Grammar",icon:"bulb",desc:[d.grammar.map(g=>g.topic).join(" · "),"دستور زبان امروز"]});
  return P; }
function practiceParts(d){ return chunk(d.exercises||[],11).map((c,i,a)=>({id:"x"+i,title:a.length>1?`Practice ${i+1}`:"Practice",icon:"star",items:c,desc:["Mixed exercises on today's grammar and words.","تمرین‌های ترکیبی روی دستور و لغات امروز."]})); }
function dayNodes(n,d){ if(d&&d.synthetic) return synthNodes(n,d); const out=[];
  stepsFor(d).forEach(s=>{
    if(s.id==="learn"||s.id==="practice"){ const parts=s.id==="learn"?learnParts(d):practiceParts(d); const per=Math.max(3,Math.round(s.min*dayHours()/3/Math.max(1,parts.length)));
      parts.forEach((p,pi)=>out.push({step:s.id, part:pi, parts:parts.length, title:p.title, icon:p.icon, min:per, desc:p.desc, kind:"lesson"})); }
    else { const I=NODE_INFO[s.id]||[s.en,"","","star"]; out.push({step:s.id, part:0, parts:1, title:I[0], icon:I[3], min:Math.max(3,Math.round(s.min*dayHours()/3)), desc:[I[1],I[2]], kind:PLAYER_STEPS.has(s.id)?"lesson":s.id==="review"?"review":s.id==="tutor"?"tutor":"task"}); }
  }); return out; }
function nodeKey(n,nd){ return nd.parts>1 ? `${n}:${nd.step}#${nd.part}` : `${n}:${nd.step}`; }
function nodeDone(n,nd){ if(nd.step==="tutor"&&(S.st.live[n]||[]).length) return true; if(nd.step==="mock"&&nd.mock&&S.st.mocks[nd.mock]) return true; return !!(S.st.done[n+":"+nd.step] || S.st.done[nodeKey(n,nd)]); }
function dayAllDone(n){ const d=S.days[n]; return !!d && dayNodes(n,d).every(nd=>nodeDone(n,nd)); }

/* ---------- Today: the path ---------- */
const OFF=[0,46,72,46,0,-46,-72,-46];
function pathHtml(n,d){
  const nodes=dayNodes(n,d); const cur=nodes.findIndex(x=>!nodeDone(n,x));
  let h=`<div class="path" style="${uStyle(n)}">`, cum=0; const BR=dayHours()>=4?[[60,5],[120,15],[180,5]]:dayHours()>=3?[[60,5],[120,15]]:[[60,10]];
  nodes.forEach((nd,i)=>{ const before=cum; cum+=nd.min; const done=nodeDone(n,nd), isCur=i===cur, locked=cur>=0&&i>cur; const x=OFF[i%OFF.length];
    h+=`<div class="pwrap ${isCur?"has-bubble":""}" style="--x:${x}px">${isCur?`<div class="bubble">${i===0?"Start":"Next"}</div>`:""}
      <button class="pnode ${done?"done":isCur?"cur":locked?"locked":""} ${nd.step==="quiz"?"big":""}" data-act="node" data-i="${i}" ${isCur?'id="curNode"':""} aria-expanded="${S.pop===i}" aria-label="${attr(nd.title+(done?", done":locked?", later":", next"))}">${ICONS[nd.icon]||ICONS.star}</button>
      <div class="plb ${isCur?"cur":""}">${esc(nd.title)}</div></div>`;
    if(S.pop===i) h+=popHtml(n,nd,i,{done,isCur,locked,x});
    BR.forEach(([m,len])=>{ if(before<m && cum>=m && i<nodes.length-1){ const opened=!!S.st.done[`${n}:brk${m}`];
      h+=`<div class="pwrap" style="--x:${Math.round(OFF[(i+4)%OFF.length]*0.7)}px"><button class="pnode chest ${opened?"opened":""}" data-act="brk" data-m="${m}" data-len="${len}" aria-label="${len}-minute break${opened?", taken":""}">${opened?ICONS.check:ICONS.cup}</button><div class="plb">${len}-min break</div></div>`; } });
  });
  const won=cur<0;
  h+=`<div class="pwrap"><button class="pnode trophy ${won?"won":""}" data-act="node-trophy" aria-label="Day ${n} trophy${won?", won":""}">${ICONS.trophy}</button><div class="plb ${won?"cur":""}">${won?"Day complete · report":hasReportData(n)?"Report so far":"Day "+n+" trophy"}</div></div></div>`;
  return h; }
function popHtml(n,nd,i,o){
  const r=S.st.results[nodeKey(n,nd)];
  const sub = (nd.parts>1? `${nd.step==="learn"?"Lesson":"Part"} ${nd.part+1} of ${nd.parts} · `:"") + `about ${nd.min} min` + (r&&r.total?` · last ${r.score}/${r.total}`:"");
  const xp = nd.kind==="task"?15:10;
  let label = o.done ? (nd.kind==="task"?"Open again":`Practise again +${xp} XP`) : o.locked ? "Jump ahead" : `Start +${xp} XP`;
  if(nd.kind==="tutor") label = o.done ? "Talk again" : "Start talking";
  if(nd.kind==="mock") label = o.done ? "Open the mock again" : "Start the mock";
  if(nd.step==="review" && !o.done){ const c=srsCounts(); const k=c.due+Math.min(25,c.fresh); label = k? `Review ${k} cards` : "Nothing due · mark done"; }
  return `<div class="pop ${o.done?"done":o.locked?"locked":""}" style="--x:${o.x}px" role="dialog" aria-label="${attr(nd.title)}">
    <div><h3>${esc(nd.title)}</h3><div class="sub">${sub}</div></div>
    ${nd.desc&&nd.desc[0]?`<div class="sub">${ex(nd.desc[0], nd.desc[1])}</div>`:""}
    ${nd.step==="learn"&&(()=>{ const pp=learnParts(S.days[n]||{})[nd.part]; return pp&&pp.items&&getVariants(n,pp.id); })()?`<div class="sub">${ICONS.star.replace('<svg','<svg width="14" height="14" style="vertical-align:-2px"')} ${ex("New practice sentences every time","هر بار جمله‌های تمرینی تازه")}</div>`:""}
    ${o.locked?`<div class="sub">${ex("Finish the steps above first, or jump ahead if you already know this.","اول مراحل بالا را تمام کن، یا اگر بلدی جلو برو.")}</div>`:""}
    <button class="btn" data-act="node-start" data-i="${i}">${label}</button>
    ${nd.step==="learn"?`<button class="btn link" data-act="step" data-v="guide">${ICONS.book}Guidebook</button>`:""}
  </div>`; }
function tutorMini(n){ const has=hasReportData(n); return `<section class="card row" style="flex-wrap:nowrap;gap:14px"><div style="color:var(--blue);flex:none">${ICONS.mic.replace('<svg','<svg width="34" height="34"')}</div><div class="grow"><h3>${has?"Review today with your tutor":"Speak with your tutor"}</h3><p class="small muted">${has?ex("Gemini gets today's scores, mistakes and weak spots and drills exactly those.","Gemini نمره‌ها، اشتباهات و نقاط ضعف امروزت را می‌گیرد و روی همان‌ها کار می‌کند."):ex("Gemini knows today's words, your script and your mistakes.","Gemini لغات، متن و اشتباهات امروزت را می‌داند.")}</p></div><button class="btn blue sm" data-act="live-start" data-n="${n}" data-mode="${has?"review":"coach"}">Talk</button></section>`; }
function breakSheet(){ const B=S.brk; const left=Math.max(0,B.endAt-Date.now());
  return `<div class="sheet-bg"><div class="sheet" role="dialog" aria-label="Break"><div style="color:var(--orange);display:grid;place-items:center">${ICONS.cup.replace('<svg','<svg width="64" height="64"')}</div><h2>${B.len}-minute break</h2>
    <div class="tnum" id="brkTxt" style="font-size:2.6rem;font-weight:900;color:var(--ink-strong)">${fmtMs(left)}</div>
    <div class="muted">${B.len>=15?ex("Eat something, walk around, look out of a window. No phone.","چیزی بخور، کمی راه برو، از پنجره بیرون را نگاه کن. بدون گوشی."):ex("Stand up, drink water, rest your eyes.","بلند شو، آب بخور، به چشم‌هایت استراحت بده.")}</div>
    <button class="btn primary big" data-act="brk-end">${left>0?"End break":"Back to learning"}</button></div></div>`; }
function tickBreak(){ clearInterval(tickBreak._i); tickBreak._i=setInterval(()=>{ if(!S.brk){ clearInterval(tickBreak._i); return; } const left=S.brk.endAt-Date.now(); const el=$("#brkTxt"); if(el) el.textContent=fmtMs(Math.max(0,left));
  if(left<=0){ clearInterval(tickBreak._i); sfx("done"); toast("Break over. Weiter geht's!"); } },500); }

async function startNode(n, i){ const d=await getDay(n); if(!d) return; const nd=dayNodes(n,d)[i]; if(!nd) return; S.pop=null;
  if(["drill","hoertrainer","mix","words","minitest","repair"].includes(nd.step)) for(let k=1;k<=n;k++) await getDay(k);
  if(nd.kind==="tutor"){ S.liveMode=nd.mode||(hasReportData(n)?"review":"coach"); S.dayN=n; startLive(n); return; }
  if(nd.kind==="blitz"){ S.blitzFor=n; startBlitz(); return; }
  if(nd.kind==="mock"){ S.view="exam"; openMock(nd.mock); return; }
  if(nd.kind==="eye"){ const E=eyeData(); if(!E) return; const i=Math.max(0,E.items.findIndex(x=>eyeUnlocked(x)&&!(S.st.eye||{})[x.id])); S.eye={i:eyeUnlocked(E.items[i])?i:E.items.findIndex(eyeUnlocked), step:"rate", picks:{}, band:null, n}; render(); window.scrollTo(0,0); return; }
  if(d.set) await offUrls(d.set);
  if(nd.kind==="lesson"){ const screens=buildScreens(n,d,nd); if(!screens.length){ toast("Nothing to practise here yet"); return; }
    startLesson({n, step:nd.step, part:nd.part, parts:nd.parts, key:nodeKey(n,nd), title:nd.title, screens, node:i}); }
  else if(nd.kind==="review"){ for(const k of Object.keys(S.st.intro)) await getDay(+k); startFc("de");
    if(!S.fc.queue.length){ S.fc=null; if(!S.st.done[n+":review"]){ S.st.done[n+":review"]=Date.now(); addXp(5); save(); } toast(n===1?"Nothing to review on Day 1. Weiter!":"No cards due. Super!"); render(); return; }
    S.fcFrom=n; S.view="review"; render(); window.scrollTo(0,0); }
  else { S.step=nd.step; S.stepAt=Date.now(); render(); window.scrollTo(0,0); }
}

/* ---------- building lesson screens from a day's content ---------- */
function vfull(v){ return (v.article&&v.article!=="-"?v.article+" ":"")+v.de; }
function opts(correct, pool, k, seed){ const uniq=[...new Set(pool.filter(x=>x&&x!==correct))]; return shuffled([correct,...shuffled(uniq,seed).slice(0,k-1)], seed+"o"); }
function shuf2(w, seed){ let sh=shuffled(w,seed); for(let t=1; t<6 && w.length>1 && sh.join("\u0001")===w.join("\u0001"); t++) sh=shuffled(w,seed+"#"+t); return sh; }
const NAMES=["Gruber","Huber","Wieser","Steiner","Moser","Karimi","Bauer","Novak","Leitner","Hofer","Rahimi","Pichler"];
function buildScreens(n,d,nd){ const seed=nd.step+nd.part+Date.now();
  if(nd.step==="learn"){ const p=learnParts(d)[nd.part]; if(!S.st.intro[n]){ S.st.intro[n]=Date.now(); save(); } if(!p) return [];
    const rk=n+":"+p.id; S.st.runs=S.st.runs||{}; const run=S.st.runs[rk]||0; S.st.runs[rk]=run+1;
    S.les_build={variants:p.items?getVariants(n,p.id):null, run}; const out=learnScreens(d,p,seed); S.les_build=null;
    if(p.items&&!getVariants(n,p.id)) ensureVariants(n,p.id);
    else if(p.items&&run>=2&&run%3===2){ const ov=Object.assign({day:n}, S.imported[n]||{}); if(ov.variants&&ov.variants[p.id]){ delete ov.variants[p.id]; saveOverlay(n,ov).then(()=>getDay(n)).then(()=>ensureVariants(n,p.id)); } }
    return out; }
  if(nd.step==="practice"){ const p=practiceParts(d)[nd.part]; return p?p.items.map((it,i)=>exScreen(it, seed+i)):[]; }
  if(nd.step==="quiz") return (d.review_quiz||[]).map((q,i)=>exScreen({type:"mcq",prompt:q.q,options:q.options,answer:q.answer,explain_en:q.explain_en,explain_fa:q.explain_fa}, seed+i));
  if(nd.step==="diktat") return (d.diktat||[]).map(t=>({type:"dictation", text:t, noLog:true}));
  const H=dayHours()/3;
  if(nd.step==="drill") return drillScreens(n, Math.round((d.synthetic?16:12)*H));
  if(nd.step==="hoertrainer") return hoerScreens(n, Math.round((d.synthetic?14:12)*H));
  if(nd.step==="mix") return mixScreens(n, 15);
  if(nd.step==="minitest") return mixScreens(n, 20).map(s=>Object.assign(s,{nohint:true}));
  if(nd.step==="words") return wordsRecallScreens(n, Math.round(17*H));
  if(nd.step==="repair") return repairScreens(n, recentMistakes(21));
  return []; }
function exScreen(it, seed){ const b={explain_en:it.explain_en, explain_fa:it.explain_fa};
  if(it.type==="word_order"){ const w=String(it.prompt).split(/\s*·\s*/).filter(Boolean); return {...b,type:"word_order",words:shuf2(w,seed),answer:it.answer,q:it.answer}; }
  if(it.type==="translate") return {...b,type:"translate",prompt:it.prompt,answer:it.answer,accept:it.accept,q:it.prompt};
  if(it.type==="article") return {...b,type:"article",prompt:String(it.prompt).replace(/_+/g,"").trim(),options:(it.options&&it.options.length?it.options:["der","die","das"]),answer:it.answer,q:String(it.prompt).replace(/_+/g,"").trim()};
  if(it.type==="gap") return {...b,type:"gap",prompt:it.prompt,options:shuffled(it.options||[],seed),answer:it.answer,q:it.prompt};
  return {...b,type:"mcq",prompt:it.prompt,options:shuffled(it.options||[],seed),answer:it.answer,q:it.prompt}; }
function learnScreens(d,p,seed){ const out=[]; const V=d.vocab||[], P=d.phrases||[];
  if(p.id==="abc"){ const letters=d.alphabet.filter(a=>a.l&&a.l.length<=2); const say=a=>LETTER_TTS[a.l]||LETTER_TTS[a.l.toUpperCase()]||a.name||a.l;
    out.push({type:"abcgrid"});
    shuffled(letters,seed).slice(0,6).forEach((a,i)=>out.push({type:"listen",prompt:"Which letter do you hear?",say:say(a),options:opts(a.l,letters.map(x=>x.l),4,seed+i),answer:a.l,noLog:true}));
    shuffled(NAMES,seed).slice(0,2).forEach(w=>out.push({type:"spell",word:w,noLog:true}));
    return out; }
  if(p.id==="sounds"){ const all=d.pronunciation.flatMap(x=>x.words||[]);
    d.pronunciation.forEach((x,i)=>{ out.push({type:"tip",kind:"sound",title:x.focus,en:x.tip_en,fa:x.tip_fa,words:x.words||[]});
      const w=x.words||[]; if(w.length>=2){ const a=w[hashStr(seed+i)%w.length]; out.push({type:"listen",prompt:"Tap what you hear",say:a,options:opts(a,[...w,...all],4,seed+"s"+i),answer:a,noLog:true}); } });
    return out; }
  const VAR=S.les_build&&S.les_build.variants, RUN=(S.les_build&&S.les_build.run)||0;
  if(p.id[0]==="w"){ const items=p.items, pool=V.map(v=>v.en), fullPool=V.map(vfull);
    for(let g=0; g<items.length; g+=3){ const grp=items.slice(g,g+3);
      grp.forEach(v=>out.push({type:"teach",kind:"word",v}));
      shuffled(grp,seed+g).slice(0,VAR?2:3).forEach((v,j)=>out.push({type:"meaning",de:vfull(v),fa:v.fa,options:opts(v.en,pool,4,seed+g+"m"+j),answer:v.en,q:vfull(v),explain_en:v.example_de?v.example_de+(v.example_en?" · "+v.example_en:""):"",explain_fa:v.fa})); }
    if(items.length>=3) out.push({type:"match",pairs:shuffled(items,seed+"mt").slice(0,5).map(v=>({l:vfull(v),r:v.en,say:vfull(v)})),noLog:true});
    const rest=[];
    items.filter(v=>["der","die","das"].includes(v.article)).slice(0,VAR?2:3).forEach(v=>rest.push({type:"article",prompt:v.de,options:["der","die","das"],answer:v.article,q:v.de,explain_en:`${v.article} ${v.de}${v.plural&&v.plural!=="-"?", "+v.plural:""}`}));
    if(VAR){ rest.push(...variantScreens(p, VAR, RUN, fullPool)); }
    else { shuffled(items,seed+"l").slice(0,2).forEach((v,j)=>rest.push({type:"listen",prompt:"What do you hear?",say:vfull(v),options:opts(vfull(v),fullPool,4,seed+"L"+j),answer:vfull(v),noLog:true}));
      shuffled(items,seed+"r").slice(0,2).forEach((v,j)=>rest.push({type:"reverse",en:v.en,fa:v.fa,options:opts(vfull(v),fullPool,4,seed+"R"+j),answer:vfull(v),q:v.en,sayOpts:true})); }
    shuffled(items,seed+"wr").slice(0,2).forEach(v=>rest.push(writeScreen(v)));
    out.push(...shuffled(rest,seed+"rest"));
    return out; }
  if(p.id[0]==="p"){ const items=p.items, pool=P.map(x=>x.en), dePool=P.map(x=>x.de);
    for(let g=0; g<items.length; g+=4){ const grp=items.slice(g,g+4);
      grp.forEach(x=>out.push({type:"teach",kind:"phrase",v:x}));
      shuffled(grp,seed+g).slice(0,2).forEach((x,j)=>out.push({type:"meaning",de:x.de,fa:x.fa,options:opts(x.en,pool,3,seed+g+"pm"+j),answer:x.en,q:x.de,explain_fa:x.fa})); }
    if(items.length>=3) out.push({type:"match",pairs:shuffled(items,seed+"pmt").slice(0,4).map(x=>({l:x.de,r:x.en,say:x.de})),noLog:true});
    const rest=[];
    if(VAR) rest.push(...variantScreens(p, VAR, RUN, dePool));
    else items.filter(x=>{ const w=x.de.split(/\s+/); return w.length>=3&&w.length<=7; }).sort((a,b)=>hashStr(seed+a.de)-hashStr(seed+b.de)).slice(0,2)
      .forEach((x,j)=>{ const w=x.de.split(/\s+/); rest.push({type:"word_order",words:shuf2(w,seed+"w"+j),answer:x.de,q:x.de,en:x.en,explain_fa:x.fa}); });
    out.push(...shuffled(rest,seed+"prest"));
    const sp=shuffled(items,seed+"sp")[0]; if(sp) out.push({type:"speak",text:sp.de,en:sp.en,noLog:true,free:true});
    return out; }
  if(p.id==="gram"){ d.grammar.forEach(g=>out.push({type:"tip",kind:"grammar",title:g.topic,en:g.explain_en,fa:g.explain_fa,table:g.table,examples:g.examples,mistakes:g.common_mistakes}));
    (d.exercises||[]).filter(e=>e.type==="gap"||e.type==="word_order").slice(0,4).forEach((e,i)=>out.push(exScreen(e,seed+"g"+i)));
    return out; }
  return out; }

/* ---------- the lesson player ---------- */
const CHOICE=new Set(["mcq","gap","article","meaning","listen","reverse"]);
const NOCHECK=new Set(["teach","tip","abcgrid"]);
function startLesson(o){ stopSpeech(); S.les=Object.assign({queue:o.screens.map((_,i)=>i), pos:0, state:"ans", pick:null, wo:[], text:"", res:null, first:{}, graded:0, right:0, combo:0, maxCombo:0, startAt:Date.now(), retried:{}, match:null, sp:null, spoken:-1, quit:false}, o); S.pop=null; render(); window.scrollTo(0,0); }
function lesCur(){ const L=S.les; return L.screens[L.queue[L.pos]]; }
function bigSay(text, slow, small){ const i=SAY_BANK.push({text})-1; return `<button class="bigsay ${small||slow?"slowb":""}" data-act="say" data-i="${i}" ${slow?'data-slow="1"':""} aria-label="${slow?"Play slowly":"Play"}" title="${slow?"Play slowly":"Play"}">${slow?ICONS.turtle:ICONS.speaker}</button>`; }
function artHtml(t){ const m=String(t).match(/^(der|die|das)\s+(.*)$/); return m?`<span class="${artClass(m[1])}">${m[1]}</span> ${esc(m[2])}`:esc(t); }
function textIn(L, ph, single){ const chk=L.state==="chk"; const cls=chk?(L.res&&L.res.ok?"inp-ok":"inp-bad"):"";
  return (single?`<input type="text" class="les-in ${cls}" id="lesIn" data-les="text" value="${attr(L.text)}" placeholder="${attr(ph)}" ${chk?"disabled":""} autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="${attr(ph)}">`
    :`<textarea class="les-in ${cls}" id="lesIn" data-les="text" placeholder="${attr(ph)}" ${chk?"disabled":""} autocomplete="off" autocapitalize="sentences" spellcheck="false" aria-label="${attr(ph)}">${esc(L.text)}</textarea>`)
    + (chk?"":`<div class="ukeys" aria-label="Special letters">${["ä","ö","ü","ß","Ä","Ö","Ü"].map(c=>`<button data-act="les-key" data-v="${c}" tabindex="-1">${c}</button>`).join("")}</div>`); }
function vLesson(){ const L=S.les, s=lesCur(); const pct=Math.round(L.pos/L.queue.length*100);
  return `<div class="les"><div class="les-top"><button class="xbtn" data-act="les-quit" aria-label="Quit lesson">${ICONS.x}</button>
    <div class="grow" style="position:relative"><div class="lbar" role="progressbar" aria-label="Lesson progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(pct,3)}%"></i></div>${L.combo>=3?`<span class="combo">${L.combo} in a row</span>`:""}</div></div>
    <div class="les-body">${screenHtml(s,L)}</div>${lesFoot(s,L)}${L.quit?quitSheet():""}</div>`; }
function screenHtml(s,L){ const chk=L.state==="chk";
  const tiles=(list,cls="")=>{ const lay=list.length===3&&list.every(o=>o.length<12)?"three":list.length===4&&list.every(o=>o.length<26)?"two":"";
    return `<div class="answers ${lay}">${list.map((o,i)=>{ let c=""; if(chk){ if(o===s.answer) c="right"; else if(i===L.pick) c="wrong"; } else if(i===L.pick) c="sel";
      const gone=!chk&&(L.elim||[]).includes(i);
      return `<button class="ans ${c} ${gone?"gone":""} ${s.type==="article"?artClass(o):""} ${cls}" data-act="les-pick" data-v="${i}" ${chk||gone?"disabled":""}><span class="kbd">${i+1}</span><span>${esc(o)}</span></button>`; }).join("")}</div>`; };
  switch(s.type){
  case "teach": { const v=s.v, word=s.kind==="word", art=word&&v.article&&v.article!=="-"?v.article:"";
    return `<div><span class="badge">${word?"New word":"New phrase"}</span></div>
      <div class="teach"><div class="prompt-row">${bigSay(vfull(v),false,true)}<div class="word">${art?`<span class="${artClass(art)}">${esc(art)}</span> `:""}${esc(v.de)}</div></div>
      ${v.plural&&v.plural!=="-"?`<div class="muted">Plural: <b>${esc(v.plural)}</b></div>`:""}
      <div class="mean">${esc(v.en)}</div>${S.st.lang!=="en"&&v.fa?`<div class="fa" style="font-size:1.12rem;align-self:stretch">${esc(v.fa)}</div>`:""}
      <div class="row">${v.register==="formal"?`<span class="chip acc">formal · Sie</span>`:v.register==="informal"?`<span class="chip">informal · du</span>`:""}${v.austrian?`<span class="chip at">Austrian${typeof v.austrian==="string"?": "+esc(v.austrian):""}</span>`:""}</div>
      ${(()=>{ const hk=hookFor(L.n||currentDay(), v); return hk?`<div class="hook">${ICONS.bulb}<span><b>Memory hook:</b> ${esc(hk)}</span></div>`:""; })()}
      ${v.example_de?`<div class="sunk row" style="flex-wrap:nowrap;align-self:stretch">${sayBtn(v.example_de,{slow:true})}<div><b>${esc(v.example_de)}</b>${v.example_en?`<br><span class="small muted">${esc(v.example_en)}</span>`:""}</div></div>`:""}</div>`; }
  case "tip": return `<div><span class="badge blue">${s.kind==="sound"?"Sound tip":"Grammar"}</span></div><h1 class="les-h">${esc(s.title)}</h1><div class="card stack">${ex(s.en,s.fa)}
      ${s.words&&s.words.length?`<div class="row">${s.words.map(w=>`<button class="wtile" data-act="sayw" data-v="${attr(w)}">${esc(w)}</button>`).join("")}</div><p class="small muted">Tap each word to hear it.</p>`:""}
      ${s.table&&s.table.length?`<div class="tablewrap"><table class="gram">${s.table.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></div>`:""}
      ${(s.examples||[]).map(e=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(e.de)}<div><b>${esc(e.de)}</b><br><span class="small muted">${esc(e.en)}</span></div></div>`).join("")}
      ${s.mistakes&&s.mistakes.length?`<div class="sunk small"><b>Common mistakes</b><ul style="margin:6px 0 0;padding-left:18px">${s.mistakes.map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div>`:""}</div>`;
  case "abcgrid": { const d=S.days[L.n]||{}; return `<h1 class="les-h">Tap each letter to hear it</h1><div class="abc">${(d.alphabet||[]).map(a=>`<button data-act="letter" data-v="${attr(a.l)}" aria-label="${attr(a.l+", "+a.name)}"><span class="L">${esc(a.l)}</span><span class="nm">${esc(a.name)}</span>${S.st.lang!=="en"&&a.fa?`<span class="fa">${esc(a.fa)}</span>`:""}</button>`).join("")}</div>
      <p class="small muted">${ex("Listen carefully to E and I, G and J, V and W, and the umlauts: they're the classic spelling traps.","به E و I، G و J، V و W و حروف اوملات دقت کن؛ تله‌های رایج هجی هستند.")}</p>`; }
  case "meaning": return `<h1 class="les-h">What does this mean?</h1><div class="prompt-row">${bigSay(s.de,false,true)}<div class="big-prompt">${artHtml(s.de)}</div></div>${tiles(s.options)}`;
  case "reverse": return `<h1 class="les-h">How do you say this in German?</h1><div class="big-prompt">“${esc(s.en)}”</div>${S.st.lang!=="en"&&s.fa?`<div class="fa">${esc(s.fa)}</div>`:""}${tiles(s.options)}`;
  case "listen": return `<h1 class="les-h">${esc(s.prompt||"What do you hear?")}</h1><div class="listen-row">${bigSay(s.say)}${bigSay(s.say,true)}</div>${tiles(s.options,"c")}`;
  case "write": return `<h1 class="les-h">Write it in German</h1><div class="big-prompt">“${esc(s.en)}”</div>${S.st.lang!=="en"&&s.fa?`<div class="fa">${esc(s.fa)}</div>`:""}<p class="small muted">${ex("Nouns with der, die or das.","اسم‌ها را با der، die یا das بنویس.")}</p>${textIn(L,"Type in German",true)}`;
  case "mcq": return `<h1 class="les-h">${esc(s.h||"Choose the right answer")}</h1>${s.say?`<div>${bigSay(s.say,false,true)}</div>`:""}<div class="big-prompt" style="font-size:1.25rem">${esc(s.prompt)}</div>${tiles(s.options)}`;
  case "gap": { const w=L.pick!=null?s.options[L.pick]:""; const html=esc(s.prompt).replace(/_{2,}/, `<span class="gapword">${w?esc(w):"&nbsp;"}</span>`);
    return `<h1 class="les-h">Fill in the gap</h1><div class="big-prompt" style="font-size:1.3rem">${html}</div>${tiles(s.options)}`; }
  case "article": return `<h1 class="les-h">der, die or das?</h1><div class="big-prompt"><span class="gapword ${L.pick!=null?artClass(s.options[L.pick]):""}">${L.pick!=null?esc(s.options[L.pick]):"&nbsp;"}</span> ${esc(s.prompt)}</div>${tiles(s.options,"c")}`;
  case "word_order": return `<h1 class="les-h">${s.en?"Write this in German":"Put the words in order"}</h1>${s.en?`<div class="big-prompt" style="font-size:1.2rem">“${esc(s.en)}”</div>`:""}
      <div class="wline">${L.wo.map(ix=>`<button class="wtile" data-act="les-wo-del" data-ix="${ix}" ${chk?"disabled":""}>${esc(s.words[ix])}</button>`).join("")}</div>
      <div class="wbank">${s.words.map((w,ix)=>L.wo.includes(ix)?`<span class="wtile ph" aria-hidden="true">${esc(w)}</span>`:`<button class="wtile" data-act="les-wo-add" data-ix="${ix}" ${chk?"disabled":""}>${esc(w)}</button>`).join("")}</div>`;
  case "translate": return `<h1 class="les-h">Write this in German</h1><div class="big-prompt" style="font-size:1.25rem">${esc(s.prompt)}</div>${textIn(L,"Type in German")}`;
  case "dictation": return `<h1 class="les-h">Type what you hear</h1><div class="listen-row">${bigSay(s.text)}${bigSay(s.text,true)}</div>${textIn(L,"Type in German")}`;
  case "hear": return `<h1 class="les-h">${esc(s.h||"Type what you hear")}</h1><div class="listen-row">${bigSay(s.say)}${bigSay(s.say,true)}</div>${textIn(L,s.kind==="day"?"Wochentag":s.kind==="time"?"10:00":s.kind==="price"?"3,50":"0664 …",true)}`;
  case "spell": return `<h1 class="les-h">Type the name you hear spelled</h1><p class="muted small">${ex("In Hören Teil 2 a spelled name must be 100% correct.","در بخش ۲ شنیدن، اسمِ هجی‌شده باید کاملاً درست باشد.")}</p><div class="listen-row"><button class="bigsay" data-act="les-spell" aria-label="Spell again">${ICONS.speaker}</button></div>${textIn(L,"Surname",true)}`;
  case "match": return matchHtml(s,L);
  case "speak": return speakHtml(s,L);
  } return ""; }
function matchHtml(s,L){ if(!L.match){ const ids=s.pairs.map((_,i)=>i); L.match={L:shuffled(ids,"l"+L.pos+L.startAt), R:shuf2(ids,"r"+L.pos+L.startAt), sel:null, done:[], bad:null, mistakes:0}; }
  const M=L.match; const tile=(side,i)=>{ const p=s.pairs[i]; const done=M.done.includes(i); const sel=M.sel&&M.sel.side===side&&M.sel.i===i; const bad=M.bad&&M.bad.some(b=>b.side===side&&b.i===i);
    return `<button class="ans c ${done?"gone":bad?"wrong":sel?"sel":""}" data-act="les-match" data-side="${side}" data-i="${i}" ${done?"disabled":""}>${side==="l"?artHtml(p.l):esc(p.r)}</button>`; };
  return `<h1 class="les-h">Tap the matching pairs</h1><div class="match"><div class="col">${M.L.map(i=>tile("l",i)).join("")}</div><div class="col">${M.R.map(i=>tile("r",i)).join("")}</div></div>`; }
function srAvail(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition); }
function speakHtml(s,L){ const P=L.sp||{};
  return `<h1 class="les-h">Speak this sentence</h1><div class="prompt-row">${bigSay(s.text,false,true)}<div class="big-prompt" style="font-size:1.35rem">${esc(s.text)}</div></div>${s.en?`<div class="muted">${esc(s.en)}</div>`:""}
    ${srAvail()?`<button class="micbtn ${P.listening?"on":""}" data-act="les-mic" ${L.state==="chk"||P.listening?"disabled":""}>${ICONS.mic}${P.listening?"Listening… speak now":"Tap to speak"}</button>`
      :`<div class="banner info"><div>${ex("Say the sentence out loud, then tap “I said it”. Speech checking needs Chrome or Edge.","جمله را بلند بگو و بعد «I said it» را بزن. بررسی گفتار فقط در Chrome یا Edge کار می‌کند.")}</div></div>`}
    ${P.error?`<p class="small" style="color:var(--red-ink)">${esc(P.error)}</p>`:""}`; }
function answerText(s){ return s.type==="dictation"?s.text:s.type==="spell"?s.word:s.answer; }
function expl(s){ return s.explain_en||s.explain_fa?`<div class="small">${ex(s.explain_en||"", s.explain_fa||"")}</div>`:""; }
function lesFoot(s,L){
  if(L.state==="chk"){ const r=L.res||{};
    if(r.skip) return `<div class="les-foot"><div class="in"><span class="small muted">${ex("Skipped. It won't count against you.","رد شد و حساب نمی‌شود.")}</span><button class="btn primary big" id="lesBtn" data-act="les-next">Continue</button></div></div>`;
    const praise=["Richtig!","Super!","Sehr gut!","Toll!","Perfekt!","Genau!","Ausgezeichnet!"][(L.pos*3+L.right)%7];
    const body = r.ok ? `<div class="fbk"><div class="ic">${ICONS.check}</div><div class="stack" style="gap:4px;min-width:0"><h3>${r.note==="typo"?"Almost! Watch the spelling":r.note==="close"?`Close: ${r.pct}% of the words right`:r.note==="article"?"Almost! Remember the article":praise}</h3>${r.note==="typo"||r.note==="article"||r.note==="close"?`<div class="ans-line">${s.type==="write"?artHtml(answerText(s)):esc(answerText(s))}</div>`:""}${r.heard!=null?`<div class="small">I heard: <i>${esc(r.heard)}</i> · ${r.score}%</div>`:""}${expl(s)}</div></div>`
      : `<div class="fbk"><div class="ic">${ICONS.x}</div><div class="stack" style="gap:4px;min-width:0"><h3>${r.match?"Some pairs were wrong":s.free?"Not quite. Listen and try again later":s.type==="dictation"&&r.pct!=null?`${r.pct}% of the words. Correct answer:`:"Correct answer:"}</h3>${r.match||s.free?"":`<div class="ans-line">${s.type==="article"?artHtml(s.answer+" "+s.prompt):esc(answerText(s))}</div>`}${r.diff||""}${r.heard!=null?`<div class="small">I heard: <i>${esc(r.heard)}</i> · ${r.score}%</div>`:""}${expl(s)}</div></div>`;
    return `<div class="les-foot ${r.ok?"ok":"bad"}" role="status"><div class="in">${body}<button class="btn big" id="lesBtn" data-act="les-next">Continue</button></div></div>`; }
  if(NOCHECK.has(s.type)) return `<div class="les-foot"><div class="in"><span></span><button class="btn primary big" id="lesBtn" data-act="les-next">Continue</button></div></div>`;
  if(s.type==="match") return `<div class="les-foot"><div class="in"><span class="small muted">${ex("Tap a German word, then its meaning.","یک کلمه آلمانی و بعد معنی‌اش را بزن.")}</span><button class="btn big" disabled>Check</button></div></div>`;
  if(s.type==="speak") return `<div class="les-foot"><div class="in"><button class="btn" data-act="les-skip">Can't speak now</button>${srAvail()?"":`<button class="btn primary big" id="lesBtn" data-act="les-said">I said it</button>`}</div></div>`;
  const can = CHOICE.has(s.type) ? L.pick!=null : s.type==="word_order" ? L.wo.length>0 : !!L.text.trim();
  const hint = CHOICE.has(s.type) && !s.nohint && (s.options||[]).length>2 ? `<button class="btn" data-act="les-hint" ${(S.st.coins||0)<10||(L.elim||[]).length?"disabled":""} title="Remove one wrong answer">${ICONS.bulb}Hint · ${COIN}10</button>` : "";
  const skip = (s.type==="listen"||s.type==="dictation"||s.type==="spell"||s.type==="hear") ? `<div class="row">${hint}<button class="btn" data-act="les-skip">Can't listen now</button></div>` : hint || `<span></span>`;
  return `<div class="les-foot"><div class="in">${skip}<button class="btn primary big" id="lesBtn" data-act="les-check" ${can?"":"disabled"}>Check</button></div></div>`; }
function quitSheet(){ return `<div class="sheet-bg"><div class="sheet" role="dialog" aria-label="Quit lesson"><h2>Wait, don't go!</h2><p class="muted">${ex("You'll lose your progress in this lesson.","پیشرفتت در این درس از بین می‌رود.")}</p>
  <button class="btn primary big" data-act="les-quit-no">Keep learning</button><button class="btn ghost" data-act="les-quit-yes" style="color:var(--red-ink)">End session</button></div></div>`; }
function germanOf(s){ if(s.type==="write") return s.answer; if(s.type==="gap") return String(s.prompt).replace(/_{2,}/, s.answer); if(s.type==="article") return s.answer+" "+s.prompt; if(["reverse","word_order","translate"].includes(s.type)) return String(s.answer).split(" / ")[0]; return ""; }
function lesCheck(){ const L=S.les, s=lesCur(); if(!L||L.state!=="ans") return; let ok=false, your="", extra={};
  if(CHOICE.has(s.type)){ if(L.pick==null) return; your=s.options[L.pick]; ok=your===s.answer; }
  else if(s.type==="word_order"){ your=L.wo.map(i=>s.words[i]).join(" "); if(!your) return; ok=norm(your)===norm(s.answer); }
  else if(s.type==="translate"){ your=L.text.trim(); if(!your) return; ok=(s.accept&&s.accept.length?s.accept:String(s.answer).split(" / ")).some(x=>norm(x)===norm(your)); }
  else if(s.type==="dictation"){ your=L.text.trim(); if(!your) return; const strip=t=>t.replace(/[.,!?;:„“"]/g,"").replace(/\s+/g," ").trim();
    if(strip(your)===strip(s.text)) ok=true; else if(norm(your)===norm(s.text)){ ok=true; extra.note="typo"; }
    else { const tot=s.text.split(/\s+/).filter(Boolean).length; const good=lcsDiff(s.text, your).filter(t=>t.t==="ok").length; const pct=Math.round(good/Math.max(1,tot)*100); if(pct>=85){ ok=true; extra.note="close"; extra.pct=pct; } else extra.pct=pct; }
    if(!ok||extra.note) extra.diff=`<div class="small" style="line-height:1.9">${lcsDiff(s.text, your).map(t=>t.t==="ok"?esc(t.w):t.t==="extra"?`<s>${esc(t.w)}</s>`:`<u style="text-decoration-thickness:3px">${esc(t.w)}</u>`).join(" ")}</div>`; }
  else if(s.type==="hear"){ your=L.text.trim(); if(!your) return; ok=hearOk(s,your); }
  else if(s.type==="spell"){ your=L.text.trim(); if(!your) return; ok=your.toLowerCase().replace(/\s/g,"")===s.word.toLowerCase(); }
  else if(s.type==="write"){ your=L.text.trim(); if(!your) return; if(norm(your)===norm(s.answer)) ok=true; else if(s.bare&&s.answer!==s.bare&&norm(your)===norm(s.bare)){ ok=true; extra.note="article"; } }
  gradeScreen(ok, your, extra); }
function gradeScreen(ok, your, extra){ const L=S.les; const idx=L.queue[L.pos], s=L.screens[idx];
  L.state="chk"; L.res=Object.assign({ok, your}, extra||{});
  if(!(idx in L.first)&&(s.type==="hear"||s.kind==="spelled_name")){ const hk=s.kind||"hear"; S.st.hearStats=S.st.hearStats||{}; const hs=S.st.hearStats[hk]=S.st.hearStats[hk]||{ok:0,n:0}; hs.n++; if(ok) hs.ok++; }
  if(!s.free){ if(!(idx in L.first)){ L.first[idx]=ok; L.graded++; if(ok) L.right++; else if(!s.noLog) logMistake(L.n||currentDay(), L.src||L.step, s.q||s.prompt||"", your, String(answerText(s)||""), s.kind||s.type); }
    if(!ok && !L.retried[idx]){ L.retried[idx]=1; L.queue.push(idx); } }
  if(ok){ L.combo++; L.maxCombo=Math.max(L.maxCombo,L.combo); sfx("ok"); const g=germanOf(s); if(g) setTimeout(()=>{ if(S.les===L){ stopSpeech(); speak(g); } },280); }
  else { L.combo=0; sfx("bad"); vib(); }
  render(); }
function lesNext(){ const L=S.les; if(!L) return; stopSpeech(); L.pos++; Object.assign(L,{state:"ans",pick:null,wo:[],text:"",res:null,match:null,sp:null,elim:[]});
  if(L.pos>=L.queue.length) return finishLesson(); render(); window.scrollTo(0,0); }
function lesAfterRender(){ const L=S.les; if(!L) return; const s=lesCur(); if(!s) return;
  if(L.state==="ans" && L.spoken!==L.pos){ L.spoken=L.pos;
    const t = s.type==="teach"?vfull(s.v) : s.type==="meaning"?s.de : s.type==="listen"?s.say : s.type==="dictation"?s.text : s.say ? s.say : null;
    if(t) setTimeout(()=>{ if(S.les===L&&L.spoken===L.pos){ stopSpeech(); speak(t); } },350);
    if(s.type==="spell") setTimeout(()=>{ if(S.les===L&&L.spoken===L.pos) spellOut(s.word); },350); }
  const inp=$("#lesIn"); if(inp && L.state==="ans" && document.activeElement!==inp && matchMedia("(pointer:fine)").matches){ inp.focus({preventScroll:true}); const v=inp.value; try{ inp.setSelectionRange(v.length,v.length); }catch(e){} } }
function lesMic(){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; const L=S.les, s=lesCur(); if(!SR||!L) return; stopSpeech();
  const r=new SR(); r.lang="de-DE"; r.interimResults=false; r.maxAlternatives=4; L.sp={listening:true}; render();
  r.onresult=e=>{ const alts=[...e.results[0]].map(a=>a.transcript); const best=alts.map(a=>({a,s:simScore(s.text,a)})).sort((x,y)=>y.s-x.s)[0]; L.sp=null; if(S.les===L) gradeScreen(best.s>=70, best.a, {heard:best.a, score:best.s}); };
  r.onerror=e=>{ L.sp={error:e.error==="not-allowed"?"Allow the microphone for this site, or tap “Can't speak now”.":e.error==="no-speech"?"I didn't hear anything. Try again.":String(e.error)}; render(); };
  r.onend=()=>{ if(L.sp&&L.sp.listening){ L.sp={error:"I didn't hear anything. Try again."}; render(); } };
  try{ r.start(); }catch(e){ L.sp={error:e.message}; render(); } }
function finishLesson(){ const L=S.les; const acc=L.graded?Math.round(L.right/L.graded*100):null; const ms=Date.now()-L.startAt; const perfect=acc===100&&L.graded>=3;
  const comboBonus=Math.min(10, Math.floor((L.maxCombo||0)/5)*2); let dayDone=false;
  if(L.key){ const wasAll=dayAllDone(L.n); S.st.done[L.key]=Date.now(); if(L.graded) S.st.results[L.key]={score:L.right,total:L.graded,at:Date.now()};
    if(L.parts>1 && [...Array(L.parts).keys()].every(pi=>S.st.done[`${L.n}:${L.step}#${pi}`])) S.st.done[`${L.n}:${L.step}`]=S.st.done[`${L.n}:${L.step}`]||Date.now();
    dayDone=!wasAll && dayAllDone(L.n); }
  if(L.src==="rust"&&S.st.comeback){ S.st.comeback.done=Date.now(); S.st.done["cb:"+dk(new Date())]=Date.now(); }
  if(L.step==="learn"&&L.n&&S.days[L.n]){ const p=learnParts(S.days[L.n])[L.part]; if(p&&p.items) seedSrs(L.n,p); }
  bump("lessons"); dbump("lessons"); if(perfect){ bump("perfect"); dbump("perfect"); } dmax("maxCombo", L.maxCombo||0);
  if(L.step==="diktat"){ dbump("listen"); if(perfect) bump("dictPerfect"); }
  let coins=addCoins(5+(perfect?5:0)); if(dayDone){ coins+=addCoins(50); bump("daysDone"); }
  const xp=addXp(10+(perfect?5:0)+comboBonus); checkBadges(); save(); sfx("done");
  S.fin={title: dayDone?`Day ${L.n} complete!`:L.src==="rust"?"Welcome back! Rust check done":L.src==="mix"?"Review complete!":perfect?"Perfect lesson!":"Lesson complete!", xp, acc, ms, dayDone, n:L.n, node:L.node, combo:L.maxCombo, coins, comboBonus, boost:boostOn()};
  S.les=null; render(); window.scrollTo(0,0); }
function mockCta(n){ const m=MOCKS.find(x=>x.day===n); if(!m) return ""; const r=(S.st.mocks||{})[m.id];
  return `<section class="card stack" style="border-color:var(--orange)"><div class="row" style="flex-wrap:nowrap;gap:14px"><div style="color:var(--orange);flex:none">${ICONS.exam.replace('<svg','<svg width="38" height="38"')}</div>
    <div class="grow"><div class="label">Mock exam day</div><h3>${esc(m.title)}</h3></div></div><p class="small">${esc(m.how)}</p>${r?resultMini(r):""}
    <div><button class="btn primary" data-act="mock-open" data-id="${m.id}">${r?"Take it again":"Start mock"}</button></div></section>`; }
function medalSvg(){ return `<svg viewBox="0 0 160 160" aria-hidden="true"><g stroke="var(--gold)" stroke-width="7" stroke-linecap="round" opacity=".6">${[0,45,90,135,180,225,270,315].map(a=>`<path d="M80 8v16" transform="rotate(${a} 80 80)"/>`).join("")}</g>
  <circle cx="80" cy="86" r="48" fill="var(--gold-d)"/><circle cx="80" cy="80" r="48" fill="var(--gold)"/><circle cx="80" cy="80" r="36" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4"/>
  <path d="m80 52 9 18.3 20.2 2.9-14.6 14.3 3.4 20.1L80 98.1l-18 9.5 3.4-20.1L50.8 73.2 71 70.3z" fill="#fff"/></svg>`; }
function vFinish(){ const F=S.fin; const cols=["#58c322","#1db0f0","#ffc61a","#ff6fae","#ce82ff","#ff9a1f"];
  const conf=Array.from({length:44},(_,i)=>`<i style="left:${(i*37+11)%100}%;background:${cols[i%6]};animation-delay:${((i*7)%10)*0.09}s;animation-duration:${2.2+(i%5)*0.25}s"></i>`).join("");
  const accLbl = F.acc>=95?"Amazing":F.acc>=80?"Good":"Accuracy";
  const msg = F.dayDone ? ex("You finished every step today. Rest well and come back tomorrow.","همه مراحل امروز را تمام کردی. خوب استراحت کن و فردا برگرد.")
    : F.extra ? `<div>${esc(F.extra)}</div>`
    : F.acc!=null&&F.acc<80 ? ex("Below 80%. Practise this once more to lock it in.","زیر ۸۰٪ است. یک بار دیگر تمرین کن تا جا بیفتد.") : `<div>${["Weiter so!","Sehr gut gemacht!","Du schaffst das!","Prima!"][F.xp%4]}${F.combo>=5?` · ${F.combo} in a row`:""}</div>`;
  return `<div class="les">${F.acc!=null&&F.acc<80?"":`<div class="confetti" aria-hidden="true">${conf}</div>`}<div class="fin">
    <div class="fin-art">${F.acc!=null&&F.acc<80?edi(130,"happy"):medalSvg()}</div><h1>${esc(F.title)}</h1><div class="muted">${msg}</div>
    <div class="fin-stats">
      <div class="fstat" style="--c:var(--gold)"><div class="h">Total XP</div><div class="b">${ICONS.bolt}${F.xp}</div></div>
      ${F.acc!=null?`<div class="fstat" style="--c:var(--green)"><div class="h">${accLbl}</div><div class="b">${ICONS.target}${F.acc}%</div></div>`:""}
      <div class="fstat" style="--c:var(--blue)"><div class="h">Time</div><div class="b">${ICONS.clock}${fmtMs(F.ms||0)}</div></div>
      ${F.coins?`<div class="fstat" style="--c:var(--orange)"><div class="h">Schilling</div><div class="b">${COIN}+${F.coins}</div></div>`:""}</div>
    ${F.comboBonus||F.boost?`<div class="row" style="justify-content:center">${F.comboBonus?`<span class="chip warn">${ICONS.flame.replace('<svg','<svg width="14" height="14"')} combo bonus +${F.comboBonus} XP</span>`:""}${F.boost?`<span class="chip gold">${ICONS.bolt.replace('<svg','<svg width="14" height="14"')} double XP</span>`:""}</div>`:""}
    <div class="small muted tnum">Today: ${xpToday()} / ${goalXp()} XP${xpToday()>=goalXp()?" · daily goal reached":""}</div></div>
    <div class="les-foot"><div class="in">${F.dayDone&&F.n?`<button class="btn" data-act="fin-continue">Later</button><button class="btn primary big" id="lesBtn" data-act="fin-report">See today's report</button>`:`${F.acc!=null&&F.acc<80&&F.node!=null?`<button class="btn" data-act="fin-again">Practise again</button>`:"<span></span>"}<button class="btn primary big" id="lesBtn" data-act="fin-continue">Continue</button>`}</div></div></div>`; }
function finishFc(){ const f=S.fc; S.fc=null; const n=S.fcFrom; let dayDone=false;
  if(n){ const wasAll=dayAllDone(n); S.st.done[n+":review"]=S.st.done[n+":review"]||Date.now(); dayDone=!wasAll&&dayAllDone(n); S.view="today"; }
  let coins=addCoins(5); if(dayDone){ coins+=addCoins(50); bump("daysDone"); } const xp=addXp(5+Math.min(20,f.seen)); checkBadges();
  S.fcFrom=null; save(); sfx("done");
  S.fin={title:dayDone?`Day ${n} complete!`:"Cards reviewed!", xp, coins, acc:f.seen?Math.round((f.good||0)/f.seen*100):null, ms:Date.now()-(f.at||Date.now()), dayDone, n, boost:boostOn()};
  render(); window.scrollTo(0,0); }
function guideShell(n,d){ return `<div class="les"><div class="les-top"><button class="xbtn" data-act="back" aria-label="Close guidebook">${ICONS.x}</button><div class="grow"><div class="label">Day ${n} · Guidebook</div><h2>${esc(d.title||PLAN[n-1].t)}</h2></div></div>
  <div class="les-body">${stLearn(n,d)}</div>
  <div class="les-foot"><div class="in"><span class="small muted">${ex("All of today's words, phrases and grammar on one page.","همه لغات، جمله‌ها و دستور امروز در یک صفحه.")}</span><button class="btn primary big" id="lesBtn" data-act="back">Got it</button></div></div></div>`; }

/* ====================== v6: gamification layer ====================== */
/* Economy: Schilling (the old Austrian currency) earned by learning, spent in the shop. */
const COIN='<svg viewBox="0 0 24 24" class="coin"><circle cx="12" cy="12" r="10" fill="#ffc61a" stroke="#e0a800" stroke-width="2"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/><text x="12" y="16.3" text-anchor="middle" font-size="11" font-weight="900" fill="#a86f00" font-family="Nunito,Segoe UI,sans-serif">S</text></svg>';
function shield(col){ return `<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" fill="${col}" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L12 14.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff" fill-opacity=".9"/></svg>`; }
function sdKey(d){ return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function dayData(){ const k=dk(new Date()); S.st.daily=S.st.daily||{}; if(!S.st.daily[k]){ S.st.daily[k]={}; const keys=Object.keys(S.st.daily).sort(); while(keys.length>21) delete S.st.daily[keys.shift()]; } return S.st.daily[k]; }
function bump(k,n=1){ S.st.stats=S.st.stats||{}; S.st.stats[k]=(S.st.stats[k]||0)+n; }
function stat(k){ return (S.st.stats||{})[k]||0; }
function dbump(k,n=1){ const D=dayData(); D[k]=(D[k]||0)+n; }
function dmax(k,v){ const D=dayData(); D[k]=Math.max(D[k]||0,v); S.st.stats=S.st.stats||{}; S.st.stats[k]=Math.max(S.st.stats[k]||0,v); }
function addCoins(n){ S.st.coins=(S.st.coins||0)+n; S.st.coinsEarned=(S.st.coinsEarned||0)+n; return n; }
function totalXp(){ return Object.values(S.st.xp||{}).reduce((a,b)=>a+b,0); }
function levelInfo(x){ let l=1, need=100, rest=x; while(rest>=need){ rest-=need; l++; need=100+50*(l-1); } return {lvl:l, into:rest, need}; }
function boostOn(){ return (S.st.boostUntil||0)>Date.now(); }
function queueCel(c){ S.cel=S.cel||[]; if(!S.cel.some(x=>x.type===c.type&&x.id===c.id)) S.cel.push(c); }
function daysComplete(){ let k=0; for(let n=1;n<=PLAN.length;n++) if(S.days[n]&&dayAllDone(n)) k++; return Math.max(k, stat("daysDone")); }
function cardsKnown(){ const c=srsCounts(); return c.learned+c.due; }

/* streak freezes: bought in the shop, used automatically for missed days */
function applyFreezes(){ if(!(S.st.freezes>0)) return; const set=studyDates(); const fz=new Set(S.st.freezeDays||[]); const t=todayMid(); const gap=[]; let i=1;
  for(;i<60;i++){ const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); const k=sdKey(d); if(set.has(k)||fz.has(k)) break; gap.push(k); }
  if(i>=60||!gap.length||gap.length>S.st.freezes) return;
  gap.forEach(k=>fz.add(k)); S.st.freezes-=gap.length; S.st.freezeDays=[...fz].slice(-40); save();
  setTimeout(()=>toast(`Streak freeze used for ${gap.length} missed day${gap.length>1?"s":""}. Your streak is safe!`),1600); }

/* leagues: honest weekly XP tiers (no fake opponents). Promote with 800+ XP in a week, drop below 300. */
const LEAGUES=[["Bregenz","#d08a4a"],["Innsbruck","#9aa8b4"],["Salzburg","#ffc61a"],["Linz","#1db0f0"],["Graz","#ff6fae"],["Wien","#ce82ff"]];
const PROMOTE=800, KEEP=300;
function weekStart(d){ const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
function weekXp(ws){ let s=0; for(let i=0;i<7;i++){ const d=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()+i); s+=(S.st.xp||{})[dk(d)]||0; } return s; }
function updateLeague(){ const L=S.st.league=S.st.league||{tier:0,week:""}; const ws=weekStart(new Date()), cur=dk(ws);
  if(!L.week){ L.week=cur; return; } if(L.week===cur) return;
  const [y,m,d]=L.week.split("-").map(Number); let w=new Date(y,m-1,d);
  while(w<ws){ const x=weekXp(w), before=L.tier; if(x>=PROMOTE) L.tier=Math.min(LEAGUES.length-1,L.tier+1); else if(x<KEEP) L.tier=Math.max(0,L.tier-1);
    if(L.tier>before) queueCel({type:"league", tier:L.tier, xp:x}); else if(L.tier<before) setTimeout(()=>toast(`Back to the ${LEAGUES[L.tier][0]} league. Earn ${PROMOTE} XP this week to move up!`),1800);
    w=new Date(w.getFullYear(),w.getMonth(),w.getDate()+7); }
  L.week=cur; save(); }
function leagueCard(compact){ const L=S.st.league||{tier:0}; const [name,col]=LEAGUES[L.tier]; const x=weekXp(weekStart(new Date())); const top=L.tier>=LEAGUES.length-1;
  const left=7-((new Date().getDay()+6)%7); const pct=Math.min(100,Math.round(x/PROMOTE*100));
  return `<section class="card stack league"><div class="row" style="flex-wrap:nowrap;gap:14px"><div class="lg-shield">${shield(col)}</div>
    <div class="grow"><div class="label">Weekly league · ${left} day${left>1?"s":""} left</div><h2>${name} league</h2>
    <div class="small muted">${top?ex(`Top league! Keep ${KEEP}+ XP a week to stay in Wien.`,"بالاترین لیگ! هفته‌ای حداقل "+KEEP+" امتیاز تا در وین بمانی."):x>=PROMOTE?ex(`Promotion secured: you move to ${LEAGUES[L.tier+1][0]} on Monday.`,"صعود قطعی شد."):ex(`${PROMOTE-x} XP more this week to move up to ${LEAGUES[L.tier+1][0]}.`,`${PROMOTE-x} امتیاز دیگر تا صعود.`)}</div></div></div>
    <div class="qbar"><i style="width:${pct}%;background:${col}"></i><span class="tnum">${x} / ${PROMOTE} XP</span></div>
    ${compact?"":`<div class="ladder">${LEAGUES.map(([nm,c],i)=>`<div class="rung ${i===L.tier?"cur":i<L.tier?"past":""}" title="${nm}"><span style="color:${i<=L.tier?c:"var(--faint)"}">${shield(i<=L.tier?c:"var(--line)")}</span><b>${nm}</b></div>`).join("")}</div>
    <p class="small muted">${ex(`Leagues are you against the clock, not other people: ${PROMOTE}+ XP in a week (Mon–Sun) moves you up, under ${KEEP} moves you down. Reach Wien before the exam!`,`لیگ‌ها رقابت با خودت است: ${PROMOTE}+ امتیاز در هفته صعود، زیر ${KEEP} سقوط. قبل از آزمون به وین برس!`)}</p>`}</section>`; }

/* achievements */
const BADGES=[
 ["first","Erste Schritte","Finish your first lesson","star",()=>stat("lessons")>=1],
 ["lessons25","Fleißig","Finish 25 lessons","star",()=>stat("lessons")>=25],
 ["lessons100","Unermüdlich","Finish 100 lessons","star",()=>stat("lessons")>=100],
 ["perfect","Perfekt!","Get 100% in a lesson","target",()=>stat("perfect")>=1],
 ["perfect10","Fehlerfrei","Get 100% in 10 lessons","target",()=>stat("perfect")>=10],
 ["combo10","In Fahrt","10 right answers in a row","flame",()=>stat("maxCombo")>=10],
 ["combo25","Unaufhaltsam","25 right answers in a row","flame",()=>stat("maxCombo")>=25],
 ["streak3","Drei Tage","Reach a 3-day streak","flame",()=>streak()>=3],
 ["streak7","Eine Woche","Reach a 7-day streak","flame",()=>streak()>=7],
 ["streak14","Zwei Wochen","Reach a 14-day streak","flame",()=>streak()>=14],
 ["streak30","Bis zur Prüfung","Reach a 30-day streak","flame",()=>streak()>=30],
 ["xp1000","Tausend","Earn 1,000 XP","bolt",()=>totalXp()>=1000],
 ["xp5000","Fünftausend","Earn 5,000 XP","bolt",()=>totalXp()>=5000],
 ["words100","Wortschatz","Have 100 cards in memory","cards",()=>cardsKnown()>=100],
 ["words300","Lexikon","Have 300 cards in memory","cards",()=>cardsKnown()>=300],
 ["day1","Tagessieger","Finish every step of a day","trophy",()=>daysComplete()>=1],
 ["day7","Wochensieger","Finish 7 full days","trophy",()=>daysComplete()>=7],
 ["dict","Diktat-Profi","Finish a dictation with 100%","pencil",()=>stat("dictPerfect")>=1],
 ["blitz20","Blitzschnell","Score 20 in Wörter-Blitz","bolt",()=>(S.st.blitzBest||0)>=20],
 ["quests10","Abenteurer","Claim 10 daily quests","chest",()=>stat("quests")>=10],
 ["mock","Probe bestanden","Pass the written part of a mock","exam",()=>Object.values(S.st.mocks||{}).some(r=>r&&r.wPass)],
 ["tutor","Gesprächig","Finish a session with the tutor","mic",()=>Object.values(S.st.live||{}).flat().length>=1],
 ["austria","Österreich-Fan","Add the Austrian words deck","flagAT",()=>!!(S.st.decks&&S.st.decks.austria)],
 ["wien","Ab nach Wien","Reach the Wien league","trophy",()=>((S.st.league||{}).tier||0)>=LEAGUES.length-1]];
function checkBadges(){ S.st.badges=S.st.badges||{}; let changed=false;
  BADGES.forEach(([id,,,,test])=>{ if(S.st.badges[id]) return; let ok=false; try{ ok=test(); }catch(e){} if(ok){ S.st.badges[id]=Date.now(); addCoins(20); queueCel({type:"badge", id}); changed=true; } });
  if(changed) save(); }
function badgesCard(){ const got=S.st.badges||{}; const n=Object.keys(got).length;
  return `<section class="card stack"><div class="row between"><h2>Achievements</h2><span class="chip gold tnum">${n} / ${BADGES.length}</span></div>
    <div class="bgrid">${BADGES.map(([id,t,d,ic])=>`<div class="bdg ${got[id]?"on":""}" title="${attr(d)}"><div class="bi">${ICONS[ic]}</div><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>
    <p class="small muted">Each achievement pays 20 Schilling.</p></section>`; }
function levelCard(){ const L=levelInfo(totalXp()); const pct=Math.round(L.into/L.need*100);
  return `<section class="card row lvl" style="flex-wrap:nowrap;gap:16px"><div class="lvl-ring" style="--p:${pct}"><span>${L.lvl}</span></div>
    <div class="grow"><div class="label">Level ${L.lvl}</div><h2>${["Anfänger","Lernender","Entdecker","Sprecher","Kenner","Profi","Meister","Champion"][Math.min(7,Math.floor((L.lvl-1)/2))]}</h2>
    <div class="qbar"><i style="width:${pct}%"></i><span class="tnum">${L.into} / ${L.need} XP</span></div><div class="small muted">${L.need-L.into} XP to level ${L.lvl+1} · level-ups pay 30 Schilling</div></div></section>`; }

/* daily quests: one fixed + two that rotate every day */
const QPOOL=[
 {id:"lessons3",t:"Finish 3 lessons",max:3,val:D=>D.lessons||0,r:15,ic:"star"},
 {id:"perfect",t:"Get 100% in a lesson",max:1,val:D=>D.perfect||0,r:20,ic:"target"},
 {id:"combo10",t:"Get 10 right in a row",max:10,val:D=>D.maxCombo||0,r:20,ic:"flame"},
 {id:"cards20",t:"Review 20 cards",max:20,val:()=>(S.st.fcLog||{})[dk(new Date())]||0,r:15,ic:"cards"},
 {id:"listen",t:"Finish a Hören or Dictation step",max:1,val:D=>D.listen||0,r:20,ic:"headph"},
 {id:"blitz",t:"Play a Wörter-Blitz round",max:1,val:D=>D.blitz||0,r:15,ic:"bolt"},
 {id:"break",t:"Take a planned break",max:1,val:D=>D.breaks||0,r:10,ic:"cup"}];
function quests(){ const h=hashStr(dk(new Date())); const a=QPOOL[h%QPOOL.length]; let b=QPOOL[(h>>>5)%QPOOL.length]; if(b===a) b=QPOOL[(QPOOL.indexOf(a)+3)%QPOOL.length];
  return [{id:"xp",t:`Earn ${goalXp()} XP`,max:goalXp(),val:()=>xpToday(),r:20,ic:"bolt"}, a, b]; }
function questsCard(n,d){ const D=dayData(), cl=D.claimed||{};
  const rows=quests().map(q=>{ const v=Math.min(q.val(D),q.max), done=v>=q.max, claimed=cl[q.id];
    return `<div class="quest"><div class="qi" style="color:var(--${q.ic==="bolt"?"gold":q.ic==="flame"?"orange":q.ic==="cards"?"purple":"blue"})">${ICONS[q.ic]}</div><div class="stack" style="gap:4px"><div class="row between" style="flex-wrap:nowrap"><b>${esc(q.t)}</b>${claimed?`<span class="chip ok">${ICONS.check.replace('<svg','<svg width="12" height="12"')} claimed</span>`:done?`<button class="btn gold sm" data-act="quest-claim" data-q="${q.id}" data-r="${q.r}">${COIN} Claim ${q.r}</button>`:`<span class="chip gold">${COIN} ${q.r}</span>`}</div>
      <div class="qbar"><i style="width:${Math.round(v/q.max*100)}%"></i><span class="tnum">${v} / ${q.max}</span></div></div></div>`; }).join("");
  return `<section class="card"><div class="row between" style="margin-bottom:4px"><h2>Daily quests</h2><span class="small muted">new quests at midnight</span></div>${rows}</section>`; }

/* mascot: Edi the edelweiss (original character) */
function edi(size=96, mood="happy"){ const mouth = mood==="wow" ? '<ellipse cx="0" cy="9" rx="5" ry="6" fill="#3c3c3c"/><ellipse cx="0" cy="11.5" rx="3" ry="2.4" fill="#ff7b86"/>' : mood==="wink" ? '<path d="M-8 6 Q0 15 8 6" stroke="#3c3c3c" stroke-width="2.8" fill="none" stroke-linecap="round"/>' : '<path d="M-8 5 Q0 15 8 5Z" fill="#3c3c3c"/><path d="M-4.5 9.6 Q0 12.6 4.5 9.6" stroke="#ff7b86" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
  const eyes = mood==="wink" ? '<ellipse cx="-8" cy="-4" rx="3.4" ry="4.4" fill="#3c3c3c"/><circle cx="-7" cy="-5.5" r="1.3" fill="#fff"/><path d="M4 -4 Q8 -8 12 -4" stroke="#3c3c3c" stroke-width="2.6" fill="none" stroke-linecap="round"/>' : '<ellipse cx="-8" cy="-4" rx="3.4" ry="4.4" fill="#3c3c3c"/><ellipse cx="8" cy="-4" rx="3.4" ry="4.4" fill="#3c3c3c"/><circle cx="-7" cy="-5.6" r="1.3" fill="#fff"/><circle cx="9" cy="-5.6" r="1.3" fill="#fff"/>';
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" class="edi" aria-hidden="true"><g transform="translate(60 61)">
    ${[0,45,90,135,180,225,270,315].map(a=>`<path d="M0 -14 C 12 -24 10 -46 0 -57 C -10 -46 -12 -24 0 -14Z" transform="rotate(${a+22.5})" fill="#ffffff" stroke="#cfd8de" stroke-width="2.2" stroke-linejoin="round"/>`).join("")}
    ${[0,60,120,180,240,300].map(a=>`<path d="M0 -12 C 7 -18 6 -32 0 -38 C -6 -32 -7 -18 0 -12Z" transform="rotate(${a})" fill="#f4f7f8" stroke="#dfe6ea" stroke-width="1.6"/>`).join("")}
    <circle r="22" fill="#ffd84d" stroke="#e5b300" stroke-width="2.5"/>${eyes}<circle cx="-14" cy="5" r="3.6" fill="#ff9aa2" opacity=".75"/><circle cx="14" cy="5" r="3.6" fill="#ff9aa2" opacity=".75"/>${mouth}</g></svg>`; }
function ediSays(n){ const xp=xpToday(), g=goalXp(), dl=daysLeft();
  const [de,en] = !xp ? [`Servus! Bereit für Tag ${n}?`, `Ready for today? ${dl} days to the exam.`] : xp>=g ? ["Tagesziel geschafft!", "Daily goal done. Every extra lesson is a bonus."] : [`Noch ${g-xp} XP!`, `${g-xp} XP to your daily goal. Weiter so!`];
  return `<div class="edi-row">${edi(76, xp>=g?"wink":"happy")}<div class="speech"><b>${esc(de)}</b><span>${esc(en)}</span></div></div>`; }

/* celebration screens (streak, level, badge, league) */
function weekDots(){ const set=studyDates(); const fz=new Set(S.st.freezeDays||[]); const ws=weekStart(new Date()); const t=todayMid();
  return `<div class="wdots">${["Mo","Di","Mi","Do","Fr","Sa","So"].map((nm,i)=>{ const d=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()+i); const k=sdKey(d); const on=set.has(k), f=fz.has(k), today=+d===+t;
    return `<div class="wd ${on?"on":f?"frz":""} ${today?"today":""}"><span>${nm}</span><i>${on?ICONS.check:f?"❄":""}</i></div>`; }).join("")}</div>`; }
function vCel(){ const c=S.cel[0]; let art="", h="", p="";
  if(c.type==="streak"){ const s=streak(); art=`<div class="cel-flame">${ICONS.flame}<b class="tnum">${s}</b></div>`; h=`${s}-day streak!`;
    p=ex(s<=1?"Your streak starts today. Come back tomorrow to keep it going.":"You studied again today. Keep the flame alive until the exam!", s<=1?"زنجیره امروز شروع شد. فردا برگرد تا ادامه پیدا کند.":"امروز هم خواندی. شعله را تا روز آزمون روشن نگه دار!")
      + weekDots() + `<div class="small muted">${S.st.freezes?`${S.st.freezes} streak freeze${S.st.freezes>1?"s":""} ready`:`No streak freeze yet · buy one in the shop`}</div>`; }
  else if(c.type==="level"){ art=`<div class="lvl-ring big" style="--p:100"><span>${c.lvl}</span></div>`; h=`Level ${c.lvl}!`; p=`<div class="chip gold" style="font-size:.95rem">${COIN} +30 Schilling</div>`; }
  else if(c.type==="badge"){ const B=BADGES.find(b=>b[0]===c.id)||["","Achievement","","star"]; art=`<div class="bdg on big"><div class="bi">${ICONS[B[3]]}</div></div>`; h=B[1]; p=`<div>${esc(B[2])}</div><div class="chip gold" style="font-size:.95rem">${COIN} +20 Schilling</div>`; }
  else if(c.type==="league"){ const [nm,col]=LEAGUES[c.tier]; art=`<div class="lg-shield big">${shield(col)}</div>`; h=`Welcome to ${nm}!`; p=ex(`${c.xp} XP last week moved you up a league. ${c.tier>=LEAGUES.length-1?"You made it to Wien!":"Next stop: "+LEAGUES[c.tier+1][0]+"."}`,"به لیگ بالاتر صعود کردی!"); }
  return `<div class="les"><div class="fin cel">${c.type==="streak"||c.type==="level"?"":`<div class="confetti" aria-hidden="true">${confetti()}</div>`}
    <div class="cel-art">${art}</div><div class="row" style="justify-content:center;gap:10px;flex-wrap:nowrap">${edi(56,c.type==="streak"?"happy":"wow")}<h1>${esc(h)}</h1></div><div class="stack" style="align-items:center">${p}</div></div>
    <div class="les-foot"><div class="in"><span class="small muted tnum">${S.cel.length>1?`${S.cel.length-1} more`:""}</span><button class="btn primary big" id="lesBtn" data-act="cel-next">Continue</button></div></div></div>`; }
function confetti(){ const cols=["#58c322","#1db0f0","#ffc61a","#ff6fae","#ce82ff","#ff9a1f"]; return Array.from({length:44},(_,i)=>`<i style="left:${(i*37+11)%100}%;background:${cols[i%6]};animation-delay:${((i*7)%10)*0.09}s;animation-duration:${2.2+(i%5)*0.25}s"></i>`).join(""); }

/* shop */
function vShop(){ const c=S.st.coins||0; const bl=boostOn()?Math.ceil((S.st.boostUntil-Date.now())/60000):0;
  const item=(ic,col,t,d,price,act,dis,note)=>`<div class="shop-item"><div class="si" style="color:${col}">${ic}</div><div class="grow stack" style="gap:6px"><h3>${t}</h3><div class="small muted">${d}</div>
    <div class="row between">${note?`<span class="small">${note}</span>`:"<span></span>"}${act?`<button class="btn ${dis?"":"gold"}" data-act="shop-buy" data-v="${act}" ${dis?"disabled":""}>${COIN}${price}</button>`:`<span class="chip gold">${COIN} ${price} each</span>`}</div></div></div>`;
  return `<div class="row between"><h1>Shop</h1><div class="wallet">${COIN}<b class="tnum">${c}</b></div></div>
    <div class="edi-row">${edi(70,"wink")}<div class="speech"><b>Schilling!</b><span>${ex("The old Austrian money is back. Earn it by learning, spend it here.","پول قدیمی اتریش برگشته! با یادگیری جمعش کن و اینجا خرج کن.")}</span></div></div>
    <section class="card stack" style="gap:0">
    ${item(`<span style="font-size:2rem;line-height:1">❄</span>`,"var(--blue)","Streak freeze",ex("Protects your streak if you miss a day. Used automatically. You can hold 2.","اگر یک روز نخوانی، زنجیره‌ات حفظ می‌شود. خودکار استفاده می‌شود. حداکثر ۲ تا."),150,"freeze",c<150||(S.st.freezes||0)>=2,`Owned: <b>${S.st.freezes||0} / 2</b>`)}
    ${item(ICONS.bolt,"var(--gold)","Double XP · 15 minutes",ex("Every XP you earn counts twice for 15 minutes. Start it right before a lesson block.","تا ۱۵ دقیقه همه امتیازها دو برابر می‌شوند. درست قبل از شروع درس بخر."),100,"boost",c<100||bl>0,bl?`<b style="color:var(--orange)">Active · ${bl} min left</b>`:"")}
    ${item(ICONS.bulb,"var(--purple)","Lesson hint",ex("Inside a lesson, tap Hint to remove one wrong answer.","داخل درس، Hint را بزن تا یک گزینه غلط حذف شود."),10,null)}
    </section>
    <section class="card stack"><h2>How to earn Schilling</h2>
      <div class="earn">${[["Finish a lesson","5"],["Perfect lesson (100%)","+5"],["Finish an exam-format step","10"],["Open a break chest","5–15"],["Claim a daily quest","10–20"],["Unlock an achievement","20"],["Level up","30"],["Finish a whole day","50"],["Wörter-Blitz","1 per word"]].map(([a,b])=>`<div class="row between"><span>${a}</span><span class="chip gold">${COIN} ${b}</span></div>`).join("")}</div></section>`; }

/* Wörter-Blitz: 60-second vocabulary speed round */
function blitzPool(){ return allCards().filter(c=>c.en&&c.de&&c.kind!=="m"&&String(c.en).length<60); }
async function startBlitz(){ for(const k of Object.keys(S.st.intro)) await getDay(+k); const pool=blitzPool();
  if(pool.length<6){ toast("Learn a few words first: finish a Words lesson."); return; }
  S.blitz={pool, endAt:Date.now()+60000, score:0, wrong:0, combo:0, q:null, flash:null, startAt:Date.now()}; nextBlitz(); render(); window.scrollTo(0,0); tickBlitz(); }
function nextBlitz(){ const B=S.blitz; let c; do{ c=B.pool[Math.floor(Math.random()*B.pool.length)]; } while(B.q&&B.pool.length>1&&vfull(c)===B.q.de);
  const rev=Math.random()<0.3; B.q = rev ? {de:c.en, answer:vfull(c), rev:true, options:opts(vfull(c), B.pool.map(vfull), 4, String(Math.random()))} : {de:vfull(c), answer:c.en, options:opts(c.en, B.pool.map(x=>x.en), 4, String(Math.random()))};
  if(!rev) setTimeout(()=>{ if(S.blitz===B){ stopSpeech(); speak(B.q.de); } },120); }
function tickBlitz(){ clearInterval(tickBlitz._i); tickBlitz._i=setInterval(()=>{ const B=S.blitz; if(!B){ clearInterval(tickBlitz._i); return; } const left=B.endAt-Date.now();
  const bar=$("#blitzBar"), t=$("#blitzT"); if(bar) bar.style.width=Math.max(0,left/600)+"%"; if(t) t.textContent=Math.max(0,Math.ceil(left/1000));
  if(left<=0){ clearInterval(tickBlitz._i); endBlitz(); } },200); }
function endBlitz(){ const B=S.blitz; if(!B) return; S.blitz=null; if(S.blitzFor){ S.st.done[S.blitzFor+":blitz"]=Date.now(); S.blitzFor=null; } stopSpeech(); const best=Math.max(S.st.blitzBest||0, B.score); const rec=B.score>(S.st.blitzBest||0)&&B.score>0; S.st.blitzBest=best;
  dbump("blitz"); const coins=addCoins(Math.min(40,B.score)); const xp=B.score?addXp(Math.min(30,B.score)):0; checkBadges(); save(); sfx("done");
  S.fin={title:rec?"New high score!":"Wörter-Blitz", xp, acc:B.score+B.wrong?Math.round(B.score/(B.score+B.wrong)*100):null, ms:60000, coins, extra:`${B.score} word${B.score===1?"":"s"} · best ${best}`, n:null}; render(); }
function vBlitz(){ const B=S.blitz, q=B.q, left=Math.max(0,B.endAt-Date.now());
  return `<div class="les"><div class="les-top"><button class="xbtn" data-act="blitz-quit" aria-label="Stop">${ICONS.x}</button>
    <div class="grow"><div class="lbar blitzbar"><i id="blitzBar" style="width:${left/600}%"></i></div></div><span class="blitz-t tnum" id="blitzT">${Math.ceil(left/1000)}</span></div>
    <div class="les-body"><div class="row between"><span class="badge blue">Wörter-Blitz</span><span class="chip gold tnum">${ICONS.bolt.replace('<svg','<svg width="14" height="14"')} ${B.score}${B.combo>=3?` · ${B.combo} in a row`:""}</span></div>
    <h1 class="les-h">${q.rev?"Which German word?":"What does it mean?"}</h1><div class="big-prompt" style="font-size:2rem;text-align:center;padding:10px 0">${q.rev?esc(q.de):artHtml(q.de)}</div>
    <div class="answers two">${q.options.map((o,i)=>{ let c=""; if(B.flash){ if(o===q.answer) c="right"; else if(i===B.flash.i) c="wrong"; } return `<button class="ans c ${c}" data-act="blitz-pick" data-v="${i}" ${B.flash?"disabled":""}><span class="kbd">${i+1}</span><span>${q.rev?artHtml(o):esc(o)}</span></button>`; }).join("")}</div>
    <p class="small muted" style="text-align:center">As many as you can in 60 seconds · best ${S.st.blitzBest||0}</p></div></div>`; }

/* ====================== v7: daily report (ÖSD scale) + personalized tutor ====================== */
const PART_INFO={
 "lesen-1":["Lesen Teil 1","matching situations to short ads","موقعیت‌ها را به آگهی‌ها وصل کردن"],
 "lesen-2":["Lesen Teil 2","Ja/Nein on short texts (emails, notices)","درست/غلط روی متن‌های کوتاه"],
 "lesen-3":["Lesen Teil 3","matching short texts to pictures or information","وصل کردن متن‌های کوتاه به تصویر یا اطلاعات"],
 "hoeren-1":["Hören Teil 1","short dialogues and announcements → pictures","گفت‌وگوها و اطلاعیه‌های کوتاه → تصویر"],
 "hoeren-2":["Hören Teil 2","taking notes: spelled names, numbers, times","یادداشت‌برداری: اسم هجی‌شده، عدد، ساعت"],
 "hoeren-3":["Hören Teil 3","what each person really chooses (watch for nicht / aber)","انتخاب واقعی هر نفر (به nicht و aber دقت کن)"],
 "schreiben-1":["Schreiben Teil 1","filling in a form: names, dates, ticks","پر کردن فرم: اسم، تاریخ، علامت‌ها"]};
const KIND_INFO={
 article:["der / die / das","Genders of nouns","جنسیت اسم‌ها", "Ask 'der, die oder das?' for each noun he got wrong, then 4 new nouns from today; make him say article + noun + plural."],
 word_order:["Word order","Verb in position 2, question order","ترتیب کلمات: فعل در جایگاه دوم","Give the English, he says the German sentence; contrast statement vs W-question vs yes/no question."],
 gap:["Grammar in sentences","Pronouns, endings, du / Sie forms","دستور در جمله: ضمیر، پایانه فعل، du و Sie","Say the sentence with a gap and let him complete it aloud; then make him build one new sentence with the same rule."],
 meaning:["Word meanings","Recognising today's words","شناختن معنی لغات امروز","Say the German word, he gives the meaning in English, then uses it in a 3-word sentence."],
 reverse:["Recalling German words","Producing words from English","به یاد آوردن کلمه آلمانی","Say the English word, he answers in German with the article."],
 mcq:["Understanding situations","Which phrase fits which situation","کدام جمله برای کدام موقعیت","Describe a tiny situation in English and ask what he says in German (greeting, goodbye, polite form)."],
 translate:["Writing sentences","Translating short sentences","ترجمه جمله‌های کوتاه","He translates short English sentences aloud; correct and have him repeat."],
 "hoeren-notes":["Notes in Hören","Exact spelling and numbers","هجی دقیق و اعداد","Dictate surnames letter by letter and phone numbers in pairs; he writes and reads them back."],
 speaking:["Speaking errors","Sentences the tutor corrected","جمله‌هایی که مربی اصلاح کرد","Say his wrong sentence back to him and let him correct it aloud; then ask a new question that needs the same structure."],
 write:["Writing words","Spelling today's words from memory","نوشتن لغات از حفظ","Say the English word; he says the German word with article and spells it letter by letter."],
 form:["Form filling","Personal data in German forms","اطلاعات شخصی در فرم","Ask form questions (Vorname? Geburtsdatum? Postleitzahl?) and he answers in the right format."]};
function dayMistakes(n){ return (S.st.mistakes||[]).filter(m=>m.day===n&&m.q&&m.right); }
function mistakeKind(m){ if(m.kind) return m.kind; const s=String(m.src||""); if(s.startsWith("hoeren")) return "hoeren-notes"; if(s==="form") return "form"; return "mcq"; }
function partPct(n, key){ const r=S.st.results[n+":"+key]; return r&&r.total? r.score/r.total : null; }
function sectionPts(n, keys, max){ const ps=keys.map(k=>partPct(n,k)).filter(x=>x!=null); if(!ps.length) return null; return {pts:Math.round(ps.reduce((a,b)=>a+b,0)/ps.length*max), parts:ps.length, of:keys.length}; }
function emailGrade(n){ const g=S.st.grades[n+":email"]; return g&&g.score!=null? g : null; }
function spScore(n){ const ss=(S.st.live[n]||[]).filter(x=>x.score_25!=null); if(ss.length) return {pts:Math.max(0,Math.min(25,Math.round(+ss[ss.length-1].score_25))), src:"tutor"};
  const r=(S.st.selfSp||{})[n]; if(r){ const t=(+r.a1)+(+r.a2)+(+r.a3)+(+r.lex)+(+r.aus)+(+r.form); return {pts:t, src:"self"}; } return null; }
function dayReport(n){ const d=S.days[n]||{};
  const keysL=["lesen-1","lesen-2","lesen-3"].filter((k,i)=>d.lesen&&d.lesen["teil"+(i+1)]);
  const keysH=["hoeren-1","hoeren-2","hoeren-3"].filter((k,i)=>d.hoeren&&d.hoeren["teil"+(i+1)]);
  const L=sectionPts(n,keysL,30), H=sectionPts(n,keysH,30);
  const f=partPct(n,"schreiben-1"), eg=emailGrade(n);
  const sa1=f!=null?PSA1(Math.round(f*10)):null, sa2=eg?Math.round(+eg.score):null;
  const Sch=sa1==null&&sa2==null?null:{pts:(sa2!=null&&sa2<4)?0:(sa1||0)+(sa2||0), sa1, sa2, zeroed:sa2!=null&&sa2<4, partial:sa1==null||sa2==null};
  const W=L&&H&&Sch&&!Sch.partial ? L.pts+H.pts+Sch.pts : null;
  const sp=spScore(n);
  const wPass=W!=null && W>=38 && L.pts>=6 && H.pts>=6 && sa2>=4;
  const grade=W==null?"":W>=66?"sehr gut":W>=56?"gut":W>=38?"bestanden":"nicht bestanden";
  const oGrade=!sp?"":sp.pts>=22?"sehr gut":sp.pts>=19?"gut":sp.pts>=12?"bestanden":"nicht bestanden";
  const nodes=d.title?dayNodes(n,d):[]; const lessons=nodes.filter(nd=>nd.kind==="lesson").map(nd=>{ const r=S.st.results[nodeKey(n,nd)]; return {title:nd.title, step:nd.step, acc:r&&r.total?Math.round(r.score/r.total*100):null}; });
  const la=lessons.filter(x=>x.acc!=null); const lessonAvg=la.length?Math.round(la.reduce((a,x)=>a+x.acc,0)/la.length):null;
  const mis=dayMistakes(n); const byKind={}; mis.forEach(m=>{ const k=mistakeKind(m); (byKind[k]=byKind[k]||[]).push(m); });
  const pron=Object.values((S.st.pronLog||{})[n]||{}); const pronAvg=pron.length?Math.round(pron.reduce((a,x)=>a+x.score,0)/pron.length):null;
  const pr=d.title?dayProgress(n,d):{done:0,total:0};
  const rep={n, L, H, Sch, W, wPass, grade, sp, oGrade, lessons, lessonAvg, mis, byKind, pron, pronAvg, eg, done:pr.done, total:pr.total};
  rep.weak=weakPoints(rep); return rep; }
function weakPoints(R){ const w=[], n=R.n;
  const sec=(name,obj,max,min,keys)=>{ if(!obj) return; const pct=obj.pts/max; if(pct<0.6){ const lowParts=keys.map(k=>({k,p:partPct(n,k)})).filter(x=>x.p!=null&&x.p<0.6).sort((a,b)=>a.p-b.p);
      w.push({score:(obj.pts<min?3:2)-pct, area:name, en:`${name}: ${obj.pts}/${max} on the ÖSD scale${obj.pts<min?` (below the minimum ${min})`:""}.`+(lowParts.length?" Weakest: "+lowParts.map(x=>`${PART_INFO[x.k][0]}, ${PART_INFO[x.k][1]} (${Math.round(x.p*100)}%)`).join("; ")+".":""),
        fa:`${name}: ${obj.pts} از ${max}`+(lowParts.length?" · ضعیف‌ترین: "+lowParts.map(x=>PART_INFO[x.k][2]).join("، "):""), drill:lowParts.map(x=>PART_INFO[x.k][0]+": "+PART_INFO[x.k][1]).join("; ")||name}); } };
  sec("Lesen",R.L,30,6,["lesen-1","lesen-2","lesen-3"]); sec("Hören",R.H,30,6,["hoeren-1","hoeren-2","hoeren-3"]);
  if(R.Sch&&R.Sch.sa2!=null&&R.Sch.sa2<6) w.push({score:R.Sch.sa2<4?3.5:1.5, area:"Schreiben email", en:`Email ${R.Sch.sa2}/10${R.Sch.sa2<4?": below 4, so the whole Schreiben part would score 0":""}.`+((R.eg&&R.eg.errors||[]).length?" Errors: "+R.eg.errors.slice(0,4).map(e=>`${e.wrong} → ${e.right}`).join("; "):""), fa:`ایمیل ${R.Sch.sa2} از ۱۰`, drill:"Say the corrected email sentences aloud; practise greeting, 3 content points and sign-off.", items:(R.eg&&R.eg.errors||[]).slice(0,4).map(e=>({q:e.wrong,right:e.right}))});
  if(R.Sch&&R.Sch.sa1!=null&&R.Sch.sa1<3) w.push({score:1.2, area:"Schreiben form", en:`Form ${R.Sch.sa1}/5.`, fa:`فرم ${R.Sch.sa1} از ۵`, drill:KIND_INFO.form[3]});
  if(R.sp&&R.sp.pts<15) w.push({score:R.sp.pts<12?3:1.5, area:"Sprechen", en:`Sprechen ${R.sp.pts}/25 (${R.sp.src==="tutor"?"tutor score":"your self-rating"})${R.sp.pts<12?", below the minimum 12":""}.`, fa:`صحبت ${R.sp.pts} از ۲۵`, drill:"Teil 1 introduction with follow-up questions, then one photo question."});
  Object.entries(R.byKind).forEach(([k,arr])=>{ const I=KIND_INFO[k]||[k,"","",""]; if(arr.length<2&&!["hoeren-notes","form"].includes(k)) return;
    w.push({score:Math.min(2.5,0.6+arr.length*0.35), area:I[0], en:`${I[0]}: ${arr.length} mistake${arr.length>1?"s":""} today (${I[1].toLowerCase()}).`, fa:`${I[2]}: ${arr.length} اشتباه`, drill:I[3], items:arr.slice(0,5).map(m=>({q:m.q,your:m.your,right:m.right}))}); });
  R.lessons.filter(x=>x.acc!=null&&x.acc<70).forEach(x=>w.push({score:1+(70-x.acc)/100, area:x.title, en:`${x.title} lesson: ${x.acc}% (aim for 80%).`, fa:`درس ${x.title}: ${x.acc}٪`, drill:`Revise the content of the "${x.title}" lesson.`}));
  const badPron=R.pron.filter(p=>p.score<70); if(badPron.length) w.push({score:1.1, area:"Pronunciation", en:`${badPron.length} script sentence${badPron.length>1?"s":""} under 70% in the pronunciation check.`, fa:"تلفظ چند جمله زیر ۷۰٪", drill:"Shadow these sentences slowly, then at normal speed: "+badPron.map(p=>p.text).join(" | "), items:badPron.slice(0,4).map(p=>({q:p.text,your:p.heard,right:p.text}))});
  return w.sort((a,b)=>b.score-a.score).slice(0,6); }
function snapshotReport(n){ const R=dayReport(n); S.st.reports=S.st.reports||{};
  S.st.reports[n]={at:Date.now(), L:R.L&&R.L.pts, H:R.H&&R.H.pts, Sch:R.Sch&&R.Sch.pts, sa2:R.Sch&&R.Sch.sa2, W:R.W, wPass:R.wPass, sp:R.sp&&R.sp.pts, lessonAvg:R.lessonAvg, mistakes:R.mis.length, weak:R.weak.map(x=>x.area)};
  const keys=Object.keys(S.st.reports).map(Number).sort((a,b)=>a-b); while(keys.length>40) delete S.st.reports[keys.shift()]; return R; }
function hasReportData(n){ return Object.keys(S.st.results).some(k=>k.startsWith(n+":")) || dayMistakes(n).length>0 || !!emailGrade(n); }

/* repair lesson built from today's mistakes */
function repairScreens(n, list){ const mis=(list||dayMistakes(n)).filter(m=>m.q&&m.right&&(!list||!["number","phone","time","price","day","spelled_name"].includes(m.kind))); const seen=new Set(); const uniq=mis.filter(m=>!seen.has(m.q)&&seen.add(m.q)).slice(0,12);
  const rights=[...new Set((S.st.mistakes||[]).map(m=>m.right).filter(Boolean))];
  return uniq.map((m,i)=>{ const k=mistakeKind(m);
    if(k==="article") return {type:"article",prompt:m.q,options:["der","die","das"],answer:m.right,q:m.q,kind:"article",explain_en:`${m.right} ${m.q}`};
    if(k==="word_order"&&String(m.right).split(/\s+/).length>2){ const w=String(m.right).split(/\s+/); return {type:"word_order",words:shuf2(w,"rep"+i+Date.now()),answer:m.right,q:m.right,kind:"word_order"}; }
    const pool=rights.filter(r=>r!==m.right&&r!==m.your&&String(r).length<70); const wrong=m.your&&m.your!==m.right&&String(m.your).length<70?[m.your]:[];
    const options=shuffled([m.right,...wrong,...shuffled(pool,"rp"+i).slice(0,3-wrong.length)],"ro"+i+Date.now());
    return {type:"mcq",prompt:k==="speaking"?`Which is correct? You said: „${m.q}“`:m.q,options,answer:m.right,q:m.q,kind:k,explain_en:m.your?`Last time you answered: ${m.your}`:""}; }).map(x=>Object.assign(x,{noLog:true})); }
function startRepair(n){ const screens=repairScreens(n); if(!screens.length){ toast("No mistakes to repair today. Super!"); return; } S.report=null; startLesson({src:"repair", n, title:"Repair lesson", screens}); }

/* the report screen */
function scoreRow(label, obj, max, min, open, note){ if(!obj) return `<div class="bar-row"><div class="row between small"><b>${esc(label)}</b><span class="muted">not done yet</span></div><div class="bar"><i style="width:0"></i>${min!=null?`<span class="minline" style="left:${Math.round(min/max*100)}%"></span>`:""}</div>${open?`<div><button class="btn sm" data-act="rep-open" data-v="${open}">Do it now</button></div>`:""}</div>`;
  return barRow(label, obj.pts, max, min, note||"") ; }
function vReport(){ const n=S.report; const d=S.days[n]; if(!d) return `<div class="banner">No lesson for Day ${n} yet.</div>`;
  const R=snapshotReport(n); save(); const date=dateOf(n);
  const partRows=[...["lesen-1","lesen-2","lesen-3"],...["hoeren-1","hoeren-2","hoeren-3"],"schreiben-1"].map(k=>{ const r=S.st.results[n+":"+k]; if(!r||!r.total) return ""; const p=Math.round(r.score/r.total*100);
    return `<div class="prow"><div><b>${PART_INFO[k][0]}</b><div class="small muted">${esc(PART_INFO[k][1])}</div></div><span class="chip ${p>=60?"ok":"bad"} tnum">${r.score}/${r.total}</span></div>`; }).join("");
  const emailRow = R.eg ? `<div class="prow"><div><b>Schreiben Teil 2</b><div class="small muted">email, graded by the examiner AI</div></div><span class="chip ${R.eg.score>=4?"ok":"bad"} tnum">${R.eg.score}/10</span></div>` : "";
  const spCard = `<section class="card stack"><div class="row between"><h2>Sprechen</h2>${R.sp?`<span class="chip ${R.sp.pts>=12?"ok":"bad"} tnum">${R.sp.pts}/25 · ${R.oGrade}</span>`:""}</div>
    ${R.sp?`<p class="small muted">${R.sp.src==="tutor"?"Score from your last tutor session today.":"Your self-rating with the ÖSD criteria."}</p>`:`<p class="small">${ex("Not measured yet. Talk to the tutor in exam mode for a score, or rate yourself honestly below.","هنوز سنجیده نشده. با مربی در حالت آزمون صحبت کن یا خودت صادقانه نمره بده.")}</p>`}
    ${R.pronAvg!=null?`<div class="small">Pronunciation check average: <b class="tnum">${R.pronAvg}%</b> over ${R.pron.length} sentence${R.pron.length>1?"s":""}</div>`:""}
    ${!R.sp||R.sp.src==="self"?(()=>{ const s=(S.st.selfSp||{})[n]||{a1:0,a2:0,a3:0,lex:0,aus:0,form:0}; return `<details class="acc" open><summary>Rate yourself (ÖSD criteria)</summary><div class="in grid2">
      ${[["a1","Teil 1 · introduce yourself",4],["a2","Teil 2 · describe the photo",4],["a3","Teil 3 · role-play",4],["lex","Vocabulary",5],["aus","Pronunciation & fluency",4],["form","Grammar",4]].map(([k,l,mx])=>`<div class="field"><span class="lb">${l} (0–${mx})</span>${selN("data-selfsp",n+":"+k,s[k],mx)}</div>`).join("")}</div></details>`; })():""}
    <div class="row"><button class="btn blue" data-act="live-start" data-n="${n}" data-mode="exam">${ICONS.mic}Get a score from the tutor</button></div></section>`;
  const weak = R.weak.length ? R.weak.map((w,i)=>`<div class="weak"><div class="wn">${i+1}</div><div class="stack" style="gap:4px;min-width:0"><b>${esc(w.area)}</b><div class="small">${ex(w.en,w.fa)}</div>
      ${(w.items||[]).length?`<div class="stack" style="gap:3px">${w.items.slice(0,3).map(it=>`<div class="small sunk" style="padding:6px 10px"><b>${esc(it.q)}</b>${it.your?` · <span style="color:var(--red-ink);text-decoration:line-through">${esc(it.your)}</span>`:""} → <span style="color:var(--green-ink);font-weight:800">${esc(it.right)}</span></div>`).join("")}</div>`:""}</div></div>`).join("")
    : `<p class="small muted">${hasReportData(n)?ex("No clear weak spots today. Excellent work!","امروز نقطه ضعف مشخصی نبود. عالی!"):ex("Do some lessons and exam-format steps first; your weak spots will appear here.","اول چند درس و تمرین آزمونی انجام بده تا نقاط ضعف اینجا ظاهر شوند.")}</p>`;
  const kinds=Object.entries(R.byKind).sort((a,b)=>b[1].length-a[1].length);
  const xp=(S.st.xp||{})[dk(date)]||0;
  return `<div class="les"><div class="les-top"><button class="xbtn" data-act="rep-close" aria-label="Close report">${ICONS.x}</button><div class="grow"><div class="label">Tagesbericht · ${fmtDate(date)}</div><h2>Day ${n} report</h2></div></div>
  <div class="les-body">
    <div class="edi-row">${edi(70, R.wPass?"wink":"happy")}<div class="speech"><b>${R.done>=R.total&&R.total?`Tag ${n} geschafft!`:`${R.done} of ${R.total} steps done`}</b><span>${R.W!=null?(R.wPass?ex("If today were the exam, you would pass the written part.","اگر امروز روز آزمون بود، بخش کتبی را قبول می‌شدی."):ex("Not a pass yet on today's practice. The weak spots below show what to fix.","هنوز قبولی نیست. نقاط ضعف پایین نشان می‌دهد چه چیزی را درست کنی.")):ex("Scores fill in as you finish Lesen, Hören and Schreiben.","نمره‌ها با تمام کردن خواندن، شنیدن و نوشتن کامل می‌شوند.")}</span></div></div>
    <section class="card stack"><div class="row between"><h2>If today were the exam</h2>${R.W!=null?`<span class="chip ${R.wPass?"ok":"bad"} tnum">Written ${R.W}/75 · ${R.grade}</span>`:""}</div>
      ${scoreRow("Lesen",R.L,30,6,"lesen", R.L&&R.L.parts<R.L.of?`(${R.L.parts} of ${R.L.of} parts)`:"")}
      ${scoreRow("Hören",R.H,30,6,"hoeren", R.H&&R.H.parts<R.H.of?`(${R.H.parts} of ${R.H.of} parts)`:"")}
      ${scoreRow("Schreiben",R.Sch,15,null,"schreiben", R.Sch?(R.Sch.zeroed?"· email under 4 → 0":R.Sch.partial?"(form or email missing)":""):"")}
      ${R.W!=null?barRow("Written total",R.W,75,38):`<div class="small muted">${ex("Written total appears when Lesen, Hören and both Schreiben parts are done.","جمع کتبی وقتی ظاهر می‌شود که خواندن، شنیدن و هر دو بخش نوشتن انجام شده باشد.")}</div>`}
      ${R.sp?barRow("Sprechen (oral exam)",R.sp.pts,25,12):""}
      <p class="small muted">${ex("Projected from today's practice sets onto the official ÖSD scale (Lesen 30, Hören 30, Schreiben 15, Sprechen 25). Pass: 38/75 written with Lesen ≥ 6, Hören ≥ 6 and email ≥ 4, plus 12/25 oral. Short practice sets swing a lot; the mocks on Days 23, 29, 37, 43 and 47 are the real test.","تخمین روی مقیاس رسمی ÖSD از تمرین‌های امروز. قبولی: ۳۸ از ۷۵ کتبی با خواندن و شنیدن حداقل ۶ و ایمیل حداقل ۴، و ۱۲ از ۲۵ شفاهی.")}</p></section>
    ${partRows||emailRow?`<section class="card"><h2 style="margin-bottom:6px">Exam parts today</h2>${partRows}${emailRow}</section>`:""}
    <section class="card stack"><div class="row between"><h2>Your weak spots</h2>${R.weak.length?`<span class="chip bad">${R.weak.length}</span>`:""}</div>${weak}
      ${R.mis.length?`<div class="row"><button class="btn primary" data-act="rep-repair">Repair lesson · ${Math.min(12,new Set(R.mis.map(m=>m.q)).size)} items</button><button class="btn blue" data-act="live-start" data-n="${n}" data-mode="review">${ICONS.mic}Fix them with the tutor</button></div>`:""}</section>
    ${spCard}
    <section class="card stack"><h2>Words &amp; grammar</h2>${R.lessons.length?R.lessons.map(x=>x.acc==null?`<div class="row between small"><span>${esc(x.title)}</span><span class="muted">not done</span></div>`:barRow(x.title,x.acc,100,80,"%")).join(""):""}
      ${R.lessonAvg!=null?`<div class="small">Average: <b class="tnum">${R.lessonAvg}%</b> · first-try accuracy, aim for 80%</div>`:""}</section>
    ${kinds.length?`<section class="card stack"><h2>Mistakes today · ${R.mis.length}</h2>${kinds.map(([k,arr])=>`<details class="acc"><summary>${esc((KIND_INFO[k]||[k])[0])} · ${arr.length}</summary><div class="in stack" style="gap:6px">${arr.slice(0,15).map(m=>`<div class="small"><b>${esc(m.q)}</b> · <span style="color:var(--red-ink);text-decoration:line-through">${esc(m.your||"–")}</span> → <span style="color:var(--green-ink);font-weight:800">${esc(m.right)}</span></div>`).join("")}</div></details>`).join("")}</section>`:""}
    <section class="card"><div class="tiles">${[["bolt","var(--gold)",xp,"XP that day"],["target","var(--green)",R.lessonAvg!=null?R.lessonAvg+"%":"–","lesson accuracy"],["x","var(--red)",R.mis.length,"mistakes"]].map(([ic,c,v,l])=>`<div class="tile"><div class="ti" style="color:${c}">${ICONS[ic]}</div><b class="tnum">${v}</b><span>${l}</span></div>`).join("")}</div></section>
  </div>
  <div class="les-foot"><div class="in">${R.mis.length?`<button class="btn" data-act="rep-repair">Repair lesson</button>`:"<span></span>"}<button class="btn blue big" data-act="live-start" data-n="${n}" data-mode="review">${ICONS.mic}Review with tutor</button></div></div></div>`; }
function reportCard(n){ if(!hasReportData(n)) return ""; const R=dayReport(n);
  return `<section class="card stack report-card"><div class="row between"><div><div class="label">Day ${n} report</div><h2>${R.W!=null?`Written ${R.W}/75 · ${R.grade}`:"Your results so far"}</h2></div>${R.W!=null?`<span class="chip ${R.wPass?"ok":"bad"}">${R.wPass?"pass":"not yet"}</span>`:""}</div>
    <div class="row small">${[["Lesen",R.L,30],["Hören",R.H,30],["Schreiben",R.Sch,15],["Sprechen",R.sp,25]].map(([l,o,m])=>`<span class="chip ${o?(o.pts/m>=0.5?"ok":"bad"):""} tnum">${l} ${o?o.pts+"/"+m:"–"}</span>`).join("")}</div>
    ${R.weak.length?`<div class="small"><b>Weak spots:</b> ${R.weak.slice(0,3).map(w=>esc(w.area)).join(" · ")}</div>`:""}
    <div class="row"><button class="btn primary sm" data-act="rep-show" data-n="${n}">Open report</button><button class="btn blue sm" data-act="live-start" data-n="${n}" data-mode="review">${ICONS.mic}Review with tutor</button></div></section>`; }

/* tutor: personal context from results */
function tutorResults(n){ const R=dayReport(n); const L=[];
  const pts=[R.L?`Lesen ${R.L.pts}/30`:"", R.H?`Hören ${R.H.pts}/30`:"", R.Sch?`Schreiben ${R.Sch.pts}/15${R.Sch.zeroed?" (email under 4 → 0)":""}`:"", R.W!=null?`written total ${R.W}/75 (${R.grade})`:"", R.sp?`Sprechen ${R.sp.pts}/25 (${R.sp.src})`:""].filter(Boolean);
  if(pts.length) L.push(`TODAY'S RESULTS (Day ${n}, projected onto the ÖSD scale): ${pts.join(", ")}.`);
  const parts=Object.keys(PART_INFO).map(k=>{ const r=S.st.results[n+":"+k]; return r&&r.total?`${PART_INFO[k][0]} ${r.score}/${r.total}`:""; }).filter(Boolean); if(parts.length) L.push("EXAM PARTS: "+parts.join(", ")+".");
  const les=R.lessons.filter(x=>x.acc!=null).map(x=>`${x.title} ${x.acc}%`); if(les.length) L.push("LESSON ACCURACY (first try): "+les.join(", ")+".");
  if(R.mis.length) L.push("TODAY'S MISTAKES (question → correct answer, his answer): "+R.mis.slice(0,18).map(m=>`[${(KIND_INFO[mistakeKind(m)]||[mistakeKind(m)])[0]}] ${m.q} → ${m.right} (he: ${m.your||"–"})`).join(" | "));
  if(R.eg&&(R.eg.errors||[]).length) L.push(`HIS EMAIL TODAY scored ${R.eg.score}/10. Errors: `+R.eg.errors.map(e=>`${e.wrong} → ${e.right}`).join("; "));
  const bp=R.pron.filter(p=>p.score<70); if(bp.length) L.push("PRONUNCIATION PROBLEMS (speech check under 70%): "+bp.map(p=>`"${p.text}" (heard: "${p.heard}")`).join("; "));
  if(R.weak.length) L.push("WEAK POINTS, MOST IMPORTANT FIRST:\n"+R.weak.map((w,i)=>`${i+1}. ${w.en} DRILL: ${w.drill}`).join("\n"));
  const prev=Object.entries(S.st.reports||{}).filter(([k])=>+k<n).sort((a,b)=>b[0]-a[0]).slice(0,3).filter(([,r])=>(r.weak||[]).length);
  if(prev.length) L.push("WEAK POINTS FROM EARLIER DAYS (recycle briefly if time allows): "+prev.map(([k,r])=>`Day ${k}: ${r.weak.join(", ")}`).join(" | "));
  const still=Object.entries(S.st.live||{}).flatMap(([day,arr])=>arr.map(x=>({day:+day,...x}))).sort((a,b)=>b.at-a.at).slice(0,2).filter(x=>(x.still_weak||[]).length);
  if(still.length) L.push("STILL WEAK AFTER EARLIER TUTOR SESSIONS: "+still.map(x=>`Day ${x.day}: ${x.still_weak.join("; ")}`).join(" | "));
  return {text:L.join("\n"), R}; }

function logPartMistakes(g){ try{ const [ns,part]=g.split(":"); const n=+ns, d=S.days[n]; if(!d||S.testPrefix&&g.startsWith(S.testPrefix)) return;
  if(part==="h2"&&d.hoeren&&d.hoeren.teil2) d.hoeren.teil2.note_fields.forEach((f,i)=>{ const v=S.ans[g+":"+i]||""; if(!noteOk(f,v)) logMistake(n,"hoeren-2",`Hören note: ${f.label_de}`,v,String(f.answer),"hoeren-notes"); });
  if(part==="s1"&&d.schreiben&&d.schreiben.teil1) d.schreiben.teil1.fields.forEach(f=>{ const v=S.ans[g+":"+f.id]; if(!formOk(f,v)) logMistake(n,"form",`Form: ${f.label_de}`,Array.isArray(v)?v.join(", "):(v||""),Array.isArray(f.answer)?f.answer.join(", "):String(f.answer),"form"); });
}catch(e){} }
/* ====================== v8: tutor → app loop, speaking analytics, readiness ====================== */
const SP_CRIT=[["teil1","Teil 1 · introduce yourself",4],["teil2","Teil 2 · photo",4],["teil3","Teil 3 · role-play",4],["vocab","Vocabulary",5],["pron","Pronunciation & fluency",4],["grammar","Grammar",4]];
const TEIL1_TOPICS=["Sprachen","Hobbys","Sport","Familie","Beruf","Lieblingsessen"];
const ERR_CAT={article:"der/die/das",verb_position:"Verb position",conjugation:"Verb endings",case:"Cases (den/dem)",vocabulary:"Wrong word",pronunciation:"Pronunciation",word_order:"Word order",other:"Other"};
const EN_STOP=new Set("the a an and or but is are was were i you he she it we they my your this that what how do does did not no yes yeah okay ok please sorry can could would should will to of in on at for with from about have has had be been me him her them our their so just like think know mean".split(" "));
function allSessions(){ return Object.entries(S.st.live||{}).flatMap(([day,arr])=>(arr||[]).map((x,i)=>Object.assign({day:+day, idx:i}, x))).sort((a,b)=>(a.at||0)-(b.at||0)); }
function sessionMetrics(log, ms){ const mine=log.filter(x=>x.role==="you"), tutor=log.filter(x=>x.role!=="you");
  const words=t=>(String(t).match(/[A-Za-zÄÖÜäöüß']+/g)||[]); const my=mine.flatMap(x=>words(x.text)); const tw=tutor.flatMap(x=>words(x.text));
  const en=my.filter(w=>EN_STOP.has(w.toLowerCase())).length; const minutes=Math.max(1,Math.round(ms/60000));
  return {minutes, myWords:my.length, tutorWords:tw.length, turns:mine.length, avgLen:mine.length?Math.round(my.length/mine.length*10)/10:0, wpm:Math.round(my.length/Math.max(1,ms/60000)), talkShare:my.length+tw.length?Math.round(my.length/(my.length+tw.length)*100):0, germanShare:my.length?Math.round((1-en/my.length)*100):0}; }
const DRAFT_KEY="osd-a1-live-draft";
function saveDraft(){ const L=S.live; if(!L||!L.log.length) return; lsSet(DRAFT_KEY, JSON.stringify({n:L.n, mode:L.mode, started:L.started, log:L.log, at:Date.now()})); }
function getDraft(){ try{ const d=JSON.parse(lsGet(DRAFT_KEY)||"null"); return d&&d.log&&d.log.length?d:null; }catch(e){ return null; } }
function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }
function draftBanner(){ const D=getDraft(); if(!D||S.live) return ""; return `<div class="banner info"><div class="grow"><b>${ex("You have an unsaved tutor session","یک جلسه ذخیره‌نشده با مربی داری")}</b><div class="small">Day ${D.n} · ${new Date(D.started).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})} · ${D.log.length} lines</div>
  <div class="row" style="margin-top:8px"><button class="btn primary sm" data-act="draft-save" ${S.saveBusy?"disabled":""}>${S.saveBusy?"Saving…":"Save & analyse"}</button><button class="btn sm" data-act="draft-discard">Discard</button></div></div></div>`; }
/* turn a transcript into a stored, analysed session (used by live sessions, recovered drafts and Gemini-app imports) */
async function analyseSession({n, mode, log, started, source, rawText, lat, ptt}){
  const ms=Math.max(60000,(Date.now()-(started||Date.now())));
  const transcript=rawText || log.map(x=>(x.role==="you"?"Raam: ":"Tutor: ")+x.text).join("\n");
  if(transcript.length<60) throw new Error("The session was too short to analyse.");
  let weak=[]; try{ weak=dayReport(n).weak.map(w=>w.area); }catch(e){}
  const r=await api("/api/ai",{mode:"summarize", payload:{day:n, transcript, mode, weak}}); const s=r.result||{};
  const crit=s.criteria||{}; SP_CRIT.forEach(([k,,mx])=>{ if(crit[k]!=null) crit[k]=Math.max(0,Math.min(mx,Math.round(+crit[k]))); });
  const sum=SP_CRIT.reduce((a,[k])=>a+(crit[k]!=null?crit[k]:0),0); const hasCrit=SP_CRIT.some(([k])=>crit[k]!=null);
  const sess={id:"s"+Date.now().toString(36), at:Date.now(), started:started||Date.now(), mode:mode||"coach", source:source||"live",
    summary_en:s.summary_en||"", strengths:s.strengths||[], errors:(s.errors||[]).slice(0,12), next_focus:s.next_focus||[], fixed:s.fixed||[], still_weak:s.still_weak||[],
    topics:(s.topics_covered||[]).filter(t=>TEIL1_TOPICS.includes(t)), words_used:(s.new_words_used||[]).slice(0,20), criteria:hasCrit?crit:null,
    score_25:s.score_25!=null&&!isNaN(+s.score_25)?Math.max(0,Math.min(25,Math.round(+s.score_25))):(hasCrit?sum:null),
    metrics: log&&log.length ? sessionMetrics(log, ms) : {minutes:Math.max(1,Math.round(ms/60000))}};
  if(lat&&lat.length){ const sorted=lat.slice().sort((a,b)=>a-b); sess.metrics.waitAvg=Math.round(lat.reduce((a,b)=>a+b,0)/lat.length/100)/10; sess.metrics.waitMax=Math.round(sorted[sorted.length-1]/100)/10; sess.metrics.ptt=!!ptt; }
  // keep the transcript: private storage folder when signed in, otherwise this device
  try{ if(S.uid){ const path=`${S.uid}/sessions/${sess.id}.json`; const { error } = await sb.storage.from("media").upload(path, new Blob([JSON.stringify({n, mode, transcript})],{type:"application/json"}), {upsert:true}); if(!error) sess.transcript=path; }
       if(!sess.transcript){ const T=JSON.parse(lsGet("osd-a1-transcripts")||"{}"); T[sess.id]=transcript.slice(0,20000); const ks=Object.keys(T); while(ks.length>12) delete T[ks.shift()]; lsSet("osd-a1-transcripts", JSON.stringify(T)); sess.transcript="local:"+sess.id; } }catch(e){}
  const arr=S.st.live[n]=(S.st.live[n]||[]); arr.push(sess); if(arr.length>10) arr.shift(); S.st.done[n+":tutor"]=S.st.done[n+":tutor"]||Date.now();
  // close the loop: every corrected error becomes a flashcard and a mistake the report and repair lesson can use
  const said=norm((log||[]).filter(x=>x.role==="you").map(x=>x.text).join(" "));
  const real=e=>{ if(!e||!e.wrong||!e.right||norm(e.wrong)===norm(e.right)) return false; if(!said) return true; const w=norm(e.wrong).split(" ").filter(x=>x.length>1); return w.length>0 && w.filter(x=>said.includes(x)).length/w.length>=0.6; };
  sess.errors=sess.errors.filter(real);
  sess.errors.forEach(e=>logMistake(n,"tutor",e.wrong,"",e.right,"speaking"));
  const xp=addXp(20); addCoins(10); dbump("speak"); bump("sessions"); checkBadges(); save();
  return {sess, xp}; }
function sessionCard(x){ const sc=x.score_25; return `<button class="prow rbtn" data-act="sess-open" data-day="${x.day}" data-id="${attr(x.id||x.idx)}"><div><b>Day ${x.day} · ${x.mode==="exam"?"Exam simulation":x.mode==="review"?"Weak-spot review":"Coaching"}</b><div class="small muted">${new Date(x.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}${x.metrics?` · ${x.metrics.minutes} min`:""}${x.source==="gemini-app"?" · Gemini app":""}</div></div>${sc!=null?`<span class="chip ${sc>=12?"ok":"bad"} tnum">${sc}/25</span>`:""}</button>`; }
function findSession(day, id){ const arr=S.st.live[day]||[]; return arr.find(x=>x.id===id) || arr[+id] || null; }
function lineChart(points, max, min, label){ // single series, own scale; native tooltips per point
  if(!points.length) return ""; const W=320,H=140,p=26; const xs=i=>p+(points.length===1?(W-2*p)/2:i*(W-2*p)/(points.length-1)); const ys=v=>H-p-(v/max)*(H-2*p);
  const path=points.map((v,i)=>`${i?"L":"M"}${xs(i).toFixed(1)},${ys(v.y).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" class="lchart" role="img" aria-label="${attr(label)}">
    ${[0,max].map(g=>`<line x1="${p}" x2="${W-p}" y1="${ys(g)}" y2="${ys(g)}" class="grid"/><text x="${p-6}" y="${ys(g)+4}" class="ax" text-anchor="end">${Math.round(g)}</text>`).join("")}
    ${min!=null?`<line x1="${p}" x2="${W-p}" y1="${ys(min)}" y2="${ys(min)}" class="minl"/><text x="${p+4}" y="${ys(min)+14}" class="ax" text-anchor="start">pass ${min}</text>`:""}
    <path d="${path}" class="ln"/>${points.map((v,i)=>`<circle cx="${xs(i)}" cy="${ys(v.y)}" r="5" class="pt"><title>${esc(v.t)}: ${v.y}</title></circle>`).join("")}
    ${points.length>1?`<text x="${xs(points.length-1)}" y="${ys(points[points.length-1].y)-10}" class="lbl" text-anchor="end">${points[points.length-1].y}</text>`:""}</svg>`; }
function vSpeaking(){ const all=allSessions(); const scored=all.filter(x=>x.score_25!=null); const last=scored[scored.length-1];
  if(S.sess){ const x=findSession(S.sess.day, S.sess.id); if(x) return sessionDetail(x, S.sess.day); S.sess=null; }
  const mins=all.reduce((a,x)=>a+((x.metrics||{}).minutes||0),0); const withM=all.filter(x=>x.metrics&&x.metrics.myWords!=null);
  const avg=(arr,f)=>arr.length?Math.round(arr.reduce((a,x)=>a+f(x),0)/arr.length*10)/10:null;
  const errCount={}; all.forEach(x=>(x.errors||[]).forEach(e=>{ const c=ERR_CAT[e.category]?e.category:"other"; errCount[c]=(errCount[c]||0)+1; }));
  const errs=Object.entries(errCount).sort((a,b)=>b[1]-a[1]); const emax=errs.length?errs[0][1]:1;
  const topics=new Set(all.flatMap(x=>x.topics||[]));
  const critAvg=SP_CRIT.map(([k,l,mx])=>{ const v=scored.filter(x=>x.criteria&&x.criteria[k]!=null).slice(-3).map(x=>x.criteria[k]); return [k,l,mx,v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10:null]; });
  const tile=(ic,col,v,l)=>`<div class="tile"><div class="ti" style="color:${col}">${ICONS[ic]}</div><b class="tnum">${v}</b><span>${l}</span></div>`;
  return `<div class="row between"><div><div class="label">Progress</div><h1>Speaking</h1></div><button class="btn sm" data-act="tab" data-v="progress">${ICONS.back}Back</button></div>
    ${draftBanner()}
    <section class="card stack"><div class="tiles">${tile("mic","var(--blue)",all.length,"sessions")}${tile("clock","var(--blue)",mins+" min","speaking time")}${tile("target","var(--green)",last?last.score_25+"/25":"–","latest score")}${tile("chat","var(--purple)",avg(withM,x=>x.metrics.myWords)??"–","words you say / session")}${tile("bolt","var(--gold)",avg(withM,x=>x.metrics.avgLen)??"–","words per turn")}${tile("flagAT","var(--red)",withM.length?avg(withM,x=>x.metrics.germanShare)+"%":"–","German, not English")}</div>
    <p class="small muted">${ex("Words per turn is the best simple sign of fluency: A1 speakers move from 2–3 words to full 6–8 word sentences.","«کلمه در هر نوبت» ساده‌ترین نشانه روانی است: از ۲–۳ کلمه به جمله‌های کامل ۶–۸ کلمه‌ای برس.")}</p></section>
    <section class="card stack"><h2>Sprechen score</h2>${scored.length?lineChart(scored.slice(-12).map(x=>({y:x.score_25,t:`Day ${x.day}`})),25,12,"Sprechen score per session"):`<p class="small muted">${ex("No scored session yet. Do one session in Exam simulation mode to get your first score out of 25.","هنوز جلسه نمره‌دار نداری. یک جلسه در حالت شبیه‌سازی آزمون انجام بده.")}</p>`}</section>
    ${critAvg.some(c=>c[3]!=null)?`<section class="card stack"><h2>ÖSD criteria</h2><p class="small muted">Average of your last 3 scored sessions</p>${critAvg.map(([k,l,mx,v])=>v==null?"":barRow(l,v,mx,null)).join("")}</section>`:""}
    <section class="card stack"><h2>Teil 1 topics practised</h2><div class="row">${TEIL1_TOPICS.map(t=>`<span class="chip ${topics.has(t)?"ok":""}">${topics.has(t)?ICONS.check.replace('<svg','<svg width="12" height="12"'):""} ${t}</span>`).join("")}</div><p class="small muted">${ex("In the exam you talk about 4 of these 6. Cover all six before Mock 1 (Day 29).","در آزمون درباره ۴ مورد از این ۶ صحبت می‌کنی. تا آزمون آزمایشی ۱ (روز ۲۹) همه را تمرین کن.")}</p></section>
    ${errs.length?`<section class="card stack"><h2>Your recurring speaking errors</h2>${errs.map(([c,v])=>`<div class="bar-row"><div class="row between small"><b>${esc(ERR_CAT[c])}</b><span class="tnum">${v}</span></div><div class="bar"><i class="bad" style="width:${Math.round(v/emax*100)}%"></i></div></div>`).join("")}<p class="small muted">${ex("Every corrected error is now a flashcard in Review and part of the next repair lesson. The tutor drills the top ones next time.","هر اشتباه اصلاح‌شده حالا یک فلش‌کارت در Review است و مربی دفعه بعد روی مهم‌ترین‌ها کار می‌کند.")}</p></section>`:""}
    <section class="card"><div class="row between" style="margin-bottom:4px"><h2>Sessions</h2><button class="btn blue sm" data-act="live-start" data-n="${currentDay()}">${ICONS.mic}New session</button></div>${all.length?all.slice().reverse().map(sessionCard).join(""):`<p class="small muted">No sessions yet.</p>`}</section>
    <details class="acc"><summary>Add a session from the Gemini app</summary><div class="in stack">
      <p class="small">${ex("Practised in the Gemini app instead? Copy the conversation there (share → copy) and paste it here. The app analyses it like an in-app session.","در اپ Gemini تمرین کردی؟ گفت‌وگو را کپی کن و اینجا بچسبان تا مثل جلسه داخل اپ تحلیل شود.")}</p>
      <textarea data-imp="gemini-session" placeholder="Paste the conversation…">${esc(S.importText["gemini-session"]||"")}</textarea>
      <div class="row"><select id="impMode" style="width:auto"><option value="coach">Coaching</option><option value="review">Weak-spot review</option><option value="exam">Exam simulation</option></select><button class="btn primary" data-act="sess-import" ${S.saveBusy?"disabled":""}>${S.saveBusy?"Analysing…":"Analyse & save"}</button></div></div></details>`; }
function sessionDetail(x, day){ const m=x.metrics||{};
  return `<div class="row between"><div><div class="label">Day ${day} · ${new Date(x.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div><h1>${x.mode==="exam"?"Exam simulation":x.mode==="review"?"Weak-spot review":"Coaching"}</h1></div><button class="btn sm" data-act="sess-close">${ICONS.back}All sessions</button></div>
    <section class="card stack"><div class="row between"><h2>Result</h2>${x.score_25!=null?`<span class="chip ${x.score_25>=12?"ok":"bad"} tnum" style="font-size:.95rem">${x.score_25}/25 · ${x.score_25>=22?"sehr gut":x.score_25>=19?"gut":x.score_25>=12?"bestanden":"nicht bestanden"}</span>`:""}</div>
      ${x.summary_en?`<p>${esc(x.summary_en)}</p>`:""}
      ${x.criteria?SP_CRIT.map(([k,l,mx])=>x.criteria[k]==null?"":barRow(l,x.criteria[k],mx,null)).join(""):""}
      ${m.myWords!=null?`<div class="tiles">${[["chat","var(--purple)",m.myWords,"words you said"],["bolt","var(--gold)",m.avgLen,"words per turn"],["clock","var(--blue)",m.minutes+" min","length"],["mic","var(--blue)",m.talkShare+"%","of the talking was you"],["flagAT","var(--red)",m.germanShare+"%","German"],["review","var(--green)",m.turns,"turns"],...(m.waitAvg!=null?[["clock","var(--orange)",m.waitAvg+" s","average wait for the tutor"]]:[])].map(([ic,c,v,l])=>`<div class="tile"><div class="ti" style="color:${c}">${ICONS[ic]}</div><b class="tnum">${v}</b><span>${l}</span></div>`).join("")}</div>`:""}
      ${x.confidence==null?`<div class="stack" style="gap:6px"><span class="small"><b>How did it feel?</b></span><div class="row">${["Very hard","Hard","OK","Good","Easy"].map((l,i)=>`<button class="opt" data-act="sess-conf" data-v="${i+1}" data-day="${day}" data-id="${attr(x.id||x.idx)}">${l}</button>`).join("")}</div></div>`:`<div class="small muted">You felt: ${["Very hard","Hard","OK","Good","Easy"][x.confidence-1]}</div>`}</section>
    ${(x.strengths||[]).length?`<section class="card stack"><h2>What went well</h2>${x.strengths.map(s=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span style="color:var(--green)">${ICONS.check.replace('<svg','<svg width="18" height="18"')}</span><span>${esc(s)}</span></div>`).join("")}</section>`:""}
    ${(x.errors||[]).length?`<section class="card stack"><h2>Corrections · added to your cards</h2>${x.errors.map(e=>`<div class="sunk small"><span class="label">${esc(ERR_CAT[e.category]||"")}</span><br><span style="color:var(--red-ink);text-decoration:line-through">${esc(e.wrong)}</span> → <b style="color:var(--green-ink)">${esc(e.right)}</b>${e.why_en?`<br><span class="muted">${esc(e.why_en)}</span>`:""}</div>`).join("")}</section>`:""}
    ${(x.fixed||[]).length||(x.still_weak||[]).length?`<section class="card stack"><h2>Weak spots</h2>${(x.fixed||[]).map(f=>`<div class="small"><span class="chip ok">fixed</span> ${esc(f)}</div>`).join("")}${(x.still_weak||[]).map(f=>`<div class="small"><span class="chip bad">still weak</span> ${esc(f)}</div>`).join("")}</section>`:""}
    ${(x.next_focus||[]).length?`<section class="card stack"><h2>Next session</h2>${x.next_focus.map(f=>`<div class="small">→ ${esc(f)}</div>`).join("")}</section>`:""}
    ${(x.topics||[]).length||(x.words_used||[]).length?`<section class="card stack">${(x.topics||[]).length?`<div class="small"><b>Teil 1 topics:</b> ${x.topics.map(esc).join(", ")}</div>`:""}${(x.words_used||[]).length?`<div class="small"><b>Words you used:</b> ${x.words_used.map(esc).join(", ")}</div>`:""}</section>`:""}
    ${x.transcript?`<details class="acc" data-act="sess-transcript" data-path="${attr(x.transcript)}"><summary>Transcript</summary><div class="in"><pre class="prompt" id="transcriptBox" style="max-height:360px">${S.transcript&&S.transcript.path===x.transcript?esc(S.transcript.text):"Loading…"}</pre></div></details>`:""}`; }
async function loadTranscript(path){ if(S.transcript&&S.transcript.path===path) return; let text="";
  try{ if(path.startsWith("local:")){ text=(JSON.parse(lsGet("osd-a1-transcripts")||"{}"))[path.slice(6)]||"Not stored on this device."; }
       else { const { data, error } = await sb.storage.from("media").download(path); if(error) throw error; const j=JSON.parse(await data.text()); text=j.transcript||""; } }
  catch(e){ text="Couldn't load the transcript: "+(e.message||e); }
  S.transcript={path, text}; const el=$("#transcriptBox"); if(el) el.textContent=text; }
function speakingCard(){ const all=allSessions(); const scored=all.filter(x=>x.score_25!=null); const last=scored[scored.length-1];
  return `<section class="card stack"><div class="row between"><h2>Speaking with your tutor</h2>${last?`<span class="chip ${last.score_25>=12?"ok":"bad"} tnum">${last.score_25}/25</span>`:""}</div>
    ${scored.length>1?lineChart(scored.slice(-8).map(x=>({y:x.score_25,t:`Day ${x.day}`})),25,12,"Sprechen score trend"):`<p class="small muted">${all.length?`${all.length} session${all.length>1?"s":""} saved.`:ex("Every tutor session is saved here automatically with a score, corrections and fluency numbers.","هر جلسه با مربی به‌طور خودکار با نمره، اصلاح‌ها و آمار روانی اینجا ذخیره می‌شود.")}</p>`}
    <div><button class="btn primary sm" data-act="tab" data-v="speaking">Open speaking dashboard</button></div></section>`; }
/* exam readiness: rolling average of the last three measurements per section */
function readinessCard(){ const snap=Object.assign({}, S.st.reports||{});
  for(let n=1;n<=PLAN.length;n++){ if(S.days[n]&&hasReportData(n)){ try{ const R=dayReport(n); snap[n]={L:R.L&&R.L.pts, H:R.H&&R.H.pts, Sch:R.Sch&&!R.Sch.partial?R.Sch.pts:null}; }catch(e){} } }
  const reps=Object.entries(snap).sort((a,b)=>a[0]-b[0]).map(([,r])=>r); const mocks=Object.values(S.st.mocks||{}).sort((a,b)=>a.at-b.at);
  const pick=(fromRep, fromMock)=>{ const v=[...reps.map(fromRep), ...mocks.map(fromMock)].filter(x=>x!=null&&!isNaN(x)); return v.length?{v:Math.round(v.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,v.length)), n:v.length}:null; };
  const L=pick(r=>r.L,m=>m.L), H=pick(r=>r.H,m=>m.H), Sch=pick(r=>r.Sch,m=>m.Sch);
  const spv=allSessions().filter(x=>x.score_25!=null).map(x=>x.score_25).concat(mocks.map(m=>m.sp).filter(x=>x!=null)); const Sp=spv.length?{v:Math.round(spv.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,spv.length)), n:spv.length}:null;
  if(!L&&!H&&!Sch&&!Sp) return "";
  const W=L&&H&&Sch?L.v+H.v+Sch.v:null;
  const row=(l,o,mx,mn)=>o?barRow(l,o.v,mx,mn):`<div class="small muted">${l}: no data yet</div>`;
  return `<section class="card stack"><div class="row between"><h2>Exam readiness</h2>${W!=null?`<span class="chip ${W>=38&&L.v>=6&&H.v>=6?"ok":"bad"} tnum">Written ≈ ${W}/75</span>`:""}</div>
    ${row("Lesen",L,30,6)}${row("Hören",H,30,6)}${row("Schreiben",Sch,15,null)}${W!=null?barRow("Written total",W,75,38):""}${row("Sprechen",Sp,25,12)}
    <p class="small muted">${ex("Average of your last three results per section (day reports, mocks and tutor sessions). This is the number to watch as the exam gets closer.","میانگین سه نتیجه آخر در هر بخش (گزارش روزانه، آزمون آزمایشی و جلسه مربی).")}</p></section>`; }

/* ====================== v9: guided long tutor sessions, varied sentences, memory ====================== */
/* --- tutor session conductor: the app runs a timed lesson plan and steers Gemini phase by phase --- */
function tutorMinutes(){ return +S.st.tutorMin||25; }
function sessionPlan(n, mode, total){ const X=S.mock?S.examCtx:null; let R=null; try{ if(hasReportData(n)) R=dayReport(n); }catch(e){} const weak=R?R.weak:[]; const late=n>=8;
  const speak = late ? "ÖSD Sprechen: Teil 1 (introduce himself on 4 of the 6 topics, follow-up questions, spell his name, say a phone number), then one Teil 2 photo description (Was sehen Sie? Wer? Wo? Was machen die Leute?) and a short Teil 3 role-play where he must ask you questions too."
    : "ÖSD Sprechen Teil 1: he introduces himself (name, country, city, languages, job, family). Ask follow-up questions, make him spell his name and say his phone number in pairs of digits. Push him from single words to full sentences.";
  let P;
  if(mode==="exam") P=[
    ["Warm-up",1,"Greet him as the examiner and have a short, relaxed, unscored chat (how he is, how he got here), exactly like the real exam. In one English sentence explain the three parts. Then begin."],
    ["Teil 1 · introduce yourself",4,`Exam conditions, Sie, no corrections: he introduces himself on 4 of these 6 topics: ${(X&&X.topics||TEIL1_TOPICS).join(", ")}. Ask 2–3 follow-up questions, including spelling his surname.`],
    ["Teil 2 · describe a picture",4,X&&X.photo?`He has chosen this photo from the official model test. He can see it, you cannot; it shows: ${X.photo.scene_en} Let him describe it with the four questions: Was sehen Sie? Wie viele Personen? Wo sind sie? Was machen sie? Then one or two simple follow-up questions. No corrections yet.`:"Describe a simple everyday photo in words (for example a family at breakfast, people at a bus stop). Ask: Was sehen Sie? Wie viele Personen? Wo sind sie? Was machen sie? No corrections yet."],
    ["Teil 3 · role-play",4,X&&X.photo?`Role-play in the situation of his photo: ${X.photo.roleplay_en} You play the other person and start with: „${X.photo.starter_de}“ He must ask at least 3 questions himself and answer yours. No corrections yet.`:"Short role-play linked to the picture: you are the other person; he must ask at least 3 questions and answer yours. No corrections yet."],
    ["Feedback & score",4,"Switch to English. Give his score out of 25 with the six criteria (Teil 1, 2, 3 each 0–4, vocabulary 0–5, pronunciation 0–4, grammar 0–4). Name his 3 most important errors; for each, say the correct sentence and make him repeat it twice."],
    ["Second attempt",5,"Repeat his weakest exam part with NEW questions. He must use the corrections. Praise every improvement."],
    ["Final recap",2,"Ask 4 quick questions he struggled with today. Tell him what improved. Say goodbye only now."]];
  else if(mode==="review"){ const w=(weak.length?weak:[{area:"Today's grammar", en:"Today's grammar.", drill:"Many short transformation questions on today's grammar.", items:[]},{area:"Today's words", en:"Today's words.", drill:"English → German recall with articles.", items:[]}]).slice(0,3);
    P=[["Warm-up",2,"Greet him warmly. In two short English sentences sum up today's results (strongest area, 2–3 weakest). Ask in German how he is, then 3 easy questions about himself."],
      ...w.map((x,i)=>[`Weak spot ${i+1}: ${x.area}`, i<2?5:4, `Work only on this: ${x.en||x.area} ${x.drill||""} First re-ask the exact items he got wrong${(x.items||[]).length?" ("+x.items.slice(0,4).map(it=>`${it.q} → ${it.right}`).join("; ")+")":""}. Then give at least 6 NEW similar items, each in a new sentence. Make him repeat every corrected sentence once.`]),
      ["Words & phrases recall",5,"Quick-fire recall of TODAY'S WORDS and PHRASES and older mistakes: say the English (or a tiny situation), he answers in German, nouns always with article. After every 4 items he builds one sentence using two of them. Re-ask every miss 2–3 minutes later."],
      ["Speaking exam practice",6,speak],
      ["Recap",2,"Re-ask 5 items he got wrong in THIS session. In English, tell him which weak spots are now fine and which need more work tomorrow, and give a speaking score out of 25. Say goodbye only now."]]; }
  else P=[
    ["Warm-up",2,"Greet him, say in one English sentence what today's session covers, then 3 easy questions about himself."],
    ["New words",6,"Active recall of TODAY'S WORDS: English → German with article, then German → English, then he uses each word in his own short sentence. Re-ask misses 2–3 minutes later."],
    ["Phrases in mini-dialogues",5,"Play short everyday situations (meeting a neighbour, a shop, a phone call) where he must use TODAY'S PHRASES. Switch between du and Sie."],
    ["Grammar drill",5,"Drill TODAY'S GRAMMAR with many short transformation questions (statement → question, du → Sie, ich → er/sie), one sentence at a time."],
    ["Speaking exam practice",5,speak],
    ["Recap",2,"Re-ask 5 things he missed in this session, name 3 things he did well and 3 corrections, give a speaking score out of 25. Say goodbye only now."]];
  const sum=P.reduce((a,p)=>a+p[1],0), k=total/sum; return P.map(([t,m,i])=>({t, min:Math.max(1,Math.round(m*k)), ins:i})); }
function regie(L, i, extra){ const p=L.plan[i], N=L.plan.length;
  return `[APP NOTE – instructions from the app, not from Raam. Do not read aloud or mention this note.] Phase ${i+1} of ${N}: ${p.t} (about ${p.min} minutes). ${p.ins} ${i<N-1?"Stay in this phase and keep asking questions until the next APP NOTE arrives. Do not wrap up or say goodbye.":"This is the final phase."}${extra?" "+extra:""}`; }
function phaseTarget(p){ return Math.max(3, Math.round(p.min*2.5)); } // about one answer every 24 s of active time
function phasePct(L){ const p=L.plan[L.phase]; return Math.min(100, Math.max(L.phaseUsed/(p.min*600), L.phaseTurns/phaseTarget(p)*100)); }
function livePhaseTick(){ clearInterval(livePhaseTick._i); livePhaseTick._i=setInterval(()=>{ const L=S.live; if(!L||!L.plan){ clearInterval(livePhaseTick._i); return; }
  const now=Date.now(), dt=L.lastTick?now-L.lastTick:0; L.lastTick=now;
  if(L.status!=="live"||L.paused) return;
  if(!L.waiting) L.phaseUsed+=dt; // the clock stops while the tutor is thinking
  if(L.note&&!L.waiting&&!L.holding&&L.sess&&!L.sess.modelSpeaking&&now-(L.noteAt||0)>4000){ L.noteAt=now; flushNote(L); }
  const p=L.plan[L.phase]; const left=p.min*60000-L.phaseUsed; const tg=phaseTarget(p);
  const t=$("#phaseLeft"); if(t) t.textContent=fmtMs(Math.max(0,left)); const bar=$("#phaseBar"); if(bar) bar.style.width=phasePct(L)+"%";
  const pt=$("#phaseTurns"); if(pt) pt.textContent=`${Math.min(L.phaseTurns,tg)}/${tg} answers`;
  const tot=$("#liveTotal"); if(tot) tot.textContent=fmtMs(now-L.started);
  if(left<=0||L.phaseTurns>=tg){ if(L.phase<L.plan.length-1) nextPhase(); else if(!L.complete&&left<=0){ L.complete=true; sfx("done"); render(); } } },1000); }
function nextPhase(){ const L=S.live; if(!L||!L.plan||L.phase>=L.plan.length-1) return; L.phase++; L.phaseUsed=0; L.phaseTurns=0;
  sendNote(L, regie(L,L.phase)); sfx("tap"); render(); }
function phaseBlock(L){ if(!L.plan) return ""; const p=L.plan[L.phase];
  const tg=phaseTarget(p);
  return `<div class="card stack phasecard"><div class="row between"><div><div class="label">Phase ${L.phase+1} of ${L.plan.length} · total <span id="liveTotal" class="tnum">${fmtMs(Date.now()-L.started)}</span> / ${tutorMinutes()} min</div><h3>${esc(p.t)}</h3></div><div style="text-align:right"><span class="tnum phase-left" id="phaseLeft">${fmtMs(Math.max(0,p.min*60000-L.phaseUsed))}</span><div class="small muted tnum" id="phaseTurns">${Math.min(L.phaseTurns,tg)}/${tg} answers</div></div></div>
    <div class="lbar"><i id="phaseBar" style="width:${phasePct(L)}%"></i></div>
    <div class="phases">${L.plan.map((x,i)=>`<span class="ph ${i<L.phase?"done":i===L.phase?"cur":""}">${esc(x.t.replace(/^Weak spot \d+: /,"Weak: "))}</span>`).join("")}</div>
    ${L.complete?`<div class="banner info"><div>${ex("Plan finished. Let the tutor finish the recap, then press End session to save everything.","برنامه تمام شد. بگذار مربی جمع‌بندی کند، بعد End session را بزن تا ذخیره شود.")}</div></div>`:""}
    <div class="row">${L.phase<L.plan.length-1?`<button class="btn sm" data-act="live-next">Next phase</button>`:""}<button class="btn sm" data-act="live-more">+5 min</button></div></div>`; }

/* --- fresh sentences: Gemini writes new A1 sentences for each word and phrase, cached per day in the synced overlay --- */
function knownWords(n){ const out=[]; for(let k=1;k<=n;k++){ const d=S.days[k]; if(!d) continue; (d.vocab||[]).forEach(v=>out.push(vfull(v))); (d.phrases||[]).slice(0,10).forEach(p=>out.push(p.de)); } return out.slice(-260); }
function partItems(p){ return (p.items||[]).map(x=>p.id[0]==="w"?{id:vfull(x), de:x.de, article:x.article, en:x.en, kind:"word"}:{id:x.de, de:x.de, en:x.en, kind:"phrase"}); }
function cleanVariants(res, items){ const ids=new Set(items.map(i=>i.id)); const out={}; const arr=(res&&res.items)||[];
  arr.forEach(it=>{ if(!it||!ids.has(it.id)) return; const sents=(it.sentences||[]).filter(s=>s&&typeof s.de==="string"&&s.de.split(/\s+/).length>=2&&s.de.length<120&&s.en).slice(0,4).map(s=>({de:s.de.trim(), en:String(s.en).trim(), fa:s.fa||"", gap:s.gap&&s.de.includes(s.gap)?s.gap:null,
      wrong_en:(s.wrong_en||[]).filter(w=>w&&w!==s.en).slice(0,2), near_de:(s.near_de||[]).filter(w=>w&&w.trim()!==s.de.trim()).slice(0,2), situation_en:s.situation_en||""}));
    if(sents.length) out[it.id]={hook:String(it.hook||"").slice(0,140), sentences:sents}; });
  return Object.keys(out).length?out:null; }
function getVariants(n,pid){ const d=S.days[n]; return d&&d.variants&&d.variants[pid]&&d.variants[pid].items||null; }
async function ensureVariants(n, onlyPid){ if(!S.uid||!S.ai||S.varBusy) return; const d=S.days[n]; if(!d) return;
  const parts=learnParts(d).filter(p=>p.items&&(!onlyPid||p.id===onlyPid)&&!getVariants(n,p.id)); if(!parts.length) return; S.varBusy=true;
  try{ for(const p of parts){ const items=partItems(p);
      const r=await api("/api/ai",{mode:"variants", payload:{day:n, theme:PLAN[n-1].t, grammar:PLAN[n-1].g, items, known:knownWords(n), count:3}});
      const clean=cleanVariants(r.result, items); if(!clean) continue;
      const ov=Object.assign({day:n}, S.imported[n]||{}); ov.variants=Object.assign({}, ov.variants||{}, {[p.id]:{at:Date.now(), items:clean}}); await saveOverlay(n, ov); await getDay(n); } }
  catch(e){ console.warn("variants", e); }
  S.varBusy=false; }
function hookFor(n, v){ const d=S.days[n]; if(!d||!d.variants) return ""; for(const k of Object.keys(d.variants)){ const it=d.variants[k].items&&d.variants[k].items[v.article!==undefined&&v.article!=="-"&&v.article?vfull(v):v.de]; if(it&&it.hook) return it.hook; } return ""; }
function variantScreens(p, V, run, pool){ const out=[]; const items=partItems(p); const gaps=[];
  items.forEach(it=>{ const vv=V[it.id]; if(vv) vv.sentences.forEach(s=>{ if(s.gap) gaps.push(s.gap); }); });
  items.forEach((it,i)=>{ const vv=V[it.id]; if(!vv) return; const s=vv.sentences[(run+i)%vv.sentences.length]; const kind=(run+i)%4;
    if(it.kind==="phrase" && s.situation_en && kind===0){ out.push({type:"mcq", h:"What do you say?", prompt:s.situation_en, options:opts(it.de, pool, 3, "sit"+run+i), answer:it.de, q:s.situation_en, explain_en:`${s.de} · ${s.en}`}); return; }
    if(kind===0 && s.gap){ const dis=[...new Set(gaps.filter(g=>g!==s.gap))]; if(dis.length>=2){ out.push({type:"gap", prompt:s.de.replace(s.gap,"____"), options:shuffled([s.gap,...shuffled(dis,"g"+run+i).slice(0,3)],"go"+run+i), answer:s.gap, q:s.de, explain_en:s.en, explain_fa:s.fa}); return; } }
    if(kind===1 && s.wrong_en.length>=1){ out.push({type:"mcq", h:"What does this sentence mean?", say:s.de, prompt:`„${s.de}“`, options:shuffled([s.en,...s.wrong_en],"c"+run+i), answer:s.en, q:s.de, explain_en:s.de}); return; }
    if(kind===2 && s.near_de.length>=1){ out.push({type:"listen", prompt:"Which sentence do you hear?", say:s.de, options:shuffled([s.de,...s.near_de],"l"+run+i), answer:s.de, noLog:true, explain_en:s.en}); return; }
    const w=s.de.split(/\s+/); if(w.length>=3&&w.length<=9) out.push({type:"word_order", words:shuf2(w,"b"+run+i), answer:s.de, q:s.de, en:s.en, explain_fa:s.fa});
    else if(s.wrong_en.length) out.push({type:"mcq", h:"What does this sentence mean?", say:s.de, prompt:`„${s.de}“`, options:shuffled([s.en,...s.wrong_en],"c2"+run+i), answer:s.en, q:s.de});
  });
  return out; }
/* typed recall: producing the word is the strongest memory exercise */
function writeScreen(v){ return {type:"write", en:v.en, fa:v.fa, answer:vfull(v), bare:v.de, q:v.en}; }
function nextMorning(){ const t=new Date(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()+1,4).getTime(); }
function seedSrs(n, p){ if(!p||!p.items) return; const nm=nextMorning(); p.items.forEach(x=>{ const id=(p.id[0]==="w"?"v:":"p:")+x.de; if(!S.st.srs[id]) S.st.srs[id]={ef:2.5,ivl:0,reps:0,lapses:0,due:nm}; }); }
/* evening recap: a short retrieval round on today's words before sleep */
function recapScreens(n){ const d=S.days[n]; if(!d) return []; const done=learnParts(d).filter((p,pi)=>p.items&&(S.st.done[`${n}:learn#${pi}`]||S.st.done[n+":learn"]));
  const words=done.filter(p=>p.id[0]==="w").flatMap(p=>p.items), phr=done.filter(p=>p.id[0]==="p").flatMap(p=>p.items); if(words.length+phr.length<4) return [];
  const seed="rc"+Date.now(), fullPool=(d.vocab||[]).map(vfull), out=[];
  shuffled(words,seed+"w").slice(0,5).forEach(v=>out.push(writeScreen(v)));
  shuffled(words,seed+"r").slice(0,4).forEach((v,j)=>out.push({type:"reverse",en:v.en,fa:v.fa,options:opts(vfull(v),fullPool,4,seed+"R"+j),answer:vfull(v),q:v.en,sayOpts:true}));
  shuffled(phr,seed+"p").slice(0,4).forEach((x,j)=>out.push({type:"mcq",h:"What do you say?",prompt:x.en,options:opts(x.de,(d.phrases||[]).map(y=>y.de),3,seed+"P"+j),answer:x.de,q:x.en}));
  shuffled(words,seed+"l").slice(0,3).forEach((v,j)=>out.push({type:"listen",prompt:"What do you hear?",say:vfull(v),options:opts(vfull(v),fullPool,4,seed+"L"+j),answer:vfull(v),noLog:true}));
  return shuffled(out,seed); }
function recapCard(n){ const d=S.days[n]; if(!d||S.st.done[n+":recap"]||n!==currentDay()) return ""; const h=new Date().getHours(); if(h<17&&!dayAllDone(n)) return "";
  if(recapScreens(n).length<4) return "";
  return `<section class="card row recap-card" style="flex-wrap:nowrap;gap:14px"><div style="flex:none">${edi(60,"wink")}</div><div class="grow"><h3>Before you sleep · 5-minute recap</h3><p class="small muted">${ex("Recalling today's words just before sleep and again tomorrow morning is the fastest way to stop forgetting them.","یادآوری لغات امروز درست قبل از خواب و دوباره فردا صبح، سریع‌ترین راه برای فراموش نکردن آن‌هاست.")}</p></div><button class="btn primary sm" data-act="recap-start" data-n="${n}">Start</button></section>`; }

/* ---------- events ---------- */
document.addEventListener("click", async e=>{
  const b=e.target.closest("[data-act]"); if(!b) return;
  const a=b.dataset.act;
  if(a==="tab"){ S.view=b.dataset.v; S.step=null; S.fc=null; S.mix=null; S.pop=null; S.fcFrom=null; S.report=null; S.sess=null; if(S.blitz){ clearInterval(tickBlitz._i); S.blitz=null; } if(S.view==="today") S.dayN=S.dayN||currentDay(); render(); window.scrollTo(0,0); }
  else if(a==="day"){ const n=+b.dataset.v; if(n<1||n>PLAN.length) return; S.dayN=n; S.view="today"; S.step=null; S.pop=null; S.report=null; render(); window.scrollTo(0,0); }
  else if(a==="step"){ S.step=b.dataset.v; S.stepAt=Date.now(); S.pop=null; render(); window.scrollTo(0,0); }
  else if(a==="node"){ const i=+b.dataset.i; S.pop=S.pop===i?null:i; sfx("tap"); render(); const pp=$(".pop"); if(pp) pp.scrollIntoView({block:"nearest",behavior:"smooth"}); }
  else if(a==="node-start"){ startNode(S.dayN||currentDay(), +b.dataset.i); }
  else if(a==="node-trophy"){ const n=S.dayN||currentDay(); if(!dayAllDone(n)) toast(hasReportData(n)?"Report so far. Finish every step to win the trophy.":"Finish every step on the path to win today's trophy."); if(hasReportData(n)||dayAllDone(n)){ S.report=n; render(); window.scrollTo(0,0); } }
  else if(a==="brk"){ S.brk={n:S.dayN||currentDay(), m:+b.dataset.m, len:+b.dataset.len, endAt:Date.now()+(+b.dataset.len)*60000}; render(); }
  else if(a==="brk-end"){ const B=S.brk; if(B){ const k=`${B.n}:brk${B.m}`; if(!S.st.done[k]){ S.st.done[k]=Date.now(); const c=addCoins(5+Math.floor(Math.random()*11)); const x=addXp(5); dbump("breaks"); checkBadges(); save(); sfx("done"); toast(`Chest opened: +${c} Schilling, +${x} XP`); } } S.brk=null; render(); }
  else if(a==="les-pick"){ const L=S.les; if(!L||L.state!=="ans") return; L.pick=+b.dataset.v; const s=lesCur(); if(s.sayOpts||s.type==="listen"&&/^[A-Za-zÄÖÜäöüß ]{3,}$/.test(s.options[L.pick])&&s.options[L.pick].length>2){ stopSpeech(); speak(s.options[L.pick]); } else sfx("tap"); render(); }
  else if(a==="les-check"){ lesCheck(); }
  else if(a==="les-next"){ lesNext(); }
  else if(a==="les-wo-add"){ const L=S.les; if(L.state!=="ans") return; L.wo.push(+b.dataset.ix); const s=lesCur(); speak(s.words[+b.dataset.ix]); render(); }
  else if(a==="les-wo-del"){ const L=S.les; if(L.state!=="ans") return; L.wo=L.wo.filter(x=>x!==+b.dataset.ix); render(); }
  else if(a==="les-key"){ const el=$("#lesIn"); if(!el) return; const v=b.dataset.v; const st=el.selectionStart??el.value.length, en=el.selectionEnd??st; el.value=el.value.slice(0,st)+v+el.value.slice(en); try{ el.setSelectionRange(st+v.length, st+v.length); }catch(e){} el.focus(); S.les.text=el.value; const lb=$("#lesBtn"); if(lb) lb.disabled=!el.value.trim(); }
  else if(a==="les-match"){ const L=S.les, M=L.match, s=lesCur(); if(!M||L.state!=="ans") return; const side=b.dataset.side, i=+b.dataset.i; if(side==="l"){ stopSpeech(); speak(s.pairs[i].say); }
    if(!M.sel || M.sel.side===side){ M.sel={side,i}; render(); return; }
    const li=side==="l"?i:M.sel.i, ri=side==="r"?i:M.sel.i; M.sel=null;
    if(li===ri){ M.done.push(li); if(M.done.length===s.pairs.length){ gradeScreen(M.mistakes<=1, "", {match:true}); return; } sfx("pair"); render(); }
    else { M.mistakes++; M.bad=[{side:"l",i:li},{side:"r",i:ri}]; sfx("bad"); vib(60); render(); setTimeout(()=>{ if(S.les===L&&L.match===M){ M.bad=null; render(); } },550); } }
  else if(a==="les-mic"){ lesMic(); }
  else if(a==="les-skip"){ const L=S.les; stopSpeech(); L.state="chk"; L.res={skip:true}; render(); }
  else if(a==="les-said"){ gradeScreen(true, "", {}); }
  else if(a==="les-spell"){ const s=lesCur(); if(s) spellOut(s.word); }
  else if(a==="les-quit"){ const L=S.les; if(L.pos===0&&L.state==="ans"){ S.les=null; stopSpeech(); render(); return; } L.quit=true; render(); }
  else if(a==="les-quit-no"){ S.les.quit=false; render(); }
  else if(a==="les-quit-yes"){ S.les=null; stopSpeech(); render(); window.scrollTo(0,0); }
  else if(a==="fin-continue"){ S.fin=null; render(); window.scrollTo(0,0); if(S.view==="today") setTimeout(()=>{ const c=$("#curNode"); if(c) c.scrollIntoView({block:"center",behavior:"smooth"}); },60); }
  else if(a==="fin-again"){ const F=S.fin; S.fin=null; startNode(F.n, F.node); }
  else if(a==="task-done"){ const k=b.dataset.key, step=b.dataset.step, n=+k.split(":")[0]; const wasAll=dayAllDone(n); S.st.done[k]=Date.now(); const gx=addXp(15); let coins=addCoins(10); if(step==="hoeren") dbump("listen");
    let sc=0,tot=0; Object.entries(S.st.results).forEach(([rk,r])=>{ if(rk.startsWith(n+":"+step)&&r&&r.total){ sc+=r.score; tot+=r.total; } });
    const dayDone=!wasAll&&dayAllDone(n); if(dayDone){ coins+=addCoins(50); bump("daysDone"); } checkBadges(); save(); sfx("done"); stopSpeech();
    S.fin={title:dayDone?`Day ${n} complete!`:`${(NODE_INFO[step]||[step])[0]} complete!`, xp:gx, coins, boost:boostOn(), acc:tot?Math.round(sc/tot*100):null, ms:S.stepAt?Date.now()-S.stepAt:0, dayDone, n}; S.step=null; S.timer=null; render(); window.scrollTo(0,0); }
  else if(a==="day-hours"){ S.st.dayHours=+b.dataset.v; save(); render(); }
  else if(a==="goal"){ S.st.goal=+b.dataset.v; save(); render(); }
  else if(a==="quest-claim"){ const D=dayData(); D.claimed=D.claimed||{}; if(D.claimed[b.dataset.q]) return; D.claimed[b.dataset.q]=1; const r=addCoins(+b.dataset.r); bump("quests"); checkBadges(); save(); sfx("done"); toast(`Quest complete: +${r} Schilling`); render(); }
  else if(a==="shop-buy"){ const v=b.dataset.v, c=S.st.coins||0;
    if(v==="freeze"&&c>=150&&(S.st.freezes||0)<2){ S.st.coins-=150; S.st.freezes=(S.st.freezes||0)+1; sfx("done"); toast("Streak freeze ready. Your streak is protected for one missed day."); }
    else if(v==="boost"&&c>=100&&!boostOn()){ S.st.coins-=100; S.st.boostUntil=Date.now()+15*60000; sfx("done"); toast("Double XP for 15 minutes. Go!"); }
    save(); render(); }
  else if(a==="les-hint"){ const L=S.les, s=lesCur(); if(!L||L.state!=="ans"||(S.st.coins||0)<10||(L.elim||[]).length) return;
    const wrong=s.options.map((o,i)=>i).filter(i=>s.options[i]!==s.answer&&i!==L.pick); if(!wrong.length) return; const i=wrong[Math.floor(Math.random()*wrong.length)];
    L.elim=[i]; S.st.coins-=10; save(); sfx("tap"); render(); }
  else if(a==="fin-report"){ const n=S.fin.n; S.fin=null; S.report=n; render(); window.scrollTo(0,0); }
  else if(a==="rep-show"){ S.report=+b.dataset.n; S.pop=null; render(); window.scrollTo(0,0); }
  else if(a==="rep-close"){ S.report=null; render(); window.scrollTo(0,0); }
  else if(a==="rep-open"){ const n=S.report; S.report=null; S.dayN=n; S.view="today"; S.step=b.dataset.v; S.stepAt=Date.now(); render(); window.scrollTo(0,0); }
  else if(a==="rep-repair"){ startRepair(S.report); }
  else if(a==="sess-open"){ S.sess={day:+b.dataset.day, id:b.dataset.id}; S.view="speaking"; S.transcript=null; render(); window.scrollTo(0,0); }
  else if(a==="sess-close"){ S.sess=null; render(); window.scrollTo(0,0); }
  else if(a==="sess-conf"){ const x=findSession(+b.dataset.day, b.dataset.id); if(x){ x.confidence=+b.dataset.v; save(); render(); } }
  else if(a==="sess-transcript"){ if(!b.open) loadTranscript(b.dataset.path); }
  else if(a==="draft-discard"){ clearDraft(); render(); }
  else if(a==="draft-save"||a==="sess-import"){ if(!S.ai||!S.uid){ toast("Sign in (and set up Gemini) to analyse sessions"); return; } if(S.saveBusy) return;
    let job; if(a==="draft-save"){ const D=getDraft(); if(!D) return; job={n:D.n, mode:D.mode, log:D.log, started:D.started, source:"live"}; }
    else { const txt=(S.importText["gemini-session"]||"").trim(); if(txt.length<60){ toast("Paste the whole conversation first"); return; } const md=($("#impMode")||{}).value||"coach"; job={n:currentDay(), mode:md, log:[], started:Date.now()-60000, source:"gemini-app", rawText:txt}; }
    S.saveBusy=true; render();
    try{ const {sess}=await analyseSession(job); if(a==="draft-save") clearDraft(); else S.importText["gemini-session"]=""; S.view="speaking"; S.sess={day:job.n, id:sess.id}; toast("Session saved"); }
    catch(e){ toast("Couldn't analyse: "+e.message); }
    S.saveBusy=false; render(); window.scrollTo(0,0); }
  else if(a==="cel-next"){ S.cel.shift(); render(); window.scrollTo(0,0); }
  else if(a==="blitz-start"){ startBlitz(); }
  else if(a==="rust-start"){ const n=+b.dataset.n; for(let k=1;k<=n;k++) await getDay(k); const screens=rustScreens(n); if(!screens.length){ toast("Nothing to check yet"); return; } startLesson({src:"rust", n, title:"Rust check", screens}); }
  else if(a==="rust-skip"){ if(S.st.comeback){ S.st.comeback.skip=true; save(); } render(); }
  else if(a==="replan"){ replanTo(+b.dataset.n); toast(`Today is now Day ${b.dataset.n}`); render(); }
  else if(a==="replan-no"){ S.st.replanDismiss=dk(new Date()); save(); render(); }
  else if(a==="blitz-quit"){ clearInterval(tickBlitz._i); S.blitz=null; stopSpeech(); render(); }
  else if(a==="blitz-pick"){ const B=S.blitz; if(!B||B.flash) return; const i=+b.dataset.v; const ok=B.q.options[i]===B.q.answer; B.flash={i,ok};
    if(ok){ B.score++; B.combo++; sfx("ok"); } else { B.wrong++; B.combo=0; sfx("bad"); vib(60); }
    render(); setTimeout(()=>{ if(S.blitz===B){ B.flash=null; nextBlitz(); render(); } }, ok?260:800); }
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
    const used=S.plays[k]||0; if(!unlimited&&used>=max) return; S.plays[k]=used+1; const it=SAY_BANK[+b.dataset.i]; render(); if(it) speakLines(it.lines,!!b.dataset.slow); }
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
  else if(a==="check"){ const g=b.dataset.g; if(!S.checked[g]) logPartMistakes(g); S.checked[g]=true; render(); }
  else if(a==="uncheck"){ const g=b.dataset.g; delete S.checked[g]; Object.keys(S.ans).forEach(k=>{ if(k.startsWith(g+":")) delete S.ans[k]; }); Object.keys(S.plays).forEach(k=>{ if(k.startsWith(g+"|")) delete S.plays[k]; }); render(); }
  else if(a==="uncheck-pre"){ const pre=b.dataset.g; Object.keys(S.checked).forEach(k=>{ if(k.startsWith(pre)) delete S.checked[k]; }); Object.keys(S.ans).forEach(k=>{ if(k.startsWith(pre)) delete S.ans[k]; }); render(); }
  else if(a==="grade"){ gradeEmail(+b.dataset.n); }
  else if(a==="copy"){ copyText(b.dataset.txt); }
  else if(a==="import"){ importDay(+b.dataset.n); }
  else if(a==="fc-start"){ startFc(b.dataset.mode); render(); }
  else if(a==="fc-show"){ S.fc.show=true; render(); const c=S.fc.queue[0]; if(S.fc.mode==="en"&&c) speak((c.article&&c.article!=="-"?c.article+" ":"")+c.de); }
  else if(a==="fc-grade"){ const q=+b.dataset.q; const c=S.fc.queue.shift(); grade(c,q); S.fc.seen++; if(q>=3) S.fc.good=(S.fc.good||0)+1; const fk=dk(new Date()); S.st.fcLog=S.st.fcLog||{}; S.st.fcLog[fk]=(S.st.fcLog[fk]||0)+1;
    if(q<3) S.fc.queue.splice(Math.min(4,S.fc.queue.length),0,c); S.fc.show=false; q>=3?sfx("ok"):sfx("bad"); if(!S.fc.queue.length){ finishFc(); return; } render();
    const nx=S.fc.queue[0]; if(nx&&S.fc.mode==="de") speak((nx.article&&nx.article!=="-"?nx.article+" ":"")+nx.de); }
  else if(a==="fc-end"){ S.fc=null; if(S.fcFrom){ S.view="today"; S.fcFrom=null; } render(); window.scrollTo(0,0); }
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
  else if(a==="mock-tutor"){ S.liveMode="exam"; const D=S.mock&&S.mockData[S.mock.id]; const ph=D&&D.sprechen&&D.sprechen.teil2&&D.sprechen.teil2.photos; S.examCtx=D&&D.official?{topics:(D.sprechen.teil1&&D.sprechen.teil1.topics)||TEIL1_TOPICS, photo:ph?ph[S.mock.photo||0]:null}:null; startLive(currentDay()); }
  else if(a==="mock-use-tutor"){ S.mock.spOverride=b.dataset.v===""?null:+b.dataset.v; render(); }
  else if(a==="mock-a2-self"){ S.mock.sa2=null; S.mock.sa2Detail=null; render(); }
  else if(a==="mock-grade"){ gradePaperEmail(); }
  else if(a==="mock-result"){ mockGo("result"); }
  else if(a==="mock-exit"){ stopOffAudio(); S.mock=null; S.testPrefix=""; S.examCtx=null; render(); window.scrollTo(0,0); }
  else if(a==="offplay"){ offPlay(b); }
  else if(a==="offrate"){ const au=b.closest(".offplayer")&&b.closest(".offplayer").querySelector("audio"); if(au){ au.playbackRate=+b.dataset.r; try{ au.preservesPitch=true; }catch(_){} b.parentElement.querySelectorAll('[data-act="offrate"]').forEach(x=>x.classList.toggle("sel",x===b)); } }
  else if(a==="offtr"){ offTranscript(b.dataset.set,b.dataset.key,b.dataset.g); }
  else if(a==="offseek"){ const au=b.closest(".offplayer")&&b.closest(".offplayer").querySelector("audio"); if(au){ au.currentTime=+b.dataset.s; au.play().catch(()=>{}); } }
  else if(a==="vid-on"){ S.vidOn=true; render(); }
  else if(a==="eye-open"){ S.eye={i:+b.dataset.i, step:"rate", picks:{}, band:null, n:b.dataset.n?+b.dataset.n:null}; render(); window.scrollTo(0,0); }
  else if(a==="eye-pick"){ S.eye.picks[+b.dataset.q]=b.dataset.v==="1"; render(); }
  else if(a==="eye-band"){ S.eye.band=+b.dataset.v; render(); }
  else if(a==="eye-reveal"){ S.eye.step="reveal"; const x=eyeData().items[S.eye.i]; S.st.eye=S.st.eye||{}; S.st.eye[x.id]=Date.now(); addXp(5); save(); render(); }
  else if(a==="eye-next"){ const E=eyeData(); let j=S.eye.i+1; while(j<E.items.length&&!eyeUnlocked(E.items[j])) j++; if(j<E.items.length){ S.eye={i:j, step:"rate", picks:{}, band:null, n:S.eye.n}; } else { if(S.eye.n){ S.st.done[S.eye.n+":eye"]=Date.now(); save(); } S.eye=null; toast("Nice work, examiner!"); } render(); window.scrollTo(0,0); }
  else if(a==="eye-close"){ S.eye=null; render(); }
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
  else if(a==="tutor-min"){ S.st.tutorMin=+b.dataset.v; save(); render(); }
  else if(a==="talk-mode"){ S.st.talkMode=b.dataset.v; save(); render(); }
  else if(a==="live-start"){ if(b.dataset.mode) S.liveMode=b.dataset.mode; else if(S.liveMode==="coach"&&hasReportData(+b.dataset.n)&&!b.closest(".tutor-card")) S.liveMode="review"; startLive(+b.dataset.n); }
  else if(a==="live-mute"){ if(S.live&&S.live.sess){ S.live.muted=!S.live.muted; S.live.sess.setMuted(S.live.muted); render(); } }
  else if(a==="live-end"){ clearInterval(livePhaseTick._i); endLive(); }
  else if(a==="live-next"){ nextPhase(); }
  else if(a==="live-more"){ if(S.live&&S.live.plan){ S.live.complete=false; S.live.plan[S.live.phase].min+=5; render(); } }
  else if(a==="recap-start"){ const n=+b.dataset.n; const screens=recapScreens(n); if(!screens.length){ toast("Finish a Words lesson first"); return; } startLesson({src:"recap", n, key:n+":recap", step:"recap", parts:1, title:"Evening recap", screens}); }
  else if(a==="copy-context"){ copyContext(+b.dataset.n); }
  else if(a==="reset-no"){ S.confirmReset=false; render(); }
  else if(a==="reset-yes"){ const keep={lang:S.st.lang,voice:S.st.voice,rate:S.st.rate,start:S.st.start}; S.st=Object.assign(defaultState(),keep); S.confirmReset=false; S.ex={}; S.ans={}; S.checked={}; save(); toast("Progress reset"); render(); }
});
function itemsFor(src){ if(src==="mix") return S.mix||[]; const d=S.days[S.dayN||currentDay()]; if(src==="check") return d.exercises; if(src==="quiz") return d.review_quiz.map(q=>({type:"mcq",prompt:q.q,options:q.options,answer:q.answer})); return d.exercises; }
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.dataset.les==="text" && S.les){ S.les.text=t.value; const lb=$("#lesBtn"); if(lb) lb.disabled=!t.value.trim(); }
  if(t.dataset.store && t.type!=="radio") S.ans[t.dataset.store]=t.value;
  if(t.dataset.draft){ S.st.drafts[t.dataset.draft]=t.value; const wc=wordCount(t.value); const el=$("#wc"); if(el){ el.textContent=wc+" words · aim for 30, at least 25"; el.style.color=wc>=25?"var(--ok)":"var(--muted)"; } const wk=$("#wcheck"); if(wk) wk.innerHTML=writeCheckHtml(t.value, t.dataset.intro); clearTimeout(t._s); t._s=setTimeout(save,800); }
  if(t.dataset.imp) S.importText[t.dataset.imp]=t.value;
  if(t.dataset.cards) S.cardText[t.dataset.cards]=t.value;
  if(t.dataset.mtask&&S.mock) S.mock.task=t.value;
  if(t.dataset.set==="rate"){ S.st.rate=+t.value; const l=t.previousElementSibling; if(l) l.querySelector("span").textContent=(+t.value).toFixed(2)+"×"; clearTimeout(t._s); t._s=setTimeout(save,500); }
});
document.addEventListener("keydown", e=>{
  if(!S.les && !S.fin && !S.fc && !S.blitz && !(S.cel&&S.cel.length)) return; if(e.ctrlKey||e.metaKey||e.altKey) return;
  const tag=e.target.tagName;
  if(S.les && S.les.quit) return;
  if(e.key==="Enter" && !e.shiftKey){ const b=$("#lesBtn"); if(b && !b.disabled){ e.preventDefault(); b.click(); } return; }
  if(tag==="INPUT"||tag==="TEXTAREA") return;
  if(S.les && /^[1-9]$/.test(e.key)){ const t=document.querySelector(`[data-act="les-pick"][data-v="${+e.key-1}"]`); if(t&&!t.disabled){ e.preventDefault(); t.click(); } }
  if(S.blitz && /^[1-4]$/.test(e.key)){ const t=document.querySelector(`[data-act="blitz-pick"][data-v="${+e.key-1}"]`); if(t&&!t.disabled){ e.preventDefault(); t.click(); } return; }
  if(S.fc && S.fc.show && /^[1-4]$/.test(e.key)){ const t=document.querySelectorAll('[data-act="fc-grade"]')[+e.key-1]; if(t){ e.preventDefault(); t.click(); } }
  if(S.fc && !S.fc.show && e.key===" "){ const t=$("#lesBtn"); if(t){ e.preventDefault(); t.click(); } }
});
document.addEventListener("mousedown", e=>{ if(e.target.closest('[data-act="les-key"]')) e.preventDefault(); });
document.addEventListener("submit", e=>{
  if(e.target.id==="authForm"){ e.preventDefault(); submitAuth(); }
  if(e.target.id==="liveText"){ e.preventDefault(); const i=$("#liveTextIn"); const v=i&&i.value.trim(); if(v&&S.live&&S.live.sess){ S.live.sess.sendUserText(v); S.live.log.push({role:"you",text:v}); S.live.phaseTurns++; i.value=""; drawLiveLog(); } }
});
document.addEventListener("change", e=>{
  const t=e.target;
  if(t.dataset.count&&S.mock){ S.mock.counts[t.dataset.count]=+t.value; }
  if(t.dataset.rub&&S.mock){ S.mock.rub[t.dataset.rub]=+t.value; render(); }
  if(t.dataset.selfsp){ const [ns,k]=t.dataset.selfsp.split(":"); S.st.selfSp=S.st.selfSp||{}; const o=S.st.selfSp[ns]=S.st.selfSp[ns]||{a1:0,a2:0,a3:0,lex:0,aus:0,form:0}; o[k]=+t.value; save(); render(); }
  if(t.dataset.spr&&S.mock){ S.mock.sp[t.dataset.spr]=+t.value; S.mock.spOverride=null; render(); }
  if(t.dataset.pt){ const i=t.dataset.pt.lastIndexOf(":"); S.st.drafts[t.dataset.pt.slice(0,i)+":p"+t.dataset.pt.slice(i+1)]=t.checked; save(); }
  if(t.dataset.upload){ const files=[...t.files]; if(files.length) uploadFiles(+t.dataset.upload, files); }
  if(t.dataset.set==="tutorVoice"){ S.st.tutorVoice=t.value; save(); }
  if(t.dataset.store && (t.type==="radio"||t.tagName==="SELECT")) S.ans[t.dataset.store]=t.value;
  if(t.dataset.multi){ const k=t.dataset.multi; const arr=new Set(S.ans[k]||[]); t.checked?arr.add(t.value):arr.delete(t.value); S.ans[k]=[...arr]; }
  if(t.dataset.chk){ if(t.checked) S.st.done[t.dataset.chk]=Date.now(); else delete S.st.done[t.dataset.chk]; save(); }
  if(t.dataset.set==="voice"){ S.st.voice=t.value; save(); speak("Grüß Gott!"); }
  if(t.dataset.set==="strict"){ S.st.strict=t.checked; save(); }
  if(t.dataset.set==="sfx"){ S.st.sfx=t.checked; save(); if(t.checked) sfx("ok"); }
  if(t.dataset.offimport&&t.files&&t.files.length){ importOfficial([...t.files]); t.value=""; }
  if(t.dataset.set==="exam"){ if(/^\d{4}-\d{2}-\d{2}$/.test(t.value)){ S.st.exam=t.value; schedule._k=null; S.dayN=currentDay(); save(); render(); } else toast("Use the format YYYY-MM-DD"); }
  if(t.dataset.set==="start"){ if(/^\d{4}-\d{2}-\d{2}$/.test(t.value)){ S.st.start=t.value; schedule._k=null; S.dayN=currentDay(); save(); render(); } else toast("Use the format YYYY-MM-DD"); }
});

/* ====================== v10: 3-hour plan, comeback mode, auto review days, trainers ====================== */
function rng(seed){ let x=hashStr(String(seed))||1; return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; return ((x>>>0)%100000)/100000; }; }
function pick(arr, r){ return arr[Math.floor(r()*arr.length)]; }
function capFirst(t){ return t.charAt(0).toUpperCase()+t.slice(1); }

/* --- Grammar gym: verb endings, articles, question words, word order (generated, no AI needed) --- */
const PRONS=["ich","du","er","wir","ihr","sie"];
const VERBS=[ // [infinitive, English, day introduced, forms ich/du/er/wir/ihr/sie, complement]
 ["heißen","be called",1,["heiße","heißt","heißt","heißen","heißt","heißen"],["Raam","Anna","Thomas","Gruber","Wieser","Huber"]],
 ["sein","be",2,["bin","bist","ist","sind","seid","sind"],"in Wien"],
 ["kommen","come",2,["komme","kommst","kommt","kommen","kommt","kommen"],"aus dem Iran"],
 ["wohnen","live",2,["wohne","wohnst","wohnt","wohnen","wohnt","wohnen"],"in Teheran"],
 ["sprechen","speak",2,["spreche","sprichst","spricht","sprechen","sprecht","sprechen"],"Persisch"],
 ["haben","have",3,["habe","hast","hat","haben","habt","haben"],"zwei Kinder"],
 ["lernen","learn",4,["lerne","lernst","lernt","lernen","lernt","lernen"],"Deutsch"],
 ["machen","do",4,["mache","machst","macht","machen","macht","machen"],"heute Sport"],
 ["arbeiten","work",4,["arbeite","arbeitest","arbeitet","arbeiten","arbeitet","arbeiten"],"in Wien"],
 ["trinken","drink",4,["trinke","trinkst","trinkt","trinken","trinkt","trinken"],"Kaffee"],
 ["schreiben","write",4,["schreibe","schreibst","schreibt","schreiben","schreibt","schreiben"],"eine E-Mail"],
 ["lesen","read",4,["lese","liest","liest","lesen","lest","lesen"],"ein Buch"],
 ["verstehen","understand",4,["verstehe","verstehst","versteht","verstehen","versteht","verstehen"],"die Frage"],
 ["spielen","play",4,["spiele","spielst","spielt","spielen","spielt","spielen"],"Fußball"],
 ["fahren","go (by vehicle)",6,["fahre","fährst","fährt","fahren","fahrt","fahren"],"nach Graz"],
 ["essen","eat",8,["esse","isst","isst","essen","esst","essen"],"gern Reis"],
 ["möchten","would like",8,["möchte","möchtest","möchte","möchten","möchtet","möchten"],"einen Tee"],
 ["kaufen","buy",9,["kaufe","kaufst","kauft","kaufen","kauft","kaufen"],"Brot"],
 ["nehmen","take",9,["nehme","nimmst","nimmt","nehmen","nehmt","nehmen"],"den Bus"],
 ["gehen","go",12,["gehe","gehst","geht","gehen","geht","gehen"],"ins Kino"],
 ["können","can",12,["kann","kannst","kann","können","könnt","können"],"gut kochen"],
 ["wollen","want",12,["will","willst","will","wollen","wollt","wollen"],"Deutsch lernen"],
 ["sehen","see",13,["sehe","siehst","sieht","sehen","seht","sehen"],"den Film"],
 ["müssen","must",17,["muss","musst","muss","müssen","müsst","müssen"],"zum Arzt gehen"],
 ["dürfen","may",17,["darf","darfst","darf","dürfen","dürft","dürfen"],"hier parken"]];
const QWORDS=[["___ wohnst du? – In Wien.","Wo",2],["___ kommst du? – Aus dem Iran.","Woher",2],["___ heißen Sie? – Raam.","Wie",1],["___ ist das? – Das ist Frau Pichler.","Wer",2],
 ["___ machst du heute? – Ich lerne Deutsch.","Was",4],["___ alt bist du? – Dreißig.","Wie",3],["___ Sprachen sprichst du? – Persisch und Englisch.","Welche",2],["___ wohnen Sie? – In Teheran.","Wo",2],
 ["___ kommen Sie? – Aus Österreich.","Woher",2],["___ kostet das? – Drei Euro.","Wie viel",9],["___ beginnt der Kurs? – Um zehn Uhr.","Wann",10],["___ fährst du? – Nach Graz.","Wohin",16]];
const QW_OPTS=["Wo","Woher","Wohin","Wie","Was","Wer","Wann","Welche","Wie viel"];
const ORDER_BANK=[["Heute lerne ich Deutsch.","Today I am learning German.",4],["Hast du heute Zeit?","Do you have time today?",3],["Wohnst du in Wien?","Do you live in Vienna?",4],
 ["Ich verstehe die Frage nicht.","I don't understand the question.",4],["Sprechen Sie Englisch?","Do you speak English?",4],["Woher kommen Sie?","Where do you come from?",2],
 ["Jetzt wohne ich in Teheran.","Now I live in Tehran.",2],["Wie alt sind Sie?","How old are you?",3],["Am Montag arbeite ich nicht.","On Monday I don't work.",11],["Morgen fahre ich nach Graz.","Tomorrow I'm going to Graz.",6]];
function knownNouns(n){ const out=[]; for(let k=1;k<=n;k++){ const d=S.days[k]; if(d&&!d.synthetic) (d.vocab||[]).forEach(v=>{ if(["der","die","das"].includes(v.article)) out.push(v); }); } return out; }
function drillScreens(n, count){ const r=rng("drill"+n+Date.now()); const out=[]; const lvl=Math.max(1,n);
  const verbs=VERBS.filter(v=>v[2]<=lvl); const mis=(S.st.mistakes||[]); const conjWeak=mis.filter(m=>m.kind==="gap"||m.kind==="translate").length;
  const nConj=Math.round((count||14)*(conjWeak>3?0.45:0.4)), nArt=3, nQ=3, nOrd=Math.max(1,(count||14)-nConj-nArt-nQ);
  for(let i=0;i<nConj&&verbs.length;i++){ const v=pick(verbs,r), pi=Math.floor(r()*6); const comp=Array.isArray(v[4])?v[4][pi]:v[4]; const form=v[3][pi];
    const pron=pi===5&&r()<0.5?"Sie":PRONS[pi]; const prompt=`${capFirst(pron)} ___ ${comp}.`;
    if(i%3===2) out.push({type:"write", h:"Type the right verb form", en:`${prompt} (${v[0]})`, answer:form, q:`${prompt} (${v[0]})`, kind:"conjugation", explain_en:`${pron} ${form} · ${v[0]} = ${v[1]}`});
    else { const others=[...new Set(v[3].filter(f=>f!==form))]; out.push({type:"gap", prompt:prompt+` (${v[0]})`, options:shuffled([form,...shuffled(others,"o"+i+r()).slice(0,3)],"g"+i+r()), answer:form, q:prompt, kind:"conjugation", explain_en:`${pron} → ${form} (${v[0]}: ${v[3].slice(0,3).join(", ")} …)`}); } }
  const nouns=knownNouns(n); const wrongArt=new Set(mis.filter(m=>m.kind==="article"||(m.kind==="write"&&/^(der|die|das) /i.test(m.right||""))).map(m=>String(m.q).replace(/^(der|die|das)\s+/i,"")));
  const pref=nouns.filter(v=>wrongArt.has(v.de)||wrongArt.has(v.en)); const pool=[...shuffled(pref,"p"+n), ...shuffled(nouns,"a"+n+r())];
  const seenN=new Set(); pool.filter(v=>!seenN.has(v.de)&&seenN.add(v.de)).slice(0,nArt).forEach(v=>out.push({type:"article",prompt:v.de,options:["der","die","das"],answer:v.article,q:v.de,kind:"article",explain_en:`${v.article} ${v.de}${v.plural&&v.plural!=="-"?", "+v.plural:""} · ${v.en}`}));
  shuffled(QWORDS.filter(q=>q[2]<=lvl),"q"+n+r()).slice(0,nQ).forEach(([p,a])=>{ const opts=shuffled([a,...shuffled(QW_OPTS.filter(x=>x!==a&&!(a==="Wie"&&x==="Wie viel")),"qo"+p).slice(0,3)],"qs"+p); out.push({type:"gap",prompt:p,options:opts,answer:a,q:p,kind:"question_word",explain_en:a==="Wo"?"wo = where (place) · woher = where from · wohin = where to":a==="Woher"?"woher = where from (origin)":""}); });
  shuffled(ORDER_BANK.filter(o=>o[2]<=lvl),"w"+n+r()).slice(0,nOrd).forEach(([de,en])=>{ const w=de.split(/\s+/); out.push({type:"word_order",words:shuf2(w,"wo"+de+r()),answer:de,q:de,en,kind:"word_order",explain_en:"The verb is always in position 2 in a statement and first in a yes/no question."}); });
  return shuffled(out,"dr"+n+r()); }

/* --- Hör-Trainer: numbers, phone numbers, times, days, prices and spelled names (TTS, generated) --- */
const DAYS_DE=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const SURNAMES=["Gruber","Pichler","Wieser","Huber","Steiner","Moser","Hofer","Bauer","Leitner","Weber","Fuchs","Berger","Novak","Karimi","Rahimi","Schuster"];
const HOURS_DE=["null","eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn","elf","zwölf"];
function hoerScreens(n, count){ const r=rng("hoer"+n+Date.now()); const out=[]; const N=count||12;
  const num=()=>{ const max=n<3?20:n<9?100:1000; const x=Math.floor(r()*(max+1)); out.push({type:"hear",kind:"number",h:"Type the number you hear",say:String(x),answer:String(x),q:"number "+x}); };
  const phone=()=>{ const d=Array.from({length:6},()=>Math.floor(r()*10)).join(""); const pre=pick(["0664","0676","0699","0650"],r);
    const say=`${pre.split("").join(" ")}, ${d.slice(0,2)}, ${d.slice(2,4)}, ${d.slice(4,6)}`; out.push({type:"hear",kind:"phone",h:"Write the phone number",say,answer:`${pre} ${d}`,q:"phone "+pre+" "+d}); };
  const name=()=>{ const w=pick(SURNAMES,r); out.push({type:"spell",word:w,kind:"spelled_name"}); };
  const day=()=>{ const w=pick(DAYS_DE,r); const t=pick([`Der Termin ist am ${w}.`,`Wir treffen uns am ${w}.`,`Am ${w} habe ich Zeit.`,`Der Kurs beginnt am ${w}.`],r); out.push({type:"hear",kind:"day",h:"Which day do you hear?",say:t,answer:w,q:t}); };
  const time=()=>{ const hr=1+Math.floor(r()*12); const half=n>=10&&r()<0.5; const say=half?`um halb ${HOURS_DE[hr===12?12:hr]}`:`um ${hr} Uhr`; const H=half?(hr-1===0?12:hr-1):hr; const ans=`${H}:${half?"30":"00"}`;
    out.push({type:"hear",kind:"time",h:"What time? (for example 10:00)",say:pick([`Der Termin ist ${say}.`,`Kommen Sie bitte ${say}.`,`Der Bus fährt ${say}.`],r),answer:ans,q:"time "+ans,explain_en:half?"halb acht = 7:30 (half before eight)":""}); };
  const price=()=>{ const e=1+Math.floor(r()*20), c=pick([0,20,50,80,90,99],r); const ans=c?`${e},${String(c).padStart(2,"0")}`:`${e}`; out.push({type:"hear",kind:"price",h:"How much? (for example 3,50)",say:c?`${e} Euro ${c}`:`${e} Euro`,answer:ans,q:"price "+ans}); };
  const plan=[num,num,phone,name,day,time,num,phone,name,day]; if(n>=9) plan.push(price,price); if(n>=4) plan.push(time);
  shuffled(plan,"hp"+n+r()).slice(0,N).forEach(f=>f()); return out; }
function hearOk(s, v){ const digits=x=>String(x).replace(/\D/g,"");
  if(s.kind==="number"||s.kind==="phone"||s.kind==="price"){ const a=digits(s.answer), b=digits(v); if(s.kind==="price"){ return b===a||b===digits(s.answer.replace(",",""))||(!s.answer.includes(",")&&b===a+"00"); } return a===b; }
  if(s.kind==="time"){ const t=String(v).replace(/uhr/i,"").trim(); const m=t.match(/^(\d{1,2})(?:[:.](\d{2}))?$/); if(!m) return false; const [h,mi]=s.answer.split(":"); return +m[1]===+h&&(m[2]||"00")===mi; }
  return norm(v)===norm(s.answer); }

/* --- writing tasks for review days (graded by the examiner AI, like Schreiben Teil 2) --- */
const EMAIL_TASKS=[
 {email_from:"Lukas",intro_de:"Lieber Lukas,\nvielen Dank für dein E-Mail.",email_de:"Hallo!\nAm Samstag mache ich eine Party in meiner Wohnung. Kommst du auch? Bitte schreib mir bald.\nViele Grüße\nLukas",task_de:"Antworten Sie Lukas. Schreiben Sie circa 30 Wörter.",task_en:"Reply to Lukas.",points_de:["Danke für die Einladung","Wann kommen Sie?","Was bringen Sie mit?"],model_answer_de:"Hallo Lukas,\ndanke für die Einladung! Ich komme gern. Ich komme am Samstag um acht Uhr. Ich bringe einen Kuchen mit. Bis Samstag!\nLiebe Grüße\nRaam",useful_phrases:["Danke für …","Ich komme gern …","Ich bringe … mit."]},
 {email_from:"Anna",intro_de:"Liebe Anna,\nvielen Dank für dein E-Mail.",email_de:"Liebe Freunde,\nich habe jetzt eine neue Wohnung in Graz! Sie ist klein, aber schön. Besuch mich bald!\nAnna",task_de:"Antworten Sie Anna. Schreiben Sie circa 30 Wörter.",task_en:"Reply to Anna.",points_de:["Gratulieren Sie","Wann können Sie kommen?","Fragen Sie nach der Adresse"],model_answer_de:"Liebe Anna,\nsuper, gratuliere zur neuen Wohnung! Ich kann am Sonntag kommen. Wie ist deine Adresse? Ich freue mich!\nLiebe Grüße\nRaam",useful_phrases:["Gratuliere!","Ich kann am … kommen.","Wie ist deine Adresse?"]},
 {email_from:"Thomas",intro_de:"Lieber Thomas,\nvielen Dank für dein E-Mail.",email_de:"Hallo Raam,\ndu lernst jetzt Deutsch, oder? Wie ist dein Kurs? Erzähl mal!\nThomas",task_de:"Antworten Sie Thomas. Schreiben Sie circa 30 Wörter.",task_en:"Reply to Thomas.",points_de:["Wo ist der Kurs?","Wann lernen Sie?","Wie ist der Lehrer / die Lehrerin?"],model_answer_de:"Hallo Thomas,\nja, ich lerne Deutsch! Der Kurs ist in Teheran. Ich lerne jeden Tag drei Stunden. Die Lehrerin ist sehr nett. Deutsch ist schwer, aber schön!\nViele Grüße\nRaam",useful_phrases:["Der Kurs ist in …","Ich lerne jeden Tag …","Die Lehrerin ist …"]},
 {email_from:"Sarah",intro_de:"Liebe Sarah,\nvielen Dank für dein E-Mail.",email_de:"Hi!\nWas machst du am Wochenende? Ich habe am Samstag Zeit.\nSarah",task_de:"Antworten Sie Sarah. Schreiben Sie circa 30 Wörter.",task_en:"Reply to Sarah.",points_de:["Was machen Sie am Wochenende?","Laden Sie Sarah ins Kino ein","Wann treffen Sie sich?"],model_answer_de:"Hallo Sarah,\nam Samstag lerne ich Deutsch, aber am Abend habe ich Zeit. Gehen wir ins Kino? Wir treffen uns um sieben Uhr am Kino. Bis Samstag!\nLiebe Grüße\nRaam",useful_phrases:["Am Wochenende …","Gehen wir …?","Wir treffen uns um …"]},
 {email_from:"Peter",intro_de:"Lieber Peter,\nvielen Dank für dein E-Mail.",email_de:"Hallo!\nAm Freitag habe ich Geburtstag und mache ein Fest. Kommst du?\nPeter",task_de:"Antworten Sie Peter. Schreiben Sie circa 30 Wörter.",task_en:"Reply to Peter.",points_de:["Gratulieren Sie zum Geburtstag","Sie können nicht kommen – warum?","Schlagen Sie einen anderen Tag vor"],model_answer_de:"Lieber Peter,\nalles Gute zum Geburtstag! Leider kann ich am Freitag nicht kommen, ich arbeite bis zehn Uhr. Hast du am Samstag Zeit? Dann trinken wir einen Kaffee.\nLiebe Grüße\nRaam",useful_phrases:["Alles Gute zum Geburtstag!","Leider kann ich nicht …","Hast du am … Zeit?"]},
 {email_from:"Maria",intro_de:"Liebe Maria,\nvielen Dank für dein E-Mail.",email_de:"Hallo Raam,\nim Dezember besuche ich Teheran! Was kann ich dort machen?\nMaria",task_de:"Antworten Sie Maria. Schreiben Sie circa 30 Wörter.",task_en:"Reply to Maria.",points_de:["Freuen Sie sich","Was kann Maria in Teheran sehen?","Geben Sie Ihre Telefonnummer"],model_answer_de:"Hallo Maria,\ntoll, ich freue mich! In Teheran kannst du den Basar und die Berge sehen. Das Essen ist sehr gut. Meine Telefonnummer ist 0912 345 6789. Ruf mich an!\nLiebe Grüße\nRaam",useful_phrases:["Ich freue mich!","Du kannst … sehen.","Meine Telefonnummer ist …"]}];

/* --- review, buffer, mock and rest days build themselves from earlier days --- */
function learnedBefore(n){ const out={vocab:[],phrases:[],ex:[],quiz:[]}; for(let k=1;k<n;k++){ const d=S.days[k]; if(!d||d.synthetic) continue;
  (d.vocab||[]).forEach(v=>out.vocab.push(v)); (d.phrases||[]).forEach(x=>out.phrases.push(x)); (d.exercises||[]).forEach(e=>out.ex.push(e));
  (d.review_quiz||[]).forEach(q=>out.quiz.push({type:"mcq",prompt:q.q,options:q.options,answer:q.answer,explain_en:q.explain_en,explain_fa:q.explain_fa})); } return out; }
async function buildSynthetic(n){ for(let k=1;k<n;k++) await getDay(k); const p=PLAN[n-1], t=p.t.toLowerCase(); const d={synthetic:true, day:n, title:p.t, title_fa:p.fa};
  if(p.k==="rest"||p.k==="mock") return d;
  const src=[]; for(let k=1;k<n;k++){ const x=S.days[k]; if(x&&!x.synthetic) src.push(k); }
  const withH=src.filter(k=>S.days[k].hoeren), withL=src.filter(k=>S.days[k].lesen);
  if(withH.length&&!/lesen \+ hören|schreiben|sprechen/.test(t)||/hören/.test(t)&&withH.length){ const m=withH[hashStr("h"+n)%withH.length]; d.hoeren=JSON.parse(JSON.stringify(S.days[m].hoeren)); d.hoerenFrom=m; }
  if(/lesen/.test(t)&&withL.length){ const m=withL[hashStr("l"+n)%withL.length]; d.lesen=JSON.parse(JSON.stringify(S.days[m].lesen)); d.lesenFrom=m; }
  const dk_=src.flatMap(k=>S.days[k].diktat||[]); if(dk_.length) d.diktat=shuffled(dk_,"dk"+n).slice(0,6);
  if(/schreiben|bootcamp|buffer|fix/.test(t)||p.k==="review"&&n%3===0){ d.schreiben={teil2:Object.assign({word_target:30},EMAIL_TASKS[n%EMAIL_TASKS.length])}; }
  if(/hören/.test(t)){ const off=await officialPractice(n); if(off){ d.hoeren=JSON.parse(JSON.stringify(off.hoeren)); d.set=off.set; d.hoerenFrom="ÖSD"; } }
  return d; }
function synthNodes(n,d){ const p=PLAN[n-1], t=p.t.toLowerCase(), H=dayHours()/3; const N=[];
  const add=(step,title,icon,min,desc,kind,extra)=>N.push(Object.assign({step,part:0,parts:1,title,icon,min:Math.max(3,Math.round(min*H)),desc,kind},extra||{}));
  add("review","Review cards","review",p.k==="rest"?10:20,[NODE_INFO.review[1],NODE_INFO.review[2]],"review");
  if(p.k==="rest"){ add("blitz","Wörter-Blitz","bolt",5,["One quick round, then rest.","یک دور سریع، بعد استراحت."],"blitz"); return N; }
  if(p.k==="mock"){ const m=MOCKS.find(x=>x.day===n)||MOCKS.find(x=>x.id==="ta"); add("mock",m.short,"exam",120,[m.how,""],"mock",{mock:m.id}); add("tutor","Tutor: oral exam","mic",25,["A full oral exam simulation with score.","شبیه‌سازی کامل آزمون شفاهی با نمره."],"tutor",{mode:"exam"}); return N; }
  const sp=/sprechen/.test(t), hoer=/hören/.test(t), gram=/grammar/.test(t), vocab=/vocabulary|sweep/.test(t);
  if(/mini-test/.test(t)) add("minitest","Mini-test","trophy",20,["20 exam-style questions on everything so far. No hints.","۲۰ سؤال به سبک آزمون از همه مطالب. بدون راهنما."],"lesson");
  add("mix","Mixed review","star",15,["Questions from all earlier days, mixed.","سؤال‌های ترکیبی از همه روزهای قبل."],"lesson");
  add("words","Words recall","book",vocab?30:15,["Write and recognise earlier words from memory.","لغات قبلی را از حفظ بنویس و تشخیص بده."],"lesson");
  add("drill","Grammar gym","bulb",gram?30:15,[NODE_INFO.drill[1],NODE_INFO.drill[2]],"lesson");
  add("hoertrainer","Hör-Trainer","headph",hoer?20:10,[NODE_INFO.hoertrainer[1],NODE_INFO.hoertrainer[2]],"lesson");
  if(d.hoeren) add("hoeren",d.hoerenFrom==="ÖSD"?"Hören · real ÖSD audio":`Hören (from Day ${d.hoerenFrom})`,"headph",20,d.hoerenFrom==="ÖSD"?["The official model test recordings again: first at exam speed, then slowly with the transcript.","فایل‌های صوتی نمونه آزمون رسمی، دوباره: اول با سرعت آزمون، بعد آهسته با متن."]:["The listening tasks of an earlier day, again. Use the slow button if you need it.","تمرین شنیدن یک روز قبل، دوباره."],"task");
  if(d.diktat) add("diktat","Dictation","pencil",10,[NODE_INFO.diktat[1],NODE_INFO.diktat[2]],"lesson");
  if(d.lesen) add("lesen",`Lesen (from Day ${d.lesenFrom})`,"bookopen",15,[NODE_INFO.lesen[1],NODE_INFO.lesen[2]],"task");
  if(d.schreiben) add("schreiben","Email practice","mail",20,["Write a 30-word email; the examiner AI grades it.","یک ایمیل ۳۰ کلمه‌ای بنویس؛ هوش مصنوعی نمره می‌دهد."],"task");
  if(/schreiben|email/.test(t)&&eyeData()) add("eye","Examiner's eye","pencil",10,["Mark real A1 learner emails with the official criteria.","ایمیل‌های واقعی داوطلبان A1 را با معیارهای رسمی نمره بده."],"eye");
  if((S.st.mistakes||[]).some(m=>m.q&&m.right)) add("repair","Repair lesson","pencil",15,["Your recent mistakes, asked again.","اشتباهات اخیرت، دوباره."],"lesson");
  add("blitz","Wörter-Blitz","bolt",5,["60 seconds, as many words as you can.","۶۰ ثانیه، هر چند کلمه که می‌توانی."],"blitz");
  add("tutor",sp?"Tutor: oral exam":"Tutor session","mic",sp?30:25,[NODE_INFO.tutor[1],NODE_INFO.tutor[2]],"tutor",sp?{mode:"exam"}:{});
  return N; }
function wordsRecallScreens(n, count){ const L=learnedBefore(n); const V=L.vocab, P=L.phrases; if(V.length<4) return []; const seed="wr"+n+Date.now(); const full=V.map(vfull); const out=[];
  shuffled(V,seed+"w").slice(0,5).forEach(v=>out.push(writeScreen(v)));
  shuffled(V,seed+"r").slice(0,4).forEach((v,j)=>out.push({type:"reverse",en:v.en,fa:v.fa,options:opts(vfull(v),full,4,seed+"R"+j),answer:vfull(v),q:v.en,sayOpts:true}));
  shuffled(V.filter(v=>["der","die","das"].includes(v.article)),seed+"a").slice(0,3).forEach(v=>out.push({type:"article",prompt:v.de,options:["der","die","das"],answer:v.article,q:v.de,kind:"article"}));
  shuffled(V,seed+"l").slice(0,2).forEach((v,j)=>out.push({type:"listen",prompt:"What do you hear?",say:vfull(v),options:opts(vfull(v),full,4,seed+"L"+j),answer:vfull(v),noLog:true}));
  if(P.length>=4) shuffled(P,seed+"p").slice(0,3).forEach((x,j)=>out.push({type:"mcq",h:"What do you say?",prompt:x.en,options:opts(x.de,P.map(y=>y.de),3,seed+"P"+j),answer:x.de,q:x.en}));
  return shuffled(out,seed).slice(0,count||17); }
function mixScreens(n, count){ const L=learnedBefore(n); const items=[...L.ex,...L.quiz]; const seed="mx"+n+Date.now(); return shuffled(items,seed).slice(0,count||15).map((it,i)=>exScreen(it,seed+i)); }
function recentMistakes(days){ const since=Date.now()-days*DAY_MS; return (S.st.mistakes||[]).filter(m=>m.q&&m.right&&(m.at||0)>=since); }

function synthIntro(n,d){ const p=PLAN[n-1]; const learned=[]; for(let k=1;k<n;k++){ const x=S.days[k]; if(x&&!x.synthetic) learned.push(k); }
  const txt = p.k==="rest" ? ex("Rest day. One short card review and a Blitz round keep the words warm. Nothing else today.","روز استراحت. یک مرور کوتاه کارت‌ها و یک دور Blitz کافی است.")
    : p.k==="mock" ? ex("Mock exam day: do the whole exam with the timers, in one sitting, like the real thing. Then let the tutor test your speaking.","روز آزمون آزمایشی: کل آزمون را با زمان‌سنج و یک‌جا انجام بده، مثل آزمون واقعی. بعد مربی صحبت کردنت را می‌سنجد.")
    : ex(`This day builds itself from what you've already studied${learned.length?` (Days ${learned[0]}–${learned[learned.length-1]})`:""} and from your own mistakes. Every lesson is new each time you open it.`,`این روز از درس‌هایی که خوانده‌ای و از اشتباهات خودت ساخته می‌شود. هر بار که درسی را باز کنی، سؤال‌ها تازه‌اند.`);
  return `<section class="card row" style="flex-wrap:nowrap;gap:12px"><div style="color:var(--blue);flex:none">${ICONS[p.k==="mock"?"exam":p.k==="rest"?"cup":"review"].replace('<svg','<svg width="30" height="30"')}</div><div class="small">${txt}</div></section>`; }
/* --- comeback mode and replanning --- */
function studyGap(){ const set=studyDates(); const t=todayMid(); for(let i=0;i<200;i++){ const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); if(set.has(sdKey(d))) return i; } return null; }
// After 3+ days away, the first day back becomes the restart day: the plan moves so today is the first unfinished day.
async function detectComeback(){ const g=studyGap(); const today=dk(new Date()); if(g==null||g<3||(S.st.comeback&&S.st.comeback.date===today)) return;
  S.st.comeback={date:today, gap:g}; const cur=currentDay();
  for(let k=1;k<cur;k++) await getDay(k);
  const fu=firstUnfinished(cur); if(fu&&fu<cur&&untouched(fu)){ S.st.anchor={n:fu, date:today}; S.st.comeback.resumed=fu; schedule._k=null; S.dayN=currentDay(); }
  save(); }
function rustScreens(n){ const out=[]; const L=learnedBefore(n); if(!L.vocab.length) return [];
  out.push(...wordsRecallScreens(n,7)); out.push(...drillScreens(Math.max(1,n-1),5)); out.push(...hoerScreens(n,3));
  shuffled(L.quiz,"rq"+n).slice(0,3).forEach((q,i)=>out.push(exScreen(q,"rq"+n+i))); return out; }
function comebackCard(n){ const C=S.st.comeback; const today=dk(new Date()); if(!C||C.date!==today||C.done||C.skip) return "";
  const c=srsCounts();
  return `<section class="card stack comeback"><div class="edi-row">${edi(76,"happy")}<div class="speech"><b>Willkommen zurück!</b><span>${ex(`You were away ${C.gap} days. That's okay: nothing is lost. Today is your restart day${C.resumed?`: the plan now continues with Day ${C.resumed}, and the exam date stays the same`:""}. Start with a 10-minute rust check, then continue with today's day.`,`${C.gap} روز نبودی. اشکالی ندارد: چیزی از دست نرفته. امروز روز شروع دوباره است${C.resumed?`: برنامه از روز ${C.resumed} ادامه پیدا می‌کند و تاریخ آزمون عوض نمی‌شود`:""}. با یک بازبینی ۱۰ دقیقه‌ای شروع کن، بعد درس امروز را ادامه بده.`)}</span></div></div>
    <div class="stack" style="gap:6px"><div class="row" style="flex-wrap:nowrap"><span class="chip acc">1</span><span class="grow"><b>Rust check</b> · 15 quick questions from earlier days</span></div>
      <div class="row" style="flex-wrap:nowrap"><span class="chip acc">2</span><span class="grow"><b>Review cards</b> · ${c.due} due after your break</span></div>
      <div class="row" style="flex-wrap:nowrap"><span class="chip acc">3</span><span class="grow"><b>Day ${n}</b> · today's path below</span></div></div>
    <div class="row"><button class="btn primary" data-act="rust-start" data-n="${n}">Start the rust check</button><button class="btn ghost" data-act="rust-skip">Skip</button></div></section>`; }
function firstUnfinished(upTo){ for(let k=1;k<upTo;k++){ const d=S.days[k]; if(!d) return null; if(!dayAllDone(k)) return k; } return null; }
function untouched(k){ return !Object.keys(S.st.done).some(x=>x.startsWith(k+":")&&!/:(brk|chk|recap)/.test(x)); }
function replanCard(n){ if(n!==currentDay()) return ""; const fu=firstUnfinished(n); if(!fu||S.st.replanDismiss===dk(new Date())) return ""; if(n-fu<2&&!untouched(fu)) return "";
  return `<div class="banner info"><div class="grow"><b>${ex(`Day ${fu} isn't finished yet.`,`روز ${fu} هنوز تمام نشده.`)}</b><div class="small">${ex(`Move your plan so today is Day ${fu}? Buffer days at the end are used up first, so the exam date doesn't change.`,`برنامه را جابه‌جا کنم تا امروز روز ${fu} باشد؟ اول روزهای جبرانی آخر برنامه استفاده می‌شوند.`)}</div>
    <div class="row" style="margin-top:8px"><button class="btn primary sm" data-act="replan" data-n="${fu}">Move my plan</button><button class="btn sm" data-act="replan-no">Not now</button></div></div></div>`; }
async function migratePlan(){ if((S.st.planV||1)>=2) return; S.st.exam=S.st.exam||DEFAULT_EXAM; S.st.dayHours=S.st.dayHours||3;
  for(let n=1;n<=8;n++) await getDay(n);
  for(let n=1;n<=PLAN.length;n++){ const d=S.days[n]; if(!d||d.synthetic) continue; const old=STEPS.filter(s=>!["drill","hoertrainer","tutor"].includes(s.id)&&s.has(d));
    if(old.length&&old.every(s=>S.st.done[n+":"+s.id])){ const ts=S.st.done[n+":quiz"]||S.st.done[n+":"+old[old.length-1].id]; ["drill","hoertrainer","tutor"].forEach(k=>{ if(!S.st.done[n+":"+k]) S.st.done[n+":"+k]=ts; }); } }
  let fu=1; while(fu<PLAN.length&&S.days[fu]&&dayAllDone(fu)) fu++;
  if(fu>1&&dateOf(fu)<todayMid()) S.st.anchor={n:fu, date:dk(new Date())};
  S.st.planV=2; schedule._k=null; S.dayN=currentDay(); save(); }

/* ====================== v11: official ÖSD Modellsätze with real audio, official marking, examiner's eye ====================== */
// Official ÖSD content (texts, keys, learner samples) lives only in the private `library` table of the user's account,
// and the recordings and pictures only in the user's private storage folder, imported from the ZIP files they downloaded.
const OFF_SETS={za1:{title:"ÖSD Zertifikat A1 · Modellsatz", short:"ZA1", mock:"m1"}, za1oe:{title:"ÖSD Zertifikat A1/Österreich · Modellsatz", short:"ZA1/Ö", mock:"m2"}};
S.keep={}; document.addEventListener("toggle", e=>{ const t=e.target; if(t&&t.dataset&&t.dataset.keep) S.keep[t.dataset.keep]=t.open; }, true);
S.lib={}; S.offMedia={}; S.offUrls={}; S.offAudio=null; S.offImport=null; S.trOpen={}; S.trBusy=null; S.eye=null; S.vidOn=false; S.examCtx=null;
try{ S.lib=JSON.parse(lsGet("osd-a1-lib")||"{}")||{}; }catch(e){ S.lib={}; }
async function pullLibrary(){ if(!S.uid) return; try{ const r=await sb.from("library").select("key,content"); if(!r.error){ S.lib={}; (r.data||[]).forEach(x=>{ S.lib[x.key]=x.content; }); lsSet("osd-a1-lib", JSON.stringify(S.lib)); } }catch(e){} }
function offData(set){ return S.lib["official:"+set]||null; }
function offDir(set){ return `${S.uid}/official/${set}`; }
async function offStatus(set, force){ if(!S.uid) return {audio:0,img:0,files:[],imgs:[]}; const c=S.offMedia[set]; if(c&&!force&&Date.now()-c.at<5*60000) return c;
  try{ const a=await sb.storage.from("media").list(offDir(set),{limit:50}); const i=await sb.storage.from("media").list(offDir(set)+"/img",{limit:50});
    const files=((a&&a.data)||[]).filter(f=>f.id).map(f=>f.name), imgs=((i&&i.data)||[]).filter(f=>f.id).map(f=>f.name);
    S.offMedia[set]={at:Date.now(), audio:["A1","A2","A3"].filter(k=>files.includes(k+".mp3")).length, img:imgs.length, files, imgs}; }
  catch(e){ S.offMedia[set]={at:Date.now(), audio:0, img:0, files:[], imgs:[]}; }
  return S.offMedia[set]; }
function offReady(set){ const m=S.offMedia[set]; return !!(offData(set)&&m&&m.audio===3&&m.img>=15); }
async function offUrls(set){ const c=S.offUrls[set]; if(c&&Date.now()-c.at<5*3600e3) return c.map;
  const st=await offStatus(set); const paths=[...(st.files||[]).filter(f=>/\.mp3$/.test(f)).map(f=>offDir(set)+"/"+f), ...(st.imgs||[]).map(f=>offDir(set)+"/img/"+f)];
  const map={}; if(paths.length){ try{ const r=await sb.storage.from("media").createSignedUrls(paths, 6*3600); ((r&&r.data)||[]).forEach((x,i)=>{ if(x&&x.signedUrl) map[paths[i].split("/").pop().replace(/\.(mp3|jpg)$/,"")]=x.signedUrl; }); }catch(e){} }
  S.offUrls[set]={at:Date.now(), map}; return map; }
function offUrl(set,key){ const c=S.offUrls[set]; return (c&&c.map[key])||""; }

/* importing the ZIP files: MP3s are uploaded as they are; the pictures are cut out of the Modellsatz PDF */
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=()=>rej(new Error("Couldn't load a helper library. Check your connection.")); document.head.appendChild(s); }); }
async function loadPdfjs(){ if(!window.pdfjsLib){ await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"); window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; } return window.pdfjsLib; }
function offFromName(name){ const m=String(name).match(/_A([123])_(\d{6})/); if(!m) return null;
  for(const k of Object.keys(OFF_SETS)){ const D=offData(k); if(D&&(D.audio_codes||[]).includes(m[2])) return {set:k, part:"A"+m[1]}; }
  return m[2]==="060917"?{set:"za1",part:"A"+m[1]}:m[2]==="150917"?{set:"za1oe",part:"A"+m[1]}:null; }
async function importOfficial(fileList){
  if(!S.uid){ toast("Sign in first"); return; }
  const P=S.offImport={msg:"Reading the files…", done:[], err:""}; render();
  try{
    const groups=[];
    for(const f of fileList){ const buf=new Uint8Array(await f.arrayBuffer());
      if(/\.zip$/i.test(f.name)){ P.msg="Unpacking "+f.name+"…"; render(); const { unzipSync }=await import("https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js");
        const ent=unzipSync(buf,{filter:x=>!/(^|\/)(__MACOSX|\._)/.test(x.name)&&/\.(mp3|pdf)$/i.test(x.name)});
        groups.push({mp3:Object.entries(ent).filter(([n])=>/\.mp3$/i.test(n)).map(([name,data])=>({name,data})), pdf:Object.entries(ent).filter(([n])=>/\.pdf$/i.test(n)).map(([name,data])=>({name,data}))}); }
      else if(/\.mp3$/i.test(f.name)) groups.push({mp3:[{name:f.name,data:buf}], pdf:[]});
      else if(/\.pdf$/i.test(f.name)) groups.push({mp3:[], pdf:[{name:f.name,data:buf}]}); }
    for(const g of groups){ let set=null;
      for(const a of g.mp3){ const s=offFromName(a.name); if(!s) continue; set=s.set; P.msg=`Uploading ${OFF_SETS[s.set].short} · audio ${s.part}…`; render();
        const {error}=await sb.storage.from("media").upload(`${offDir(s.set)}/${s.part}.mp3`, new Blob([a.data],{type:"audio/mpeg"}), {upsert:true, contentType:"audio/mpeg"}); if(error) throw error; P.done.push(OFF_SETS[s.set].short+" audio "+s.part); }
      for(const p of g.pdf){ if(!/modellsatz|ms_hp|za1/i.test(p.name)) continue; const ps=set||(/Ö|Oe|Österreich|Ã|_oe/i.test(p.name)?"za1oe":"za1"); P.msg=`Cutting the pictures out of the ${OFF_SETS[ps].short} PDF…`; render(); await cropOfficialPdf(ps, p.data); P.done.push(OFF_SETS[ps].short+" pictures"); } }
    Object.keys(OFF_SETS).forEach(k=>{ delete S.offUrls[k]; });
    for(const k of Object.keys(OFF_SETS)) await offStatus(k,true);
    P.msg=P.done.length?"Done.":"No ÖSD Modellsatz files found in what you chose.";
  }catch(e){ P.err=e.message||String(e); P.msg=""; }
  render(); }
async function cropOfficialPdf(set, data){ const D=offData(set); const C=D&&D.crops; if(!C) throw new Error("The test content isn't loaded yet. Reload the app and try again.");
  const lib=await loadPdfjs(); const pdf=await lib.getDocument({data}).promise;
  for(const [key,spec] of Object.entries(C)){ if(!spec||!spec.page) continue;
    const page=await pdf.getPage(spec.page); const vp1=page.getViewport({scale:1}); const vp=page.getViewport({scale:C.page_w/vp1.width});
    const cv=document.createElement("canvas"); cv.width=Math.round(vp.width); cv.height=Math.round(vp.height); await page.render({canvasContext:cv.getContext("2d"), viewport:vp}).promise;
    for(let i=0;i<spec.boxes.length;i++){ const [x0,y0,x1,y1]=spec.boxes[i]; const w=x1-x0, h=y1-y0, k=Math.min(1,640/w); const out=document.createElement("canvas"); out.width=Math.round(w*k); out.height=Math.round(h*k);
      const ctx=out.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,out.width,out.height); ctx.drawImage(cv,x0,y0,w,h,0,0,out.width,out.height);
      const blob=await new Promise(r=>out.toBlob(r,"image/jpeg",0.82)); const {error}=await sb.storage.from("media").upload(`${offDir(set)}/img/${key}_${i+1}.jpg`, blob, {upsert:true, contentType:"image/jpeg"}); if(error) throw error; } } }
function officialCard(){ if(!S.uid) return ""; const sets=Object.keys(OFF_SETS); if(!sets.some(k=>offData(k))) return ""; const P=S.offImport;
  sets.forEach(k=>{ if(!S.offMedia[k]&&!S.offMedia["_l"+k]){ S.offMedia["_l"+k]=1; offStatus(k).then(()=>{ delete S.offMedia["_l"+k]; if(S.view==="exam"&&!S.mock) render(); }); } });
  const all=sets.every(offReady), busy=P&&P.msg&&P.msg!=="Done."&&!P.err&&!/^No /.test(P.msg);
  return `<section class="card stack"><div class="label">Official ÖSD model tests</div><h2>Real exam papers, real audio</h2>
    <p class="small">${ex("Mock 1 and Mock 2 use the two official model tests you downloaded: the real texts, pictures and recordings, marked with the official answer key and point tables. The files stay private in your account.","آزمون ۱ و ۲ از دو نمونه آزمون رسمی که دانلود کردی استفاده می‌کنند: متن‌ها، تصاویر و فایل‌های صوتی واقعی، با کلید و جدول نمره رسمی. فایل‌ها خصوصی در حساب تو می‌مانند.")}</p>
    ${sets.map(k=>{ const m=S.offMedia[k]||{}, ok=offReady(k); return `<div class="row between" style="flex-wrap:nowrap;gap:10px"><div style="min-width:0"><b>${esc(OFF_SETS[k].title)}</b><div class="small muted">${!offData(k)?"content not loaded":ok?"ready · real audio and pictures":`audio ${m.audio||0}/3 · pictures ${m.img||0}/15`}</div></div><span class="chip ${ok?"ok":"warn"}">${ok?"Ready":"Needs files"}</span></div>`; }).join("")}
    ${all?"":`<p class="small">${ex("Once only: choose the ZIP files you downloaded from osd.at (ZA1_Modellsatz.zip and ZA1-Oe-Modellsatz-HP.zip). The app uploads the MP3s to your private folder and cuts the pictures out of the PDF.","فقط یک بار: فایل‌های ZIP را که از osd.at دانلود کردی انتخاب کن. اپ فایل‌های صوتی را در پوشه خصوصی‌ات آپلود و تصاویر را از PDF جدا می‌کند.")}</p>`}
    <label class="btn ${all?"":"primary"}" style="align-self:flex-start">${busy?esc(P.msg):all?"Replace the files":"Add the ZIP files"}<input type="file" multiple accept=".zip,.mp3,.pdf,application/zip,audio/mpeg,application/pdf" data-offimport="1" hidden ${busy?"disabled":""}></label>
    ${P&&P.done&&P.done.length?`<div class="small" style="color:var(--ok)">✓ ${esc(P.done.join(" · "))}</div>`:""}${P&&P.err?`<div class="small" style="color:var(--bad)">${esc(P.err)}</div>`:""}${P&&/^No /.test(P.msg||"")?`<div class="small" style="color:var(--bad)">${esc(P.msg)}</div>`:""}
  </section>`; }

/* the real recordings: once in exam mode (the file contains the instructions, pauses and Teil 2 repetition), freely afterwards */
function offPlayer(g, set, key){ const url=offUrl(set,key); const chk=S.checked[g]; const oneShot=(S.st.strict||isTest(g))&&!chk; const pk=g+"|off"; const used=S.plays[pk]||0;
  if(!url) return `<div class="banner"><div>${ex("The recording isn't added yet: add the official ZIP files in the Exam tab.","فایل صوتی هنوز اضافه نشده: فایل‌های ZIP رسمی را در تب Exam اضافه کن.")}</div></div>`;
  if(oneShot){ const playing=S.offAudio&&S.offAudio.g===g&&!S.offAudio.ended;
    return `<div class="stack" style="gap:6px"><div class="row"><button class="btn sm ${used?"":"primary"}" data-act="offplay" data-g="${attr(g)}" data-set="${set}" data-key="${key}" ${used?"disabled":""}>${ICONS.play}${playing?"Playing…":used?"Played":"Play the recording"}</button><span class="small tnum muted" id="offT">${playing?"":""}</span></div>
      <p class="small muted">${ex("Real ÖSD recording with the instructions and pauses. It plays once, like in the exam (Teil 2 repeats inside the recording).","فایل صوتی واقعی ÖSD همراه با دستورالعمل‌ها و مکث‌ها. مثل آزمون یک بار پخش می‌شود (بخش ۲ داخل فایل تکرار می‌شود).")}</p></div>`; }
  const tk=`transcript:${set}:${key}`, T=S.lib[tk], open=S.trOpen[g];
  return `<div class="stack offplayer" style="gap:6px"><audio controls preload="none" src="${attr(url)}" style="width:100%"></audio>
    <div class="row">${[0.75,0.9,1].map(r=>`<button class="opt" data-act="offrate" data-r="${r}">${r}×</button>`).join("")}<button class="btn sm" data-act="offtr" data-g="${attr(g)}" data-set="${set}" data-key="${key}" ${S.trBusy===tk?"disabled":""}>${S.trBusy===tk?"Writing the transcript…":open?"Hide transcript":"Transcript"}</button></div>
    ${open&&T?trHtml(T):""}</div>`; }
function trSec(t){ const m=String(t||"").match(/(\d+):(\d{2})/); return m?(+m[1])*60+(+m[2]):null; }
function trHtml(T){ return `<div class="sunk stack transcript" style="gap:8px"><div class="small muted">${ex("Transcript made by Gemini from the recording; small errors are possible. Tap a time to jump there.","متن را Gemini از روی فایل نوشته؛ ممکن است اشتباه کوچکی داشته باشد. روی زمان بزن تا به آن‌جا بروی.")}</div>
  ${(T.segments||[]).map(s=>`<div class="stack" style="gap:4px"><div class="label">${esc(s.label||"")}</div>${(s.lines||[]).map(l=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:8px">${trSec(l.t)!=null?`<button class="opt tnum" data-act="offseek" data-s="${trSec(l.t)}" style="flex:none;padding:2px 8px">${esc(l.t)}</button>`:""}<div><b>${l.speaker?esc(l.speaker)+": ":""}</b>${esc(l.de||"")}${l.en?`<br><span class="small muted">${esc(l.en)}</span>`:""}</div></div>`).join("")}</div>`).join("")}</div>`; }
async function offTranscript(set,key,g){ const k=`transcript:${set}:${key}`; if(S.lib[k]){ S.trOpen[g]=!S.trOpen[g]; render(); return; }
  if(!S.ai){ toast("Transcripts need the Gemini key on the server"); return; }
  S.trBusy=k; render();
  try{ const map=await offUrls(set); const r=await api("/api/ai",{mode:"transcribe", payload:{url:map[key], part:key}}); const c=r.result; if(!c||!c.segments) throw new Error("empty transcript");
    S.lib[k]=c; lsSet("osd-a1-lib", JSON.stringify(S.lib)); S.trOpen[g]=true;
    try{ await sb.from("library").upsert({user_id:S.uid, key:k, content:c, updated_at:new Date().toISOString()}); }catch(e){} }
  catch(e){ toast("Couldn't make the transcript: "+e.message); }
  S.trBusy=null; render(); }
function offPlay(b){ const g=b.dataset.g, url=offUrl(b.dataset.set,b.dataset.key); if(!url) return; const pk=g+"|off"; if((S.plays[pk]||0)>=1) return;
  stopSpeech(); if(S.offAudio&&S.offAudio.el){ try{ S.offAudio.el.pause(); }catch(e){} }
  const el=new Audio(url); const A=S.offAudio={g, el, ended:false}; S.plays[pk]=1;
  el.ontimeupdate=()=>{ const t=$("#offT"); if(t&&S.offAudio===A) t.textContent=`${fmtMs(el.currentTime*1000)} / ${isFinite(el.duration)?fmtMs(el.duration*1000):"…"}`; };
  el.onended=()=>{ A.ended=true; if(S.offAudio===A) render(); };
  el.onerror=()=>{ A.ended=true; S.plays[pk]=0; toast("The recording couldn't be played. Check your connection and try again."); render(); };
  el.play().catch(()=>{ A.ended=true; S.plays[pk]=0; render(); }); render(); }
function stopOffAudio(){ if(S.offAudio&&S.offAudio.el){ try{ S.offAudio.el.pause(); }catch(e){} } S.offAudio=null; }
function picImg(p,set){ const u=p.img&&set?offUrl(set,p.img):""; return u?`<img src="${attr(u)}" alt="${attr(p.label_en||"")}" class="picimg">`:""; }

/* official marking helpers (Modellsatz rules) */
function lev(a,b){ a=String(a); b=String(b); const m=a.length, n=b.length; if(!m) return n; if(!n) return m; let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){ const cur=[i]; for(let j=1;j<=n;j++) cur[j]=Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+(a[i-1]===b[j-1]?0:1)); prev=cur; } return prev[n]; }
function closeEnough(a,b){ const x=norm(a), y=norm(b); if(!x||!y) return false; if(x===y) return true; return x.length>=4 && lev(x,y)<=Math.max(1,Math.floor(x.length/5)); }
const MONTHS_DE=["jän|jan","feb","mär|mar|maer","apr","mai|may","jun","jul","aug","sep","okt|oct","nov","dez|dec"];
function dateMatch(v, dmy){ const s=String(v||"").trim().toLowerCase(); if(!s||!dmy) return false;
  let m=s.match(/^(\d{1,2})\s*[.\-\/ ]\s*(\d{1,2})\s*[.\-\/ ]\s*(\d{2}|\d{4})$/); if(m){ let y=+m[3]; if(y<100) y+=1900; return +m[1]===dmy[0]&&+m[2]===dmy[1]&&y===dmy[2]; }
  m=s.match(/^(\d{1,2})\.?\s*([a-zäöü]+)\.?\s*(\d{4})$/); if(m){ const mi=MONTHS_DE.findIndex(p=>new RegExp("^("+p+")").test(m[2])); return +m[1]===dmy[0]&&mi+1===dmy[1]&&+m[3]===dmy[2]; }
  return false; }
function textOk(f,v){ const s=String(v||"").trim(); if(!s) return false; const acc=f.accept&&f.accept.length?f.accept:[f.answer];
  if(f.check==="date") return dateMatch(s, f.date);
  if(f.strict) return acc.some(a=>String(a).toLowerCase().replace(/\s+/g," ").trim()===s.toLowerCase().replace(/\s+/g," "));
  if(acc.some(a=>norm(a)===norm(s))) return true;
  return !!f.loose && acc.some(a=>closeEnough(a,s)); }
function formMax(f){ return f.type==="given"?0:(f.pts||1); }
function formPts(f,v){ if(f.type==="given") return 0; const max=formMax(f);
  if(f.type==="multi"){ const sel=v||[], ans=f.answer||[]; if(!sel.length||sel.some(x=>!ans.includes(x))) return 0; return max===1?(sel.length===ans.length?1:0):Math.min(max, sel.length); }
  if(f.type==="choice") return v===f.answer?max:0;
  return textOk(f,v)?max:0; }
function formOk(f,v){ return formPts(f,v)===formMax(f); }
function taskPts(sc,total){ return total===6?PLA2(sc):total===5?P5(sc):null; }

/* examiner's eye: real learner emails from the ÖSD Mustertexte, judged with the official criteria */
function eyeData(){ return S.lib["official:muster"]||null; }
function eyeUnlocked(x){ return !x.after||!!S.st.mocks[x.after]; }
function eyeCard(){ const E=eyeData(); if(!E) return ""; const done=S.st.eye||{};
  return `<section class="card stack"><div class="label">Schreiben · examiner's eye</div><h2>Mark real learner emails</h2>
    <p class="small">${ex("Five real emails written by A1 candidates (from the ÖSD Mustertexte). Decide which questions were answered and how many points it gets, then compare with the official criteria. This is the fastest way to learn what examiners reward.","پنج ایمیل واقعی از داوطلبان A1 (از نمونه‌نوشته‌های ÖSD). تشخیص بده به کدام سؤال‌ها جواب داده شده و چند نمره می‌گیرد، بعد با معیارهای رسمی مقایسه کن.")}</p>
    <div class="row">${E.items.map((x,i)=>{ const ok=eyeUnlocked(x); return `<button class="opt ${done[x.id]?"sel":""}" data-act="eye-open" data-i="${i}" ${ok?"":"disabled"} title="${ok?"":"Unlocks after Mock 1 (same task)"}">E-Mail ${esc(x.id)}${done[x.id]?" ✓":ok?"":" · after Mock 1"}</button>`; }).join("")}</div></section>`; }
function vEye(){ const E=eyeData(), X=S.eye, x=E.items[X.i], T=E.tasks[x.task]||{}; const rev=X.step==="reveal";
  const qs=(T.questions||[]).map((q,qi)=>{ const pick=X.picks[qi]; const truth=x.answered[qi]; let cls=""; if(rev) cls=pick===truth?"right":"wrong";
    return `<div class="row" style="flex-wrap:nowrap;gap:8px"><div class="grow">${esc(q)}</div>${["answered","missing"].map(o=>{ const val=o==="answered"; let c=pick===val?"sel":""; if(rev) c=truth===val?"right":(pick===val?"wrong":""); return `<button class="opt ${c}" data-act="eye-pick" data-q="${qi}" data-v="${val?1:0}" ${rev?"disabled":""}>${o==="answered"?"answered":"missing"}</button>`; }).join("")}</div>`; }).join("");
  const bands=["0–3","4–6","7–10"]; const c=x.crit||{};
  return `<div class="les"><div class="les-top"><button class="xbtn" data-act="eye-close" aria-label="Close">${ICONS.x}</button><div class="grow"><div class="label">Examiner's eye · ${X.i+1} of ${E.items.length}</div><h2>E-Mail ${esc(x.id)}</h2></div></div>
    <div class="les-body">
      <section class="card stack"><div class="label">The task</div><p class="small">${esc(T.intro_en||"")}</p>${T.email_de?`<div class="mail"><div class="hd">Von: ${esc(T.from||"")}</div><div class="bd">${esc(T.email_de)}</div></div>`:""}
        <div class="small"><b>Questions:</b> ${(T.questions||[]).map(esc).join(" · ")}</div></section>
      <section class="card stack"><div class="label">What the candidate wrote (${x.words} words)</div>${T.printed?`<div class="mail preprint"><div class="bd">${esc(T.printed)}</div></div>`:""}<div class="mail"><div class="bd">${esc(x.text)}</div></div></section>
      <section class="card stack"><h3>1 · Which questions are answered?</h3>${qs}
        <h3>2 · How many points (of 10)?</h3><div class="row">${bands.map((b,bi)=>{ let cl=X.band===bi?"sel":""; if(rev) cl=x.band===bi?"right":(X.band===bi?"wrong":""); return `<button class="opt ${cl}" data-act="eye-band" data-v="${bi}" ${rev?"disabled":""}>${b}</button>`; }).join("")}</div></section>
      ${rev?`<section class="card stack" style="border-color:var(--accent)"><div class="row between"><h3>Examiner's view</h3><span class="chip ${x.band>=1?"ok":"bad"}">about ${esc(x.est)} / 10</span></div>
        <div class="tablewrap"><table class="gram"><tr><td>Length (${x.words} words)</td><td>${x.words>=25?"OK, no deduction":x.words>=20?"−1":x.words>=15?"−2":"not graded"}</td></tr>
          <tr><td>Task (questions answered)</td><td>${x.answered.filter(Boolean).length}/3 ${(c.ded||[]).length?"· "+esc(c.ded.join("; ")):""}</td></tr>
          <tr><td>Register & sign-off (0–1)</td><td>${c.k}</td></tr><tr><td>Structure (0–1)</td><td>${c.t}</td></tr><tr><td>Vocabulary (0–4)</td><td>${c.l}</td></tr><tr><td>Grammar & spelling (0–4)</td><td>${c.f}</td></tr></table></div>
        <div class="stack" style="gap:6px">${(x.errors||[]).map(e=>`<div class="sunk small"><span style="color:var(--bad);text-decoration:line-through">${esc(e[0])}</span> → <b style="color:var(--ok)">${esc(e[1])}</b>${e[2]?`<br>${esc(e[2])}`:""}</div>`).join("")}</div>
        <div>${ex(x.lesson_en, x.lesson_fa)}</div><p class="small muted">${ex("Estimate made with the official ÖSD criteria. ÖSD shows its own marking of these texts in its training video.","تخمین بر اساس معیارهای رسمی ÖSD. نمره‌گذاری خود ÖSD در ویدیوی آموزشی‌اش آمده است.")}</p></section>`:""}
    </div>
    <div class="les-foot"><div class="in">${rev?`<span></span><button class="btn primary big" id="lesBtn" data-act="eye-next">${X.i<E.items.length-1&&E.items.slice(X.i+1).some(eyeUnlocked)?"Next email":"Finish"}</button>`
      :`<span class="small muted">${ex("Decide all three questions and a score band.","هر سه سؤال و بازه نمره را مشخص کن.")}</span><button class="btn primary big" id="lesBtn" data-act="eye-reveal" ${Object.keys(X.picks).length<(T.questions||[]).length||X.band==null?"disabled":""}>Show the examiner's view</button>`}</div></div></div>`; }

/* the official oral exam video */
function oralVideoCard(open){ const items=[
  ["The first minute is a relaxed chat with the examiners. It is not scored.","دقیقه اول گفت‌وگوی آزاد با ممتحن‌هاست و نمره ندارد."],
  ["Teil 1: the candidate picks 4 topics and says 2–3 simple sentences each, then answers follow-up questions.","بخش ۱: ۴ موضوع را انتخاب می‌کند، برای هر کدام ۲–۳ جمله ساده می‌گوید و بعد به سؤال‌ها جواب می‌دهد."],
  ["Teil 2: the four questions about the photo: what, how many people, where, what are they doing.","بخش ۲: چهار سؤال درباره عکس: چه می‌بینی، چند نفر، کجا، چه می‌کنند."],
  ["Teil 3: in the role-play the candidate also asks questions. That is part of the score.","بخش ۳: در نقش‌آفرینی خودش هم سؤال می‌پرسد؛ این بخشی از نمره است."],
  ["Short, simple sentences and calm self-correction. Mistakes are allowed; long silence costs more.","جمله‌های کوتاه و ساده و اصلاح آرام اشتباه. اشتباه مجاز است؛ سکوت طولانی گران‌تر تمام می‌شود."],
  ["Then do the same three parts with the tutor's Exam simulation.","بعد همین سه بخش را با شبیه‌سازی آزمون مربی تمرین کن."]];
  return `<details class="acc" data-keep="vid" ${open||S.keep.vid?"open":""}><summary>Watch a real ÖSD A1 oral exam (official video)</summary><div class="in stack">
    <p class="small">${ex("ÖSD published this as an example of a good A1 performance. Watch it once now and once in the last week. YouTube may need a VPN in Iran.","ÖSD این ویدیو را به عنوان نمونه یک اجرای خوب A1 منتشر کرده. یک بار حالا و یک بار در هفته آخر ببین. یوتیوب در ایران ممکن است فیلتر باشد.")}</p>
    ${S.vidOn?`<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/d0RcmGpj5MY" title="ÖSD ZA1 oral exam example" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`:`<div class="row"><button class="btn sm primary" data-act="vid-on">${ICONS.play}Load the video</button><a class="btn sm" href="https://www.youtube.com/watch?v=d0RcmGpj5MY" target="_blank" rel="noopener">Open on YouTube</a></div>`}
    <div class="label">Watch for</div>${items.map(([en,fa],i)=>`<label class="row" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-chk="vid:${i}" ${S.st.done["vid:"+i]?"checked":""} style="margin-top:6px"><span>${ex(en,fa)}</span></label>`).join("")}</div></details>`; }

/* exam-day rules from the ÖSD exam regulations (valid from 1 August 2026) and the ZA1 implementation rules */
function examDayCard(){ const items=[
  ["Bring a valid passport or national ID card. Without it you can't take the exam.","پاسپورت یا کارت ملی معتبر بیاور. بدون آن نمی‌توانی امتحان بدهی."],
  ["Phones (even switched off), watches of any kind, smartwatches, earphones and earplugs, bags and notes are handed in before the exam. Leave your watch at home: the room has a clock.","گوشی (حتی خاموش)، هر نوع ساعت مچی، ساعت هوشمند، هدفون، گوش‌گیر، کیف و یادداشت قبل از امتحان تحویل داده می‌شود. ساعتت را خانه بگذار؛ اتاق ساعت دارد."],
  ["Written part: Lesen 25 min → Hören ≈10 min → Schreiben 20 min, about 55 minutes without a break (a short break is possible after Hören). Write with a non-erasable pen; no dictionary.","بخش کتبی: خواندن ۲۵ دقیقه، شنیدن حدود ۱۰ دقیقه، نوشتن ۲۰ دقیقه؛ حدود ۵۵ دقیقه بدون استراحت. با خودکار پاک‌نشدنی و بدون دیکشنری."],
  ["Oral part: 10 minutes to prepare alone. You may write keyword notes and use them in the exam. Then about 10 minutes with two examiners; it starts with a short unscored chat and is recorded.","بخش شفاهی: ۱۰ دقیقه آمادگی. می‌توانی کلیدواژه یادداشت کنی و در امتحان استفاده کنی. بعد حدود ۱۰ دقیقه با دو ممتحن؛ با یک گفت‌وگوی کوتاه بدون نمره شروع می‌شود و ضبط می‌شود."],
  ["New rule: memorised ready-made texts in Schreiben or Sprechen count as plagiarism and can lead to exclusion. Learn phrases and patterns, not whole texts, and answer the actual questions.","قانون جدید: متن‌های آماده و حفظ‌شده در نوشتن یا صحبت سرقت ادبی حساب می‌شود و می‌تواند به اخراج از امتحان منجر شود. عبارت‌ها و الگوها را یاد بگیر، نه کل متن را، و به خود سؤال‌ها جواب بده."],
  ["In Hören, don't fill in answers before you've heard the text; in Lesen, before you've read it. Both count as rule-breaking.","در شنیدن قبل از شنیدن متن و در خواندن قبل از خواندن متن جواب نده؛ هر دو تخلف حساب می‌شود."],
  ["Results come as an official result notice first; a passed exam has a QR code you can verify. The certificate has no expiry date.","نتیجه اول به صورت اعلامیه رسمی می‌آید؛ آزمون قبول‌شده کد QR قابل‌بررسی دارد. مدرک تاریخ انقضا ندارد."],
  ["Each module can be retaken as often as you like; ÖSD recommends waiting at least four weeks. You can ask to see your marking sheet within four weeks.","هر بخش را می‌توان هر چند بار تکرار کرد؛ ÖSD توصیه می‌کند حداقل چهار هفته صبر کنی. تا چهار هفته می‌توانی برگه نمره‌ات را ببینی."]];
  return `<details class="acc"><summary>Exam-day rules (ÖSD 2026)</summary><div class="in stack">${items.map(([en,fa])=>`<div class="sunk small">${ex(en,fa)}</div>`).join("")}</div></details>`; }

/* after a mock, its real recordings come back on Hören training days for slow, transcript-supported re-listening */
async function officialPractice(n){ const ready=[]; for(const [set,o] of Object.entries(OFF_SETS)){ if(S.st.mocks[o.mock]&&offData(set)){ await offStatus(set); if(offReady(set)) ready.push(set); } }
  return ready.length?offData(ready[n%ready.length]):null; }
function speakKeywords(script){ const words=[]; (script||[]).forEach(l=>String(l.de||"").split(/\s+/).forEach((w,i)=>{ const c=w.replace(/[.,!?;:„“"()]/g,""); if(!c) return; if((/^[A-ZÄÖÜ]/.test(c)&&i>0)||/\d/.test(c)) words.push(c); })); return [...new Set(words)].slice(0,14); }

/* ---------- boot ---------- */
(async function boot(){
  S.dayN=currentDay();
  render();
  await Promise.all([loadIndex(), initHealth(), loadExtras()]);
  await initAuth();
  if(S.st.freezes==null) S.st.freezes=1;
  applyFreezes(); updateLeague(); await migratePlan(); await detectComeback();
  for(const n of S.published) if(n<=currentDay()+1) getDay(n);
  await getDay(S.dayN);
  render();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
})();
