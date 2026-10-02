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
[ $ok -eq 1 ] && echo "REPRO: ALL PASS" || { echo "REPRO: FAILURES"; exit 1; }
