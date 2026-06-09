import { z } from "zod";

import {
  DAILY_ACTIVITY_OPTIONS,
  DIET_TYPES,
  EQUIPMENT_TYPES,
  FEEL_OPTIONS,
  GENDERS,
  GOALS,
  GYM_ACCESS_OPTIONS,
  MOOD_OPTIONS,
  SLEEP_QUALITIES,
  TRAINING_EXPERIENCES,
  UNIT_SYSTEMS,
  WORK_TYPES,
} from "@/lib/constants";

/** Build a Zod-friendly enum tuple from a constants array, preserving literals. */
function enumValues<const T extends ReadonlyArray<{ value: string }>>(arr: T) {
  return arr.map((a) => a.value) as [
    T[number]["value"],
    ...T[number]["value"][],
  ];
}

const optionalNumber = (min: number, max: number) =>
  z.coerce
    .number()
    .min(min)
    .max(max)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null));

/**
 * Full onboarding schema. All canonical units are metric (cm/kg) — the UI
 * converts for imperial users. Steps validate subsets of these fields.
 */
export const onboardingSchema = z.object({
  // Personal
  first_name: z.string().min(1, "Please enter your first name").max(50),
  last_name: z.string().max(50).optional(),
  gender: z.enum(enumValues(GENDERS)),
  age: z.coerce
    .number()
    .int()
    .min(13, "You must be at least 13")
    .max(100, "Please enter a valid age"),
  unit_system: z.enum(enumValues(UNIT_SYSTEMS)),
  height_cm: z.coerce.number().min(120, "Too short").max(250, "Too tall"),
  weight_kg: z.coerce.number().min(30, "Too light").max(400, "Too heavy"),
  target_weight_kg: z.coerce.number().min(30).max(400),
  country: z.string().optional(),
  language: z.string().default("en"),

  // Fitness
  training_experience: z.enum(enumValues(TRAINING_EXPERIENCES)),
  gym_access: z.enum(enumValues(GYM_ACCESS_OPTIONS)),
  available_equipment: z.array(z.enum(enumValues(EQUIPMENT_TYPES))).default([]),

  // Goals & schedule
  goals: z
    .array(z.enum(enumValues(GOALS)))
    .min(1, "Choose at least one goal")
    .max(4, "Pick up to 4 goals to stay focused"),
  available_days: z.coerce.number().int().min(2).max(6),
  session_minutes: z.coerce.number().int().min(20).max(120),

  // Body (optional)
  body_fat_pct: optionalNumber(3, 60),
  waist_cm: optionalNumber(40, 200),
  chest_cm: optionalNumber(50, 200),
  arms_cm: optionalNumber(15, 80),
  legs_cm: optionalNumber(30, 120),
  shoulders_cm: optionalNumber(70, 200),
  neck_cm: optionalNumber(25, 80),

  // Lifestyle
  daily_activity: z.enum(enumValues(DAILY_ACTIVITY_OPTIONS)),
  work_type: z.enum(enumValues(WORK_TYPES)),
  sleep_hours: z.coerce.number().min(3).max(14),
  sleep_quality: z.enum(enumValues(SLEEP_QUALITIES)),

  // Nutrition
  diet_type: z.enum(enumValues(DIET_TYPES)),
  meals_per_day: z.coerce.number().int().min(1).max(8),
  water_intake_l: z.coerce.number().min(0).max(10),

  // Health
  injuries: z.array(z.string()).default([]),
  medical_conditions: z.string().max(500).optional(),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

/** Sensible defaults so the wizard starts in a valid-ish state. */
export const onboardingDefaults: OnboardingData = {
  first_name: "",
  last_name: "",
  gender: "male",
  age: 28,
  unit_system: "metric",
  height_cm: 175,
  weight_kg: 80,
  target_weight_kg: 75,
  country: "",
  language: "en",
  training_experience: "beginner",
  gym_access: "full_gym",
  available_equipment: [],
  goals: [],
  available_days: 3,
  session_minutes: 60,
  body_fat_pct: null,
  waist_cm: null,
  chest_cm: null,
  arms_cm: null,
  legs_cm: null,
  shoulders_cm: null,
  neck_cm: null,
  daily_activity: "light",
  work_type: "office",
  sleep_hours: 7,
  sleep_quality: "good",
  diet_type: "normal",
  meals_per_day: 3,
  water_intake_l: 2.5,
  injuries: [],
  medical_conditions: "",
};

/** Fields validated at each step, used for step-gated navigation. */
export const STEP_FIELDS = [
  ["first_name", "gender", "age", "height_cm", "weight_kg", "target_weight_kg"],
  ["training_experience", "gym_access", "available_equipment"],
  ["goals", "available_days", "session_minutes"],
  [], // body measurements — all optional
  ["daily_activity", "work_type", "sleep_hours", "sleep_quality"],
  ["diet_type", "meals_per_day", "water_intake_l"],
  ["injuries"],
] as const satisfies ReadonlyArray<ReadonlyArray<keyof OnboardingData>>;

/** Profile patch validation for the settings screen. */
export const profileUpdateSchema = onboardingSchema.partial();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** Daily check-in submission. `date` is the user-local calendar day. */
export const checkinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  feel: z.enum(enumValues(FEEL_OPTIONS)),
  energy: z.coerce.number().int().min(1).max(10),
  sleep: z.coerce.number().int().min(1).max(10),
  soreness: z.coerce.number().int().min(1).max(10),
  mood: z.enum(enumValues(MOOD_OPTIONS)).nullable().optional(),
  weight_kg: optionalNumber(30, 400),
  note: z.string().max(300).optional(),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

/** New measurement entry (progress screen). */
export const measurementSchema = z.object({
  weight_kg: optionalNumber(30, 400),
  body_fat_pct: optionalNumber(3, 60),
  waist_cm: optionalNumber(40, 200),
  chest_cm: optionalNumber(50, 200),
  arms_cm: optionalNumber(15, 80),
  legs_cm: optionalNumber(30, 120),
  shoulders_cm: optionalNumber(70, 200),
  neck_cm: optionalNumber(25, 80),
  notes: z.string().max(300).optional(),
});
export type MeasurementInput = z.infer<typeof measurementSchema>;
