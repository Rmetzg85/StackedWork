-- StackedWork: rate limiting for the public form endpoints (/api/leads, /api/homeowner-lead, /api/notify-signup).
-- NOT APPLIED by the PR that adds it; the app falls back to an in-memory limiter until this exists.
-- Fixed-window counter keyed by "<route>:<salted sha256 of the client IP>" (raw IPs are never stored).
-- Only the server (service_role) uses it: RLS on with no policies, and execute is revoked from anon/authenticated.
-- Re-runnable.

create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / greatest(p_window_seconds, 1)) * greatest(p_window_seconds, 1));
  c integer;
begin
  insert into public.rate_limits as r (key, window_start, count) values (left(p_key, 200), w, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into c;
  -- Opportunistic cleanup (about 1 in 100 calls): drop windows older than a day.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return c;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer) to service_role;
grant select, insert, update, delete on table public.rate_limits to service_role;
