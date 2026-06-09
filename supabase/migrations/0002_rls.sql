-- ============================================================================
-- JYM — Row Level Security
-- Users may only read/write their own data. Reference catalog is world-readable
-- (writes happen via the service role, which bypasses RLS).
-- ============================================================================

-- Reference catalog: public read -------------------------------------------
alter table public.manufacturers enable row level security;
alter table public.muscle_groups enable row level security;
alter table public.equipment     enable row level security;
alter table public.exercises     enable row level security;

create policy "catalog_read_manufacturers" on public.manufacturers
  for select to anon, authenticated using (true);
create policy "catalog_read_muscle_groups" on public.muscle_groups
  for select to anon, authenticated using (true);
create policy "catalog_read_equipment" on public.equipment
  for select to anon, authenticated using (true);
create policy "catalog_read_exercises" on public.exercises
  for select to anon, authenticated using (true);

-- Profiles ------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Measurements --------------------------------------------------------------
alter table public.measurements enable row level security;

create policy "measurements_rw_own" on public.measurements
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Workout plans -------------------------------------------------------------
alter table public.workout_plans enable row level security;

create policy "plans_rw_own" on public.workout_plans
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Workout days / exercises: ownership via the parent plan -------------------
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;

create policy "days_rw_own" on public.workout_days
  for all to authenticated
  using (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_days.plan_id and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_days.plan_id and p.profile_id = auth.uid()
    )
  );

create policy "wexercises_rw_own" on public.workout_exercises
  for all to authenticated
  using (
    exists (
      select 1
      from public.workout_days d
      join public.workout_plans p on p.id = d.plan_id
      where d.id = workout_exercises.workout_day_id and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_days d
      join public.workout_plans p on p.id = d.plan_id
      where d.id = workout_exercises.workout_day_id and p.profile_id = auth.uid()
    )
  );

-- Training sessions ---------------------------------------------------------
alter table public.training_sessions enable row level security;

create policy "sessions_rw_own" on public.training_sessions
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Exercise logs: ownership via the parent session --------------------------
alter table public.exercise_logs enable row level security;

create policy "logs_rw_own" on public.exercise_logs
  for all to authenticated
  using (
    exists (
      select 1 from public.training_sessions s
      where s.id = exercise_logs.session_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.training_sessions s
      where s.id = exercise_logs.session_id and s.profile_id = auth.uid()
    )
  );

-- Progress photos -----------------------------------------------------------
alter table public.progress_photos enable row level security;

create policy "photos_rw_own" on public.progress_photos
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
