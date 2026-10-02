#!/usr/bin/env bash
# LOCAL REPRO ONLY: replays the exact payloads app code sends (via PostgREST semantics) against a local
# Postgres that mimics prod + the migrations. Usage: PSQL="psql -h /tmp -p 54329 -U postgres -d swrepro" ./run_app_payloads.sh
set -u
PSQL=${PSQL:-"psql -h /tmp -p 54329 -U postgres -d swrepro"}
A=11111111-1111-4111-8111-111111111111   # contractor A (test uuid, local only)
B=22222222-2222-4222-8222-222222222222   # contractor B
pass=0; fail=0
q() { $PSQL -X -q -t -A -v ON_ERROR_STOP=1 -c "$1" 2>&1; }
# as <uuid> <email> <sql>: run as role authenticated with JWT claims, PostgREST-style (one transaction)
as() {
  $PSQL -X -q -t -A -v ON_ERROR_STOP=1 <<SQL 2>&1
begin;
set local "request.jwt.claims" = '{"sub":"$1","email":"$2","role":"authenticated"}';
set local "request.jwt.claim.sub" = '$1';
set local role authenticated;
$3
commit;
SQL
}
svc() { $PSQL -X -q -t -A -v ON_ERROR_STOP=1 -c "begin; set local role service_role; $1; commit;" 2>&1; }
check() { # name, expectation(regex), actual
  if echo "$3" | grep -Eq "$2"; then echo "PASS  $1"; pass=$((pass+1)); else echo "FAIL  $1"; echo "      got: $(echo "$3" | tr '\n' ' ' | cut -c1-300)"; fail=$((fail+1)); fi
}
q "delete from public.jobs; delete from public.estimates; delete from public.receipts; delete from public.leads; delete from public.portfolio; delete from public.subscriptions; delete from public.profiles; delete from storage.objects; delete from auth.users;" >/dev/null
q "insert into auth.users(id,email) values ('$A','a.contractor@example.test'),('$B','b.contractor@example.test');" >/dev/null

# ── Add Job (handleNewJob row, price omitted -> value null) ──
r=$(as $A a.contractor@example.test "insert into public.jobs (contractor_id,customer,phone,type,value,status,date,notes,hours_worked,material_cost)
 values ('$A','Jane Doe','(410) 555-0100','Plumbing',null,'scheduled','2026-10-02',E'Address: 12 Oak St\nTime: 9:00 AM\nwater heater replacement',null,0) returning id, customer, value is null as no_price;")
check "jobs insert (Add Job, no price) as A" "Jane Doe\|t" "$r"
JOB=$(echo "$r" | grep 'Jane Doe' | cut -d'|' -f1)
r=$(as $A a.contractor@example.test "insert into public.jobs (contractor_id,customer,phone,type,value,status,date,notes,hours_worked,material_cost)
 values ('$A','Bob Lee',null,'HVAC',850,'quoted','2026-10-01',null,6.5,120) returning value;")
check "jobs insert (with price) as A" "^850(\.00)?$" "$r"
r=$(as $A a.contractor@example.test "select count(*) from public.jobs where contractor_id='$A';")
check "jobs select own (order by date) as A" "^2$" "$r"
r=$(as $A a.contractor@example.test "update public.jobs set status='complete', completed='2026-10-02' where id='$JOB' and contractor_id='$A' returning status;")
check "jobs update status as A" "^complete$" "$r"
r=$(as $B b.contractor@example.test "select count(*) from public.jobs;")
check "jobs: B cannot read A's jobs" "^0$" "$r"
r=$(as $B b.contractor@example.test "update public.jobs set status='quoted' where id='$JOB' returning id;")
check "jobs: B cannot update A's job (0 rows)" "^$" "$r"
r=$(as $B b.contractor@example.test "insert into public.jobs (contractor_id,customer,date) values ('$A','spoof','2026-10-02') returning id;")
check "jobs: B cannot insert as A" "row-level security" "$r"
r=$(as $B b.contractor@example.test "delete from public.jobs where id='$JOB' returning id;")
check "jobs: B cannot delete A's job (0 rows)" "^$" "$r"

# ── Estimate create (always draft) -> email ok -> mark sent ──
r=$(as $A a.contractor@example.test "insert into public.estimates (contractor_id,customer_name,customer_email,customer_phone,job_type,line_items,subtotal,tax_rate,tax_amount,total,notes,status,valid_until)
 values ('$A','Jane Doe','jane@example.test',null,'Plumbing','[{\"id\":1,\"description\":\"Water heater\",\"quantity\":1,\"unit\":\"each\",\"unit_price\":1200,\"total\":1200}]'::jsonb,1200,6,72,1272,null,'draft',null)
 returning id, status, length(share_token);")
check "estimates insert (draft) returns share_token" "\|draft\|32$" "$r"
EST=$(echo "$r" | cut -d'|' -f1)
r=$(as $A a.contractor@example.test "update public.estimates set status='sent' where id='$EST' and contractor_id='$A' returning status;")
check "estimates mark sent as A" "^sent$" "$r"
r=$(as $A a.contractor@example.test "update public.estimates set customer_name='Jane D.', customer_email='jane@example.test', customer_phone=null, job_type='Plumbing', line_items='[]', subtotal=0, tax_rate=0, tax_amount=0, total=0, notes='n', valid_until='2026-10-31', updated_at=now() where id='$EST' and contractor_id='$A' returning customer_name;")
check "estimates edit (handleUpdateEstimate) as A" "^Jane D\.$" "$r"
r=$(as $B b.contractor@example.test "select count(*) from public.estimates;")
check "estimates: B cannot read A's" "^0$" "$r"
r=$(as $B b.contractor@example.test "update public.estimates set status='sent' where id='$EST' returning id;")
check "estimates: B cannot mark A's sent" "^$" "$r"
TOK=$(q "select share_token from public.estimates where id='$EST';")
r=$(svc "select customer_name from public.estimates where share_token='$TOK'")
check "estimate token page (service_role by share_token)" "Jane D\." "$r"

# ── Receipt create ──
r=$(as $A a.contractor@example.test "insert into public.receipts (contractor_id,file_url,amount,category,date,description)
 values ('$A','https://x.supabase.co/storage/v1/object/public/stackedwork-images/$A/receipts/1-u-receipt.jpg',42.17,'Materials','2026-10-02','Home Depot') returning amount;")
check "receipts insert as A" "^42\.17$" "$r"
REC=$(q "select id from public.receipts limit 1;")
r=$(as $B b.contractor@example.test "select count(*) from public.receipts;")
check "receipts: B cannot read A's" "^0$" "$r"
r=$(as $B b.contractor@example.test "delete from public.receipts where id='$REC' returning id;")
check "receipts: B cannot delete A's" "^$" "$r"
r=$(as $A a.contractor@example.test "delete from public.receipts where id='$REC' and contractor_id='$A' returning id;")
check "receipts delete own as A" "^[0-9a-f-]{36}$" "$r"

# ── Portfolio ──
r=$(as $A a.contractor@example.test "insert into public.portfolio (contractor_id,before_url,after_url,job_type,caption) values ('$A','b','a','bathroom','') returning job_type;")
check "portfolio insert as A" "^bathroom$" "$r"
r=$(as $B b.contractor@example.test "select count(*) from public.portfolio;")
check "portfolio: B cannot read A's" "^0$" "$r"

# ── Leads: /api/leads (service_role insert), dashboard select + markRead ──
r=$(svc "insert into public.leads (contractor_id,name,phone,email,message,urgent,read,source,job_type) values ('$A','Homeowner H','(410) 555-0199',null,'Leak under sink',false,false,'website','plumbing') returning name")
check "leads insert via /api/leads (service_role)" "Homeowner H" "$r"
LEAD=$(q "select id from public.leads limit 1;")
r=$(as $A a.contractor@example.test "update public.leads set read=true where id='$LEAD' and contractor_id='$A' returning read;")
check "leads markRead as A" "^t$" "$r"
r=$(as $B b.contractor@example.test "select count(*) from public.leads;")
check "leads: B cannot read A's" "^0$" "$r"

# ── homeowner_leads: service_role insert; clients see nothing ──
r=$(svc "insert into public.homeowner_leads (name,phone,email,zip_code,city,job_type,description,status) values ('HO','1',null,'21201',null,'other',null,'new') returning status")
check "homeowner_leads insert via /api/homeowner-lead (service_role)" "new" "$r"
r=$(as $A a.contractor@example.test "select count(*) from public.homeowner_leads where contractor_id='$A';")
check "homeowner_leads: client select returns 0 (no client policy)" "^0$" "$r"

# ── Profiles upsert (saveProfile) ──
r=$(as $A a.contractor@example.test "insert into public.profiles (id,name,trade,service_area,phone,updated_at) values ('$A','A Co','Plumbing','Baltimore','(410) 555-0100',now()) on conflict (id) do update set name=excluded.name returning name;")
check "profiles upsert own as A" "^A Co$" "$r"
r=$(as $B b.contractor@example.test "select count(*) from public.profiles;")
check "profiles: B cannot read A's" "^0$" "$r"
r=$(as $B b.contractor@example.test "insert into public.profiles (id,name) values ('$A','spoof') on conflict (id) do update set name=excluded.name returning name;")
check "profiles: B cannot overwrite A's" "row-level security|^$" "$r"

# ── Subscriptions: webhook upsert (service_role), app lookup by user_id and by email ──
r=$(svc "insert into public.subscriptions (stripe_customer_id,stripe_subscription_id,email,status,plan,price_id,current_period_start,current_period_end,trial_end,cancel_at,updated_at)
 values ('cus_test','sub_test1','A.Contractor@example.test','trialing','base','price_x',now(),now()+interval '14 day',now()+interval '14 day',null,now())
 on conflict (stripe_subscription_id) do update set status=excluded.status returning status")
check "webhook upsert onConflict stripe_subscription_id" "trialing" "$r"
r=$(svc "insert into public.subscriptions (stripe_customer_id,stripe_subscription_id,email,status) values ('cus_test','sub_test1','A.Contractor@example.test','active') on conflict (stripe_subscription_id) do update set status=excluded.status returning status")
check "webhook upsert again (updated event) same row" "active" "$r"
r=$(svc "insert into public.subscriptions (stripe_customer_id,stripe_subscription_id,email,status) values ('cus_test','sub_test2','A.Contractor@example.test','trialing') on conflict (stripe_subscription_id) do update set status=excluded.status returning status")
check "webhook: 2nd subscription same email (re-subscribe) allowed" "trialing" "$r"
r=$(svc "update public.subscriptions set user_id='$A' where stripe_subscription_id='sub_test1' returning user_id")
check "webhook user_id link update" "$A" "$r"
r=$(as $A a.contractor@example.test "select count(*) from public.subscriptions where user_id='$A';")
check "subscriptions select by user_id as A" "^1$" "$r"
r=$(as $A a.contractor@example.test "select count(*) from public.subscriptions where email ilike 'a.contractor@example.test';")
check "subscriptions select by email (ilike, case-insensitive) as A" "^2$" "$r"
r=$(as $B b.contractor@example.test "select count(*) from public.subscriptions;")
check "subscriptions: B cannot read A's" "^0$" "$r"

# ── Storage: per-user folders in stackedwork-images ──
r=$(as $A a.contractor@example.test "insert into storage.objects (bucket_id,name,owner) values ('stackedwork-images','$A/portfolio/1-uuid-before.jpg','$A') returning name;")
check "storage upload own folder as A" "^$A/portfolio/" "$r"
r=$(as $A a.contractor@example.test "insert into storage.objects (bucket_id,name,owner) values ('stackedwork-images','$B/portfolio/evil.jpg','$A') returning name;")
check "storage: A cannot upload into B's folder" "row-level security" "$r"
r=$(as $A a.contractor@example.test "insert into storage.objects (bucket_id,name,owner) values ('stackedwork-images','portfolio/old-style.jpg','$A') returning name;")
check "storage: old shared 'portfolio/' prefix denied" "row-level security" "$r"
r=$(as $B b.contractor@example.test "delete from storage.objects where name like '$A/%' returning name;")
check "storage: B cannot delete A's files" "^$" "$r"

echo "TOTAL pass=$pass fail=$fail"
[ $fail -eq 0 ]
