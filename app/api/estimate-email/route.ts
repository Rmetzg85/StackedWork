import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../../lib/require-user";
import { EMAIL_FROM } from "../../lib/email";

// Everything interpolated into the email HTML is user-entered data: escape it.
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export async function POST(request: Request) {
  // Signed-in contractors only (otherwise this is an open relay on our Resend key).
  const auth = await requireUser(request, { missing: "Please sign in to email estimates." });
  if (auth.response) return auth.response;
  try {
    // Only the estimate id is taken from the client. Everything in the email comes from the saved row,
    // read with the caller's own token so RLS (estimates_select_own) limits it to their estimates.
    const body = await request.json().catch(() => ({}));
    const estimateId = typeof body?.estimateId === "string" ? body.estimateId.trim() : "";
    if (!/^[0-9a-f-]{36}$/i.test(estimateId)) {
      return NextResponse.json({ error: "Missing or invalid estimate id." }, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    });
    const { data: estimate, error: estErr } = await sb
      .from("estimates")
      .select("id, contractor_id, share_token, customer_name, customer_email, job_type, line_items, subtotal, tax_rate, tax_amount, total, notes, valid_until, status")
      .eq("id", estimateId)
      .eq("contractor_id", auth.user.id)
      .maybeSingle();
    if (estErr) {
      console.error("estimate-email: load failed", estErr.message);
      return NextResponse.json({ error: "Couldn't load that estimate. Please try again." }, { status: 500 });
    }
    if (!estimate) return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    if (!estimate.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(estimate.customer_email))) {
      return NextResponse.json({ error: "Add a valid customer email to this estimate first." }, { status: 400 });
    }
    const { data: profile } = await sb.from("profiles").select("name").eq("id", auth.user.id).maybeSingle();
    const contractorEmail = auth.user.email || null; // reply-to is always the signed-in user
    const contractorName = (profile?.name && String(profile.name).trim()) || contractorEmail?.split("@")[0] || "Your Contractor";
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.letstaystacked.com").replace(/\/+$/, "");
    const shareUrl = estimate.share_token && /^[A-Za-z0-9_-]{8,128}$/.test(estimate.share_token) ? `${site}/estimate/${estimate.share_token}` : "";

    if (!process.env.RESEND_API_KEY) {
      // No silent success: the estimate stays a draft and the client shows this message.
      return NextResponse.json({ error: "Email sending isn't set up yet. Your estimate was saved as a draft; you can share its link instead." }, { status: 503 });
    }
    const e = {
      ...estimate,
      tax_rate: Number(estimate.tax_rate) || 0,
      customer_name: esc(estimate.customer_name), job_type: esc(estimate.job_type), notes: estimate.notes ? esc(estimate.notes) : "",
      line_items: (Array.isArray(estimate.line_items) ? estimate.line_items : []).map((it: any) => ({ ...it, description: esc(it?.description), unit: esc(it?.unit), quantity: esc(it?.quantity) })),
      valid_until: /^\d{4}-\d{2}-\d{2}$/.test(String(estimate.valid_until || "")) ? estimate.valid_until : null,
    };

    const lineItemsHtml = (e.line_items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;">${item.description}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;text-align:center;">${item.quantity} ${item.unit}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;font-weight:600;color:#0F172A;text-align:right;">$${Number(item.total).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const validUntilHtml = e.valid_until
      ? `<p style="font-size:13px;color:#64748B;margin:0 0 4px;">Valid until: <strong>${new Date(e.valid_until + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" })}</strong></p>`
      : "";

    const taxHtml =
      e.tax_rate > 0
        ? `<tr><td colspan="3" style="padding:8px 12px;text-align:right;font-size:13px;color:#64748B;">Tax (${e.tax_rate}%)</td><td style="padding:8px 12px;text-align:right;font-size:13px;color:#64748B;">$${Number(e.tax_amount).toFixed(2)}</td></tr>`
        : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#132440,#1E3A5F);borderRadius:12px 12px 0 0;padding:28px 32px;border-radius:12px 12px 0 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:36px;height:36px;background:#4A82C4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;letter-spacing:-0.03em;text-align:center;line-height:36px;">SW</div>
        <span style="font-weight:700;font-size:16px;color:#fff;">StackedWork</span>
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Your Estimate is Ready</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.6);">From ${esc(contractorName || "Your Contractor")}</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;">
      <p style="font-size:15px;color:#374151;margin:0 0 20px;">Hi ${e.customer_name},</p>
      <p style="font-size:14px;color:#64748B;margin:0 0 24px;line-height:1.6;">
        Here is your estimate for the <strong>${e.job_type || "project"}</strong> you requested. Please review the details below.
      </p>

      <!-- Line Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <thead>
          <tr style="background:#F8FAFC;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E8F0;">Description</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E8F0;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E8F0;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E8F0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;">Subtotal</td><td style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;">$${Number(e.subtotal).toFixed(2)}</td></tr>
          ${taxHtml}
          <tr style="background:#F0FDF4;">
            <td colspan="3" style="padding:12px;text-align:right;font-size:15px;font-weight:700;color:#0F172A;">Total</td>
            <td style="padding:12px;text-align:right;font-size:18px;font-weight:800;color:#132440;">$${Number(e.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${e.notes ? `<div style="margin:20px 0;padding:14px 16px;background:#F8FAFC;border-left:3px solid #C8E64A;border-radius:4px;"><p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${e.notes}</p></div>` : ""}

      ${validUntilHtml}

      <!-- CTA -->
      ${shareUrl ? `
      <div style="margin:28px 0 0;text-align:center;">
        <a href="${shareUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C8E64A,#A8C435);color:#132440;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">View Full Estimate</a>
        <p style="font-size:11px;color:#94A3B8;margin:10px 0 0;">Or copy this link: ${shareUrl}</p>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;">
      <p style="font-size:12px;color:#94A3B8;margin:0;">Powered by <strong>StackedWork</strong> · Contractor CRM</p>
      ${contractorEmail ? `<p style="font-size:12px;color:#94A3B8;margin:4px 0 0;">Questions? Reply to this email or contact <a href="mailto:${esc(contractorEmail)}" style="color:#4A82C4;">${esc(contractorEmail)}</a></p>` : ""}
    </div>

  </div>
</body>
</html>`;

    // RESEND_API_URL only exists for local tests against a mock; production uses the real endpoint.
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: estimate.customer_email,
        reply_to: contractorEmail || undefined,
        subject: `Your ${String(estimate.job_type || "Project").slice(0, 60)} Estimate from ${String(contractorName || "Your Contractor").slice(0, 60)}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("estimate-email: Resend error", res.status, err.slice(0, 300));
      return NextResponse.json({ error: `The email provider rejected the message (HTTP ${res.status}). The estimate was not sent.` }, { status: 502 });
    }

    // Sent: mark it server-side (own row only; RLS estimates_update_own).
    const { error: updErr } = await sb.from("estimates").update({ status: "sent" }).eq("id", estimate.id).eq("contractor_id", auth.user.id);
    if (updErr) {
      console.error("estimate-email: sent but status update failed", updErr.message);
      return NextResponse.json({ ok: true, status: estimate.status, warning: "Email sent, but the estimate couldn't be marked as sent." });
    }
    return NextResponse.json({ ok: true, status: "sent" });
  } catch (err: any) {
    console.error("Estimate email error:", err);
    return NextResponse.json({ error: "Couldn't send the estimate email. Please try again." }, { status: 500 });
  }
}
