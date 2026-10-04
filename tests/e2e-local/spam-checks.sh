#!/usr/bin/env bash
# LOCAL ONLY: local build + Supabase stub (:54400). Exercises honeypot + rate limit on the public form routes,
# first with rate_limit_hit() missing (in-memory fallback), then with the table counter.
cd "$(dirname "$0")/../.."
B=http://localhost:3080
start() { ps aux | grep -E "next start -p 3080|next-server" | grep -v grep | awk '{print $2}' | xargs -r kill; sleep 1
  (SUPABASE_SERVICE_ROLE_KEY=service-local-key npx next start -p 3080 > /tmp/next-spam.log 2>&1 &); for i in $(seq 1 30); do curl -s -o /dev/null $B/ && break; sleep 0.5; done; }
post() { curl -s -w " HTTP %{http_code}%{header_json}" -X POST "$B$1" -H 'Content-Type: application/json' -H "x-forwarded-for: $2" -d "$3" | python3 -c "import sys,json; s=sys.stdin.read(); body,rest=s.split(' HTTP ',1); code=rest[:3]; h=json.loads(rest[3:]); print(body, 'HTTP', code, ('Retry-After='+h['retry-after'][0]) if 'retry-after' in h else '')"; }
LEAD='{"contractor_id":"11111111-1111-4111-8111-111111111111","name":"Local Test Lead","phone":"(410) 555-0199"}'
HP='{"contractor_id":"11111111-1111-4111-8111-111111111111","name":"Bot","phone":"1","contact_me_by_fax_only":"x"}'
echo "# $(date '+%Y-%m-%d %H:%M %Z') local build + Supabase stub"
for MODE in missing table; do
  curl -s "http://127.0.0.1:54400/__mode?rpcMissing=$([ $MODE = missing ] && echo 1 || echo 0)" >/dev/null; start
  echo; echo "## rate_limit_hit() $MODE  ($([ $MODE = missing ] && echo 'migration not applied -> in-memory fallback' || echo 'migration applied -> table counter'))"
  echo "### /api/leads (limit 5 per 10 min per IP)"
  for i in 1 2 3 4 5 6; do printf "  IP 203.0.113.7  #%s: " $i; post /api/leads 203.0.113.7 "$LEAD"; done
  printf "  IP 198.51.100.9 #1: "; post /api/leads 198.51.100.9 "$LEAD"
  printf "  honeypot filled:   "; post /api/leads 192.0.2.50 "$HP"
  echo "### /api/homeowner-lead (limit 5 per 10 min per IP)"
  for i in 1 2 3 4 5 6; do printf "  #%s: " $i; post /api/homeowner-lead 203.0.113.8 '{"name":"Local Homeowner","phone":"(410) 555-0198"}'; done
  printf "  honeypot filled: "; post /api/homeowner-lead 192.0.2.51 '{"name":"Bot","phone":"1","contact_me_by_fax_only":"buy now"}'
  echo "### /api/notify-signup (limit 5 per hour per IP)"
  for i in 1 2 3 4 5 6; do printf "  #%s: " $i; post /api/notify-signup 203.0.113.9 '{"username":"local","email":"local@example.test"}'; done
  printf "  honeypot filled: "; post /api/notify-signup 192.0.2.52 '{"username":"bot","email":"bot@example.test","contact_me_by_fax_only":"1"}'
  echo "### server log (rate-limit lines)"; grep -i "rate-limit" /tmp/next-spam.log | sort | uniq -c | sed 's/^/  /'
done
echo; echo "## stub: rows inserted (honeypot submissions must not appear)"
curl -s http://127.0.0.1:54400/__inserts | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ', len(d), 'inserts:', {t:sum(1 for x in d if x['t']==t) for t in set(x['t'] for x in d)}, '| any honeypot/bot rows:', any(x['row'].get('name')=='Bot' for x in d))"
echo "## stub: RPC keys seen (salted hashes; no raw IPs)"
grep "RPC rate_limit_hit key" /tmp/stub-spam.log | awk '{print $3, $4}' | sort | uniq -c | sed 's/^/  /'
printf "  raw IP in any key: "; grep "RPC rate_limit_hit key" /tmp/stub-spam.log | grep -cE "203\.0\.113|198\.51\.100" 
