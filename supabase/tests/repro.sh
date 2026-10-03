#!/usr/bin/env bash
# LOCAL REPRO ONLY (never point at Supabase). Needs a local Postgres 15+ superuser connection.
# Usage: PGCONN="-h /tmp -p 54329 -U postgres" LOCKDOWN=/workspace/stackedwork/RLS-LOCKDOWN-2026-09-15.sql \
#        SCHEMA=/workspace/stackedwork/NEW-SUPABASE-SCHEMA.sql supabase/tests/repro.sh
set -u
cd "$(dirname "$0")/../.."
PGCONN=${PGCONN:-"-h /tmp -p 54329 -U postgres"}
LOCKDOWN=${LOCKDOWN:-/workspace/stackedwork/RLS-LOCKDOWN-2026-09-15.sql}
SCHEMA=${SCHEMA:-/workspace/stackedwork/NEW-SUPABASE-SCHEMA.sql}
P="psql $PGCONN -X -q -v ON_ERROR_STOP=1"
fresh() { # $1 db name: prod-mimic (stubs + minimal schema + 09-15 lockdown)
  $P -d postgres -c "drop database if exists $1" -c "create database $1" >/dev/null 2>&1
  { cat supabase/tests/00_prod_mimic.sql; sed -n '/create table if not exists public.subscriptions/,$p' "$SCHEMA";
    echo 'grant all on all tables in schema public to anon, authenticated, service_role;'; } | $P -d $1 >/dev/null
  $P -d $1 -f "$LOCKDOWN" >/dev/null 2>&1
}
MIGS=$(ls supabase/migrations/*.sql | sort)

echo "== 1) Baseline: prod-mimic WITHOUT migrations (what users hit today)"
fresh sw_base
A=11111111-1111-4111-8111-111111111111
r=$($P -d sw_base -t -A -c "begin; set local \"request.jwt.claim.sub\"='$A'; set local role authenticated; insert into public.jobs (contractor_id,customer,phone,type,value,status,date,notes,hours_worked,material_cost) values ('$A','Jane Doe',null,'General',null,'quoted','2026-10-02',null,null,0) returning id; commit;" 2>&1)
echo "   Add Job insert: $(echo "$r" | grep -o 'ERROR.*' | head -1)"
r=$($P -d sw_base -t -A -c "begin; set local \"request.jwt.claim.sub\"='$A'; set local role authenticated; insert into storage.objects (bucket_id,name) values ('stackedwork-images','$A/portfolio/x.jpg') returning name; commit;" 2>&1)
echo "   Storage upload: $(echo "$r" | grep -o 'ERROR.*' | head -1)"

echo "== 2) Apply migrations in order, twice (re-runnable)"
fresh sw_repro
ok=1
for run in 1 2; do
  for f in $MIGS; do
    if out=$($P -d sw_repro -f "$f" 2>&1); then echo "   run$run OK   $(basename "$f")"; else echo "   run$run FAIL $(basename "$f"): $(echo "$out" | grep ERROR | head -1)"; ok=0; fi
  done
done

echo "== 3) rls_verify alone on a prod-mimic DB (out of order: must not roll back on missing columns)"
fresh sw_rlsonly
if out=$($P -d sw_rlsonly -f supabase/migrations/20261002060000_rls_verify.sql 2>&1); then echo "   OK"; else echo "   FAIL: $(echo "$out" | grep ERROR | head -1)"; ok=0; fi

echo "== 4) App payloads against migrated DB"
PSQL="psql $PGCONN -d sw_repro" supabase/tests/run_app_payloads.sh || ok=0
echo "== 5) Rate limit counter (20261003200000_rate_limits.sql)"
rl() { $P -d sw_repro -t -A -c "begin; set local role $1; $2; commit;" 2>&1 | grep -v '^BEGIN\|^COMMIT\|^SET' | head -1; }
c1=$(rl service_role "select public.rate_limit_hit('leads:test', 600)"); c2=$(rl service_role "select public.rate_limit_hit('leads:test', 600)"); c3=$(rl service_role "select public.rate_limit_hit('leads:other', 600)")
[ "$c1/$c2/$c3" = "1/2/1" ] && echo "   PASS service_role counts per key: $c1,$c2 (same key), $c3 (other key)" || { echo "   FAIL counts: $c1/$c2/$c3"; ok=0; }
for r in anon authenticated; do
  e=$(rl $r "select public.rate_limit_hit('x', 60)"); echo "$e" | grep -q "permission denied" && echo "   PASS $r cannot execute rate_limit_hit" || { echo "   FAIL $r execute: $e"; ok=0; }
  e=$(rl $r "select count(*) from public.rate_limits"); echo "$e" | grep -q "permission denied" && echo "   PASS $r cannot read rate_limits" || { echo "   FAIL $r read: $e"; ok=0; }
done
echo "== 6) Invoices (20261003210000_invoices.sql): numbering, Net 15, paid_at, cross-user denial"
B=22222222-2222-4222-8222-222222222222
q() { $P -d sw_repro -t -A -c "begin; set local \"request.jwt.claim.sub\"='$1'; set local role $2; $3; commit;" 2>&1 | grep -v '^BEGIN\|^COMMIT\|^SET' | head -1; }
chk() { [ "$2" = "$3" ] && echo "   PASS $1" || { echo "   FAIL $1: got '$2' want '$3'"; ok=0; }; }
ins="insert into public.invoices (contractor_id,number,customer_name,issue_date,total)"
i1=$(q $A authenticated "$ins values ('$A',99,'Jane Doe','2026-10-03',100) returning invoice_number||'|'||due_date||'|'||id")
chk "A first invoice is INV-0001 (client number 99 ignored), due Net 15" "${i1%|*}" "INV-0001|2026-10-18"; IA=${i1##*|}
chk "A second invoice is INV-0002" "$(q $A authenticated "$ins values ('$A',null,'Sam Roe','2026-10-03',50) returning invoice_number")" "INV-0002"
chk "B numbering is separate (INV-0001)" "$(q $B authenticated "$ins values ('$B',null,'Bo','2026-10-03',1) returning invoice_number")" "INV-0001"
chk "explicit due date kept" "$(q $A authenticated "insert into public.invoices (contractor_id,customer_name,issue_date,due_date) values ('$A','X','2026-10-03','2026-11-02') returning invoice_number||' '||due_date")" "INV-0003 2026-11-02"
for n in 1 2 3 4 5 6; do q $A authenticated "$ins values ('$A',null,'P$n','2026-10-03',1)" >/dev/null & done; wait
chk "6 concurrent inserts: numbers unique and gap-free (1..9)" "$(q $A authenticated "select count(distinct number)||'/'||max(number) from public.invoices where contractor_id='$A'")" "9/9"
chk "B cannot read A's invoice" "$(q $B authenticated "select count(*) from public.invoices where id='$IA'")" "0"
chk "B sees only own invoices" "$(q $B authenticated "select count(*) from public.invoices")" "1"
chk "B cannot update A's invoice" "$(q $B authenticated "with u as (update public.invoices set total=0 where id='$IA' returning 1) select count(*) from u")" "0"
chk "B cannot delete A's invoice" "$(q $B authenticated "with d as (delete from public.invoices where id='$IA' returning 1) select count(*) from d")" "0"
q $B authenticated "$ins values ('$A',null,'spoof','2026-10-03',1)" | grep -q "row-level security" && echo "   PASS B cannot insert an invoice as A" || { echo "   FAIL B insert as A"; ok=0; }
chk "A can't renumber or reassign" "$(q $A authenticated "update public.invoices set number=50, contractor_id='$B' where id='$IA' returning number||' '||(contractor_id='$A')")" "1 true"
chk "mark paid sets paid_at" "$(q $A authenticated "update public.invoices set status='paid' where id='$IA' returning (paid_at is not null)")" "t"
chk "back to sent clears paid_at, sets sent_at" "$(q $A authenticated "update public.invoices set status='sent' where id='$IA' returning (paid_at is null)::text||(sent_at is not null)::text")" "truetrue"
q $A authenticated "update public.invoices set status='overdue' where id='$IA'" | grep -q "invoices_status_check" && echo "   PASS 'overdue' is not a stored status (computed)" || { echo "   FAIL status check"; ok=0; }
q $A authenticated "update public.invoices set due_date='2026-10-01' where id='$IA'" | grep -q "invoices_due_after_issue" && echo "   PASS due date before issue date rejected" || { echo "   FAIL due check"; ok=0; }
q $A anon "select count(*) from public.invoices" | grep -q "permission denied" && echo "   PASS anon cannot read invoices" || { echo "   FAIL anon read"; ok=0; }
tok=$($P -d sw_repro -t -A -c "select share_token from public.invoices where id='$IA'")
chk "service_role reads by share_token (public page)" "$(q $A service_role "select invoice_number from public.invoices where share_token='$tok'")" "INV-0001"
chk "B deleting own invoice works" "$(q $B authenticated "with d as (delete from public.invoices returning 1) select count(*) from d")" "1"
[ $ok -eq 1 ] && echo "REPRO: ALL PASS" || { echo "REPRO: FAILURES"; exit 1; }
