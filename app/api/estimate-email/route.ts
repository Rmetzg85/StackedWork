import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { estimate, contractorName, contractorEmail, shareUrl } = await request.json();

    if (!estimate || !estimate.customer_email) {
      return NextResponse.json({ error: "Estimate and customer email required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, warning: "No email API key configured" });
    }

    const lineItemsHtml = (estimate.line_items || [])
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

    const validUntilHtml = estimate.valid_until
      ? `<p style="font-size:13px;color:#64748B;margin:0 0 4px;">Valid until: <strong>${new Date(estimate.valid_until + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></p>`
      : "";

    const taxHtml =
      estimate.tax_rate > 0
        ? `<tr><td colspan="3" style="padding:8px 12px;text-align:right;font-size:13px;color:#64748B;">Tax (${estimate.tax_rate}%)</td><td style="padding:8px 12px;text-align:right;font-size:13px;color:#64748B;">$${Number(estimate.tax_amount).toFixed(2)}</td></tr>`
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
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.6);">From ${contractorName || "Your Contractor"}</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-top:none;">
      <p style="font-size:15px;color:#374151;margin:0 0 20px;">Hi ${estimate.customer_name},</p>
      <p style="font-size:14px;color:#64748B;margin:0 0 24px;line-height:1.6;">
        Here is your estimate for the <strong>${estimate.job_type || "project"}</strong> you requested. Please review the details below.
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
          <tr><td colspan="3" style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;">Subtotal</td><td style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;">$${Number(estimate.subtotal).toFixed(2)}</td></tr>
          ${taxHtml}
          <tr style="background:#F0FDF4;">
            <td colspan="3" style="padding:12px;text-align:right;font-size:15px;font-weight:700;color:#0F172A;">Total</td>
            <td style="padding:12px;text-align:right;font-size:18px;font-weight:800;color:#132440;">$${Number(estimate.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${estimate.notes ? `<div style="margin:20px 0;padding:14px 16px;background:#F8FAFC;border-left:3px solid #C8E64A;border-radius:4px;"><p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${estimate.notes}</p></div>` : ""}

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
      ${contractorEmail ? `<p style="font-size:12px;color:#94A3B8;margin:4px 0 0;">Questions? Reply to this email or contact <a href="mailto:${contractorEmail}" style="color:#4A82C4;">${contractorEmail}</a></p>` : ""}
    </div>

  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StackedWork <notifications@stackedwork.com>",
        to: estimate.customer_email,
        reply_to: contractorEmail || undefined,
        subject: `Your ${estimate.job_type || "Project"} Estimate from ${contractorName || "Your Contractor"}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Email send failed: ${err}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Estimate email error:", err);
    return NextResponse.json({ error: err.message || "Email failed" }, { status: 500 });
  }
}
