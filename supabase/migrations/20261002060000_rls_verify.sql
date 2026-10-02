-- StackedWork: RLS verify + contractor scoping (QA bundle 2026-10-02)
-- Project: ucjnajvgpxsijzpaigpm
--
-- *** NOT APPLIED. Review, then run manually in the Supabase SQL editor (or `supabase db push`). ***
--
-- Context: /workspace/stackedwork/RLS-LOCKDOWN-2026-09-15.sql was already applied in prod. This file is
-- idempotent and uses the SAME policy names and definitions, so re-running it is a no-op for those
-- tables. It (1) asserts RLS is on, (2) re-creates the owner-only policies for the contractor tables,
-- (3) adds a nullable homeowner_leads.contractor_id (no client policy, so homeowner_leads stays
-- service_role-only), (4) adds per-user storage policies for the stackedwork-images bucket, and
-- (5) fails loudly if anything is missing.
--
-- service_role (Stripe webhook, /api/leads, /api/homeowner-lead, estimate token page) bypasses RLS.

begin;

-- 1) Enable RLS (no-op if already on)
alter table public.jobs       enable row level security;
alter table public.estimates  enable row level security;
alter table public.leads      enable row level security;
alter table public.portfolio  enable row level security;
alter table public.receipts   enable row level security;
alter table public.homeowner_leads enable row level security;
alter table public.subscriptions   enable row level security;

-- 2) Owner-only policies: contractor_id = auth.uid()  (same names as the 2026-09-15 lockdown)
do $$
declare
  t text;
begin
  foreach t in array array['jobs','estimates','leads','portfolio','receipts'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format('create policy %I on public.%I for select to authenticated using (contractor_id = auth.uid())', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (contractor_id = auth.uid())', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (contractor_id = auth.uid()) with check (contractor_id = auth.uid())', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (contractor_id = auth.uid())', t || '_delete_own', t);
  end loop;
end $$;

-- 3) homeowner_leads: optional owner column so the CRM can filter by contractor.
--    Intentionally NO anon/authenticated policy: table stays service_role-only (RLS not opened).
alter table public.homeowner_leads add column if not exists contractor_id uuid;
create index if not exists homeowner_leads_contractor_id_idx on public.homeowner_leads (contractor_id);

-- 4) jobs.value: price is optional in the app now. Allow NULL (no-op if already nullable).
alter table public.jobs alter column value drop not null;

-- 5) Storage: per-user folders in stackedwork-images ("<auth.uid()>/portfolio/...", "<auth.uid()>/receipts/...").
--    These are ADDITIVE permissive policies. If older broad policies exist on storage.objects for this bucket
--    (e.g. "any authenticated user may insert/update"), they still apply (permissive policies are OR'ed),
--    so review `select * from pg_policies where schemaname='storage'` and drop broad ones separately.
drop policy if exists sw_images_insert_own_folder on storage.objects;
create policy sw_images_insert_own_folder on storage.objects
  for insert to authenticated
  with check (bucket_id = 'stackedwork-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists sw_images_update_own_folder on storage.objects;
create policy sw_images_update_own_folder on storage.objects
  for update to authenticated
  using (bucket_id = 'stackedwork-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'stackedwork-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists sw_images_delete_own_folder on storage.objects;
create policy sw_images_delete_own_folder on storage.objects
  for delete to authenticated
  using (bucket_id = 'stackedwork-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) Assertions: abort the transaction if RLS or a policy is missing.
do $$
declare
  t text;
  p text;
  missing text := '';
begin
  foreach t in array array['jobs','estimates','leads','portfolio','receipts','homeowner_leads','subscriptions'] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relrowsecurity
    ) then
      missing := missing || format(' RLS-off:%s', t);
    end if;
  end loop;

  foreach t in array array['jobs','estimates','leads','portfolio','receipts'] loop
    foreach p in array array['_select_own','_insert_own','_update_own','_delete_own'] loop
      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = t and policyname = t || p
          and (coalesce(qual, '') like '%contractor_id = auth.uid()%' or coalesce(with_check, '') like '%contractor_id = auth.uid()%')
      ) then
        missing := missing || format(' policy:%s', t || p);
      end if;
    end loop;
  end loop;

  -- homeowner_leads must not be readable by clients
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'homeowner_leads'
      and ('anon' = any(roles) or 'authenticated' = any(roles) or 'public' = any(roles))
  ) then
    missing := missing || ' homeowner_leads-has-client-policy';
  end if;

  if missing <> '' then
    raise exception 'RLS verify failed:%', missing;
  end if;
end $$;

commit;
