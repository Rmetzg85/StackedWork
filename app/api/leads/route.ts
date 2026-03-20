import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contractor_id, name, phone, email, message, urgent } = body;

  if (!contractor_id || !name) {
    return NextResponse.json(
      { error: "contractor_id and name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      contractor_id,
      name,
      phone: phone || null,
      email: email || null,
      message: message || null,
      urgent: urgent || false,
      source: "website",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lead: data });
}
