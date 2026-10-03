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
-- Numbering: the BEFORE INSERT trigger always assigns number = max(own number) + 1, under a per-contractor
--   transaction advisory lock, so concurrent inserts for one contractor serialize. unique (contractor_id, number)
--   is the backstop; the app retries once on a 23505. Clients can't choose or change a number. Display form
--   is the generated column invoice_number: INV-0001 ... INV-9999, then INV-10000.
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

-- Number, Net 15 default, paid_at and immutable fields.
create or replace function public.invoices_before_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.contractor_id is null then
      raise exception 'invoices.contractor_id is required';
    end if;
    -- Serialize numbering per contractor for the rest of this transaction.
    perform pg_advisory_xact_lock(hashtextextended('invoices:' || new.contractor_id::text, 0));
    select coalesce(max(i.number), 0) + 1 into new.number from public.invoices i where i.contractor_id = new.contractor_id;
    if new.issue_date is null then new.issue_date := (now() at time zone 'America/New_York')::date; end if;
    new.created_at := coalesce(new.created_at, now());
  else
    new.number := old.number;               -- numbers never change
    new.contractor_id := old.contractor_id; -- invoices can't be moved to another contractor
    new.share_token := old.share_token;
    new.created_at := old.created_at;
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
revoke all on function public.invoices_before_write() from public, anon;

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
  if missing <> '' then
    raise exception 'invoices verify failed:%', missing;
  end if;
end $$;

commit;
