// Typed/offline fallback for voice-to-job. Used only when /api/parse-job is
// unavailable (network error, AI not configured). Regex-based, best effort;
// the user always reviews the fields before saving.
export type LocalParsedJob = { name: string; jobType: string; value: string; status: string };

export const JOB_TYPES = ["General", "Plumbing", "Electrical", "HVAC", "Roofing", "Drywall", "Painting", "Deck", "Flooring", "Other"];

export function parseVoiceToJobLocal(text: string): LocalParsedJob {
  const t = text.toLowerCase();
  const wordNums: Record<string, number> = { zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,thousand:1000 };
  const spokenNum = (s: string): number | null => {
    const parts = s.trim().split(/\s+/);
    let total = 0; let curr = 0;
    for (const p of parts) {
      const n = wordNums[p];
      if (n === undefined) return null;
      if (n === 1000) { total += (curr || 1) * 1000; curr = 0; }
      else if (n === 100) { curr = (curr || 1) * 100; }
      else { curr += n; }
    }
    return total + curr || null;
  };
  // Price only when it is clearly money ($, "dollars", "bucks", or spelled-out amounts).
  let value = "";
  const dollarMatch = t.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  const digitDollars = t.match(/(\d[\d,]*(?:\.\d{1,2})?)\s*(?:dollars?|bucks?)\b/);
  if (dollarMatch) value = dollarMatch[1].replace(/,/g, "");
  else if (digitDollars) value = digitDollars[1].replace(/,/g, "");
  else {
    const spoken = t.match(/\b((?:(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\s*)+)(?:dollars?|bucks?)\b/);
    if (spoken) { const n = spokenNum(spoken[1].trim()); if (n) value = String(n); }
  }
  let jobType = "General";
  for (const jt of JOB_TYPES) { if (t.includes(jt.toLowerCase())) { jobType = jt; break; } }
  if (t.includes("paint")) jobType = "Painting";
  if (t.includes("electric")) jobType = "Electrical";
  if (t.includes("roof")) jobType = "Roofing";
  if (t.includes("floor")) jobType = "Flooring";
  if (t.includes("plumb") || t.includes("leak") || t.includes("pipe")) jobType = "Plumbing";
  if (t.includes("air condition") || t.includes("hvac") || t.includes("heat pump") || t.includes("furnace")) jobType = "HVAC";
  let status = "quoted";
  if (/\bschedul/.test(t)) status = "scheduled";
  else if (t.includes("in progress") || t.includes("in-progress") || t.includes("started")) status = "in-progress";
  else if (/\b(complete|completed|finished|done)\b/.test(t)) status = "complete";
  // Name: leading capitalised words before the first comma / keyword.
  // Drop separators inside numbers ("1,200.50") first; no lookbehind (older Safari can't parse it).
  const parts = text.replace(/(\d)[,.](?=\d)/g, "$1").split(/[,.;]| for | needs | wants /i);
  const head = parts[0] || "";
  // Without a separator we can't tell where the name ends, so keep it to two words.
  const maxWords = parts.length > 1 ? 3 : 2;
  const name = head.replace(/[^a-zA-Z'\-\s]/g, "").trim().split(/\s+/).filter(Boolean).slice(0, maxWords).join(" ");
  return { name, jobType, value, status };
}
