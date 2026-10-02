// LOCAL ONLY mock of Resend's POST /emails (RESEND_API_URL=http://127.0.0.1:54402/emails). Logs what would be sent.
const http = require("http");
const sent = [];
http.createServer((req, res) => {
  if (req.url === "/__sent") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(sent)); }
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
    const j = JSON.parse(b || "{}"); sent.push(j); console.log("RESEND", j.from, "->", j.to, "|", j.subject);
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id: "local-email-1" }));
  });
}).listen(54402, () => console.log("mock resend on 54402"));
