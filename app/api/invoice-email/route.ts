import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../../lib/require-user";
import { EMAIL_FROM } from "../../lib/email";
import { fmtDateNY } from "../../lib/dates";
import { formatInvoiceNumber } from "../../lib/invoices";

// Same approach as /api/estimate-email: signed-in only, only the invoice id comes from the client,
// everything in the email is loaded from the saved row with the caller's token (RLS invoices_select_own),
// 503 when Resend isn't configured. Link sharing is the primary way to send an invoice; this is optional.
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const money = (v: unknown) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (v: string | null | undefined) => fmtDateNY(v, { month: "long", day: "numeric", year: "numeric" });

export async function POST(request: Request) {
  const auth = await requireUser(request, { missing: "Please sign in to email invoices." });
  if (auth.response) return auth.response;
  try {
    const body = await request.json().catch(() => ({}));
    const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId.trim() : "";
    if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) {
      return NextResponse.json({ error: "Missing or invalid invoice id." }, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${auth.token}` } },
    });
    const { data: inv, error: invErr } = await sb
      .from("invoices")
      .select("id, contractor_id, number, invoice_number, share_token, customer_name, customer_email, job_type, line_items, subtotal, tax_rate, tax_amount, total, notes, issue_date, due_date, status")
      .eq("id", invoiceId)
      .eq("contractor_id", auth.user.id)
      .maybeSingle();
    if (invErr) {
      console.error("invoice-email: load failed", invErr.message);
      return NextResponse.json({ error: "Couldn't load that invoice. Please try again." }, { status: 500 });
    }
    if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    if (!inv.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(inv.customer_email))) {
      return NextResponse.json({ error: "Add a valid customer email to this invoice first." }, { status: 400 });
    }
    const { data: profile } = await sb.from("profiles").select("name").eq("id", auth.user.id).maybeSingle();
    const contractorEmail = auth.user.email || null;
    const contractorName = (profile?.name && String(profile.name).trim()) || contractorEmail?.split("@")[0] || "Your Contractor";
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.letstaystacked.com").replace(/\/+$/, "");
    const shareUrl = inv.share_token && /^[A-Za-z0-9_-]{8,128}$/.test(inv.share_token) ? `${site}/invoice/${inv.share_token}` : "";
    const number = inv.invoice_number || formatInvoiceNumber(inv.number);

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email sending isn't set up yet. Share the invoice link instead." }, { status: 503 });
    }

    const items = (Array.isArray(inv.line_items) ? inv.line_items : []).map((it: any) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;">${esc(it?.description)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;text-align:center;">${esc(it?.quantity)} ${esc(it?.unit)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;font-weight:600;color:#0F172A;text-align:right;">$${Number(it?.total || 0).toFixed(2)}</td>
        </tr>`).join("");
    const taxRate = Number(inv.tax_rate) || 0;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:linear-gradient(135deg,#132440,#1E3A5F);padding:28px 32px;border-radius:12px 12px 0 0;">
      <div style="font-weight:700;font-size:16px;color:#fff;margin-bottom:8px;">StackedWork</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Invoice ${esc(number)}</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.6);">From ${esc(contractorName)}</p>
    </div>
    <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;">
      <p style="font-size:15px;color:#374151;margin:0 0 16px;">Hi ${esc(inv.customer_name)},</p>
      <p style="font-size:14px;color:#64748B;margin:0 0 20px;line-height:1.6;">Here is your invoice for the <strong>${esc(inv.job_type || "project")}</strong>.
        Issued ${esc(longDate(inv.issue_date))}, due <strong>${esc(longDate(inv.due_date))}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <tbody>${items}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;">Subtotal</td><td style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;">${money(inv.subtotal)}</td></tr>
          ${taxRate > 0 ? `<tr><td colspan="2" style="padding:8px 12px;text-align:right;font-size:13px;color:#64748B;">Tax (${taxRate}%)</td><td style="padding:8px 12px;text-align:right;font-size:13px;color:#64748B;">${money(inv.tax_amount)}</td></tr>` : ""}
          <tr style="background:#F0FDF4;"><td colspan="2" style="padding:12px;text-align:right;font-size:15px;font-weight:700;color:#0F172A;">Amount due</td><td style="padding:12px;text-align:right;font-size:18px;font-weight:800;color:#132440;">${money(inv.total)}</td></tr>
        </tfoot>
      </table>
      ${inv.notes ? `<div style="margin:20px 0;padding:14px 16px;background:#F8FAFC;border-left:3px solid #C8E64A;border-radius:4px;"><p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${esc(inv.notes)}</p></div>` : ""}
      ${shareUrl ? `<div style="margin:28px 0 0;text-align:center;">
        <a href="${shareUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C8E64A,#A8C435);color:#132440;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">View Invoice</a>
        <p style="font-size:11px;color:#94A3B8;margin:10px 0 0;">Or copy this link: ${shareUrl}</p></div>` : ""}
    </div>
    <div style="padding:20px 32px;text-align:center;">
      <p style="font-size:12px;color:#94A3B8;margin:0;">Powered by <strong>StackedWork</strong> · Contractor CRM</p>
      ${contractorEmail ? `<p style="font-size:12px;color:#94A3B8;margin:4px 0 0;">Questions? Reply to this email or contact <a href="mailto:${esc(contractorEmail)}" style="color:#4A82C4;">${esc(contractorEmail)}</a></p>` : ""}
    </div>
  </div>
</body></html>`;

    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: inv.customer_email,
        reply_to: contractorEmail || undefined,
        subject: `Invoice ${number} from ${String(contractorName).slice(0, 60)}`,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("invoice-email: Resend error", res.status, err.slice(0, 300));
      return NextResponse.json({ error: `The email provider rejected the message (HTTP ${res.status}). The invoice was not sent.` }, { status: 502 });
    }
    // Draft -> sent (never downgrades a paid invoice). Own row only (RLS invoices_update_own).
    if (inv.status === "draft") {
      const { error: updErr } = await sb.from("invoices").update({ status: "sent" }).eq("id", inv.id).eq("contractor_id", auth.user.id);
      if (updErr) {
        console.error("invoice-email: sent but status update failed", updErr.message);
        return NextResponse.json({ ok: true, status: inv.status, warning: "Email sent, but the invoice couldn't be marked as sent." });
      }
      return NextResponse.json({ ok: true, status: "sent" });
    }
    return NextResponse.json({ ok: true, status: inv.status });
  } catch (err: any) {
    console.error("Invoice email error:", err);
    return NextResponse.json({ error: "Couldn't send the invoice email. Please try again." }, { status: 500 });
  }
}
