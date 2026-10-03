# Invoicing v1: local checks (2026-10-03)

All screenshots are from a local production build (`next start -p 3090`) against the local Supabase stub
(`tests/e2e-local/stub-supabase.js`). The data is fictional test data. Nothing here touched prod.

Re-run: `OUT=docs/invoicing-2026-10-03 PLAYWRIGHT=<path> node tests/e2e-local/invoice-shots.js` (34 flow checks + 16 width checks; `results.json`).

| File | What |
|---|---|
| estimate-create-invoice-390/1280 | Accepted estimate → "Create Invoice" box |
| invoice-detail-draft-320/390/1280 | New INV-0003 copied from the estimate (Net 15 due date) |
| invoice-editor-320/390/1280, invoice-editor-new-320 | Editor (edit + blank new), issue/due dates, line items |
| invoice-detail-paid-390 | After "Mark Paid" (paid_at set) |
| invoices-list-320/390/1280 | List with Outstanding / Overdue / Paid totals, computed Overdue badge |
| public-invoice-320/390/1280, public-invoice-paid-390 | /invoice/[token] (mobile stacked layout from #60) |
| public-invoice-print-1 | Print/PDF render (page 1) |
| pre-migration-390 | What users see before the migration is applied (no error toast) |

Width checks (no horizontal overflow, page and modal): editor, detail, list and public page at 320 and 390 all pass (also 1280).
