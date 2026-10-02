/**
 * Parse the JSON object a model returned. Models sometimes wrap it in ```json fences or add prose,
 * which made JSON.parse throw ("Unexpected token '`'") and the route 500. Strips fences, takes the
 * first balanced {...} and never throws: returns null when nothing parseable is found.
 */
export function parseModelJson<T = any>(text: string | null | undefined): T | null {
  if (!text) return null;
  let s = String(text).trim();
  const fence = s.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  try { const v = JSON.parse(s); if (v && typeof v === "object" && !Array.isArray(v)) return v as T; } catch { /* fall through */ }
  const start = s.indexOf("{");
  if (start < 0) return null;
  // Scan for the matching closing brace (string-aware), so trailing prose or a 2nd object can't break it.
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try { const v = JSON.parse(s.slice(start, i + 1)); return v && typeof v === "object" && !Array.isArray(v) ? (v as T) : null; } catch { return null; }
    }
  }
  return null;
}
