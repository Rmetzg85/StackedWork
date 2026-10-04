// Invoices v1: pure helpers shared by the dashboard, the public /invoice/[token] page and the email route.
// Numbering and the Net 15 default are enforced in the DB (supabase/migrations/20261003210000_invoices.sql);
// these mirror that logic for display, the editor's defaults, and the unit tests.

export const NET_DAYS_DEFAULT = 15;

/** Stored statuses. "overdue" is never stored; see invoiceDisplayStatus(). */
export type InvoiceStoredStatus = "draft" | "sent" | "paid";
export type InvoiceDisplayStatus = InvoiceStoredStatus | "overdue";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** INV-0001 ... INV-9999, then INV-10000 (same as the DB generated column invoice_number). */
export function formatInvoiceNumber(n: number | null | undefined): string {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v <= 0) return "INV-????";
  return "INV-" + (v < 10000 ? String(v).padStart(4, "0") : String(v));
}

/** Next number for a contractor given their existing numbers (DB trigger does max + 1). */
export function nextInvoiceNumber(existing: Array<number | null | undefined>): number {
  let max = 0;
  for (const n of existing) { const v = Number(n); if (Number.isFinite(v) && v > max) max = Math.floor(v); }
  return max + 1;
}

/** YYYY-MM-DD plus N calendar days (date-only math, no time zone drift). */
export function addDays(dateKey: string, days: number): string {
  if (!DATE_ONLY.test(dateKey)) throw new Error(`bad date: ${dateKey}`);
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Default due date: issue date + Net 15. */
export const defaultDueDate = (issueDate: string, netDays: number = NET_DAYS_DEFAULT): string => addDays(issueDate, netDays);

/**
 * Overdue is computed, not stored: an invoice is overdue when it has been sent, is not paid,
 * and its due date is before today (America/New_York; pass todayNY()). Drafts are never overdue
 * because the customer hasn't received them. Due today is not overdue.
 */
export function isOverdue(inv: { status?: string | null; due_date?: string | null; paid_at?: string | null }, today: string): boolean {
  if (!inv || inv.status !== "sent" || inv.paid_at) return false;
  if (!inv.due_date || !DATE_ONLY.test(String(inv.due_date).slice(0, 10))) return false;
  return String(inv.due_date).slice(0, 10) < today;
}

export function invoiceDisplayStatus(inv: { status?: string | null; due_date?: string | null; paid_at?: string | null }, today: string): InvoiceDisplayStatus {
  if (inv?.status === "paid") return "paid";
  if (isOverdue(inv, today)) return "overdue";
  return inv?.status === "sent" ? "sent" : "draft";
}

/** Whole days past due (0 when not overdue). */
export function daysOverdue(inv: { status?: string | null; due_date?: string | null; paid_at?: string | null }, today: string): number {
  if (!isOverdue(inv, today)) return 0;
  const a = Date.parse(String(inv.due_date).slice(0, 10) + "T12:00:00Z"), b = Date.parse(today + "T12:00:00Z");
  return Math.round((b - a) / 86400000);
}

export const INVOICE_STATUS_STYLE: Record<InvoiceDisplayStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "#F1F5F9", text: "#64748B", label: "Draft" },
  sent: { bg: "#DBEAFE", text: "#1E40AF", label: "Sent" },
  paid: { bg: "#D1FAE5", text: "#065F46", label: "Paid" },
  overdue: { bg: "#FEE2E2", text: "#991B1B", label: "Overdue" },
};

const money = (v: unknown) => Math.round((Number(v) || 0) * 100) / 100;

export type InvoiceLine = { description: string; quantity: number; unit: string; unit_price: number; total: number };

/** Line-item totals, rounded to cents the way the numeric(12,2) columns store them. */
export function calcInvoiceTotals(items: Array<{ total?: unknown }>, taxRate: number) {
  const subtotal = money(items.reduce((a, it) => a + (Number(it?.total) || 0), 0));
  const taxAmount = money(subtotal * ((Number(taxRate) || 0) / 100));
  return { subtotal, taxAmount, total: money(subtotal + taxAmount) };
}

/**
 * Insert payload for "Create invoice" from a saved estimate. Copies customer, line items, subtotal,
 * tax and total exactly as saved on the estimate (no recalculation), links estimate_id, status draft,
 * issue date today and due date Net 15. number is assigned by the DB.
 */
export function invoiceFromEstimate(est: any, contractorId: string, today: string) {
  const items: InvoiceLine[] = (Array.isArray(est?.line_items) ? est.line_items : [])
    .filter((it: any) => it && String(it.description ?? "").trim())
    .map((it: any) => ({
      description: String(it.description).trim(),
      quantity: Number(it.quantity) || 0,
      unit: String(it.unit ?? ""),
      unit_price: money(it.unit_price),
      total: money(it.total),
    }));
  return {
    contractor_id: contractorId,
    estimate_id: est?.id ?? null,
    status: "draft" as const,
    customer_name: String(est?.customer_name ?? "").trim(),
    customer_email: est?.customer_email ? String(est.customer_email).trim() : null,
    customer_phone: est?.customer_phone ? String(est.customer_phone).trim() : null,
    job_type: est?.job_type ?? null,
    line_items: items,
    subtotal: money(est?.subtotal),
    tax_rate: Number(est?.tax_rate) || 0,
    tax_amount: money(est?.tax_amount),
    total: money(est?.total),
    notes: est?.notes ? String(est.notes) : null,
    issue_date: today,
    due_date: defaultDueDate(today),
  };
}
