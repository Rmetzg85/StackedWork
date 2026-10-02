-- StackedWork: subscriptions.user_id (QA bundle 2026-10-02)
-- *** NOT APPLIED. Review, then run manually. Safe to re-run. ***
--
-- Why: subscriptions is keyed by email today (the Stripe webhook only knows the Stripe customer's email).
-- Email lookups break if a user changes their login email or if case differs. This adds a nullable
-- user_id, backfills it from auth.users by case-insensitive email, and lets a signed-in user read
-- their row by user_id. The existing email policy (subscriptions_select_own_email) is kept, and the
-- app prefers user_id, then falls back to email, so nothing breaks before or after this runs.
-- Writes stay service_role only (Stripe webhook).

begin;

alter table public.subscriptions add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- Backfill: only rows with no user_id yet, matched on lower(email). Skips emails shared by more than one auth user.
update public.subscriptions s
set user_id = u.id
from auth.users u
where s.user_id is null
  and s.email is not null
  and lower(u.email) = lower(s.email)
  and (select count(*) from auth.users u2 where lower(u2.email) = lower(s.email)) = 1;

drop policy if exists subscriptions_select_own_user on public.subscriptions;
create policy subscriptions_select_own_user on public.subscriptions
  for select to authenticated
  using (user_id is not null and user_id = auth.uid());

commit;

-- Verify (run after):
-- select count(*) filter (where user_id is null) as unlinked, count(*) as total from public.subscriptions;
