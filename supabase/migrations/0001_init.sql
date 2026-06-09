-- ============================================================================
-- JYM — initial schema
-- AI Gym Training & Weight-Loss Planner
--
-- Design notes:
--  * Static reference content (equipment + exercises) lives in the app today,
--    but tables exist here so it can move to the DB and support multiple
--    equipment manufacturers (Phase 2 scalability requirement).
--  * User content (profiles, measurements, sessions, logs, plans) is owned by
--    the authenticated user and protected by Row Level Security.
--  * Enumerations are modelled as TEXT to stay forward-compatible; the app is
--    the source of truth for allowed values.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Reference: manufacturers, equipment, exercises, muscle groups
-- ----------------------------------------------------------------------------
create table if not exists public.manufacturers (
  key         text primary key,
  name        text not null,
  website     text,
  created_at  timestamptz not null default now()
);

create table if not exists public.muscle_groups (
  key   text primary key,
  name  text not null
);

create table if not exists public.exercises (
  slug              text primary key,
  name              text not null,
  description       text,
  category          text not null,
  primary_muscles   text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  muscle_groups     text[] not null default '{}',
  difficulty        text not null,
  equipment         text[] not null default '{}',
  mechanic          text,
  force             text,
  default_sets      int,
  rep_low           int,
  rep_high          int,
  rest_seconds      int,
  tempo             text,
  video_url         text,
  image_url         text,
  instructions      text[] not null default '{}',
  tips              text[] not null default '{}',
  alternatives      text[] not null default '{}',
  is_unilateral     boolean not null default false,
  created_at        timestamptz not null default now()
);

create table if not exists public.equipment (
  slug              text primary key,
  name              text not null,
  manufacturer      text references public.manufacturers(key),
  category          text not null,
  description       text,
  muscle_groups     text[] not null default '{}',
  primary_muscles   text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  difficulty        text not null,
  equipment_type    text not null,
  image_url         text,
  video_url         text,
  instructions      text[] not null default '{}',
  exercises         text[] not null default '{}',
  created_at        timestamptz not null default now()
);

create index if not exists equipment_category_idx on public.equipment (category);
create index if not exists exercises_category_idx on public.exercises (category);

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  first_name           text,
  last_name            text,
  gender               text,
  birth_date           date,
  age                  int,
  height_cm            numeric(5,1),
  weight_kg            numeric(5,1),
  target_weight_kg     numeric(5,1),
  body_fat_pct         numeric(4,1),
  country              text,
  language             text default 'en',
  unit_system          text not null default 'metric',
  training_experience  text,
  gym_access           text,
  available_equipment  text[] not null default '{}',
  goals                text[] not null default '{}',
  daily_activity       text,
  work_type            text,
  sleep_hours          numeric(3,1),
  sleep_quality        text,
  diet_type            text,
  meals_per_day        int,
  water_intake_l       numeric(3,1),
  injuries             text[] not null default '{}',
  medical_conditions   text,
  available_days       int default 3,
  session_minutes      int default 60,
  avatar_url           text,
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Measurements (progress tracking)
-- ----------------------------------------------------------------------------
create table if not exists public.measurements (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  measured_at   timestamptz not null default now(),
  weight_kg     numeric(5,1),
  body_fat_pct  numeric(4,1),
  waist_cm      numeric(5,1),
  chest_cm      numeric(5,1),
  arms_cm       numeric(5,1),
  legs_cm       numeric(5,1),
  shoulders_cm  numeric(5,1),
  neck_cm       numeric(5,1),
  hips_cm       numeric(5,1),
  notes         text
);

create index if not exists measurements_profile_idx
  on public.measurements (profile_id, measured_at);

-- ----------------------------------------------------------------------------
-- Workout plans (persisted history / editing — app also recomputes on the fly)
-- ----------------------------------------------------------------------------
create table if not exists public.workout_plans (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  goal            text,
  experience      text,
  split_type      text,
  days_per_week   int,
  session_minutes int,
  weeks           int,
  summary         text,
  status          text not null default 'active',
  meta            jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists public.workout_days (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references public.workout_plans(id) on delete cascade,
  day_index         int not null,
  name              text not null,
  focus             text,
  estimated_minutes int
);

create table if not exists public.workout_exercises (
  id              uuid primary key default gen_random_uuid(),
  workout_day_id  uuid not null references public.workout_days(id) on delete cascade,
  exercise_slug   text not null,
  order_index     int not null default 0,
  sets            int,
  reps            text,
  rest_seconds    int,
  tempo           text,
  notes           text,
  superset_group  text
);

-- ----------------------------------------------------------------------------
-- Training sessions + per-set logs
-- ----------------------------------------------------------------------------
create table if not exists public.training_sessions (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  plan_id         uuid references public.workout_plans(id) on delete set null,
  day_index       int,
  day_name        text,
  status          text not null default 'completed',
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  duration_seconds int,
  total_volume_kg numeric(8,1),
  notes           text
);

create index if not exists sessions_profile_idx
  on public.training_sessions (profile_id, started_at desc);

create table if not exists public.exercise_logs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.training_sessions(id) on delete cascade,
  exercise_slug text not null,
  set_number    int not null,
  reps          int,
  weight_kg     numeric(6,1),
  rpe           numeric(3,1),
  completed     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists logs_session_idx on public.exercise_logs (session_id);

-- ----------------------------------------------------------------------------
-- Progress photos
-- ----------------------------------------------------------------------------
create table if not exists public.progress_photos (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  taken_at    timestamptz not null default now(),
  url         text not null,
  pose        text,
  notes       text
);

-- ----------------------------------------------------------------------------
-- Triggers: keep updated_at fresh + provision a profile row on signup
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
