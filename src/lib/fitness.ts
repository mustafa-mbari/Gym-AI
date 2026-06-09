/**
 * Evidence-based fitness math: unit conversions, BMI, BMR (Mifflin–St Jeor),
 * TDEE and goal-aware calorie targets. Pure functions, easy to unit test.
 */
import type { DailyActivity, Gender, Goal } from "@/types";

// ── Unit conversions ───────────────────────────────────────────────────────
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const inToCm = (inches: number) => inches * CM_PER_IN;

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = cmToIn(cm);
  const ft = Math.floor(totalIn / 12);
  return { ft, in: Math.round(totalIn - ft * 12) };
}

// ── Age ────────────────────────────────────────────────────────────────────
export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// ── BMI ──────────────────────────────────────────────────────────────────--
export function bmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): {
  label: string;
  tone: "warning" | "success" | "destructive";
} {
  if (value < 18.5) return { label: "Underweight", tone: "warning" };
  if (value < 25) return { label: "Healthy", tone: "success" };
  if (value < 30) return { label: "Overweight", tone: "warning" };
  return { label: "Obese", tone: "destructive" };
}

// ── Energy expenditure ───────────────────────────────────────────────────--
const ACTIVITY_FACTORS: Record<DailyActivity, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  very_active: 1.725,
};

/** Mifflin–St Jeor resting metabolic rate (kcal/day). */
export function bmr(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender | null;
}): number {
  const { weightKg, heightCm, age, gender } = params;
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  // Female offset −161, male +5; use the average for non-binary/unknown.
  const offset = gender === "female" ? -161 : gender === "male" ? 5 : -78;
  return Math.round(base + offset);
}

export function tdee(restingKcal: number, activity: DailyActivity | null) {
  if (!restingKcal) return 0;
  return Math.round(restingKcal * ACTIVITY_FACTORS[activity ?? "sedentary"]);
}

/**
 * Recommended daily calorie + protein targets for the user's primary goal.
 * Deficits/surpluses are conservative and within safe ranges.
 */
export function calorieTarget(params: {
  tdeeKcal: number;
  weightKg: number;
  primaryGoal: Goal | null;
}): { calories: number; protein: number; note: string } {
  const { tdeeKcal, weightKg, primaryGoal } = params;
  if (!tdeeKcal) return { calories: 0, protein: 0, note: "" };

  let calories = tdeeKcal;
  let proteinPerKg = 1.6;
  let note = "Maintain weight while improving fitness.";

  switch (primaryGoal) {
    case "lose_weight":
    case "fat_loss":
      calories = Math.round(tdeeKcal * 0.8); // ~20% deficit
      proteinPerKg = 2.0;
      note = "≈20% calorie deficit for steady, muscle-sparing fat loss.";
      break;
    case "build_muscle":
      calories = Math.round(tdeeKcal * 1.1); // lean surplus
      proteinPerKg = 2.0;
      note = "Small surplus to fuel muscle growth without excess fat gain.";
      break;
    case "strength":
    case "athletic_performance":
      calories = Math.round(tdeeKcal * 1.05);
      proteinPerKg = 1.8;
      note = "Slight surplus to support strength & recovery.";
      break;
    case "endurance":
      calories = tdeeKcal;
      proteinPerKg = 1.6;
      note = "Maintenance calories with ample carbs for endurance work.";
      break;
    default:
      break;
  }

  return {
    calories,
    protein: weightKg ? Math.round(weightKg * proteinPerKg) : 0,
    note,
  };
}

/** Weeks to reach target weight at a safe ~0.6 kg/week change. */
export function estimateWeeksToGoal(
  weightKg: number | null,
  targetKg: number | null
): number | null {
  if (!weightKg || !targetKg) return null;
  const delta = Math.abs(weightKg - targetKg);
  if (delta < 0.5) return 0;
  return Math.ceil(delta / 0.6);
}
