// LOCAL ONLY mock of the Anthropic Messages API (ANTHROPIC_BASE_URL=http://127.0.0.1:54401).
// Returns the fenced-JSON shape that broke /api/scan-receipt on prod; GET /__mode?m=garbage switches to unparseable text.
const http = require("http");
let mode = "fenced";
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__mode") { mode = u.searchParams.get("m") || "fenced"; res.end(mode); return; }
  let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
    if (mode === "error") { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "INTERNAL-DETAIL: org quota xyz-123 exceeded" } })); return; }
    const j = JSON.parse(body || "{}");
    const prompt = JSON.stringify(j.messages || "") + JSON.stringify(j.system || "");
    let text;
    if (mode === "garbage") text = "Sorry, I can't read this image clearly.";
    else if (/receipt/i.test(prompt)) text = '```json\n{"vendor":"Local Hardware","date":"2026-10-02","subtotal":40,"tax":2.17,"total":42.17,"currency":"USD","usd_total":42.17,"description":"lumber, screws","category":"Materials"}\n```';
    else if (/line_items/i.test(prompt)) text = '```json\n{"line_items":[{"description":"Labor","quantity":4,"unit":"hours","unit_price":85,"total":340},{"description":"Materials","quantity":1,"unit":"each","unit_price":120,"total":120}],"notes":"Estimates only; verify locally."}\n```';
    else if (mode === "gutter") {
      // QA 2026-10-03 prod output for "Dana Price, 44 Elm St, gutter cleaning Saturday 10am, 250 dollars" on a Saturday: Roofing + today.
      const today = (prompt.match(/Today is \w+, (\d{4}-\d{2}-\d{2})/) || [])[1] || "2026-10-03";
      text = JSON.stringify({ customer_name: "Dana Price", address: "44 Elm St", phone: null, service: "gutter cleaning", job_type: "Roofing", scheduled_at: today + "T10:00", price: 250, status: "scheduled" });
    }
    else text = '```json\n{"customer_name":"Mike Johnson","address":"123 Oak St","phone":null,"service":"water heater replacement","job_type":"General","scheduled_at":"2026-10-02T14:00","price":null,"status":"scheduled"}\n```';
    console.log("mock", mode, req.url);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: "msg_local", type: "message", role: "assistant", model: j.model, content: [{ type: "text", text }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } }));
  });
}).listen(54401, () => console.log("mock anthropic on 54401"));
