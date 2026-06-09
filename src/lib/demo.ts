/**
 * Demo data powering the app in "demo mode" (no Supabase configured) and the
 * marketing previews. Deterministic so screenshots/tests stay stable.
 */
import type {
  Measurement,
  Profile,
  TrainingSession,
} from "@/types";

export const DEMO_PROFILE: Profile = {
  id: "demo-user",
  first_name: "Alex",
  last_name: "Carter",
  gender: "male",
  birth_date: "1996-04-12",
  age: 30,
  height_cm: 180,
  weight_kg: 84,
  target_weight_kg: 76,
  body_fat_pct: 20,
  country: "Germany",
  language: "en",
  unit_system: "metric",
  training_experience: "intermediate",
  gym_access: "full_gym",
  available_equipment: [
    "barbell",
    "dumbbell",
    "machine",
    "cable",
    "bench",
    "pull_up_bar",
    "cardio_machine",
  ],
  goals: ["fat_loss", "build_muscle"],
  daily_activity: "active",
  work_type: "office",
  sleep_hours: 7,
  sleep_quality: "good",
  diet_type: "high_protein",
  meals_per_day: 4,
  water_intake_l: 3,
  injuries: [],
  medical_conditions: null,
  available_days: 4,
  session_minutes: 60,
  avatar_url: null,
  onboarding_completed: true,
  created_at: "2026-03-01T08:00:00.000Z",
  updated_at: new Date().toISOString(),
};

/** Twelve weeks of measurements trending toward the goal. */
export function demoMeasurements(): Measurement[] {
  const weeks = 12;
  const start = {
    weight: 89,
    bf: 24,
    waist: 94,
    chest: 104,
    arms: 37,
    legs: 60,
    shoulders: 122,
    neck: 40,
  };
  const end = {
    weight: 84,
    bf: 20,
    waist: 87,
    chest: 106,
    arms: 38.5,
    legs: 61.5,
    shoulders: 124,
    neck: 39.5,
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const now = Date.now();
  const out: Measurement[] = [];
  for (let i = 0; i < weeks; i++) {
    const t = i / (weeks - 1);
    // gentle noise for realism, deterministic
    const wobble = Math.sin(i * 1.3) * 0.4;
    const daysAgo = (weeks - 1 - i) * 7;
    out.push({
      id: `demo-m-${i}`,
      profile_id: "demo-user",
      measured_at: new Date(now - daysAgo * 86400000).toISOString(),
      weight_kg: +(lerp(start.weight, end.weight, t) + wobble).toFixed(1),
      body_fat_pct: +(lerp(start.bf, end.bf, t) + wobble * 0.2).toFixed(1),
      waist_cm: +lerp(start.waist, end.waist, t).toFixed(1),
      chest_cm: +lerp(start.chest, end.chest, t).toFixed(1),
      arms_cm: +lerp(start.arms, end.arms, t).toFixed(1),
      legs_cm: +lerp(start.legs, end.legs, t).toFixed(1),
      shoulders_cm: +lerp(start.shoulders, end.shoulders, t).toFixed(1),
      neck_cm: +lerp(start.neck, end.neck, t).toFixed(1),
      hips_cm: null,
      notes: null,
    });
  }
  return out;
}

/** Recent training sessions to drive the streak + history widgets. */
export function demoSessions(): TrainingSession[] {
  // Trained on a 4-day cadence over the last ~3 weeks.
  const pattern = [0, 1, 3, 4, 7, 8, 10, 11, 14, 15, 17, 18, 21];
  const names = ["Upper A", "Lower A", "Upper B", "Lower B"];
  const now = Date.now();
  return pattern.map((daysAgo, i) => {
    const started = new Date(now - daysAgo * 86400000);
    started.setHours(18, 0, 0, 0);
    const duration = 3200 + (i % 4) * 220;
    return {
      id: `demo-s-${i}`,
      profile_id: "demo-user",
      plan_id: "demo-plan",
      day_index: i % 4,
      day_name: names[i % 4],
      status: "completed",
      started_at: started.toISOString(),
      completed_at: new Date(started.getTime() + duration * 1000).toISOString(),
      duration_seconds: duration,
      total_volume_kg: 8200 + (i % 5) * 540,
      notes: null,
    };
  });
}

/** A single measurement snapshot from a profile's current values. */
export function starterMeasurement(profile: Profile): Measurement {
  return {
    id: "starter",
    profile_id: profile.id,
    measured_at: profile.created_at ?? new Date().toISOString(),
    weight_kg: profile.weight_kg,
    body_fat_pct: profile.body_fat_pct,
    waist_cm: null,
    chest_cm: null,
    arms_cm: null,
    legs_cm: null,
    shoulders_cm: null,
    neck_cm: null,
    hips_cm: null,
    notes: "Starting point",
  };
}

export const DEMO_PLAN_INPUT = {
  goals: DEMO_PROFILE.goals,
  experience: DEMO_PROFILE.training_experience ?? "intermediate",
  gym_access: DEMO_PROFILE.gym_access ?? "full_gym",
  available_equipment: DEMO_PROFILE.available_equipment,
  available_days: DEMO_PROFILE.available_days ?? 4,
  session_minutes: DEMO_PROFILE.session_minutes ?? 60,
  injuries: DEMO_PROFILE.injuries,
} as const;
