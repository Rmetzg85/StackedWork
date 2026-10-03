// Invoices v1 helpers: numbering, Net 15 default, overdue logic, copy-from-estimate. Run via `npm run test:parser`.
const test = require("node:test"); const assert = require("node:assert/strict");
const L = require("../.tmp-test/lib/invoices.js");

test("invoice numbers format as INV-0001 and widen past 9999", () => {
  assert.equal(L.formatInvoiceNumber(1), "INV-0001");
  assert.equal(L.formatInvoiceNumber(42), "INV-0042");
  assert.equal(L.formatInvoiceNumber(9999), "INV-9999");
  assert.equal(L.formatInvoiceNumber(10000), "INV-10000");
  assert.equal(L.formatInvoiceNumber(0), "INV-????");
  assert.equal(L.formatInvoiceNumber(null), "INV-????");
});
test("next number is per-contractor max + 1 (gaps from deletes are not reused below max)", () => {
  assert.equal(L.nextInvoiceNumber([]), 1);
  assert.equal(L.nextInvoiceNumber([1, 2, 3]), 4);
  assert.equal(L.nextInvoiceNumber([1, 3]), 4);
  assert.equal(L.nextInvoiceNumber([null, undefined, 2]), 3);
});
test("due date defaults to Net 15, across month and year ends and leap day", () => {
  assert.equal(L.NET_DAYS_DEFAULT, 15);
  assert.equal(L.defaultDueDate("2026-10-03"), "2026-10-18");
  assert.equal(L.defaultDueDate("2026-10-20"), "2026-11-04");
  assert.equal(L.defaultDueDate("2026-12-25"), "2027-01-09");
  assert.equal(L.defaultDueDate("2028-02-20"), "2028-03-06");
  assert.equal(L.defaultDueDate("2026-11-01"), "2026-11-16", "DST change doesn't shift the day");
  assert.equal(L.defaultDueDate("2026-10-03", 30), "2026-11-02");
  assert.throws(() => L.defaultDueDate("10/03/2026"));
});
test("overdue: sent, unpaid, due date before today (NY); not drafts, not due today, not paid", () => {
  const t = "2026-10-20";
  assert.equal(L.isOverdue({ status: "sent", due_date: "2026-10-19" }, t), true);
  assert.equal(L.isOverdue({ status: "sent", due_date: "2026-10-20" }, t), false, "due today is not overdue");
  assert.equal(L.isOverdue({ status: "sent", due_date: "2026-10-21" }, t), false);
  assert.equal(L.isOverdue({ status: "draft", due_date: "2026-10-01" }, t), false, "drafts are never overdue");
  assert.equal(L.isOverdue({ status: "paid", due_date: "2026-10-01", paid_at: "2026-10-02T12:00:00Z" }, t), false);
  assert.equal(L.isOverdue({ status: "sent", due_date: "2026-10-01", paid_at: "2026-10-02T12:00:00Z" }, t), false);
  assert.equal(L.isOverdue({ status: "sent", due_date: null }, t), false);
  assert.equal(L.daysOverdue({ status: "sent", due_date: "2026-10-05" }, t), 15);
  assert.equal(L.daysOverdue({ status: "sent", due_date: "2026-10-25" }, t), 0);
});
test("display status maps stored status + dates", () => {
  const t = "2026-10-20";
  assert.equal(L.invoiceDisplayStatus({ status: "draft", due_date: "2026-10-01" }, t), "draft");
  assert.equal(L.invoiceDisplayStatus({ status: "sent", due_date: "2026-10-25" }, t), "sent");
  assert.equal(L.invoiceDisplayStatus({ status: "sent", due_date: "2026-10-01" }, t), "overdue");
  assert.equal(L.invoiceDisplayStatus({ status: "paid", due_date: "2026-10-01" }, t), "paid");
  assert.equal(L.invoiceDisplayStatus({ status: "weird" }, t), "draft");
  for (const s of ["draft", "sent", "paid", "overdue"]) assert.ok(L.INVOICE_STATUS_STYLE[s].label);
});
test("create from estimate copies customer, line items, subtotal, tax and total as saved", () => {
  const est = { id: "e1", customer_name: " Pat Lee ", customer_email: "pat@example.com", customer_phone: "(410) 555-0100", job_type: "Deck",
    line_items: [{ id: 9, description: "Deck boards", quantity: 3, unit: "job", unit_price: 1200, total: 3600 }, { description: "  ", quantity: 1, unit: "hours", unit_price: 0, total: 0 }],
    subtotal: 3600, tax_rate: 6, tax_amount: 216, total: 3816, notes: "Thanks", status: "accepted" };
  const inv = L.invoiceFromEstimate(est, "u1", "2026-10-03");
  assert.deepEqual(inv.line_items, [{ description: "Deck boards", quantity: 3, unit: "job", unit_price: 1200, total: 3600 }]);
  assert.equal(inv.customer_name, "Pat Lee"); assert.equal(inv.customer_email, "pat@example.com"); assert.equal(inv.customer_phone, "(410) 555-0100");
  assert.equal(inv.subtotal, 3600); assert.equal(inv.tax_rate, 6); assert.equal(inv.tax_amount, 216); assert.equal(inv.total, 3816);
  assert.equal(inv.estimate_id, "e1"); assert.equal(inv.contractor_id, "u1"); assert.equal(inv.status, "draft");
  assert.equal(inv.issue_date, "2026-10-03"); assert.equal(inv.due_date, "2026-10-18");
  for (const k of ["number", "share_token", "created_at", "updated_at", "invoice_number", "id"]) assert.equal(k in inv, false, `the DB assigns ${k}`);
});
test("totals round to cents", () => {
  assert.deepEqual(L.calcInvoiceTotals([{ total: 100.005 }, { total: 0.1 }, { total: 0.2 }], 6.25), { subtotal: 100.31, taxAmount: 6.27, total: 106.58 });
  assert.deepEqual(L.calcInvoiceTotals([], 0), { subtotal: 0, taxAmount: 0, total: 0 });
});
