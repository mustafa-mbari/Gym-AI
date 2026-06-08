/**
 * Central catalog of onboarding/domain option sets.
 *
 * Every option list is declared `as const` so we can derive precise string
 * union types from it (see `src/types`) AND drive the UI from a single source
 * of truth. Add an option here and it becomes available to forms, types, and
 * the plan generator simultaneously.
 */

export type Option<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  /** Optional lucide icon name, resolved in the UI layer. */
  icon?: string;
};

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const UNIT_SYSTEMS = [
  { value: "metric", label: "Metric (kg, cm)" },
  { value: "imperial", label: "Imperial (lb, in)" },
] as const;

export const TRAINING_EXPERIENCES = [
  {
    value: "never",
    label: "Never trained",
    description: "Brand new to working out",
    icon: "Sprout",
  },
  {
    value: "beginner",
    label: "Beginner",
    description: "Less than 1 year of training",
    icon: "Dumbbell",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "1–3 years, know the basics",
    icon: "Flame",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "3+ years of consistent training",
    icon: "Trophy",
  },
] as const;

export const GYM_ACCESS_OPTIONS = [
  {
    value: "full_gym",
    label: "Full Gym",
    description: "Commercial gym, full equipment",
    icon: "Building2",
  },
  {
    value: "small_gym",
    label: "Small Gym",
    description: "Limited machines & free weights",
    icon: "Warehouse",
  },
  {
    value: "home_gym",
    label: "Home Gym",
    description: "Some equipment at home",
    icon: "House",
  },
  {
    value: "bodyweight",
    label: "Bodyweight Only",
    description: "No equipment needed",
    icon: "PersonStanding",
  },
] as const;

export const GOALS = [
  {
    value: "lose_weight",
    label: "Lose Weight",
    description: "Drop overall body weight",
    icon: "TrendingDown",
  },
  {
    value: "fat_loss",
    label: "Fat Loss",
    description: "Lower body fat, keep muscle",
    icon: "Flame",
  },
  {
    value: "build_muscle",
    label: "Build Muscle",
    description: "Hypertrophy & size",
    icon: "Dumbbell",
  },
  {
    value: "strength",
    label: "Strength",
    description: "Lift heavier, get stronger",
    icon: "Anvil",
  },
  {
    value: "endurance",
    label: "Endurance",
    description: "Stamina & conditioning",
    icon: "Wind",
  },
  {
    value: "general_fitness",
    label: "General Fitness",
    description: "Look & feel healthier",
    icon: "HeartPulse",
  },
  {
    value: "athletic_performance",
    label: "Athletic Performance",
    description: "Power, speed & agility",
    icon: "Zap",
  },
  {
    value: "rehabilitation",
    label: "Rehabilitation",
    description: "Recover & rebuild safely",
    icon: "Stethoscope",
  },
  {
    value: "health",
    label: "Health Improvement",
    description: "Longevity & wellbeing",
    icon: "Sparkles",
  },
] as const;

export const DAILY_ACTIVITY_OPTIONS = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little to no exercise, desk job",
  },
  {
    value: "light",
    label: "Lightly Active",
    description: "Light exercise 1–3 days/week",
  },
  {
    value: "active",
    label: "Active",
    description: "Moderate exercise 3–5 days/week",
  },
  {
    value: "very_active",
    label: "Very Active",
    description: "Hard exercise 6–7 days/week",
  },
] as const;

export const WORK_TYPES = [
  { value: "office", label: "Office", description: "Mostly sitting" },
  {
    value: "manual",
    label: "Manual Labor",
    description: "Physically demanding",
  },
  { value: "mixed", label: "Mixed", description: "A bit of both" },
] as const;

export const DIET_TYPES = [
  { value: "normal", label: "Normal", description: "Balanced, no restrictions" },
  {
    value: "high_protein",
    label: "High Protein",
    description: "Protein-forward eating",
  },
  { value: "vegetarian", label: "Vegetarian", description: "No meat" },
  { value: "vegan", label: "Vegan", description: "Fully plant-based" },
  { value: "keto", label: "Keto", description: "Low carb, high fat" },
] as const;

export const SLEEP_QUALITIES = [
  { value: "poor", label: "Poor" },
  { value: "fair", label: "Fair" },
  { value: "good", label: "Good" },
  { value: "excellent", label: "Excellent" },
] as const;

export const INJURY_OPTIONS = [
  { value: "knee", label: "Knee", icon: "PersonStanding" },
  { value: "back", label: "Back", icon: "Spline" },
  { value: "shoulder", label: "Shoulder", icon: "Move" },
  { value: "hip", label: "Hip", icon: "PersonStanding" },
  { value: "elbow", label: "Elbow", icon: "Move" },
  { value: "wrist", label: "Wrist", icon: "Hand" },
  { value: "neck", label: "Neck", icon: "Move" },
  { value: "ankle", label: "Ankle", icon: "Footprints" },
] as const;

export const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

/**
 * Muscle group taxonomy. Equipment & exercises reference these keys, and the
 * dashboard's "muscle group distribution" chart aggregates on them.
 */
export const MUSCLE_GROUPS = [
  { value: "chest", label: "Chest", icon: "Shield" },
  { value: "back", label: "Back", icon: "Shield" },
  { value: "shoulders", label: "Shoulders", icon: "Shield" },
  { value: "biceps", label: "Biceps", icon: "Dumbbell" },
  { value: "triceps", label: "Triceps", icon: "Dumbbell" },
  { value: "forearms", label: "Forearms", icon: "Dumbbell" },
  { value: "core", label: "Core", icon: "Hexagon" },
  { value: "quads", label: "Quadriceps", icon: "Footprints" },
  { value: "hamstrings", label: "Hamstrings", icon: "Footprints" },
  { value: "glutes", label: "Glutes", icon: "Footprints" },
  { value: "calves", label: "Calves", icon: "Footprints" },
  { value: "full_body", label: "Full Body", icon: "PersonStanding" },
  { value: "cardio", label: "Cardio", icon: "HeartPulse" },
] as const;

/** Equipment categories used to organise the machine catalog. */
export const EQUIPMENT_CATEGORIES = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "legs", label: "Legs" },
  { value: "core", label: "Core" },
  { value: "glutes", label: "Glutes" },
  { value: "cardio", label: "Cardio" },
  { value: "functional", label: "Functional" },
  { value: "free_weights", label: "Free Weights" },
] as const;

/**
 * Equipment availability keys. These map a user's "available equipment"
 * selection to what the plan generator can program. Bodyweight is always
 * implicitly available.
 */
export const EQUIPMENT_TYPES = [
  { value: "bodyweight", label: "Bodyweight", icon: "PersonStanding" },
  { value: "dumbbell", label: "Dumbbells", icon: "Dumbbell" },
  { value: "barbell", label: "Barbell", icon: "Dumbbell" },
  { value: "kettlebell", label: "Kettlebell", icon: "Dumbbell" },
  { value: "machine", label: "Machines", icon: "Cog" },
  { value: "cable", label: "Cable Machine", icon: "Cable" },
  { value: "smith_machine", label: "Smith Machine", icon: "Cog" },
  { value: "resistance_band", label: "Resistance Bands", icon: "Spline" },
  { value: "pull_up_bar", label: "Pull-up Bar", icon: "Minus" },
  { value: "bench", label: "Adjustable Bench", icon: "Armchair" },
  { value: "ez_bar", label: "EZ Curl Bar", icon: "Dumbbell" },
  { value: "cardio_machine", label: "Cardio Machine", icon: "HeartPulse" },
] as const;

/** Workout split archetypes produced by the plan generator. */
export const SPLIT_TYPES = [
  { value: "full_body", label: "Full Body" },
  { value: "upper_lower", label: "Upper / Lower" },
  { value: "push_pull_legs", label: "Push / Pull / Legs" },
  { value: "bro_split", label: "Body-Part Split" },
  { value: "cardio_strength", label: "Cardio + Strength" },
] as const;

export const POPULAR_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "tr", label: "Türkçe" },
] as const;

/** A small set of common countries for the onboarding picker. */
export const POPULAR_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "United Arab Emirates",
  "Saudi Arabia",
  "Egypt",
  "Turkey",
  "Canada",
  "Australia",
  "India",
  "Brazil",
  "Other",
] as const;
