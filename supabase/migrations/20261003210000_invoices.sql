-- StackedWork: invoices v1 (2026-10-03)
-- ORDER: run AFTER 20261002060000_rls_verify.sql (needs public.estimates with a uuid id).
--
-- *** NOT APPLIED. Review, then run manually in the Supabase SQL editor (or `supabase db push`). ***
-- Re-runnable: every statement is IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS.
--
-- Access model (same as estimates):
--   * Contractors: owner-only RLS, contractor_id = auth.uid(), policies invoices_{select,insert,update,delete}_own.
--   * Public /invoice/[token] page: read server-side with the service_role key by share_token
--     (same as /estimate/[token]). There is NO anon policy and anon has no table grants.
--
-- Numbering: per-contractor counter table public.contractor_invoice_counters (contractor_id pk, last_number),
--   bumped atomically in the BEFORE INSERT trigger (INSERT ... ON CONFLICT DO UPDATE ... RETURNING), so numbers
--   are sequential and never reused, even after deletes. unique (contractor_id, number) is a backstop.
--   Clients can't choose or change a number. Display form is the generated column invoice_number:
--   INV-0001 ... INV-9999, then INV-10000. The counter table is server-only: RLS on, no policies, no client grants.
-- Trigger-owned fields: number, share_token (same generator as estimates), created_at/updated_at (now()).
--   Client-supplied values for these are ignored on insert and can't be changed on update.
-- estimate_id: null, or an estimate owned by the same contractor (the trigger raises otherwise).
--   The trigger is SECURITY DEFINER (search_path = public, pg_temp) so it can bump the counter and check
--   estimate ownership; it only ever uses the row's own contractor_id, and RLS still checks
--   contractor_id = auth.uid() on the final row.
-- Dates: issue_date defaults to today in America/New_York; due_date defaults to issue_date + 15 (Net 15) and is editable.
-- Status: stored as draft | sent | paid. "Overdue" is NOT stored: it is computed for display
--   (status = 'sent' and due_date < today in America/New_York); see app/lib/invoices.ts invoiceDisplayStatus().
--   paid_at is set when status becomes 'paid' and cleared if it's moved back.

begin;

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  contractor_id  uuid not null,
  estimate_id    uuid references public.estimates(id) on delete set null,
  number         integer not null,
  invoice_number text generated always as ('INV-' || case when number < 10000 then lpad(number::text, 4, '0') else number::text end) stored,
  status         text not null default 'draft',
  customer_name  text not null default '',
  customer_email text,
  customer_phone text,
  job_type       text,
  line_items     jsonb not null default '[]'::jsonb,
  subtotal       numeric(12,2) not null default 0,
  tax_rate       numeric(6,3)  not null default 0,
  tax_amount     numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  notes          text,
  issue_date     date not null default ((now() at time zone 'America/New_York')::date),
  due_date       date,
  sent_at        timestamptz,
  paid_at        timestamptz,
  share_token    text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint invoices_contractor_number_key unique (contractor_id, number),
  constraint invoices_status_check check (status in ('draft', 'sent', 'paid')),
  constraint invoices_number_positive check (number > 0),
  constraint invoices_due_after_issue check (due_date is null or due_date >= issue_date)
);

create unique index if not exists invoices_share_token_key on public.invoices (share_token);
create index if not exists invoices_contractor_created_idx on public.invoices (contractor_id, created_at desc);
create index if not exists invoices_estimate_id_idx on public.invoices (estimate_id);

-- Per-contractor counter: numbers are never reused, even after deletes. Server-only.
create table if not exists public.contractor_invoice_counters (
  contractor_id uuid primary key,
  last_number   integer not null default 0 check (last_number >= 0)
);
alter table public.contractor_invoice_counters enable row level security;
revoke all on table public.contractor_invoice_counters from public, anon, authenticated;
grant all on table public.contractor_invoice_counters to service_role;
-- Re-run safety: never let a counter fall behind existing invoices.
insert into public.contractor_invoice_counters (contractor_id, last_number)
  select contractor_id, max(number) from public.invoices group by contractor_id
on conflict (contractor_id) do update
  set last_number = greatest(public.contractor_invoice_counters.last_number, excluded.last_number);

-- Number, share_token, timestamps, estimate ownership, Net 15 default, paid_at, immutable fields.
create or replace function public.invoices_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    -- Before anything else (counter bump included): a signed-in user can only create their own invoices.
    -- service_role / SQL editor inserts have auth.uid() = null and are allowed.
    if auth.uid() is not null and new.contractor_id is distinct from auth.uid() then
      raise exception 'not your invoice' using errcode = '42501';
    end if;
    if new.contractor_id is null then
      raise exception 'invoices.contractor_id is required';
    end if;
    insert into public.contractor_invoice_counters as c (contractor_id, last_number)
      values (new.contractor_id, 1)
    on conflict (contractor_id) do update set last_number = c.last_number + 1
    returning c.last_number into new.number;
    new.share_token := replace(gen_random_uuid()::text, '-', '');  -- ignore any client value
    new.created_at := now();
    if new.issue_date is null then new.issue_date := (now() at time zone 'America/New_York')::date; end if;
  else
    new.number := old.number;               -- numbers never change
    new.contractor_id := old.contractor_id; -- invoices can't be moved to another contractor
    new.share_token := old.share_token;
    new.created_at := old.created_at;
  end if;
  if new.estimate_id is not null and (tg_op = 'INSERT' or new.estimate_id is distinct from old.estimate_id) then
    if not exists (select 1 from public.estimates e where e.id = new.estimate_id and e.contractor_id = new.contractor_id) then
      raise exception 'invoices.estimate_id must reference one of your own estimates' using errcode = '42501';
    end if;
  end if;
  if new.due_date is null then new.due_date := new.issue_date + 15; end if;
  if new.status = 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
  else
    new.paid_at := null;
  end if;
  if new.status = 'sent' and new.sent_at is null then new.sent_at := now(); end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists invoices_before_write on public.invoices;
create trigger invoices_before_write
  before insert or update on public.invoices
  for each row execute function public.invoices_before_write();

-- RLS: owner-only, same shape and naming as estimates.
alter table public.invoices enable row level security;
drop policy if exists invoices_select_own on public.invoices;
drop policy if exists invoices_insert_own on public.invoices;
drop policy if exists invoices_update_own on public.invoices;
drop policy if exists invoices_delete_own on public.invoices;
create policy invoices_select_own on public.invoices for select to authenticated using (contractor_id = auth.uid());
create policy invoices_insert_own on public.invoices for insert to authenticated with check (contractor_id = auth.uid());
create policy invoices_update_own on public.invoices for update to authenticated using (contractor_id = auth.uid()) with check (contractor_id = auth.uid());
create policy invoices_delete_own on public.invoices for delete to authenticated using (contractor_id = auth.uid());

-- Grants: no anon access at all (public page uses service_role server-side).
revoke all on table public.invoices from anon;
revoke all on table public.invoices from authenticated;
grant select, insert, update, delete on table public.invoices to authenticated;
grant all on table public.invoices to service_role;
revoke all on function public.invoices_before_write() from public, anon, authenticated;

-- Assertions: abort if RLS or a policy is missing, or anon can reach the table.
do $$
declare
  p text;
  missing text := '';
begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'invoices' and c.relrowsecurity) then
    missing := missing || ' RLS-off:invoices';
  end if;
  foreach p in array array['_select_own','_insert_own','_update_own','_delete_own'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoices'
                   and policyname = 'invoices' || p and roles = array['authenticated']::name[]
                   and (coalesce(qual, '') like '%contractor_id = auth.uid()%' or coalesce(with_check, '') like '%contractor_id = auth.uid()%')) then
      missing := missing || format(' policy:invoices%s', p);
    end if;
  end loop;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoices'
             and ('anon' = any(roles) or 'public' = any(roles))) then
    missing := missing || ' invoices-has-anon-policy';
  end if;
  if has_table_privilege('anon', 'public.invoices', 'select') then
    missing := missing || ' anon-can-select-invoices';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'contractor_invoice_counters' and c.relrowsecurity) then
    missing := missing || ' RLS-off:contractor_invoice_counters';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'contractor_invoice_counters') then
    missing := missing || ' counters-has-policy';
  end if;
  if has_table_privilege('anon', 'public.contractor_invoice_counters', 'select,insert,update,delete')
     or has_table_privilege('authenticated', 'public.contractor_invoice_counters', 'select,insert,update,delete') then
    missing := missing || ' client-can-touch-counters';
  end if;
  if not exists (select 1 from pg_proc where oid = 'public.invoices_before_write()'::regprocedure and prosecdef
                 and proconfig @> array['search_path=public, pg_temp']) then
    missing := missing || ' trigger-not-definer-with-search_path';
  end if;
  if missing <> '' then
    raise exception 'invoices verify failed:%', missing;
  end if;
end $$;

commit;
