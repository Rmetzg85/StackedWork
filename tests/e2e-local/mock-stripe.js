// LOCAL ONLY mock of the Stripe endpoints /api/manage-billing uses (STRIPE_API_BASE=http://127.0.0.1:54403).
const http = require("http");
const CUSTOMERS = [
  { id: "cus_STRIPE_S", object: "customer", email: "stripe.only@example.test" },
  { id: "cus_OTHERPRODUCT_S", object: "customer", email: "stripe.only@example.test" },
  { id: "cus_VICTIM_B", object: "customer", email: "victim.b@example.test" },
];
const sub = (id, customer, product, status) => ({ id, object: "subscription", customer, status, created: 1790000000, metadata: product ? { product } : {}, items: { object: "list", data: [{ price: { id: "price_other" } }] } });
const SUBS = [sub("sub_s", "cus_STRIPE_S", "stackedwork", "trialing"), sub("sub_o", "cus_OTHERPRODUCT_S", "other-product", "active"), sub("sub_b", "cus_VICTIM_B", "stackedwork", "active")];
const portals = [];
const list = (data) => ({ object: "list", data, has_more: false, url: "/v1/x" });
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const send = (c, b) => { res.writeHead(c, { "Content-Type": "application/json" }); res.end(JSON.stringify(b)); };
  if (u.pathname === "/__portals") return send(200, portals);
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
    console.log("STRIPE", req.method, u.pathname, u.search, b);
    if (u.pathname === "/v1/customers") return send(200, list(CUSTOMERS.filter((c) => c.email === u.searchParams.get("email"))));
    if (u.pathname === "/v1/subscriptions") return send(200, list(SUBS.filter((s) => s.customer === u.searchParams.get("customer"))));
    if (u.pathname === "/v1/billing_portal/sessions" && req.method === "POST") {
      const p = new URLSearchParams(b); const customer = p.get("customer");
      portals.push({ customer, return_url: p.get("return_url") });
      return send(200, { id: "bps_local", object: "billing_portal.session", customer, url: `https://billing.stripe.test/p/session/${customer}` });
    }
    send(404, { error: { message: "mock: not found" } });
  });
}).listen(54403, () => console.log("mock stripe on 54403"));
