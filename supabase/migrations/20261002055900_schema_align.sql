-- StackedWork: align live schema with the columns the app reads/writes (QA bundle 2026-10-02)
-- Project: ucjnajvgpxsijzpaigpm
--
-- *** NOT APPLIED. Review, then run manually BEFORE 20261002060000_rls_verify.sql. Safe to re-run. ***
--
-- Why: prod was created from NEW-SUPABASE-SCHEMA.sql ("minimal schema"), where jobs/estimates/receipts/leads/
-- homeowner_leads only have id/contractor_id/date/created_at/data(jsonb). The app (app/page.tsx, /api/*,
-- Stripe webhook) reads and writes real columns (customer, value, line_items, amount, ...), so those inserts fail
-- today. Decision: real columns are the source of truth. Existing `data` jsonb and `date` columns are kept (made
-- nullable / default '{}' so inserts that omit them succeed). Every statement is ADD COLUMN IF NOT EXISTS or
-- guarded, so it is a no-op where a column already exists. Tables were reported empty (0 rows) on 2026-10-02.
--
-- Column list derived from every .from('<table>') call in app/ (inserts, updates, selects, filters, order-by),
-- app/api/*, app/estimate/[token], and app/api/webhooks/stripe.

begin;

-- Helper: make a column nullable and give jsonb `data` a '{}' default, only if it exists.
do $$
declare
  r record;
begin
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('jobs','estimates','receipts','leads','homeowner_leads','portfolio')
      and column_name in ('data','date')
  loop
    execute format('alter table public.%I alter column %I drop not null', r.table_name, r.column_name);
    if r.column_name = 'data' then
      execute format('alter table public.%I alter column data set default %L::jsonb', r.table_name, '{}');
    end if;
  end loop;
end $$;

-- ── jobs ── app/page.tsx handleNewJob / updateJobStatus / select order by date
alter table public.jobs add column if not exists contractor_id uuid;
alter table public.jobs add column if not exists date          date;
alter table public.jobs add column if not exists customer      text;
alter table public.jobs add column if not exists phone         text;
alter table public.jobs add column if not exists type          text default 'General';
alter table public.jobs add column if not exists value         numeric(12,2);            -- nullable: price is optional
alter table public.jobs add column if not exists status        text default 'quoted';
alter table public.jobs add column if not exists notes         text;
alter table public.jobs add column if not exists hours_worked  numeric(8,2);
alter table public.jobs add column if not exists material_cost numeric(12,2) default 0;
alter table public.jobs add column if not exists completed     date;
alter table public.jobs add column if not exists created_at    timestamptz default now();
-- If value pre-existed as NOT NULL, relax it (guarded: only when the column exists).
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='jobs' and column_name='value') then
    alter table public.jobs alter column value drop not null;
  end if;
end $$;
create index if not exists jobs_contractor_date_idx on public.jobs (contractor_id, date desc);

-- ── estimates ── handleSaveEstimate / handleUpdateEstimate / markEstimateSent / estimate/[token] (share_token) / estimate-email
alter table public.estimates add column if not exists contractor_id  uuid;
alter table public.estimates add column if not exists status         text default 'draft';
alter table public.estimates add column if not exists customer_name  text;
alter table public.estimates add column if not exists customer_email text;
alter table public.estimates add column if not exists customer_phone text;
alter table public.estimates add column if not exists job_type       text;
alter table public.estimates add column if not exists line_items     jsonb default '[]'::jsonb;
alter table public.estimates add column if not exists subtotal       numeric(12,2) default 0;
alter table public.estimates add column if not exists tax_rate       numeric(6,3) default 0;
alter table public.estimates add column if not exists tax_amount     numeric(12,2) default 0;
alter table public.estimates add column if not exists total          numeric(12,2) default 0;
alter table public.estimates add column if not exists notes          text;
alter table public.estimates add column if not exists valid_until    date;
alter table public.estimates add column if not exists created_at     timestamptz default now();
alter table public.estimates add column if not exists updated_at     timestamptz default now();
-- Public estimate link token. The app reads data.share_token right after insert, so it needs a DB default.
-- gen_random_uuid() is core Postgres (no pgcrypto/extensions schema dependency): 32 hex chars, 122 random bits.
alter table public.estimates add column if not exists share_token    text default replace(gen_random_uuid()::text, '-', '');
alter table public.estimates alter column share_token set default replace(gen_random_uuid()::text, '-', '');
update public.estimates set share_token = replace(gen_random_uuid()::text, '-', '') where share_token is null;
create unique index if not exists estimates_share_token_key on public.estimates (share_token);
create index if not exists estimates_contractor_created_idx on public.estimates (contractor_id, created_at desc);

-- ── receipts ── handleReceiptUpload / deleteReceipt / select order by date
alter table public.receipts add column if not exists contractor_id uuid;
alter table public.receipts add column if not exists date          date;
alter table public.receipts add column if not exists file_url      text;
alter table public.receipts add column if not exists amount        numeric(12,2);
alter table public.receipts add column if not exists category      text default 'Other';
alter table public.receipts add column if not exists description   text;
alter table public.receipts add column if not exists created_at    timestamptz default now();
create index if not exists receipts_contractor_date_idx on public.receipts (contractor_id, date desc);

-- ── leads ── /api/leads insert (service_role) / dashboard select, realtime, markRead
alter table public.leads add column if not exists contractor_id uuid;
alter table public.leads add column if not exists name          text;
alter table public.leads add column if not exists phone         text;
alter table public.leads add column if not exists email         text;
alter table public.leads add column if not exists message       text;
alter table public.leads add column if not exists urgent        boolean default false;
alter table public.leads add column if not exists read          boolean default false;
alter table public.leads add column if not exists source        text default 'website';
alter table public.leads add column if not exists job_type      text;
alter table public.leads add column if not exists created_at    timestamptz default now();
create index if not exists leads_contractor_created_idx on public.leads (contractor_id, created_at desc);

-- ── homeowner_leads ── /api/homeowner-lead insert (service_role); dashboard select filtered by contractor_id
alter table public.homeowner_leads add column if not exists name          text;
alter table public.homeowner_leads add column if not exists phone         text;
alter table public.homeowner_leads add column if not exists email         text;
alter table public.homeowner_leads add column if not exists zip_code      text;
alter table public.homeowner_leads add column if not exists city          text;
alter table public.homeowner_leads add column if not exists job_type      text default 'other';
alter table public.homeowner_leads add column if not exists description   text;
alter table public.homeowner_leads add column if not exists status        text default 'new';
alter table public.homeowner_leads add column if not exists contractor_id uuid;
alter table public.homeowner_leads add column if not exists created_at    timestamptz default now();
create index if not exists homeowner_leads_contractor_id_idx on public.homeowner_leads (contractor_id);

-- ── portfolio ── (already matches NEW-SUPABASE-SCHEMA.sql; no-ops kept for safety)
alter table public.portfolio add column if not exists contractor_id uuid;
alter table public.portfolio add column if not exists before_url    text;
alter table public.portfolio add column if not exists after_url     text;
alter table public.portfolio add column if not exists job_type      text;
alter table public.portfolio add column if not exists caption       text;
alter table public.portfolio add column if not exists created_at    timestamptz default now();

-- ── subscriptions ── Stripe webhook upsert(onConflict: stripe_subscription_id) + app select
alter table public.subscriptions add column if not exists email                  text;
alter table public.subscriptions add column if not exists status                 text;
alter table public.subscriptions add column if not exists stripe_customer_id     text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists plan                   text;
alter table public.subscriptions add column if not exists price_id               text;
alter table public.subscriptions add column if not exists current_period_start   timestamptz;
alter table public.subscriptions add column if not exists current_period_end     timestamptz;
alter table public.subscriptions add column if not exists trial_end              timestamptz;
alter table public.subscriptions add column if not exists cancel_at              timestamptz;
alter table public.subscriptions add column if not exists cancelled_at           timestamptz;
alter table public.subscriptions add column if not exists created_at             timestamptz default now();
alter table public.subscriptions add column if not exists updated_at             timestamptz default now();
alter table public.subscriptions add column if not exists user_id                uuid references auth.users(id) on delete set null;
-- ON CONFLICT (stripe_subscription_id) needs a non-partial unique index on that column.
create unique index if not exists subscriptions_stripe_subscription_id_key on public.subscriptions (stripe_subscription_id);
create index if not exists subscriptions_email_lower_idx on public.subscriptions (lower(email));
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
-- email was UNIQUE in the minimal schema. One person can have several Stripe subscriptions over time
-- (cancel → re-subscribe); a unique email makes the webhook upsert for the 2nd subscription fail.
do $$
declare c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public' and rel.relname = 'subscriptions' and con.contype = 'u'
      and array_length(con.conkey, 1) = 1
      and (select attname from pg_attribute where attrelid = rel.oid and attnum = con.conkey[1]) = 'email'
  loop
    execute format('alter table public.subscriptions drop constraint %I', c);
  end loop;
end $$;

-- ── profiles ── Settings: select name, trade, service_area, phone by id; upsert {id, name, trade, service_area, phone, updated_at}
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists name         text;
alter table public.profiles add column if not exists trade        text;
alter table public.profiles add column if not exists service_area text;
alter table public.profiles add column if not exists phone        text;
alter table public.profiles add column if not exists updated_at   timestamptz default now();
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on public.profiles to authenticated;

commit;
