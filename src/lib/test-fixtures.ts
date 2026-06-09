/**
 * Test-only factories for the daily-companion engines. Imported exclusively
 * by `*.test.ts` files — never by application code.
 */
import { addDaysISO } from "@/lib/dates";
import type {
  DailyCheckin,
  Measurement,
  Profile,
  TrainingSession,
} from "@/types";

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "test-user",
    first_name: "Sam",
    last_name: null,
    gender: "male",
    birth_date: null,
    age: 30,
    height_cm: 180,
    weight_kg: 84,
    target_weight_kg: 76,
    body_fat_pct: null,
    country: null,
    language: "en",
    unit_system: "metric",
    training_experience: "intermediate",
    gym_access: "full_gym",
    available_equipment: [],
    goals: ["fat_loss"],
    daily_activity: "active",
    work_type: "office",
    sleep_hours: 7,
    sleep_quality: "good",
    diet_type: "normal",
    meals_per_day: 3,
    water_intake_l: 2.5,
    injuries: [],
    medical_conditions: null,
    available_days: 3,
    session_minutes: 60,
    avatar_url: null,
    onboarding_completed: true,
    created_at: "2026-03-01T08:00:00.000Z",
    updated_at: "2026-03-01T08:00:00.000Z",
    ...overrides,
  };
}

export function makeCheckin(
  date: string,
  overrides: Partial<DailyCheckin> = {}
): DailyCheckin {
  return {
    id: `c-${date}`,
    profile_id: "test-user",
    date,
    feel: "good",
    energy: 6,
    sleep: 6,
    soreness: 3,
    mood: null,
    weight_kg: null,
    note: null,
    created_at: `${date}T08:00:00.000Z`,
    ...overrides,
  };
}

export function makeSession(
  dateISO: string,
  overrides: Partial<TrainingSession> = {}
): TrainingSession {
  return {
    id: `s-${dateISO}-${overrides.day_index ?? 0}`,
    profile_id: "test-user",
    plan_id: null,
    day_index: 0,
    day_name: "Day A",
    status: "completed",
    started_at: `${dateISO}T18:00:00.000Z`,
    completed_at: `${dateISO}T19:00:00.000Z`,
    duration_seconds: 3600,
    total_volume_kg: 8000,
    notes: null,
    ...overrides,
  };
}

export function makeWeight(dateISO: string, kg: number): Measurement {
  return {
    id: `m-${dateISO}`,
    profile_id: "test-user",
    measured_at: `${dateISO}T07:00:00.000Z`,
    weight_kg: kg,
    body_fat_pct: null,
    waist_cm: null,
    chest_cm: null,
    arms_cm: null,
    legs_cm: null,
    shoulders_cm: null,
    neck_cm: null,
    hips_cm: null,
    notes: null,
  };
}

/**
 * `perWeek` completed sessions (Mon/Wed/Fri order) for each given Monday.
 */
export function weeklySessions(
  mondays: string[],
  perWeek = 3
): TrainingSession[] {
  const offsets = [0, 2, 4, 1, 3, 5];
  return mondays.flatMap((monday, w) =>
    offsets
      .slice(0, perWeek)
      .map((off, i) =>
        makeSession(addDaysISO(monday, off), { day_index: i, id: `s-w${w}-${i}` })
      )
  );
}
