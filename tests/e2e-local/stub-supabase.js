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
let MODE = { allRead: false, unpriced: false, rpcMissing: false };
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
    const rows = [OWN, OTHER].filter((r) => (!id || r.id === id) && (!cid || r.contractor_id === cid));
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
