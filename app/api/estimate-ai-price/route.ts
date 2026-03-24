import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { jobType, description, location } = await request.json();

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
- Units should be appropriate (hours, sq ft, linear ft, each, etc.)
- Keep descriptions concise and professional
- The notes field should mention that prices are estimates and suggest verifying current material costs with local suppliers
- Only return valid JSON, no other text`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse pricing response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Estimate AI pricing error:", err);
    return NextResponse.json({ error: err.message || "Pricing suggestion failed" }, { status: 500 });
  }
}
