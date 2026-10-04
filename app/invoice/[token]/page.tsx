import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PrintButton from "../../estimate/[token]/PrintButton";
import { fmtDateNY, todayNY } from "../../lib/dates";
import { INVOICE_STATUS_STYLE, daysOverdue, formatInvoiceNumber, invoiceDisplayStatus } from "../../lib/invoices";

// Mirrors /estimate/[token]: per-request server client (service role; there is no anon policy on invoices),
// awaited params, token format check, and the same mobile stacked layout and print styles.
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const money = (v: unknown) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (v: string | null | undefined) => fmtDateNY(v, { month: "long", day: "numeric", year: "numeric" });
const TH = { padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "2px solid #E2E8F0" };
const LBL = { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 };

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || !/^[A-Za-z0-9_-]{8,128}$/.test(token)) notFound();
  const { data: invoice } = await getSupabase()
    .from("invoices")
    .select("number, invoice_number, status, customer_name, customer_email, customer_phone, job_type, line_items, subtotal, tax_rate, tax_amount, total, notes, issue_date, due_date, paid_at")
    .eq("share_token", token)
    .single();

  if (!invoice) notFound();

  const lineItems: any[] = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  const today = todayNY();
  const st = invoiceDisplayStatus(invoice, today);
  const sc = INVOICE_STATUS_STYLE[st];
  const late = daysOverdue(invoice, today);
  const number = invoice.invoice_number || formatInvoiceNumber(invoice.number);
  const paid = st === "paid";

  return (
    <div style={{ fontFamily: "'DM Sans', Helvetica, Arial, sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@media print{.no-print{display:none!important}body{background:#fff}}.est-tbl td,.est-tbl th{overflow-wrap:anywhere}.est-tbl .c-amt,.est-tbl .c-price,.est-tbl .c-val{white-space:nowrap}@media screen and (max-width:560px){.est-pad{padding:20px 16px!important}.est-info{grid-template-columns:1fr!important;gap:16px!important}.est-tbl,.est-tbl tbody,.est-tbl tfoot{display:block;width:100%}.est-tbl thead{display:none}.est-tbl tbody tr{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:8px;padding:12px 4px;border-bottom:1px solid #F1F5F9}.est-tbl tbody td{display:block;padding:0!important;border:none!important}.est-tbl .c-desc{flex:0 0 100%;margin-bottom:4px;font-weight:600}.est-tbl .c-qty,.est-tbl .c-price{font-size:13px!important;color:#64748B!important;text-align:left!important}.est-tbl .c-price::before{content:'\u00d7 '}.est-tbl .c-amt{margin-left:auto;text-align:right!important}.est-tbl tfoot tr{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.est-tbl tfoot td{display:block;padding-left:4px!important;padding-right:4px!important}.est-tbl tfoot .c-lbl{text-align:left!important}.est-tbl tfoot .c-grand{font-size:20px!important}}`}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div className="est-pad" style={{ background: "linear-gradient(135deg,#132440,#1E3A5F)", borderRadius: "12px 12px 0 0", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "#4A82C4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>SW</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>StackedWork</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Invoice</h1>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{number}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span data-testid="inv-status" style={{ display: "inline-block", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span>
              {late > 0 && <div style={{ fontSize: 11, color: "#FCA5A5", marginTop: 6 }}>{late} day{late === 1 ? "" : "s"} past due</div>}
              {paid && invoice.paid_at && <div style={{ fontSize: 11, color: "#A7F3D0", marginTop: 6 }}>Paid {longDate(invoice.paid_at)}</div>}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="est-pad" style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: "none", padding: "28px 32px" }}>

          {/* Bill to & dates */}
          <div className="est-info" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, overflowWrap: "anywhere" }}>
            <div>
              <div style={LBL}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 3 }}>{invoice.customer_name}</div>
              {invoice.customer_email && <div style={{ fontSize: 13, color: "#64748B" }}>{invoice.customer_email}</div>}
              {invoice.customer_phone && <div style={{ fontSize: 13, color: "#64748B" }}>{invoice.customer_phone}</div>}
            </div>
            <div>
              <div style={LBL}>Details</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#0F172A", marginBottom: 3 }}>{invoice.job_type || "General"}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>Issued: {longDate(invoice.issue_date)}</div>
              <div style={{ fontSize: 13, color: st === "overdue" ? "#EF4444" : "#64748B", fontWeight: st === "overdue" ? 700 : 400 }}>Due: {longDate(invoice.due_date)}</div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: 24 }}>
            <table className="est-tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ ...TH, textAlign: "left" }}>Description</th>
                  <th style={{ ...TH, textAlign: "center" }}>Qty</th>
                  <th style={{ ...TH, textAlign: "right" }}>Unit Price</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="c-desc" style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, color: "#374151" }}>{item.description}</td>
                    <td className="c-qty" style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, color: "#374151", textAlign: "center" }}>{item.quantity} {item.unit}</td>
                    <td className="c-price" style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, color: "#374151", textAlign: "right" }}>${Number(item.unit_price).toFixed(2)}</td>
                    <td className="c-amt" style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>${Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="c-lbl" colSpan={3} style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>Subtotal</td>
                  <td className="c-val" style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>{money(invoice.subtotal)}</td>
                </tr>
                {Number(invoice.tax_rate) > 0 && (
                  <tr>
                    <td className="c-lbl" colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>Tax ({Number(invoice.tax_rate)}%)</td>
                    <td className="c-val" style={{ padding: "8px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>{money(invoice.tax_amount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="c-lbl" colSpan={3} style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>Total</td>
                  <td className="c-val" style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>{money(invoice.total)}</td>
                </tr>
                <tr style={{ background: paid ? "#F0FDF4" : "#F8FAFC" }}>
                  <td className="c-lbl" colSpan={3} style={{ padding: "14px 12px", textAlign: "right", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{paid ? "Paid in full" : "Amount Due"}</td>
                  <td className="c-val c-grand" style={{ padding: "14px 12px", textAlign: "right", fontSize: 22, fontWeight: 800, color: "#132440" }}>{money(paid ? 0 : invoice.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ padding: "14px 16px", background: "#F8FAFC", borderLeft: "3px solid #C8E64A", borderRadius: 4, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Notes</div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{invoice.notes}</p>
            </div>
          )}

          {!paid && <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", marginBottom: 16 }}>Questions about this invoice or how to pay? Contact your contractor directly.</p>}

          {/* Print button */}
          <div className="no-print" style={{ textAlign: "center", marginTop: 8 }}>
            <PrintButton />
          </div>
        </div>

        {/* Footer */}
        <div className="est-pad" style={{ padding: "18px 32px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>Powered by <strong>StackedWork</strong> · Contractor CRM</p>
        </div>
      </div>
    </div>
  );
}
