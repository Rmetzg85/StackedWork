import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { name, phone, email, zip_code, city, job_type, description } = await request.json();

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
    return NextResponse.json({ error: err.message || "Submission failed" }, { status: 500 });
  }
}
