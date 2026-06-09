/**
 * Programming configuration for the workout generator.
 *
 * Encodes evidence-based set/rep/rest schemes per training emphasis, the
 * mapping from user goals to an emphasis, equipment availability resolution,
 * and an injury → contraindication map. Kept declarative so the generator in
 * `generator.ts` stays focused on selection + assembly.
 */
import type {
  EquipmentType,
  Goal,
  GymAccess,
  TrainingExperience,
} from "@/types";

export type Emphasis =
  | "hypertrophy"
  | "strength"
  | "weight_loss"
  | "endurance"
  | "general"
  | "athletic"
  | "rehab";

export type SlotRole =
  | "primary"
  | "secondary"
  | "accessory"
  | "core"
  | "cardio";

export interface Scheme {
  sets: number;
  repLow: number;
  repHigh: number;
  rest: number; // seconds
  tempo: string | null;
}

/** First selected goal wins; this maps it to a training emphasis. */
export const GOAL_EMPHASIS: Record<Goal, Emphasis> = {
  lose_weight: "weight_loss",
  fat_loss: "weight_loss",
  build_muscle: "hypertrophy",
  strength: "strength",
  endurance: "endurance",
  general_fitness: "general",
  athletic_performance: "athletic",
  rehabilitation: "rehab",
  health: "general",
};

export const EMPHASIS_LABEL: Record<Emphasis, string> = {
  hypertrophy: "Muscle Building (Hypertrophy)",
  strength: "Maximal Strength",
  weight_loss: "Fat Loss & Conditioning",
  endurance: "Muscular Endurance",
  general: "General Fitness",
  athletic: "Athletic Performance",
  rehab: "Rehabilitation & Control",
};

/** Set/rep/rest scheme per emphasis and slot role. */
export const SCHEMES: Record<Emphasis, Record<SlotRole, Scheme>> = {
  hypertrophy: {
    primary: { sets: 4, repLow: 6, repHigh: 10, rest: 120, tempo: "2-0-1-0" },
    secondary: { sets: 3, repLow: 8, repHigh: 12, rest: 90, tempo: "2-0-1-0" },
    accessory: { sets: 3, repLow: 10, repHigh: 15, rest: 60, tempo: "2-0-1-0" },
    core: { sets: 3, repLow: 12, repHigh: 20, rest: 45, tempo: null },
    cardio: { sets: 1, repLow: 600, repHigh: 600, rest: 0, tempo: null },
  },
  strength: {
    primary: { sets: 5, repLow: 3, repHigh: 5, rest: 180, tempo: "2-1-1-0" },
    secondary: { sets: 4, repLow: 5, repHigh: 8, rest: 150, tempo: "2-0-1-0" },
    accessory: { sets: 3, repLow: 8, repHigh: 12, rest: 90, tempo: "2-0-1-0" },
    core: { sets: 3, repLow: 8, repHigh: 12, rest: 60, tempo: null },
    cardio: { sets: 1, repLow: 480, repHigh: 480, rest: 0, tempo: null },
  },
  weight_loss: {
    primary: { sets: 3, repLow: 10, repHigh: 15, rest: 60, tempo: "2-0-1-0" },
    secondary: { sets: 3, repLow: 12, repHigh: 15, rest: 45, tempo: "2-0-1-0" },
    accessory: { sets: 3, repLow: 12, repHigh: 20, rest: 40, tempo: "2-0-1-0" },
    core: { sets: 3, repLow: 15, repHigh: 25, rest: 30, tempo: null },
    cardio: { sets: 1, repLow: 900, repHigh: 900, rest: 0, tempo: null },
  },
  endurance: {
    primary: { sets: 3, repLow: 12, repHigh: 20, rest: 60, tempo: "2-0-1-0" },
    secondary: { sets: 3, repLow: 15, repHigh: 20, rest: 45, tempo: "2-0-1-0" },
    accessory: { sets: 2, repLow: 15, repHigh: 25, rest: 40, tempo: "2-0-1-0" },
    core: { sets: 3, repLow: 15, repHigh: 30, rest: 30, tempo: null },
    cardio: { sets: 1, repLow: 1200, repHigh: 1200, rest: 0, tempo: null },
  },
  general: {
    primary: { sets: 3, repLow: 8, repHigh: 12, rest: 90, tempo: "2-0-1-0" },
    secondary: { sets: 3, repLow: 10, repHigh: 12, rest: 75, tempo: "2-0-1-0" },
    accessory: { sets: 2, repLow: 12, repHigh: 15, rest: 60, tempo: "2-0-1-0" },
    core: { sets: 3, repLow: 12, repHigh: 20, rest: 45, tempo: null },
    cardio: { sets: 1, repLow: 600, repHigh: 600, rest: 0, tempo: null },
  },
  athletic: {
    primary: { sets: 4, repLow: 4, repHigh: 6, rest: 150, tempo: "1-0-X-0" },
    secondary: { sets: 3, repLow: 6, repHigh: 10, rest: 120, tempo: "2-0-1-0" },
    accessory: { sets: 3, repLow: 8, repHigh: 12, rest: 75, tempo: "2-0-1-0" },
    core: { sets: 3, repLow: 10, repHigh: 15, rest: 45, tempo: null },
    cardio: { sets: 1, repLow: 600, repHigh: 600, rest: 0, tempo: null },
  },
  rehab: {
    primary: { sets: 3, repLow: 10, repHigh: 15, rest: 75, tempo: "3-1-1-0" },
    secondary: { sets: 2, repLow: 12, repHigh: 15, rest: 60, tempo: "3-0-1-0" },
    accessory: { sets: 2, repLow: 12, repHigh: 20, rest: 45, tempo: "3-0-1-0" },
    core: { sets: 2, repLow: 10, repHigh: 15, rest: 45, tempo: null },
    cardio: { sets: 1, repLow: 600, repHigh: 600, rest: 0, tempo: null },
  },
};

/** Hardest difficulty the user should be programmed, by experience. */
export const EXPERIENCE_DIFFICULTY_CAP: Record<
  TrainingExperience,
  "beginner" | "intermediate" | "advanced"
> = {
  never: "beginner",
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

/**
 * Resolve the concrete set of equipment types the generator may program from,
 * given gym access plus any explicitly selected equipment. Bodyweight is
 * always available.
 */
export function resolveEquipment(
  access: GymAccess,
  selected: EquipmentType[]
): Set<EquipmentType> {
  const all: EquipmentType[] = [
    "bodyweight",
    "dumbbell",
    "barbell",
    "kettlebell",
    "machine",
    "cable",
    "smith_machine",
    "resistance_band",
    "pull_up_bar",
    "bench",
    "ez_bar",
    "cardio_machine",
  ];

  switch (access) {
    case "full_gym":
      return new Set(all);
    case "small_gym":
      return new Set<EquipmentType>([
        "bodyweight",
        "dumbbell",
        "barbell",
        "machine",
        "cable",
        "bench",
        "pull_up_bar",
        "ez_bar",
        "kettlebell",
        "cardio_machine",
      ]);
    case "home_gym": {
      const base = new Set<EquipmentType>(["bodyweight", ...selected]);
      return base;
    }
    case "bodyweight":
    default: {
      const base = new Set<EquipmentType>(["bodyweight"]);
      // Honour explicitly owned minimal gear if the user listed it.
      for (const e of selected) {
        if (["pull_up_bar", "resistance_band", "dumbbell"].includes(e)) {
          base.add(e);
        }
      }
      return base;
    }
  }
}

/**
 * Injury → exercise slugs to avoid, plus a coaching note. The generator drops
 * these candidates and surfaces the note in plan guidance.
 */
export const INJURY_AVOID: Record<
  string,
  { slugs: string[]; note: string }
> = {
  knee: {
    slugs: [
      "walking-lunge",
      "bulgarian-split-squat",
      "hack-squat",
      "box-jump",
      "jump-rope",
      "step-up",
      "front-squat",
    ],
    note: "Knee-friendly: we favoured the leg press and machine work over deep lunges and jumping. Keep reps controlled and pain-free.",
  },
  back: {
    slugs: [
      "deadlift",
      "barbell-row",
      "good-morning",
      "back-squat",
      "t-bar-row",
      "romanian-deadlift",
      "sumo-deadlift",
    ],
    note: "Back-friendly: we replaced heavy spinal-loading lifts with supported, machine-based alternatives. Brace your core and avoid rounding.",
  },
  shoulder: {
    slugs: [
      "overhead-press",
      "bench-dip",
      "skull-crusher",
      "front-raise",
      "upright-row",
    ],
    note: "Shoulder-friendly: we limited overhead and behind-the-body pressing. Stay within a pain-free range of motion.",
  },
  hip: {
    slugs: ["barbell-hip-thrust", "deadlift", "good-morning", "box-jump"],
    note: "Hip-friendly: we reduced deep hip flexion and explosive hinging. Warm up the hips thoroughly.",
  },
  elbow: {
    slugs: ["skull-crusher", "close-grip-bench-press", "preacher-curl"],
    note: "Elbow-friendly: we avoided high-stress elbow isolation. Use neutral grips where possible.",
  },
  wrist: {
    slugs: ["barbell-wrist-curl", "front-squat", "barbell-curl"],
    note: "Wrist-friendly: we minimised loaded wrist extension. Consider straps or neutral-grip variations.",
  },
  neck: {
    slugs: ["barbell-row", "deadlift"],
    note: "Neck-friendly: keep a neutral neck and avoid straining on heavy pulls.",
  },
  ankle: {
    slugs: ["box-jump", "jump-rope", "walking-lunge", "standing-calf-raise"],
    note: "Ankle-friendly: we reduced impact and balance-heavy movements.",
  },
};
