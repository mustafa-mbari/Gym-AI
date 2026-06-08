import type {
  DAILY_ACTIVITY_OPTIONS,
  DIET_TYPES,
  DIFFICULTIES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_TYPES,
  GENDERS,
  GOALS,
  GYM_ACCESS_OPTIONS,
  MUSCLE_GROUPS,
  SLEEP_QUALITIES,
  SPLIT_TYPES,
  TRAINING_EXPERIENCES,
  UNIT_SYSTEMS,
  WORK_TYPES,
} from "@/lib/constants";

/** Helper to pull the literal `value` union out of an option array. */
type ValueOf<T extends ReadonlyArray<{ value: string }>> = T[number]["value"];

export type Gender = ValueOf<typeof GENDERS>;
export type UnitSystem = ValueOf<typeof UNIT_SYSTEMS>;
export type TrainingExperience = ValueOf<typeof TRAINING_EXPERIENCES>;
export type GymAccess = ValueOf<typeof GYM_ACCESS_OPTIONS>;
export type Goal = ValueOf<typeof GOALS>;
export type DailyActivity = ValueOf<typeof DAILY_ACTIVITY_OPTIONS>;
export type WorkType = ValueOf<typeof WORK_TYPES>;
export type DietType = ValueOf<typeof DIET_TYPES>;
export type SleepQuality = ValueOf<typeof SLEEP_QUALITIES>;
export type Difficulty = ValueOf<typeof DIFFICULTIES>;
export type MuscleGroup = ValueOf<typeof MUSCLE_GROUPS>;
export type EquipmentCategory = ValueOf<typeof EQUIPMENT_CATEGORIES>;
export type EquipmentType = ValueOf<typeof EQUIPMENT_TYPES>;
export type SplitType = ValueOf<typeof SPLIT_TYPES>;

/** Force vector of an exercise — the primary movement direction. */
export type ForceType = "push" | "pull" | "static" | "hinge" | "squat";

/** Movement complexity. */
export type Mechanic = "compound" | "isolation";

// ──────────────────────────────────────────────────────────────────────────
// User & profile
// ──────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: Gender | null;
  birth_date: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  body_fat_pct: number | null;
  country: string | null;
  language: string | null;
  unit_system: UnitSystem;
  training_experience: TrainingExperience | null;
  gym_access: GymAccess | null;
  available_equipment: EquipmentType[];
  goals: Goal[];
  daily_activity: DailyActivity | null;
  work_type: WorkType | null;
  sleep_hours: number | null;
  sleep_quality: SleepQuality | null;
  diet_type: DietType | null;
  meals_per_day: number | null;
  water_intake_l: number | null;
  injuries: string[];
  medical_conditions: string | null;
  available_days: number | null;
  session_minutes: number | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Catalog: equipment & exercises (static reference content)
// ──────────────────────────────────────────────────────────────────────────

export interface Equipment {
  slug: string;
  name: string;
  manufacturer: string;
  category: EquipmentCategory;
  description: string;
  muscle_groups: MuscleGroup[];
  primary_muscles: string[];
  secondary_muscles: string[];
  difficulty: Difficulty;
  equipment_type: EquipmentType;
  image_url: string | null;
  video_url: string | null;
  instructions: string[];
  /** Exercise slugs that can be performed on this machine. */
  exercises: string[];
}

export interface Exercise {
  slug: string;
  name: string;
  description: string;
  category: MuscleGroup;
  primary_muscles: string[];
  secondary_muscles: string[];
  muscle_groups: MuscleGroup[];
  difficulty: Difficulty;
  equipment: EquipmentType[];
  mechanic: Mechanic;
  force: ForceType;
  /** Default programming defaults; the generator may override per-goal. */
  default_sets: number;
  rep_range: [number, number];
  rest_seconds: number;
  tempo: string | null;
  video_url: string | null;
  image_url: string | null;
  instructions: string[];
  tips: string[];
  /** Slugs of alternative exercises (same pattern / muscles). */
  alternatives: string[];
  is_unilateral: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Generated plans
// ──────────────────────────────────────────────────────────────────────────

export interface PlannedExercise {
  exercise_slug: string;
  name: string;
  sets: number;
  /** Display string, e.g. "8–12" or "30s". */
  reps: string;
  rep_low: number;
  rep_high: number;
  rest_seconds: number;
  tempo: string | null;
  notes: string | null;
  superset_group: string | null;
  /** Muscle groups this movement trains, for volume accounting. */
  muscle_groups: MuscleGroup[];
}

export interface WorkoutDay {
  index: number;
  name: string;
  focus: string;
  /** Estimated duration in minutes. */
  estimated_minutes: number;
  exercises: PlannedExercise[];
  /** Optional finisher / cardio block. */
  cardio: string | null;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  goal: Goal;
  experience: TrainingExperience;
  split_type: SplitType;
  days_per_week: number;
  session_minutes: number;
  weeks: number;
  /** Human-readable summary of the programming rationale. */
  summary: string;
  /** Coaching guidance bullets (progression, cardio, etc.). */
  guidance: string[];
  days: WorkoutDay[];
  /** Weekly set count per muscle group, for the distribution chart. */
  weekly_volume: Record<string, number>;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Tracking
// ──────────────────────────────────────────────────────────────────────────

export interface Measurement {
  id: string;
  profile_id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arms_cm: number | null;
  legs_cm: number | null;
  shoulders_cm: number | null;
  neck_cm: number | null;
  hips_cm: number | null;
  notes: string | null;
}

export interface TrainingSession {
  id: string;
  profile_id: string;
  plan_id: string | null;
  day_index: number | null;
  day_name: string | null;
  status: "in_progress" | "completed" | "skipped";
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  notes: string | null;
}

export interface ExerciseLog {
  id: string;
  session_id: string;
  exercise_slug: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  completed: boolean;
  created_at: string;
}

/** The input the plan generator consumes — a normalised slice of the profile. */
export interface PlanInput {
  goals: Goal[];
  experience: TrainingExperience;
  gym_access: GymAccess;
  available_equipment: EquipmentType[];
  available_days: number;
  session_minutes: number;
  injuries: string[];
}
