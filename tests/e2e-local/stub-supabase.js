// LOCAL ONLY stub of the Supabase endpoints the app calls, for screenshots/route checks. Never touches prod.
// All rows here are clearly-labelled local test fixtures, not real customers.
const http = require("http");
const UID = "11111111-1111-4111-8111-111111111111";
const EST = { id: "e1", contractor_id: UID, share_token: "abcd1234abcd1234abcd1234abcd1234",
  customer_name: "Test Customer", customer_email: null, customer_phone: "(410) 555-0100", job_type: "Plumbing",
  line_items: [{ description: "Replace water heater", quantity: 1, unit: "job", unit_price: 1500, total: 1500 }],
  subtotal: 1500, tax_rate: 0, tax_amount: 0, total: 1500, notes: "Local stub estimate", status: "sent",
  created_at: "2026-10-02T15:00:00Z", valid_until: null };
let JOBS = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", contractor_id: UID, customer: "Test Job One", phone: "(410) 555-0101", type: "Plumbing", value: 850, status: "scheduled", date: "2026-10-02", completed: null },
  { id: "aaaaaaaa-0000-4000-8000-000000000002", contractor_id: UID, customer: "Test Job Two", phone: null, type: "HVAC", value: null, status: "quoted", date: "2026-10-01", completed: null },
  { id: "aaaaaaaa-0000-4000-8000-000000000003", contractor_id: UID, customer: "Test Job Three", phone: "(410) 555-0103", type: "Roofing", value: 3200, status: "complete", date: "2026-09-28", completed: "2026-09-30" },
];
const LEADS = [
  { id: "l1", contractor_id: UID, name: "Test Lead Unread", phone: "(410) 555-0201", email: null, message: "Local stub lead", read: false, created_at: "2026-10-02T14:00:00Z" },
  { id: "l2", contractor_id: UID, name: "Test Lead Read", phone: null, email: null, message: "Local stub lead", read: true, created_at: "2026-10-01T14:00:00Z" },
];
let PHOTOS = [
  { id: "p1", contractor_id: UID, job_type: "deck", caption: "Local stub photo", created_at: "2026-10-02T14:00:00Z",
    before_url: `http://127.0.0.1:54400/storage/v1/object/public/stackedwork-images/${UID}/portfolio/1-aaa-before.jpg`,
    after_url: `http://127.0.0.1:54400/storage/v1/object/public/stackedwork-images/${UID}/portfolio/1-aaa-after.jpg` },
];
// Invoices (LOCAL fixtures). Mimics the DB trigger from 20261003210000_invoices.sql: per-contractor number,
// INV-0001 display, Net 15 default due date, paid_at follows status. MODE.invoicesMissing=1 = before the migration.
const OTHER_UID = "22222222-2222-4222-8222-222222222222";
const fmtInv = (n) => "INV-" + (n < 10000 ? String(n).padStart(4, "0") : String(n));
const plusDays = (d, n) => { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
let INVOICES = [
  { id: "11110000-0000-4000-8000-000000000001", contractor_id: UID, estimate_id: null, number: 1, invoice_number: "INV-0001", status: "paid", customer_name: "Test Client Paid", customer_email: null, customer_phone: null, job_type: "Painting",
    line_items: [{ description: "Interior painting, 2 rooms", quantity: 1, unit: "job", unit_price: 1250, total: 1250 }], subtotal: 1250, tax_rate: 0, tax_amount: 0, total: 1250, notes: null,
    issue_date: "2026-09-10", due_date: "2026-09-25", sent_at: "2026-09-10T14:00:00Z", paid_at: "2026-09-22T14:00:00Z", share_token: "inv0paid0000000000000000000000001", created_at: "2026-09-10T14:00:00Z", updated_at: "2026-09-22T14:00:00Z" },
  { id: "11110000-0000-4000-8000-000000000002", contractor_id: UID, estimate_id: null, number: 2, invoice_number: "INV-0002", status: "sent", customer_name: "Test Client Overdue", customer_email: "overdue.client@example.test", customer_phone: "(410) 555-0144", job_type: "HVAC",
    line_items: [{ description: "Furnace tune-up", quantity: 1, unit: "job", unit_price: 189, total: 189 }, { description: "Replace blower capacitor", quantity: 1, unit: "each", unit_price: 145, total: 145 }], subtotal: 334, tax_rate: 6, tax_amount: 20.04, total: 354.04, notes: "Payment by check or Zelle. Thank you!",
    issue_date: "2026-09-12", due_date: "2026-09-27", sent_at: "2026-09-12T14:00:00Z", paid_at: null, share_token: "inv0overdue00000000000000000000002", created_at: "2026-09-12T14:00:00Z", updated_at: "2026-09-12T14:00:00Z" },
  { id: "11110000-0000-4000-8000-000000000099", contractor_id: OTHER_UID, estimate_id: null, number: 1, invoice_number: "INV-0001", status: "sent", customer_name: "Other Contractor's Client", customer_email: "other.inv@example.test", customer_phone: null, job_type: "General",
    line_items: [], subtotal: 10, tax_rate: 0, tax_amount: 0, total: 10, notes: null, issue_date: "2026-10-01", due_date: "2026-10-16", sent_at: null, paid_at: null, share_token: "inv0other000000000000000000000099", created_at: "2026-10-01T14:00:00Z", updated_at: "2026-10-01T14:00:00Z" },
];
// contractor_invoice_counters: numbers never reused after deletes. Trigger also owns share_token/created_at
// and rejects an estimate_id that isn't the same contractor's.
const COUNTERS = {}; for (const i of INVOICES) COUNTERS[i.contractor_id] = Math.max(COUNTERS[i.contractor_id] || 0, i.number);
const OWN_ESTIMATES = { "eeeeeeee-0000-4000-8000-000000000002": UID, "eeeeeeee-0000-4000-8000-000000000003": UID, "eeeeeeee-0000-4000-8000-000000000099": OTHER_UID };
const invTrigger = (row, old) => {
  if (row.estimate_id && (!old || row.estimate_id !== old.estimate_id) && OWN_ESTIMATES[row.estimate_id] !== (old ? old.contractor_id : row.contractor_id))
    return { code: "42501", message: "invoices.estimate_id must reference one of your own estimates" };
  if (!old) {
    row.number = COUNTERS[row.contractor_id] = (COUNTERS[row.contractor_id] || 0) + 1;
    row.share_token = require("crypto").randomUUID().replace(/-/g, "");
    row.created_at = new Date().toISOString();
    row.issue_date = row.issue_date || new Date().toISOString().slice(0, 10);
  } else { row.number = old.number; row.contractor_id = old.contractor_id; row.share_token = old.share_token; row.created_at = old.created_at; }
  row.invoice_number = fmtInv(row.number);
  if (!row.due_date) row.due_date = plusDays(row.issue_date, 15);
  if (row.due_date < row.issue_date) return { code: "23514", message: 'new row for relation "invoices" violates check constraint "invoices_due_after_issue"' };
  row.paid_at = row.status === "paid" ? (row.paid_at || new Date().toISOString()) : null;
  if (row.status === "sent" && !row.sent_at) row.sent_at = new Date().toISOString();
  row.updated_at = new Date().toISOString();
  return null;
};
let MODE = { allRead: false, unpriced: false, rpcMissing: false, invoicesMissing: false };
const RL = {}; const INSERTS = [];
const STORAGE_REMOVED = [];
const USER = { id: UID, aud: "authenticated", role: "authenticated", email: "a.contractor@example.test", user_metadata: { first_run_done: true }, app_metadata: {}, created_at: "2026-09-01T00:00:00Z" };
const log = [];
// manage-billing fixtures (LOCAL ONLY). Each token is a different verified user.
const BU = (id, email) => ({ id, aud: "authenticated", role: "authenticated", email, user_metadata: {}, app_metadata: {} });
const BILLING_USERS = {
  "email-local-token": BU("33333333-3333-4333-8333-333333333333", "Email.Only@Example.test"),
  "linked-local-token": BU("44444444-4444-4444-8444-444444444444", "linked.elsewhere@example.test"),
  "stripe-local-token": BU("66666666-6666-4666-8666-666666666666", "stripe.only@example.test"),
  "norow-local-token": BU("77777777-7777-4777-8777-777777777777", "nobody@example.test"),
};
const SUBS = [
  { user_id: UID, email: "a.contractor@example.test", stripe_customer_id: "cus_OWN_A", status: "active", updated_at: "2026-10-01T00:00:00Z" },
  { user_id: UID, email: "a.contractor@example.test", stripe_customer_id: "cus_OLD_A", status: "canceled", updated_at: "2026-09-01T00:00:00Z" },
  { user_id: "22222222-2222-4222-8222-222222222222", email: "victim.b@example.test", stripe_customer_id: "cus_VICTIM_B", status: "active", updated_at: "2026-10-01T00:00:00Z" },
  { user_id: null, email: "email.only@example.test", stripe_customer_id: "cus_EMAILROW_E", status: "trialing", updated_at: "2026-10-01T00:00:00Z" },
  { user_id: "55555555-5555-4555-8555-555555555555", email: "linked.elsewhere@example.test", stripe_customer_id: "cus_LINKED_OTHER", status: "active", updated_at: "2026-10-01T00:00:00Z" },
];
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS", "Access-Control-Expose-Headers": "*" };
  const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json", ...cors }); res.end(body === undefined ? "" : JSON.stringify(body)); };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
  console.log(req.method, u.pathname, u.search.slice(0, 160));
  if (u.pathname === "/auth/v1/user") {
    const tok = (req.headers.authorization || "").replace(/^Bearer /i, "");
    if (tok === "good-local-token") return send(200, USER);
    if (BILLING_USERS[tok]) return send(200, BILLING_USERS[tok]);
    return send(401, { code: 401, msg: "invalid JWT" });
  }
  if (u.pathname === "/__mode") { for (const [k, v] of u.searchParams) MODE[k] = v === "1"; return send(200, MODE); }
  if (u.pathname === "/__storage_removed") return send(200, STORAGE_REMOVED);
  if (u.pathname.startsWith("/auth/v1/")) return send(200, {});
  if (u.pathname.startsWith("/storage/v1/object/public/")) { res.writeHead(200, { "Content-Type": "image/svg+xml", ...cors }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#ccc"/></svg>'); }
  if (u.pathname === "/storage/v1/object/stackedwork-images" && req.method === "DELETE") {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { const pre = (JSON.parse(b || "{}").prefixes) || []; STORAGE_REMOVED.push(...pre); console.log("STORAGE remove", pre); send(200, pre.map((name) => ({ name, bucket_id: "stackedwork-images" }))); });
    return;
  }
  if (u.pathname === "/rest/v1/rpc/rate_limit_hit") {
    // MODE.rpcMissing=1 behaves like prod before migration 20261003200000 (PostgREST: function not found).
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
      if (MODE.rpcMissing) { console.log("RPC rate_limit_hit -> 404 PGRST202 (missing)"); return send(404, { code: "PGRST202", message: "Could not find the function public.rate_limit_hit(p_key, p_window_seconds) in the schema cache" }); }
      const { p_key } = JSON.parse(b || "{}"); RL[p_key] = (RL[p_key] || 0) + 1; console.log("RPC rate_limit_hit key=", p_key, "->", RL[p_key]); send(200, RL[p_key]);
    });
    return;
  }
  if (req.method === "POST" && /^\/rest\/v1\/(leads|homeowner_leads)$/.test(u.pathname)) {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { INSERTS.push({ t: u.pathname.slice(9), row: JSON.parse(b || "{}") }); console.log("INSERT", u.pathname.slice(9)); send(201, []); });
    return;
  }
  if (u.pathname === "/__inserts") return send(200, INSERTS);
  const t = u.pathname.replace("/rest/v1/", "");
  if (t === "invoices") {
    if (MODE.invoicesMissing) return send(404, { code: "PGRST205", message: "Could not find the table 'public.invoices' in the schema cache" });
    const eq = (k) => (u.searchParams.get(k) || "").replace(/^eq\./, "");
    const id = eq("id"), cid = eq("contractor_id"), tok = eq("share_token");
    const match = (r) => (!id || r.id === id) && (!cid || r.contractor_id === cid) && (!tok || r.share_token === tok);
    if (req.method === "GET") {
      const rows = INVOICES.filter(match).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      console.log("GET invoices", { id, cid, tok: tok && tok.slice(0, 8) }, "->", rows.length, "auth=", (req.headers.authorization || "").slice(0, 25));
      if (single) return rows[0] ? send(200, rows[0]) : send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
      return send(200, rows);
    }
    if (req.method === "DELETE") { const hit = INVOICES.filter(match); INVOICES = INVOICES.filter((r) => !hit.includes(r)); console.log("DELETE invoices", id, "->", hit.length); return send(single ? 200 : 200, single ? hit[0] || null : hit); }
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
      const body = JSON.parse(b || "{}");
      if (req.method === "POST") {
        const row = { sent_at: null, paid_at: null, notes: null, ...body, id: require("crypto").randomUUID() };
        const e = invTrigger(row, null); if (e) return send(400, e);
        INVOICES.push(row); console.log("INSERT invoices", row.invoice_number, row.customer_name, row.total, "due", row.due_date);
        return send(201, single ? row : [row]);
      }
      if (req.method === "PATCH") {
        const hit = INVOICES.filter(match);
        for (const old of hit) { const row = { ...old, ...body }; const e = invTrigger(row, old); if (e) return send(400, e); Object.assign(old, row); }
        console.log("PATCH invoices", id, "cid", cid, "->", hit.length, JSON.stringify(body).slice(0, 120));
        if (single) return hit[0] ? send(200, hit[0]) : send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
        return send(200, hit);
      }
      send(405, {});
    });
    return;
  }
  if (u.pathname === "/__invoices") return send(200, INVOICES);
  if (t === "estimates" && u.searchParams.get("share_token")) {
    const tok = u.searchParams.get("share_token").replace(/^eq\./, "");
    if (tok === EST.share_token) return send(200, EST);
    return send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
  }
  if (t === "estimates" && req.method === "PATCH") { console.log("PATCH estimates", u.search); return send(200, []); }
  if (t === "estimates") {
    // Saved rows. OWN belongs to the test user; OTHER belongs to someone else (the route must not load it).
    const OWN = { ...EST, id: "eeeeeeee-0000-4000-8000-000000000002", status: "draft", customer_email: "saved.customer@example.test", customer_name: "Saved Row Customer" };
    const OTHER = { ...EST, id: "eeeeeeee-0000-4000-8000-000000000099", contractor_id: "22222222-2222-4222-8222-222222222222", customer_email: "other@example.test" };
    const id = (u.searchParams.get("id") || "").replace(/^eq\./, ""), cid = (u.searchParams.get("contractor_id") || "").replace(/^eq\./, "");
    // ACC: an accepted estimate for the "Create invoice" flow (fictional test data).
    const ACC = { ...EST, id: "eeeeeeee-0000-4000-8000-000000000003", status: "accepted", customer_name: "Test Client Deck", customer_email: "deck.client@example.test", job_type: "Deck",
      line_items: [{ description: "Composite deck boards, 12x16", quantity: 1, unit: "job", unit_price: 4200, total: 4200 }, { description: "Railing, 28 ft", quantity: 28, unit: "linear ft", unit_price: 45, total: 1260 }],
      subtotal: 5460, tax_rate: 6, tax_amount: 327.6, total: 5787.6, notes: "Includes haul-away of the old deck.", created_at: "2026-10-01T15:00:00Z" };
    const rows = [ACC, OWN, OTHER].filter((r) => (!id || r.id === id) && (!cid || r.contractor_id === cid));
    console.log("GET estimates id=", id, "contractor_id=", cid, "->", rows.length, "auth=", (req.headers.authorization || "").slice(0, 25));
    return send(200, single ? rows[0] || null : rows);
  }
  if (t === "profiles" && u.searchParams.get("select") === "name") return send(200, single ? { name: "Saved Profile Name" } : [{ name: "Saved Profile Name" }]);
  if (t === "subscriptions" && (req.headers.authorization || "") === "Bearer service-local-key") {
    // manage-billing (service role, after auth): honour the user_id / email(ilike) filters like PostgREST would.
    const uid = (u.searchParams.get("user_id") || "").replace(/^eq\./, "");
    const em = (u.searchParams.get("email") || "").replace(/^ilike\./, "").replace(/\\(.)/g, "$1").toLowerCase();
    const rows = SUBS.filter((r) => (!uid || r.user_id === uid) && (!em || (r.email || "").toLowerCase() === em));
    console.log("SERVICE subscriptions user_id=", uid || "-", "email~", em || "-", "->", rows.map((r) => r.stripe_customer_id).join(",") || "none");
    return send(200, rows);
  }
  if (t === "subscriptions") { const row = { status: "active", plan: "monthly", stripe_customer_id: null, current_period_end: "2026-11-01T00:00:00Z", trial_end: null, cancel_at: null, cancelled_at: null, updated_at: "2026-10-01T00:00:00Z", user_id: UID, email: USER.email }; return send(200, single ? row : [row]); }
  if (t === "jobs" && req.method === "DELETE") {
    const id = (u.searchParams.get("id") || "").replace(/^eq\./, ""); const cid = (u.searchParams.get("contractor_id") || "").replace(/^eq\./, "");
    const hit = JOBS.filter((j) => j.id === id && j.contractor_id === cid); JOBS = JOBS.filter((j) => !hit.includes(j));
    console.log("DELETE jobs id=", id, "contractor_id=", cid, "deleted=", hit.length);
    return send(200, hit.map((j) => ({ id: j.id })));
  }
  if (t === "jobs" && req.method === "POST") {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { const row = { id: "aaaaaaaa-0000-4000-8000-0000000000" + String(10 + JOBS.length), created_at: new Date().toISOString(), completed: null, ...JSON.parse(b || "{}") }; JOBS.unshift(row); console.log("INSERT jobs", JSON.stringify(row)); send(201, single ? row : [row]); });
    return;
  }
  if (t === "jobs") return send(200, MODE.unpriced ? JOBS.map((j) => ({ ...j, value: null })) : JOBS);
  if (t === "leads") return send(200, MODE.allRead ? LEADS.map((l) => ({ ...l, read: true })) : LEADS);
  if (t === "portfolio" && req.method === "DELETE") { const id = (u.searchParams.get("id") || "").replace(/^eq\./, ""); PHOTOS = PHOTOS.filter((p) => p.id !== id); return send(204); }
  if (t === "portfolio") return send(200, PHOTOS);
  if (t === "profiles") return single ? send(406, { code: "PGRST116", message: "no rows" }) : send(200, []);
  return send(200, single ? null : []);
}).listen(54400, () => console.log("stub on 54400"));
