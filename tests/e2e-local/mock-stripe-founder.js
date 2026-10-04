// LOCAL ONLY mock of the Stripe endpoints /api/checkout and /api/founder-spots use (STRIPE_API_BASE=http://127.0.0.1:54404).
// GET /__mode?founders=N&redeemed=N&valid=1 sets the fake state; GET /__sessions returns the checkout-session params received.
const http = require("http");
let state = { founders: 0, redeemed: 0, valid: true };
const sessions = [];
const send = (res, c, b) => { res.writeHead(c, { "Content-Type": "application/json" }); res.end(JSON.stringify(b)); };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
    if (u.pathname === "/__mode") { state = { founders: Number(u.searchParams.get("founders") || 0), redeemed: Number(u.searchParams.get("redeemed") || 0), valid: u.searchParams.get("valid") !== "0" }; sessions.length = 0; return send(res, 200, state); }
    if (u.pathname === "/__sessions") return send(res, 200, sessions);
    if (u.pathname === "/v1/subscriptions/search") {
      const data = Array.from({ length: state.founders }, (_, i) => ({ id: `sub_f${i}`, object: "subscription", status: i % 3 === 2 ? "canceled" : "trialing", metadata: { offer: "founder" }, customer: { id: `cus_f${i}`, object: "customer", email: `founder${i}@example.test` } }));
      return send(res, 200, { object: "search_result", data, has_more: false, next_page: null, url: "/v1/subscriptions/search" });
    }
    if (u.pathname.startsWith("/v1/coupons/")) {
      if (!state.valid) return send(res, 404, { error: { type: "invalid_request_error", code: "resource_missing", message: "No such coupon" } });
      return send(res, 200, { id: decodeURIComponent(u.pathname.split("/").pop()), object: "coupon", amount_off: 2000, currency: "usd", duration: "forever", max_redemptions: 20, times_redeemed: state.redeemed, valid: state.redeemed < 20 });
    }
    if (u.pathname === "/v1/checkout/sessions" && req.method === "POST") {
      const p = Object.fromEntries(new URLSearchParams(body));
      if (p["discounts[0][coupon]"] && state.redeemed >= 20) return send(res, 400, { error: { type: "invalid_request_error", message: "This coupon has reached its max_redemptions." } });
      sessions.push(p);
      return send(res, 200, { id: `cs_test_${sessions.length}`, object: "checkout.session", url: `http://localhost:3093/welcome?session_id=cs_test_${sessions.length}${p.success_url && p.success_url.includes("offer=founder") ? "&offer=founder" : ""}` });
    }
    send(res, 404, { error: { type: "invalid_request_error", message: `mock: no route ${req.method} ${u.pathname}` } });
  });
}).listen(54404, () => console.log("mock stripe (founder) on 54404"));
