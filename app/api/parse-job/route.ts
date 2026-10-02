import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Voice/typed job → structured fields. Same SDK, env var (ANTHROPIC_API_KEY)
// and model as /api/chat. Requires a signed-in Supabase user (Bearer JWT).
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TRANSCRIPT = 1500;
const STATUSES = ["quoted", "scheduled", "in-progress", "complete"] as const;

export type ParsedJob = {
  customer_name: string | null;
  address: string | null;
  phone: string | null;
  service: string | null;
  scheduled_at: string | null; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" (America/New_York local)
  price: number | null;
  status: (typeof STATUSES)[number];
};

function todayNY(): { date: string; weekday: string } {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const weekday = now.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long" });
  return { date, weekday };
}

const str = (v: unknown, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return s ? s.slice(0, max) : null;
};

function sanitize(raw: any): ParsedJob {
  let price: number | null = null;
  if (typeof raw?.price === "number" && isFinite(raw.price) && raw.price >= 0) price = Math.round(raw.price * 100) / 100;
  else if (typeof raw?.price === "string") {
    const n = parseFloat(raw.price.replace(/[$,\s]/g, ""));
    if (isFinite(n) && n >= 0) price = Math.round(n * 100) / 100;
  }
  let scheduled_at = str(raw?.scheduled_at, 16);
  if (scheduled_at && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(scheduled_at)) scheduled_at = null;
  const status = STATUSES.includes(raw?.status) ? raw.status : scheduled_at ? "scheduled" : "quoted";
  return {
    customer_name: str(raw?.customer_name, 80),
    address: str(raw?.address, 200),
    phone: str(raw?.phone, 30),
    service: str(raw?.service, 120),
    scheduled_at,
    price,
    status,
  };
}

export async function POST(request: Request) {
  // 1) Auth: verify the caller's Supabase access token.
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Please sign in to use voice entry." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Server misconfiguration: missing Supabase env" }, { status: 500 });
  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });

  // 2) Input
  let transcript = "";
  try {
    const body = await request.json();
    transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!transcript) return NextResponse.json({ error: "Nothing to parse. Say or type the job details." }, { status: 400 });
  transcript = transcript.slice(0, MAX_TRANSCRIPT);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI parsing is not configured on the server." }, { status: 503 });
  }

  // 3) Extract
  const { date, weekday } = todayNY();
  const system = `You extract job details for a contractor's CRM from a short spoken or typed note.
Today is ${weekday}, ${date} (America/New_York). Resolve relative dates ("tomorrow", "next Tuesday") against today.
Return ONLY a JSON object, no prose, with exactly these keys:
{"customer_name": string|null, "address": string|null, "phone": string|null, "service": string|null, "scheduled_at": string|null, "price": number|null, "status": "quoted"|"scheduled"|"in-progress"|"complete"}
Rules:
- customer_name: the customer's name only (not the contractor, not the service).
- service: short description of the work, e.g. "water heater replacement", "kitchen repaint".
- scheduled_at: "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" (24h, local time) if a date/time is mentioned, else null.
- price: a number in US dollars only if a price/amount is clearly stated; otherwise null. Never guess a price.
- phone: digits as spoken, formatted like (410) 555-0100 when 10 digits; else null.
- status: "scheduled" if a future date/time is set, "complete" if the job is described as done, "in-progress" if started, otherwise "quoted".
- Use null for anything not stated. Do not invent details.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: `Note: """${transcript}"""` }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Couldn't understand that. Please fill in the fields." }, { status: 422 });
    let raw: any;
    try { raw = JSON.parse(match[0]); } catch {
      return NextResponse.json({ error: "Couldn't understand that. Please fill in the fields." }, { status: 422 });
    }
    return NextResponse.json({ job: sanitize(raw) });
  } catch (err: any) {
    console.error("parse-job error:", err?.message || err);
    return NextResponse.json({ error: "AI parsing failed. Please try again or fill in the fields." }, { status: 502 });
  }
}
