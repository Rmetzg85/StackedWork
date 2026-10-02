import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server misconfiguration: missing Supabase env" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contractor_id, name, phone, email, message, urgent, job_type, source } = body;

  // Public website lead form: contractor_id comes from the contractor's public link (/l/<id>) by design.
  // Validate its shape so junk can't be inserted; the service role only inserts, never reads other rows back.
  if (typeof contractor_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractor_id)) {
    return NextResponse.json({ error: "Invalid contractor link." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json(
      { error: "contractor_id and name are required" },
      { status: 400 }
    );
  }

  const row: Record<string, any> = {
    contractor_id,
    name,
    phone: phone || null,
    email: email || null,
    message: message || null,
    urgent: urgent || false,
    read: false,
    source: source || "website",
  };
  if (job_type) row.job_type = job_type;

  const { error } = await supabase.from("leads").insert(row);

  if (error) {
    console.error("leads insert error:", error.message, error.code);
    return NextResponse.json({ error: "We couldn't send your request. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
