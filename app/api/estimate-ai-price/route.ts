import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "../../lib/require-user";
import { parseModelJson } from "../../lib/ai-json";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const auth = await requireUser(request, { missing: "Please sign in to use AI pricing." });
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const jobType = typeof body?.jobType === "string" ? body.jobType.slice(0, 80) : "";
    const description = typeof body?.description === "string" ? body.description.slice(0, 1500) : "";
    const location = typeof body?.location === "string" ? body.location.slice(0, 120) : "";

    if (!jobType) {
      return NextResponse.json({ error: "Job type required" }, { status: 400 });
    }

    const prompt = `You are a contractor pricing expert. A contractor needs help building an estimate for a ${jobType} job${description ? `: "${description}"` : ""}.${location ? ` Location: ${location}.` : ""}

Generate realistic line items for this job with current market pricing (as of early 2026). Consider typical material costs and labor rates.

Respond with a JSON object in this exact format:
{
  "line_items": [
    { "description": "string", "quantity": number, "unit": "string", "unit_price": number, "total": number },
    ...
  ],
  "notes": "string (brief pricing notes about market conditions or anything the contractor should verify)"
}

Rules:
- Include 3-7 line items (mix of labor and materials)
- Use realistic 2025-2026 market prices
- Labor rates should reflect regional averages ($45-$120/hr depending on trade)
- Materials should reflect current supply costs
- Units should be appropriate: one of "hours", "job" (flat-rate items), "each", "sq ft", "linear ft", "days", "lbs", "bags", "gallons"
- Keep descriptions concise and professional
- The notes field should mention that prices are estimates and suggest verifying current material costs with local suppliers
- Only return valid JSON, no other text`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    const parsed = parseModelJson<any>(text);
    const items = Array.isArray(parsed?.line_items) ? parsed.line_items : null;
    if (!items || items.length === 0) {
      console.error("estimate-ai-price: unparseable model output:", text.slice(0, 200));
      return NextResponse.json({ error: "Couldn't build price suggestions for that job. Try adding a short description, or enter line items by hand." }, { status: 422 });
    }
    const n = (v: any, d = 0) => { const x = typeof v === "number" ? v : Number(String(v ?? "").replace(/[$,]/g, "")); return isFinite(x) ? x : d; };
    const line_items = items.slice(0, 15).map((it: any) => {
      const quantity = n(it?.quantity, 1), unit_price = n(it?.unit_price);
      return { description: String(it?.description ?? "").slice(0, 200), quantity, unit: String(it?.unit ?? "each").slice(0, 20), unit_price, total: Math.round(quantity * unit_price * 100) / 100 };
    });
    return NextResponse.json({ line_items, notes: typeof parsed.notes === "string" ? parsed.notes.slice(0, 1000) : "" });
  } catch (err: any) {
    console.error("Estimate AI pricing error:", err?.message || err);
    return NextResponse.json({ error: "AI pricing is unavailable right now. Please enter line items by hand." }, { status: 502 });
  }
}
