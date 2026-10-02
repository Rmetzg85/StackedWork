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
const USER = { id: UID, aud: "authenticated", role: "authenticated", email: "a.contractor@example.test", user_metadata: { first_run_done: true }, app_metadata: {}, created_at: "2026-09-01T00:00:00Z" };
const log = [];
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS", "Access-Control-Expose-Headers": "*" };
  const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json", ...cors }); res.end(body === undefined ? "" : JSON.stringify(body)); };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
  console.log(req.method, u.pathname, u.search.slice(0, 160));
  if (u.pathname === "/auth/v1/user") {
    const tok = (req.headers.authorization || "").replace(/^Bearer /i, "");
    return tok === "good-local-token" ? send(200, USER) : send(401, { code: 401, msg: "invalid JWT" });
  }
  if (u.pathname.startsWith("/auth/v1/")) return send(200, {});
  const t = u.pathname.replace("/rest/v1/", "");
  if (t === "estimates" && u.searchParams.get("share_token")) {
    const tok = u.searchParams.get("share_token").replace(/^eq\./, "");
    if (tok === EST.share_token) return send(200, EST);
    return send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
  }
  if (t === "subscriptions") { const row = { status: "active", plan: "monthly", stripe_customer_id: null, current_period_end: "2026-11-01T00:00:00Z", trial_end: null, cancel_at: null, cancelled_at: null, updated_at: "2026-10-01T00:00:00Z", user_id: UID, email: USER.email }; return send(200, single ? row : [row]); }
  if (t === "jobs" && req.method === "DELETE") {
    const id = (u.searchParams.get("id") || "").replace(/^eq\./, ""); const cid = (u.searchParams.get("contractor_id") || "").replace(/^eq\./, "");
    const hit = JOBS.filter((j) => j.id === id && j.contractor_id === cid); JOBS = JOBS.filter((j) => !hit.includes(j));
    console.log("DELETE jobs id=", id, "contractor_id=", cid, "deleted=", hit.length);
    return send(200, hit.map((j) => ({ id: j.id })));
  }
  if (t === "jobs") return send(200, JOBS);
  if (t === "leads") return send(200, LEADS);
  if (t === "profiles") return single ? send(406, { code: "PGRST116", message: "no rows" }) : send(200, []);
  return send(200, single ? null : []);
}).listen(54400, () => console.log("stub on 54400"));
