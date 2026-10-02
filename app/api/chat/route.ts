import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "../../lib/require-user";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  contractor: `You are an AI assistant built into StackedWork, a CRM platform for contractors. You help contractors run their business more efficiently.

You can help with:
- Job tracking and management tips
- How to follow up with leads and win more bids
- Pricing guidance for common trades (plumbing, electrical, HVAC, roofing, painting, etc.)
- Business advice for contractors
- Revenue tracking and profitability tips
- Customer communication best practices
- How to use StackedWork features (CRM, photo portfolio, lead management, receipts, revenue dashboard)

Keep responses concise, practical, and trade-focused. You are talking to a working contractor.`,

  homeowner: `You are a friendly AI assistant on StackedWork's contractor finder platform. You help homeowners find and hire the right contractor for their project.

You can help with:
- Describing their project and figuring out what type of contractor they need
- What questions to ask contractors before hiring
- Typical price ranges for common home improvement projects
- Red flags to watch out for when hiring contractors
- How to verify a contractor's license and insurance
- What to expect during a home improvement project
- How to use the Find a Contractor form on this page

Keep responses friendly, clear, and helpful. You are talking to a homeowner who may not know much about construction.`,
};

const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;

export async function POST(request: Request) {
  // Signed-in users only (the logged-out widget answers locally and never calls this route).
  const auth = await requireUser(request, { missing: "Please sign in to chat with the AI assistant." });
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const mode = body?.mode;
    const raw = body?.messages;

    if (!raw || !Array.isArray(raw)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }
    // Bound cost: last N turns, user/assistant only, text truncated.
    const messages = raw
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim())
      .slice(-MAX_MESSAGES)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_CHARS) }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) return NextResponse.json({ error: "Messages array required" }, { status: 400 });

    const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.contractor;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: err.message || "Chat failed" }, { status: 500 });
  }
}
