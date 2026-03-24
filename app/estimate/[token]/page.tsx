import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function EstimatePage({ params }: { params: { token: string } }) {
  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("share_token", params.token)
    .single();

  if (!estimate) notFound();

  const lineItems: any[] = estimate.line_items || [];
  const isExpired = estimate.valid_until && new Date(estimate.valid_until) < new Date();

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "#F1F5F9", text: "#64748B", label: "Draft" },
    sent: { bg: "#DBEAFE", text: "#1E40AF", label: "Sent" },
    accepted: { bg: "#D1FAE5", text: "#065F46", label: "Accepted" },
    declined: { bg: "#FEE2E2", text: "#991B1B", label: "Declined" },
  };
  const sc = statusColors[estimate.status] || statusColors.sent;

  return (
    <div style={{ fontFamily: "'DM Sans', Helvetica, Arial, sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@media print{.no-print{display:none!important}body{background:#fff}}`}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#132440,#1E3A5F)", borderRadius: "12px 12px 0 0", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "#4A82C4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>SW</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>StackedWork</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Estimate</h1>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                Created {new Date(estimate.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span>
              {isExpired && <div style={{ fontSize: 11, color: "#FCA5A5", marginTop: 6 }}>This estimate has expired</div>}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: "none", padding: "28px 32px" }}>

          {/* Client & Job info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Prepared For</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 3 }}>{estimate.customer_name}</div>
              {estimate.customer_email && <div style={{ fontSize: 13, color: "#64748B" }}>{estimate.customer_email}</div>}
              {estimate.customer_phone && <div style={{ fontSize: 13, color: "#64748B" }}>{estimate.customer_phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Project Details</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#0F172A", marginBottom: 3 }}>{estimate.job_type || "General"}</div>
              {estimate.valid_until && (
                <div style={{ fontSize: 13, color: isExpired ? "#EF4444" : "#64748B" }}>
                  Valid until: {new Date(estimate.valid_until + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #E2E8F0" }}>Description</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #E2E8F0" }}>Qty</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #E2E8F0" }}>Unit Price</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #E2E8F0" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, color: "#374151" }}>{item.description}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, color: "#374151", textAlign: "center" }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, color: "#374151", textAlign: "right" }}>${Number(item.unit_price).toFixed(2)}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #F1F5F9", fontSize: 14, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>${Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>Subtotal</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>${Number(estimate.subtotal).toFixed(2)}</td>
                </tr>
                {estimate.tax_rate > 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>Tax ({estimate.tax_rate}%)</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 13, color: "#64748B" }}>${Number(estimate.tax_amount).toFixed(2)}</td>
                  </tr>
                )}
                <tr style={{ background: "#F0FDF4" }}>
                  <td colSpan={3} style={{ padding: "14px 12px", textAlign: "right", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Total</td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontSize: 22, fontWeight: 800, color: "#132440" }}>${Number(estimate.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div style={{ padding: "14px 16px", background: "#F8FAFC", borderLeft: "3px solid #C8E64A", borderRadius: 4, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Notes</div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{estimate.notes}</p>
            </div>
          )}

          {/* Print button */}
          <div className="no-print" style={{ textAlign: "center", marginTop: 8 }}>
            <button
              onClick={() => window.print()}
              style={{ padding: "10px 28px", background: "#F1F5F9", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "18px 32px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>Powered by <strong>StackedWork</strong> · Contractor CRM</p>
        </div>
      </div>
    </div>
  );
}
