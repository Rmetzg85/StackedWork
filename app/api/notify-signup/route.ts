import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, email, phone, website } = await request.json();

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
      from: "StackedWork <notifications@stackedwork.com>",
      to: "Rmetzgar@REMVentures.Tech",
      subject: `New StackedWork signup: ${username || email}`,
      html: `
        <h2>New contractor signed up</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:15px;">
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Name</td><td><strong>${username || "—"}</strong></td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Phone</td><td>${phone ? `<a href="tel:${phone}">${phone}</a>` : "—"}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#666;">Website</td><td>${website ? `<a href="${website}">${website}</a>` : "—"}</td></tr>
        </table>
        <p style="margin-top:20px;color:#666;font-size:13px;">
          ${website ? "They have a website — reach out to set up their lead capture form." : "No website provided yet — follow up to see if they need one."}
        </p>
      `,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
