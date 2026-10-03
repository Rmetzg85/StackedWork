// All user-facing dates use the business's local time zone (America/New_York),
// not UTC. `new Date().toISOString().slice(0,10)` rolls over to "tomorrow" at
// 8pm ET (7pm in winter), so we never use it for date defaults or displays.
export const APP_TZ = "America/New_York";

/** YYYY-MM-DD for the given instant, in America/New_York. */
export function dateKeyNY(d: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Today's date (YYYY-MM-DD) in America/New_York. */
export const todayNY = (): string => dateKeyNY(new Date());

/** YYYY-MM-DD for N days before today, America/New_York. */
export function daysAgoNY(n: number): string {
  const [y, m, d] = todayNY().split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() - n);
  return dt.toISOString().slice(0, 10);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize a DB value to a YYYY-MM-DD key in America/New_York.
 * Date-only strings ("2026-10-02") are calendar dates and are returned as-is;
 * timestamps are converted to the NY calendar date.
 */
export function toDateKeyNY(v: string | null | undefined): string | null {
  if (!v) return null;
  if (DATE_ONLY.test(v)) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : dateKeyNY(d);
}

/** Format a date-only string or timestamp for display in America/New_York. */
export function fmtDateNY(v: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  if (!v) return "";
  // Date-only values: anchor at noon UTC so the NY calendar day never shifts.
  const d = DATE_ONLY.test(v) ? new Date(v + "T12:00:00Z") : new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { timeZone: APP_TZ, ...opts });
}

/** Current year in America/New_York. */
export const yearNY = (): number => Number(todayNY().slice(0, 4));

const LOCAL_DT = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Human-friendly "when" for job review cards, in America/New_York:
 *   "2026-10-06T10:00"      -> "Tue, Oct 6 · 10:00 AM"  (zone-less = NY wall-clock time, shown as-is)
 *   "2026-10-06"            -> "Tue, Oct 6"             (date-only: no time)
 *   "2026-10-06T14:00:00Z"  -> "Tue, Oct 6 · 10:00 AM"  (instants are converted to NY)
 * Unparseable input is returned unchanged; empty input returns "".
 */
export function fmtWhenNY(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).trim();
  const md = (y: number, m: number, d: number) => {
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    return `${WD[dt.getUTCDay()]}, ${MO[m - 1]} ${d}`;
  };
  const hm = (h: number, mi: number) => `${((h + 11) % 12) + 1}:${String(mi).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  if (DATE_ONLY.test(s)) { const [y, m, d] = s.split("-").map(Number); return md(y, m, d); }
  const l = LOCAL_DT.exec(s);
  if (l) { const [, y, m, d, h, mi] = l.map(Number); if (h < 24 && mi < 60) return `${md(y, m, d)} · ${hm(h, mi)}`; }
  const t = new Date(s);
  if (isNaN(t.getTime())) return s;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: APP_TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" })
    .formatToParts(t).map((p) => [p.type, p.value]));
  return `${md(+parts.year, +parts.month, +parts.day)} · ${hm(+parts.hour % 24, +parts.minute)}`;
}
