-- ============================================================================
-- JYM — daily check-ins
-- One lightweight wellness snapshot per user per local calendar day. The only
-- persisted entity of the daily-companion system: adaptation state, reviews
-- and predictions are all derived from (check-ins + sessions + measurements).
-- ============================================================================

create table if not exists public.daily_checkins (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  feel        text not null,
  energy      int  not null check (energy between 1 and 10),
  sleep       int  not null check (sleep between 1 and 10),
  soreness    int  not null check (soreness between 1 and 10),
  mood        text,
  weight_kg   numeric(5,1),
  note        text,
  created_at  timestamptz not null default now(),
  unique (profile_id, date)
);

create index if not exists daily_checkins_profile_date_idx
  on public.daily_checkins (profile_id, date desc);

alter table public.daily_checkins enable row level security;

create policy "checkins_rw_own" on public.daily_checkins
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
