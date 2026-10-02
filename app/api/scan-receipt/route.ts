import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../lib/require-user";
import { parseModelJson } from "../../lib/ai-json";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_BASE64 = 7_000_000; // ~5 MB image
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  const auth = await requireUser(req, { missing: "Please sign in to scan receipts." });
  if (auth.response) return auth.response;
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }
    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_BASE64) {
      return NextResponse.json({ error: "Image too large (max ~5 MB)." }, { status: 413 });
    }
    if (!ALLOWED_MIME.includes(mimeType)) {
      return NextResponse.json({ error: "Unsupported image type. Use JPG, PNG, GIF or WebP." }, { status: 415 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Extract data from this receipt and return ONLY valid JSON with these fields:
{
  "vendor": "store or vendor name",
  "date": "YYYY-MM-DD",
  "subtotal": number or null,
  "tax": number or null,
  "total": number,
  "currency": "USD" or ISO currency code (e.g. "CAD", "EUR", "MXN"),
  "usd_total": number (if currency is not USD, convert to USD using current approximate exchange rate; otherwise same as total),
  "description": "short summary of items purchased (max 60 chars)",
  "category": one of exactly: "Materials", "Fuel/Gas", "Equipment", "Tools", "Subcontractor", "Insurance", "Office/Software", "Other"
}
Return only the JSON object. No markdown, no explanation.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const data = parseModelJson<Record<string, any>>(text);
    if (!data) {
      console.error("scan-receipt: unparseable model output:", text.slice(0, 200));
      return NextResponse.json({ error: "We couldn't read that receipt. Please fill in the amount and details by hand." }, { status: 422 });
    }
    const num = (v: any) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && v.trim() && isFinite(Number(v.replace(/[$,]/g, ""))) ? Number(v.replace(/[$,]/g, "")) : null);
    const CATS = ["Materials", "Fuel/Gas", "Equipment", "Tools", "Subcontractor", "Insurance", "Office/Software", "Other"];
    return NextResponse.json({
      vendor: typeof data.vendor === "string" ? data.vendor.slice(0, 80) : null,
      date: typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : null,
      subtotal: num(data.subtotal), tax: num(data.tax), total: num(data.total),
      currency: typeof data.currency === "string" ? data.currency.slice(0, 3).toUpperCase() : "USD",
      usd_total: num(data.usd_total) ?? num(data.total),
      description: typeof data.description === "string" ? data.description.slice(0, 120) : null,
      category: CATS.includes(data.category) ? data.category : "Other",
    });
  } catch (err: any) {
    console.error("scan-receipt error:", err?.message || err);
    return NextResponse.json({ error: "Receipt scan is unavailable right now. Please fill in the details by hand." }, { status: 502 });
  }
}
