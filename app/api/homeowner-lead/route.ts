import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isHoneypot, rateLimit, clientIp } from "../../lib/abuse";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (isHoneypot(body)) return NextResponse.json({ success: true }); // silent fake success for bots
    const rl = await rateLimit("homeowner-lead", clientIp(request), 5, 600); // 5 per 10 minutes per IP
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
    }
    const { name, phone, email, zip_code, city, job_type, description } = body || {};

    if (!name || (!phone && !email)) {
      return NextResponse.json({ error: "Name and at least one contact method are required." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("homeowner_leads").insert({
      name,
      phone: phone || null,
      email: email || null,
      zip_code: zip_code || null,
      city: city || null,
      job_type: job_type || "other",
      description: description || null,
      status: "new",
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Homeowner lead error:", err);
    return NextResponse.json({ error: "We couldn't submit your request. Please try again." }, { status: 500 });
  }
}
