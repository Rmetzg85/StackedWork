import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

export async function POST(request: Request) {
  try {
    const { messages, mode } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.homeowner;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: err.message || "Chat failed" }, { status: 500 });
  }
}
