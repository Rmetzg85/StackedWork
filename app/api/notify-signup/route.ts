import { NextResponse } from "next/server";
import { EMAIL_FROM } from "../../lib/email";

// Unauthenticated by necessity (signup with email confirmation has no session yet). Everything below is
// caller-supplied, so it is length-limited and HTML-escaped; website links only allow http(s).
const esc = (v: unknown) => String(v ?? "").slice(0, 200).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const username = esc(raw?.username), email = esc(raw?.email), phone = esc(raw?.phone);
  const website = esc(raw?.website);
  const websiteHref = /^https?:\/\/[^\s"'<>]{1,200}$/i.test(String(raw?.website || "")) ? website : "";

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true });
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: "Rmetzgar@REMVentures.Tech",
      subject: `New StackedWork signup: ${username || email}`,
      html: `
        <h2>New contractor signed up</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:15px;">
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Name</td><td><strong>${username || "—"}</strong></td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Phone</td><td>${phone ? `<a href="tel:${phone}">${phone}</a>` : "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Website</td><td>${websiteHref ? `<a href="${websiteHref}">${website}</a>` : website || "—"}</td></tr>
        </table>
        <p style="margin-top:20px;color:#666;font-size:13px;">
          ${website ? "They have a website — reach out to set up their lead capture form." : "No website provided yet — follow up to see if they need one."}
        </p>
      `,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
