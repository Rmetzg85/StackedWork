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

  if (!contractor_id || !name) {
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

  const { data, error } = await supabase
    .from("leads")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lead: data });
}
