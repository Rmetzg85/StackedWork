// Typed/offline fallback for voice-to-job. Used only when /api/parse-job is
// unavailable (network error, AI not configured, signed out). Regex-based,
// best effort; the user always reviews every field before saving.
//
// Extracts: customer name, phone, street address, job type, price, date, time,
// status and a short service description. Tested against QA's 12 realistic
// phrases (tests/parse-job-local.test.cjs).
import { todayNY } from "./dates";

export type LocalParsedJob = {
  name: string;
  jobType: string;
  value: string; // price as typed ("1200.50"), "" if none
  status: string; // quoted | scheduled | in-progress | complete
  phone: string; // "(410) 555-0182" or ""
  address: string; // "123 Oak St" or ""
  date: string; // YYYY-MM-DD (America/New_York) or ""
  time: string; // HH:MM 24h or ""
  service: string; // short description, e.g. "lawn mow"
};

export const JOB_TYPES = ["General", "Plumbing", "Electrical", "HVAC", "Roofing", "Drywall", "Painting", "Deck", "Flooring", "Landscaping", "Other"];

/** Map a free-text service ("water heater replacement", "AC not cooling", "lawn mow") to a JOB_TYPES value. */
export function jobTypeFromText(text: string | null | undefined): string {
  const t = String(text || "").toLowerCase();
  let jobType = "General";
  for (const [jt, re] of TYPE_RULES) if (re.test(t)) jobType = jt;
  return jobType;
}

const WORD_NUMS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};
const NUM_WORD = "(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)";
// "two thousand five hundred", "fifteen hundred", "four hundred and fifty"
const SPOKEN_SEQ = new RegExp(`\\b${NUM_WORD}(?:[\\s-]+(?:and\\s+)?${NUM_WORD})*\\b`, "gi");

function spokenToNumber(s: string): number | null {
  const parts = s.toLowerCase().replace(/-/g, " ").split(/\s+/).filter((p) => p && p !== "and");
  let total = 0, curr = 0;
  for (const p of parts) {
    const n = WORD_NUMS[p];
    if (n === undefined) return null;
    if (n === 1000) { total += (curr || 1) * 1000; curr = 0; }
    else if (n === 100) curr = (curr || 1) * 100;
    else curr += n;
  }
  const v = total + curr;
  return v > 0 ? v : null;
}

const STREET_SUFFIX = "(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Blvd|Boulevard|Way|Pl|Place|Ter|Terrace|Cir|Circle|Pkwy|Parkway|Hwy|Highway|Pike|Trail|Trl)";
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_RE = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function weekdayOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}
const pad = (n: number) => String(n).padStart(2, "0");

// Order matters: later rules win (more specific trades override generic words).
const TYPE_RULES: [string, RegExp][] = [
  ["Landscaping", /\b(lawn|lawns|mow|mowing|landscap\w*|yard work|yard cleanup|mulch|hedges?|sod|leaf|leaves|tree trimming|trim(?:ming)? trees|weeding|sprinklers?|irrigation)\b/],
  ["Painting", /\b(paint|painting|painted|repaint)\b/],
  ["Flooring", /\b(floor|floors|flooring|tile|tiling|carpet|hardwood|laminate|lvp)\b/],
  ["Drywall", /\b(drywall|sheetrock|plaster|patch(?:ing)? (?:the )?wall)\b/],
  ["Roofing", /\b(roof|roofing|shingles?|gutters?)\b/],
  ["Deck", /\b(deck|decking|porch)\b/],
  ["Electrical", /\b(electric|electrical|electrician|panel|outlets?|wiring|rewire|breaker|light fixtures?|ceiling fan)\b/],
  ["Plumbing", /\b(plumb|plumbing|plumber|leak|leaking|leaky|pipes?|drain|clog(?:ged)?|toilet|faucet|sink|shower valve|water heater|sewer|sump pump)\b/],
  ["HVAC", /\b(hvac|heat pump|furnace|air condition(?:er|ing)?|ac|a\/c|not cooling|no cooling|no heat|ductwork|ducts?|thermostat|mini[- ]split)\b/],
];

const FILLER_LEAD = /^\s*(?:(?:um+|uh+|er+|so|okay|ok|alright|like|yeah|hey|well|and|new job|add (?:a )?job|job)[\s,]+)*(?:(?:this is|this one is|it's|it is|that's)\s+)?(?:(?:for|with)\s+)?/i;
const NAME_STOP = new Set(["fix", "fixing", "replace", "install", "repair", "remove", "build", "clean", "mow", "patch", "new", "quote", "estimate", "check", "inspect", "at", "on", "in", "from", "needs", "need", "wants", "want", "has", "is", "said", "called", "for", "with", "the", "and", "to"]);

export function parseVoiceToJobLocal(text: string, today: string = todayNY()): LocalParsedJob {
  const original = text || "";
  let work = " " + original.replace(/\s+/g, " ").trim() + " ";
  const consumed: string[] = []; // spans removed from `work`, used to build the service description
  const take = (re: RegExp): RegExpMatchArray | null => {
    const m = work.match(re);
    // Replace with a comma so a removed phone/address/price also ends a name ("jose 301-555-7788 fence repair").
    if (m) { consumed.push(m[0]); work = work.replace(m[0], " , "); }
    return m;
  };

  // --- Phone (10 digits, any separators) ---
  let phone = "";
  const ph = take(/(?:\+?1[\s.-]?)?\(?\b(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/);
  if (ph) phone = `(${ph[1]}) ${ph[2]}-${ph[3]}`;

  // --- Street address: "123 Oak St", "55 Main Street", "4 W Elm Ave" ---
  let address = "";
  const addr = take(new RegExp(`\\b\\d{1,6}\\s+(?:[NSEW]\\.?\\s+)?(?:[A-Za-z][A-Za-z'-]*\\s+){1,3}?${STREET_SUFFIX}\\b\\.?`, "i"));
  if (addr) address = addr[0].trim().replace(/\.$/, "");

  // --- Time: "2pm", "2:30 p.m.", "10 am", "noon" ---
  let time = "";
  const tm = take(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?=[\s,.;]|$)/i);
  if (tm) {
    let h = Number(tm[1]) % 12;
    if (/p/i.test(tm[3])) h += 12;
    time = `${pad(h)}:${tm[2] || "00"}`;
  } else if (take(/\b(?:at\s+)?noon\b/i)) time = "12:00";
  else {
    // "at 3", "at 10:30" with no am/pm: assume working hours (7-11 morning, 12 noon, 1-6 afternoon).
    const bh = take(/\bat\s+(\d{1,2})(?::(\d{2}))?(?=\s*(?:o'?clock\b)?\s*(?:[,.;]|$|(?:on|tomorrow|today|tonight|next|this|for|and|then|in the|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b))/i);
    if (bh && Number(bh[1]) >= 1 && Number(bh[1]) <= 12) {
      const h = Number(bh[1]);
      time = `${pad(h >= 7 && h <= 11 ? h : h === 12 ? 12 : h + 12)}:${bh[2] || "00"}`;
    }
  }

  // --- Date ---
  let date = "";
  let dm: RegExpMatchArray | null;
  if ((dm = take(/\b(today|tonight|this (?:morning|afternoon|evening))\b/i))) date = today;
  else if ((dm = take(/\b(?:the )?day after tomorrow\b/i))) date = addDays(today, 2);
  else if ((dm = take(/\btomorrow\b/i))) date = addDays(today, 1);
  else if ((dm = take(/\byesterday\b/i))) date = addDays(today, -1);
  else if ((dm = take(new RegExp(`\\b(?:(next|this|on|for)\\s+)?(${WEEKDAYS.join("|")})\\b`, "i")))) {
    const target = WEEKDAYS.indexOf(dm[2].toLowerCase());
    let diff = (target - weekdayOf(today) + 7) % 7;
    if (dm[1] && dm[1].toLowerCase() === "next" && diff === 0) diff = 7;
    date = addDays(today, diff);
  } else if ((dm = take(new RegExp(`\\b(${MONTH_RE})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i")))) {
    const mi = MONTHS.findIndex((m) => m.startsWith(dm![1].toLowerCase().slice(0, 3)));
    const y = Number(today.slice(0, 4));
    let key = `${y}-${pad(mi + 1)}-${pad(Number(dm[2]))}`;
    if (key < addDays(today, -30)) key = `${y + 1}-${pad(mi + 1)}-${pad(Number(dm[2]))}`;
    date = key;
  } else if ((dm = take(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
    const y = dm[3] ? (dm[3].length === 2 ? 2000 + Number(dm[3]) : Number(dm[3])) : Number(today.slice(0, 4));
    date = `${y}-${pad(Number(dm[1]))}-${pad(Number(dm[2]))}`;
  }

  // --- Price ---
  let value = "";
  const money = (s: string) => s.replace(/,/g, "");
  let pm: RegExpMatchArray | null;
  if ((pm = take(/\$\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?/i))) {
    value = pm[2] ? String(Number(money(pm[1])) * 1000) : money(pm[1]);
  } else if ((pm = take(/\b(\d+(?:\.\d+)?)\s*(thousand|hundred)\b(?:\s*(?:dollars?|bucks?))?/i))) {
    value = String(Math.round(Number(pm[1]) * (pm[2].toLowerCase() === "thousand" ? 1000 : 100)));
  } else if ((pm = take(/\b(\d[\d,]*(?:\.\d{1,2})?)\s*(k|grand)\b/i))) {
    value = String(Math.round(Number(money(pm[1])) * 1000));
  } else if ((pm = take(/\b(\d[\d,]*(?:\.\d{1,2})?)\s*(?:dollars?|bucks?|usd)\b/i))) {
    value = money(pm[1]);
  } else {
    // Spoken amounts: "fifteen hundred dollars", "two thousand five hundred". Without "dollars" only
    // accept sequences that contain hundred/thousand so "one" or "two" alone never become a price.
    const seqs = [...work.matchAll(SPOKEN_SEQ)];
    for (const s of seqs) {
      const after = work.slice((s.index || 0) + s[0].length);
      const hasUnit = /^\s*(?:dollars?|bucks?)\b/i.test(after);
      if (hasUnit || /hundred|thousand/i.test(s[0])) {
        const n = spokenToNumber(s[0]);
        if (n) {
          value = String(n);
          const unit = after.match(/^\s*(?:dollars?|bucks?)\b/i);
          take(new RegExp(`\\b${s[0].replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}${unit ? unit[0].replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") : ""}`, "i"));
          break;
        }
      }
    }
    if (!value) {
      // Bare number left after removing phone/address/time/date: use the last one that isn't a quantity.
      // No lookbehind anywhere in this file: Safari < 16.4 can't parse it and the whole bundle would fail.
      const cands = [...work.matchAll(/(^|[^\w/])(\d[\d,]*(?:\.\d{1,2})?)(?![\w/])(?!\s*(?:sq|square|ft|feet|foot|hours?|hrs?|units?|rooms?|windows?|doors?|years?|yrs?|days?|weeks?|months?|%|percent|gallons?|inch(?:es)?|x\b))/gi)]
        .filter((m) => Number(money(m[2])) >= 20);
      const last = cands[cands.length - 1];
      if (last) {
        value = money(last[2]);
        const at = (last.index || 0) + last[1].length;
        consumed.push(last[2]);
        work = work.slice(0, at) + " , " + work.slice(at + last[2].length);
      }
    }
  }
  // Drop a dangling "like"/"about"/"around" left in front of a removed price.
  work = work.replace(/\b(?:like|about|around|roughly|approx(?:imately)?)\s+(?=[,.;]|\s*$)/gi, " ");

  // --- Status ---
  const t = original.toLowerCase();
  let status = "";
  if (/\bschedul/.test(t) || /\bbooked\b/.test(t)) status = "scheduled";
  else if (/\b(in progress|in-progress|started|starting today|working on|underway|ongoing)\b/.test(t)) status = "in-progress";
  else if (/\b(complete|completed|finished|done|wrapped up)\b/.test(t)) status = "complete";
  else if (/\b(quote|quoted|estimate|bid)\b/.test(t)) status = "quoted";
  else if ((date && date >= today) || time) status = "scheduled";
  else status = "quoted";
  work = work.replace(/\b(?:scheduled|schedule|booked|in progress|started|done|finished|completed?|quoted?)\b(?:\s+for\b)?/gi, " ");

  // --- Job type ---
  const jobType = jobTypeFromText(t);

  // --- Customer name ---
  const clean = work.replace(FILLER_LEAD, "").replace(/^[\s,.;]+/, "");
  const words = clean.split(/\s+/).filter(Boolean);
  const isCap = (w: string) => /^[A-Z][a-zA-Z'’-]*$/.test(w) && !/^[A-Z]{2,}$/.test(w); // "AC"/"HVAC" aren't names
  const isTradeWord = (w: string) => TYPE_RULES.some(([, re]) => re.test(w.toLowerCase()));
  let name = "";
  // 1) "<job> for <Name>" wins over a leading capitalised word: "Water heater replacement for Mike Davis at 42 Oak St"
  //    is Mike Davis, not "Water". Also "…for the Hendersons", "…for Mrs. Lee", "customer is Ana Ortiz".
  const fm = work.match(/\b(?:for|customer(?: is)?|client(?: is)?|name is)\s+(?:the\s+)?((?:Mr|Mrs|Ms|Dr)\.?\s+)?([A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){0,2})/);
  if (fm) {
    const fw: string[] = [];
    for (const w of fm[2].split(/\s+/)) {
      const lw = w.toLowerCase();
      if (NAME_STOP.has(lw) || WEEKDAYS.includes(lw) || MONTHS.includes(lw) || /^(?:today|tomorrow|tonight|yesterday|next|this)$/.test(lw) || !isCap(w) || isTradeWord(w)) break;
      fw.push(w);
    }
    if (fw.length) name = ((fm[1] || "") + fw.join(" ")).trim();
  }
  // 2) Otherwise, leading capitalised words: "Mike Johnson, 123 Oak St, lawn mow".
  if (!name) {
    const nameWords: string[] = [];
    for (const raw of words) {
      const w = raw.replace(/[,.;:!?]+$/, "");
      const lw = w.toLowerCase();
      if (!w || NAME_STOP.has(lw) || /\d/.test(w) || isTradeWord(w) || !isCap(w) || WEEKDAYS.includes(lw)) break;
      nameWords.push(w);
      if (raw !== w || nameWords.length >= 3) break; // punctuation ends the name
    }
    if (nameWords.length) name = nameWords.join(" ");
  }
  if (!name) {
    // All-lowercase transcripts: leading words up to a stop word / trade word / number, max 2 words.
    const lw: string[] = [];
    for (const raw of words) {
      const w = raw.replace(/[,.;:!?]+$/, "");
      if (!w || NAME_STOP.has(w.toLowerCase()) || /\d/.test(w) || isTradeWord(w)) break;
      lw.push(w);
      if (raw !== w || lw.length >= 2) break;
    }
    name = lw.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  if (name) work = work.replace(new RegExp(`(?:\\b(?:for|customer|client)\\s+)?(?:the\\s+)?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"), " , ");

  // --- Address fallback: "on Elm", "over on Maple" (a capitalised street name without a number) ---
  if (!address) {
    const om = work.match(/\b(?:on|at)\s+([A-Z][a-zA-Z'-]+(?:\s+(?:[A-Z][a-zA-Z'-]+))?)\b/);
    if (om && !WEEKDAYS.includes(om[1].toLowerCase()) && !MONTHS.includes(om[1].toLowerCase())) {
      address = om[1];
      work = work.replace(om[0], " ");
    }
  }

  // --- Service description: what's left, minus filler ---
  const service = work
    .replace(FILLER_LEAD, "")
    .replace(/\b(?:um+|uh+|like|so|needs?|wants?|for|the|at|on|and)\b(?=[\s,.;]*(?:[,.;]|$))/gi, " ")
    .replace(/^\s*(?:needs?|wants?)\s+/i, "")
    .split(/[,.;]/).map((p) => p.replace(/\s+/g, " ").trim()).filter((p) => p && !/^(?:um+|uh+|like|so|and|for|the|at|on|next|this)$/i.test(p))
    .join(", ")
    .replace(/^(?:needs?|wants?)\s+/i, "")
    .slice(0, 120);

  return { name, jobType, value, status, phone, address, date, time, service };
}
