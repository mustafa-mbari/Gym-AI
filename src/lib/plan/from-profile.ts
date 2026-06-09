import type { PlanInput, Profile } from "@/types";
import type { OnboardingData } from "@/lib/validations";
import { generatePlan } from "./generator";

/** Normalise a stored profile into the generator's input slice. */
export function profileToPlanInput(profile: Profile): PlanInput {
  return {
    goals: profile.goals?.length ? profile.goals : ["general_fitness"],
    experience: profile.training_experience ?? "beginner",
    gym_access: profile.gym_access ?? "full_gym",
    available_equipment: profile.available_equipment ?? [],
    available_days: profile.available_days ?? 3,
    session_minutes: profile.session_minutes ?? 60,
    injuries: profile.injuries ?? [],
  };
}

/**
 * The active plan is a pure function of the profile, so we can recompute it
 * deterministically rather than persisting every set/rep. (Plan tables still
 * exist in the schema for future editing / history.)
 */
export function planForProfile(profile: Profile) {
  return generatePlan(profileToPlanInput(profile));
}

/** Convert validated onboarding answers into a full Profile row. */
export function onboardingToProfile(
  data: OnboardingData,
  id = "demo-user"
): Profile {
  const now = new Date().toISOString();
  return {
    id,
    first_name: data.first_name,
    last_name: data.last_name ?? null,
    gender: data.gender,
    birth_date: null,
    age: data.age,
    height_cm: data.height_cm,
    weight_kg: data.weight_kg,
    target_weight_kg: data.target_weight_kg,
    body_fat_pct: data.body_fat_pct ?? null,
    country: data.country ?? null,
    language: data.language ?? "en",
    unit_system: data.unit_system,
    training_experience: data.training_experience,
    gym_access: data.gym_access,
    available_equipment: data.available_equipment ?? [],
    goals: data.goals,
    daily_activity: data.daily_activity,
    work_type: data.work_type,
    sleep_hours: data.sleep_hours,
    sleep_quality: data.sleep_quality,
    diet_type: data.diet_type,
    meals_per_day: data.meals_per_day,
    water_intake_l: data.water_intake_l,
    injuries: data.injuries ?? [],
    medical_conditions: data.medical_conditions ?? null,
    available_days: data.available_days,
    session_minutes: data.session_minutes,
    avatar_url: null,
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  };
}
