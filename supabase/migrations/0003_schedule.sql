-- ============================================================================
-- JYM — schedule overrides
-- Persists a user's calendar customisations (moves, skips, completed, rest
-- days) for logged-in users. The default weekly cadence is still derived
-- client-side from the plan; only user overrides are stored here.
-- ============================================================================

create table if not exists public.schedule_overrides (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  day_index   int,
  status      text not null default 'planned',
  cleared     boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (profile_id, date)
);

create index if not exists schedule_overrides_profile_idx
  on public.schedule_overrides (profile_id, date);

alter table public.schedule_overrides enable row level security;

create policy "schedule_rw_own" on public.schedule_overrides
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
