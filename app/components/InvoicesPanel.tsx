"use client";
// Invoices v1 (dashboard side). Rendered inside the Estimates tab as the "Invoices" section.
// Data rules live in the DB (numbering, Net 15 default, paid_at) and app/lib/invoices.ts (overdue display).
import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fmtDateNY, todayNY } from "../lib/dates";
import { unitOptions } from "../lib/units";
import { INVOICE_STATUS_STYLE, calcInvoiceTotals, daysOverdue, defaultDueDate, formatInvoiceNumber, invoiceDisplayStatus, invoiceFromEstimate } from "../lib/invoices";

const G = "#C8E64A", GD = "#A8C435";
const Btn = ({ children, onClick, style, ...rest }: any) => <button onClick={onClick} style={{ padding: "8px 18px", background: G, color: "#132440", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: rest.disabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans'", opacity: rest.disabled ? 0.7 : 1, ...style }} {...rest}>{children}</button>;
const BtnO = ({ children, onClick, style, ...rest }: any) => <button onClick={onClick} style={{ padding: "8px 18px", background: "#fff", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: rest.disabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans'", opacity: rest.disabled ? 0.7 : 1, ...style }} {...rest}>{children}</button>;
const Card = ({ children, style }: any) => <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, ...style }}>{children}</div>;
const money = (v: unknown) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (inv: any) => inv?.invoice_number || formatInvoiceNumber(inv?.number);
const INP = { width: "100%", padding: "9px 10px", border: "1.5px solid #E2E8F0", borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans'", outline: "none", boxSizing: "border-box" as const, minWidth: 0, background: "#fff" };
const LBL = { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } as const;
const JOB_TYPES = ["General", "Plumbing", "Electrical", "HVAC", "Roofing", "Drywall", "Painting", "Deck", "Flooring", "Other"];

export const InvBadge = ({ inv }: { inv: any }) => {
  const c = INVOICE_STATUS_STYLE[invoiceDisplayStatus(inv, todayNY())];
  return <span data-testid="inv-badge" style={{ display: "inline-block", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, whiteSpace: "nowrap" }}>{c.label}</span>;
};

/** One-line due/paid summary for list rows. */
export function dueText(inv: any): string {
  const today = todayNY();
  const st = invoiceDisplayStatus(inv, today);
  if (st === "paid") return inv.paid_at ? `Paid ${fmtDateNY(inv.paid_at)}` : "Paid";
  if (st === "overdue") { const d = daysOverdue(inv, today); return `${d} day${d === 1 ? "" : "s"} overdue`; }
  return inv.due_date ? `Due ${fmtDateNY(inv.due_date)}` : "";
}

type Props = {
  supabase: SupabaseClient;
  userId: string | null;
  invoices: any[];
  setInvoices: (fn: (prev: any[]) => any[]) => void;
  fromEstimate: any | null;          // set by the estimate detail's "Create invoice" button
  onFromEstimateDone: () => void;
  openInvoiceId: string | null;      // set by "View invoice" on an estimate
  onOpenInvoiceDone: () => void;
  showToast: (msg: string, kind?: "error" | "success" | "info") => void;
  toastErr: (what: string, err: any) => void;
  authJsonHeaders: () => Promise<Record<string, string>>;
  needAccount: (what: string) => void;
  unavailable?: boolean;             // invoices table not migrated yet
};

type Draft = { id?: string; customer_name: string; customer_email: string; customer_phone: string; job_type: string; issue_date: string; due_date: string; dueTouched: boolean; tax_rate: string; notes: string; line_items: any[]; estimate_id?: string | null };

const blankDraft = (): Draft => {
  const t = todayNY();
  return { customer_name: "", customer_email: "", customer_phone: "", job_type: "General", issue_date: t, due_date: defaultDueDate(t), dueTouched: false, tax_rate: "0", notes: "", line_items: [{ id: 1, description: "", quantity: 1, unit: "hours", unit_price: 0, total: 0 }] };
};
const draftFrom = (inv: any): Draft => ({
  id: inv.id, customer_name: inv.customer_name || "", customer_email: inv.customer_email || "", customer_phone: inv.customer_phone || "", job_type: inv.job_type || "General",
  issue_date: inv.issue_date || todayNY(), due_date: inv.due_date || defaultDueDate(inv.issue_date || todayNY()), dueTouched: true, tax_rate: String(inv.tax_rate ?? 0), notes: inv.notes || "",
  line_items: (inv.line_items || []).map((it: any, i: number) => ({ ...it, id: Date.now() + i })), estimate_id: inv.estimate_id ?? null,
});

export default function InvoicesPanel(p: Props) {
  const { supabase, userId, invoices, setInvoices, showToast, toastErr } = p;
  const [detail, setDetail] = useState<any | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const today = todayNY();
  const createdFor = useRef<string | null>(null);

  const upsertLocal = (row: any) => {
    setInvoices(prev => prev.some(x => x.id === row.id) ? prev.map(x => x.id === row.id ? row : x) : [row, ...prev]);
    setDetail((d: any) => (d && d.id === row.id ? row : d));
  };

  // Insert with one retry on a unique violation (backstop; the DB trigger numbers from a per-contractor counter).
  // number, share_token and created_at/updated_at are assigned by the DB trigger, so they're never sent;
  // the share link always uses the share_token from the returned row (.select().single()).
  const insertInvoice = async (input: any) => {
    const { number: _n, share_token: _t, created_at: _c, updated_at: _u, invoice_number: _i, id: _id, ...payload } = input || {};
    let res = await supabase.from("invoices").insert(payload).select().single();
    if (res.error && (res.error as any).code === "23505") res = await supabase.from("invoices").insert(payload).select().single();
    return res;
  };

  // "Create invoice" from an estimate: copy it as saved, then open the new draft.
  useEffect(() => {
    const est = p.fromEstimate;
    if (!est || !userId) return;
    p.onFromEstimateDone();
    if (createdFor.current === est.id) return; // effects can re-run (dev StrictMode); create once per click
    createdFor.current = est.id;
    setTimeout(() => { if (createdFor.current === est.id) createdFor.current = null; }, 3000);
    (async () => {
      const { data, error } = await insertInvoice(invoiceFromEstimate(est, userId, todayNY()));
      if (error) { toastErr("Couldn't create the invoice", error); return; }
      upsertLocal(data);
      setDetail(data);
      showToast(`${num(data)} created from ${est.customer_name}'s estimate. Due ${fmtDateNY(data.due_date)} (Net 15).`, "success");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fromEstimate, userId]);

  useEffect(() => {
    if (!p.openInvoiceId) return;
    const inv = invoices.find(x => x.id === p.openInvoiceId);
    if (inv) setDetail(inv);
    p.onOpenInvoiceDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.openInvoiceId]);

  const setStatus = async (inv: any, status: "draft" | "sent" | "paid", quiet = false) => {
    if (busy) return false;
    setBusy(true);
    const patch: any = { status };
    if (status === "paid") patch.paid_at = new Date().toISOString(); else patch.paid_at = null;
    const { data, error } = await supabase.from("invoices").update(patch).eq("id", inv.id).eq("contractor_id", userId).select().single();
    setBusy(false);
    if (error) { toastErr("Couldn't update the invoice", error); return false; }
    upsertLocal(data);
    if (!quiet) showToast(status === "paid" ? `${num(data)} marked paid.` : status === "sent" ? `${num(data)} marked sent.` : `${num(data)} moved back to draft.`, "success");
    return true;
  };

  const shareUrl = (inv: any) => `${window.location.origin}/invoice/${inv.share_token}`;
  // Link sharing is the primary way to send: sharing a draft marks it sent (so due/overdue tracking starts).
  const shareLink = async (inv: any, mode: "copy" | "open" | "native") => {
    const url = shareUrl(inv);
    if (mode === "open") window.open(url, "_blank");
    else if (mode === "native" && (navigator as any).share) { try { await (navigator as any).share({ title: `Invoice ${num(inv)}`, url }); } catch { return; } }
    else { try { await navigator.clipboard?.writeText(url); showToast("Invoice link copied.", "success"); } catch { showToast(url, "info"); } }
    if (inv.status === "draft" && mode !== "open") await setStatus(inv, "sent", true);
  };

  const emailInvoice = async (inv: any) => {
    if (!inv.customer_email || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/invoice-email", { method: "POST", headers: await p.authJsonHeaders(), body: JSON.stringify({ invoiceId: inv.id }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) { showToast(`Invoice email was NOT sent: ${data?.error || `HTTP ${res.status}`}`, "error"); return; }
      if (data.status === "sent") upsertLocal({ ...inv, status: "sent", sent_at: inv.sent_at || new Date().toISOString() });
      showToast(`${num(inv)} emailed to ${inv.customer_email}.`, "success");
    } catch (e: any) { showToast(`Invoice email was NOT sent: ${e?.message || "network error"}`, "error"); }
    finally { setBusy(false); }
  };

  const deleteInvoice = async (inv: any) => {
    if (!confirm(`Delete ${num(inv)}? This can't be undone.`)) return;
    const { error } = await supabase.from("invoices").delete().eq("id", inv.id).eq("contractor_id", userId);
    if (error) { toastErr("Couldn't delete the invoice", error); return; }
    setInvoices(prev => prev.filter(x => x.id !== inv.id));
    setDetail(null);
    showToast(`${num(inv)} deleted.`, "success");
  };

  const saveDraft = async () => {
    if (!draft || !userId || !draft.customer_name.trim()) return;
    if (draft.due_date && draft.issue_date && draft.due_date < draft.issue_date) { setErr("Due date can't be before the issue date."); return; }
    setSaving(true); setErr(null);
    const taxRate = parseFloat(draft.tax_rate) || 0;
    const items = draft.line_items.filter(it => String(it.description).trim()).map(({ id: _id, ...it }) => ({ ...it, quantity: Number(it.quantity) || 0, unit_price: Number(it.unit_price) || 0, total: Number(it.total) || 0 }));
    const { subtotal, taxAmount, total } = calcInvoiceTotals(items, taxRate);
    const fields = {
      customer_name: draft.customer_name.trim(), customer_email: draft.customer_email.trim() || null, customer_phone: draft.customer_phone.trim() || null,
      job_type: draft.job_type, line_items: items, subtotal, tax_rate: taxRate, tax_amount: taxAmount, total, notes: draft.notes.trim() || null,
      issue_date: draft.issue_date || today, due_date: draft.due_date || defaultDueDate(draft.issue_date || today),
    };
    const res = draft.id
      ? await supabase.from("invoices").update(fields).eq("id", draft.id).eq("contractor_id", userId).select().single()
      : await insertInvoice({ ...fields, contractor_id: userId, status: "draft", estimate_id: draft.estimate_id ?? null });
    setSaving(false);
    if (res.error) { setErr(res.error.message); toastErr("Couldn't save the invoice", res.error); return; }
    upsertLocal(res.data);
    setDraft(null);
    setDetail(res.data);
    showToast(draft.id ? `${num(res.data)} saved.` : `${num(res.data)} created as a draft.`, "success");
  };

  const updLine = (id: number, field: string, value: any) => setDraft(d => d && ({ ...d, line_items: d.line_items.map(it => {
    if (it.id !== id) return it;
    const u = { ...it, [field]: value };
    if (field === "quantity" || field === "unit_price") u.total = parseFloat((Number(u.quantity) * Number(u.unit_price)).toFixed(2));
    return u;
  }) }));

  const open = invoices.filter(i => i.status !== "paid");
  const overdue = open.filter(i => invoiceDisplayStatus(i, today) === "overdue");
  const sum = (a: any[]) => a.reduce((s, i) => s + (Number(i.total) || 0), 0);

  return (<>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10, flexWrap: "wrap" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Invoices</h1>
      <Btn onClick={() => userId ? (setErr(null), setDraft(blankDraft())) : p.needAccount("create and send invoices")}>+ New Invoice</Btn>
    </div>
    <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 14 }}>Bill clients from an estimate or from scratch. Share the link or email it; mark it paid when the money's in.</p>
    {invoices.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 14 }}>
      {[{ l: "Outstanding", v: money(sum(open)), c: "#0F172A" }, { l: `Overdue (${overdue.length})`, v: money(sum(overdue)), c: overdue.length ? "#B91C1C" : "#0F172A" }, { l: "Paid", v: money(sum(invoices.filter(i => i.status === "paid"))), c: "#065F46" }].map(s =>
        <Card key={s.l} style={{ padding: "10px 12px", minWidth: 0 }}><div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{s.l}</div><div style={{ fontSize: 15, fontWeight: 800, color: s.c, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.v}</div></Card>)}
    </div>}
    {p.unavailable
      ? <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#0F172A", marginBottom: 6 }}>Invoicing is almost ready</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Invoices will appear here once the latest StackedWork update finishes rolling out.</div>
        </Card>
      : invoices.length === 0
      ? <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#0F172A", marginBottom: 6 }}>No invoices yet</div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>Open an accepted estimate and tap “Create invoice”, or start a blank one.</div>
          <Btn onClick={() => userId ? (setErr(null), setDraft(blankDraft())) : p.needAccount("create and send invoices")}>Create First Invoice</Btn>
        </Card>
      : <Card style={{ overflow: "hidden" }}>
          {invoices.map((inv: any, i: number) => (
            <div key={inv.id} data-testid="inv-row" style={{ padding: "14px 18px", borderBottom: i < invoices.length - 1 ? "1px solid #F1F5F9" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setDetail(inv)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{num(inv)} · {inv.customer_name}</div>
                <div style={{ fontSize: 11, color: invoiceDisplayStatus(inv, today) === "overdue" ? "#B91C1C" : "#94A3B8", marginTop: 2 }}>{inv.job_type || "General"} · {dueText(inv)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{money(inv.total)}</span>
                <InvBadge inv={inv} />
              </div>
            </div>
          ))}
        </Card>}

    {/* Detail */}
    {detail && !draft && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setDetail(null)}>
      <div role="dialog" aria-label={`Invoice ${num(detail)}`} style={{ background: "#fff", borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg,#132440,#1E3A5F)", borderRadius: "16px 16px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{num(detail)}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail.customer_name} · {detail.job_type || "General"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <InvBadge inv={detail} />
            <button onClick={() => { setErr(null); setDraft(draftFrom(detail)); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans'" }}>✏️ Edit</button>
            <button aria-label="Close" onClick={() => setDetail(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 14, fontSize: 12, color: "#64748B" }}>
            <div><div style={{ fontWeight: 700, color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Issued</div>{fmtDateNY(detail.issue_date)}</div>
            <div><div style={{ fontWeight: 700, color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Due</div><span style={{ color: invoiceDisplayStatus(detail, today) === "overdue" ? "#B91C1C" : undefined, fontWeight: invoiceDisplayStatus(detail, today) === "overdue" ? 700 : 400 }}>{fmtDateNY(detail.due_date)}{invoiceDisplayStatus(detail, today) === "overdue" ? ` · ${dueText(detail)}` : ""}</span></div>
            {detail.paid_at && <div><div style={{ fontWeight: 700, color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paid</div>{fmtDateNY(detail.paid_at)}</div>}
            {detail.customer_email && <div style={{ overflowWrap: "anywhere" }}><div style={{ fontWeight: 700, color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</div>{detail.customer_email}</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            {(detail.line_items || []).map((it: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13, color: "#374151" }}>
                <div style={{ minWidth: 0, overflowWrap: "anywhere" }}><div style={{ fontWeight: 600 }}>{it.description}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{it.quantity} {it.unit} × ${Number(it.unit_price).toFixed(2)}</div></div>
                <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>${Number(it.total).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ textAlign: "right", fontSize: 12, color: "#64748B", marginTop: 8 }}>Subtotal {money(detail.subtotal)}{Number(detail.tax_rate) > 0 ? ` · Tax (${Number(detail.tax_rate)}%) ${money(detail.tax_amount)}` : ""}</div>
            <div style={{ textAlign: "right", fontSize: 18, fontWeight: 800, color: "#132440" }}>Total {money(detail.total)}</div>
          </div>
          {detail.notes && <div style={{ padding: "10px 14px", background: "#F8FAFC", borderLeft: "3px solid #C8E64A", borderRadius: 4, marginBottom: 14 }}><p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{detail.notes}</p></div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {detail.status !== "paid"
              ? <Btn data-testid="inv-mark-paid" disabled={busy} onClick={() => setStatus(detail, "paid")} style={{ fontSize: 12, padding: "8px 14px" }}>✅ Mark Paid</Btn>
              : <BtnO disabled={busy} onClick={() => setStatus(detail, "sent")} style={{ fontSize: 12, padding: "8px 14px" }}>Mark Unpaid</BtnO>}
            <Btn onClick={() => shareLink(detail, typeof navigator !== "undefined" && (navigator as any).share ? "native" : "copy")} style={{ fontSize: 12, padding: "8px 14px" }}>🔗 Share Link</Btn>
            <BtnO onClick={() => shareLink(detail, "copy")} style={{ fontSize: 12, padding: "8px 14px" }}>📋 Copy Link</BtnO>
            <BtnO onClick={() => shareLink(detail, "open")} style={{ fontSize: 12, padding: "8px 14px" }}>👁 Preview</BtnO>
            {detail.customer_email && <BtnO disabled={busy} onClick={() => emailInvoice(detail)} style={{ fontSize: 12, padding: "8px 14px" }}>📧 Email</BtnO>}
            {detail.status === "draft" && <BtnO disabled={busy} onClick={() => setStatus(detail, "sent")} style={{ fontSize: 12, padding: "8px 14px" }}>Mark Sent</BtnO>}
            <BtnO onClick={() => deleteInvoice(detail)} style={{ fontSize: 12, padding: "8px 14px", color: "#EF4444" }}>Delete</BtnO>
          </div>
          {detail.status === "draft" && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>Sharing or emailing the link marks this invoice sent. It shows Overdue if it's still unpaid after the due date.</p>}
        </div>
      </div>
    </div>}

    {/* Editor (new / edit) */}
    {draft && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 71, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div role="dialog" aria-label="Invoice editor" data-testid="inv-editor" style={{ background: "#fff", borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,#132440,#1E3A5F)", borderRadius: "16px 16px 0 0", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{draft.id ? `Edit ${num(invoices.find(x => x.id === draft.id))}` : "New Invoice"}</div>
          <button aria-label="Close editor" onClick={() => setDraft(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/3" }}><label style={LBL}>Customer Name *</label><input aria-label="Customer name" value={draft.customer_name} onChange={e => setDraft({ ...draft, customer_name: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Email</label><input type="email" aria-label="Customer email" value={draft.customer_email} onChange={e => setDraft({ ...draft, customer_email: e.target.value })} style={INP} /></div>
            <div><label style={LBL}>Phone</label><input type="tel" aria-label="Customer phone" value={draft.customer_phone} onChange={e => setDraft({ ...draft, customer_phone: e.target.value })} style={INP} /></div>
            <div style={{ gridColumn: "1/3" }}><label style={LBL}>Job Type</label><select value={draft.job_type} onChange={e => setDraft({ ...draft, job_type: e.target.value })} style={INP}>{(JOB_TYPES.includes(draft.job_type) ? JOB_TYPES : [...JOB_TYPES, draft.job_type]).map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label style={LBL}>Issue Date</label><input type="date" aria-label="Issue date" value={draft.issue_date} onChange={e => { const v = e.target.value; setDraft({ ...draft, issue_date: v, due_date: !draft.dueTouched && /^\d{4}-\d{2}-\d{2}$/.test(v) ? defaultDueDate(v) : draft.due_date }); }} style={INP} /></div>
            <div><label style={LBL}>Due Date <span style={{ fontWeight: 400, color: "#94A3B8" }}>(Net 15)</span></label><input type="date" aria-label="Due date" value={draft.due_date} min={draft.issue_date} onChange={e => setDraft({ ...draft, due_date: e.target.value, dueTouched: true })} style={INP} /></div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Line Items</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
            {draft.line_items.map(it => (
              <div key={it.id} className="sw-li" style={{ gap: 5 }}>
                <input className="sw-li-d" aria-label="Description" value={it.description} onChange={e => updLine(it.id, "description", e.target.value)} placeholder="Description" style={{ padding: "7px 8px", border: "1.5px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans'", outline: "none" }} />
                <input className="sw-li-q" aria-label="Quantity" type="number" min="0" value={it.quantity} onChange={e => updLine(it.id, "quantity", e.target.value)} style={{ padding: "7px 6px", border: "1.5px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans'", outline: "none", textAlign: "center" }} />
                <select className="sw-li-u" aria-label="Unit" value={it.unit} onChange={e => updLine(it.id, "unit", e.target.value)} style={{ padding: "7px 4px", border: "1.5px solid #E2E8F0", borderRadius: 6, fontSize: 11, fontFamily: "'DM Sans'", outline: "none", background: "#fff" }}>
                  {unitOptions(it.unit).map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
                <input className="sw-li-p" aria-label="Price per unit" type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updLine(it.id, "unit_price", e.target.value)} style={{ padding: "7px 6px", border: "1.5px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans'", outline: "none", textAlign: "right" }} />
                <div className="sw-li-t" aria-label="Amount" style={{ padding: "7px 6px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${Number(it.total || 0).toFixed(2)}</div>
                <button className="sw-li-x" aria-label="Remove line item" onClick={() => setDraft({ ...draft, line_items: draft.line_items.filter(x => x.id !== it.id) })} style={{ background: "none", border: "none", color: "#CBD5E1", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>×</button>
              </div>
            ))}
          </div>
          <button onClick={() => setDraft({ ...draft, line_items: [...draft.line_items, { id: Date.now(), description: "", quantity: 1, unit: "hours", unit_price: 0, total: 0 }] })} style={{ fontSize: 12, color: GD, fontWeight: 600, background: "none", border: `1px dashed ${G}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans'", width: "100%", marginBottom: 14 }}>+ Add Line Item</button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
            <div><label style={LBL}>Tax Rate (%)</label><input type="number" min="0" max="30" step="0.1" aria-label="Tax rate" value={draft.tax_rate} onChange={e => setDraft({ ...draft, tax_rate: e.target.value })} style={INP} /></div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
              {(() => { const { subtotal, taxAmount, total } = calcInvoiceTotals(draft.line_items, parseFloat(draft.tax_rate) || 0); return <div data-testid="inv-editor-total" style={{ padding: "9px 10px", background: "#F0FDF4", borderRadius: 7, textAlign: "right" }}><div style={{ fontSize: 11, color: "#64748B" }}>Subtotal: ${subtotal.toFixed(2)}{taxAmount > 0 ? ` · Tax: $${taxAmount.toFixed(2)}` : ""}</div><div style={{ fontSize: 16, fontWeight: 800, color: "#132440" }}>Total: ${total.toFixed(2)}</div></div>; })()}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}><label style={LBL}>Notes</label><textarea aria-label="Notes" value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={3} placeholder="e.g. Payment by check or Zelle. Thank you!" style={{ ...INP, resize: "vertical" }} /></div>
          {err && <div style={{ marginBottom: 12, padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#991B1B" }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            <BtnO onClick={() => setDraft(null)} style={{ fontSize: 13, padding: 11 }}>Cancel</BtnO>
            <button data-testid="inv-save" onClick={saveDraft} disabled={saving || !draft.customer_name.trim()} style={{ padding: 11, background: `linear-gradient(135deg,${G},${GD})`, color: "#132440", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving || !draft.customer_name.trim() ? "not-allowed" : "pointer", opacity: saving || !draft.customer_name.trim() ? 0.6 : 1, fontFamily: "'DM Sans'" }}>{saving ? "Saving..." : draft.id ? "Save Changes" : "Create Invoice"}</button>
          </div>
        </div>
      </div>
    </div>}
  </>);
}
