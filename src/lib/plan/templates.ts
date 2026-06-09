/**
 * Split + day templates. Each training day is described as an ordered list of
 * "slots" — abstract movement requirements (muscle groups + mechanic + force +
 * role). The generator fills each slot with the best available exercise.
 *
 * This abstraction lets one set of templates adapt to any equipment, goal and
 * injury profile, and produces sensible A/B variation when days repeat.
 */
import type { ForceType, Mechanic, MuscleGroup, SplitType } from "@/types";
import type { Emphasis, SlotRole } from "./schemes";

export interface Slot {
  label: string;
  groups: MuscleGroup[];
  role: SlotRole;
  mechanic?: Mechanic;
  force?: ForceType;
}

export interface DayTemplate {
  name: string;
  focus: string;
  splitType: SplitType;
  slots: Slot[];
}

// ── Reusable slots ───────────────────────────────────────────────────────--
const S = {
  squat: {
    label: "Squat Pattern",
    groups: ["quads", "glutes"],
    role: "primary",
    mechanic: "compound",
    force: "squat",
  } satisfies Slot,
  hinge: {
    label: "Hip Hinge",
    groups: ["hamstrings", "glutes"],
    role: "primary",
    mechanic: "compound",
    force: "hinge",
  } satisfies Slot,
  hPush: {
    label: "Horizontal Press",
    groups: ["chest"],
    role: "primary",
    mechanic: "compound",
    force: "push",
  } satisfies Slot,
  vPush: {
    label: "Overhead Press",
    groups: ["shoulders"],
    role: "primary",
    mechanic: "compound",
    force: "push",
  } satisfies Slot,
  hPull: {
    label: "Row",
    groups: ["back"],
    role: "secondary",
    mechanic: "compound",
    force: "pull",
  } satisfies Slot,
  vPull: {
    label: "Vertical Pull",
    groups: ["back"],
    role: "secondary",
    mechanic: "compound",
    force: "pull",
  } satisfies Slot,
  chestAcc: {
    label: "Chest Accessory",
    groups: ["chest"],
    role: "accessory",
  } satisfies Slot,
  legPress: {
    label: "Quad Accessory",
    groups: ["quads"],
    role: "secondary",
  } satisfies Slot,
  legCurl: {
    label: "Hamstring Curl",
    groups: ["hamstrings"],
    role: "accessory",
    mechanic: "isolation",
  } satisfies Slot,
  lateral: {
    label: "Lateral Raise",
    groups: ["shoulders"],
    role: "accessory",
    mechanic: "isolation",
  } satisfies Slot,
  rearDelt: {
    label: "Rear Delt / Face Pull",
    groups: ["shoulders"],
    role: "accessory",
  } satisfies Slot,
  biceps: {
    label: "Biceps",
    groups: ["biceps"],
    role: "accessory",
    mechanic: "isolation",
  } satisfies Slot,
  triceps: {
    label: "Triceps",
    groups: ["triceps"],
    role: "accessory",
    mechanic: "isolation",
  } satisfies Slot,
  calves: {
    label: "Calves",
    groups: ["calves"],
    role: "accessory",
    mechanic: "isolation",
  } satisfies Slot,
  glutes: {
    label: "Glute Accessory",
    groups: ["glutes"],
    role: "accessory",
  } satisfies Slot,
  core: {
    label: "Core",
    groups: ["core"],
    role: "core",
  } satisfies Slot,
} as const;

const cardioSlot: Slot = {
  label: "Conditioning Finisher",
  groups: ["cardio", "full_body"],
  role: "cardio",
};

// ── Day templates ────────────────────────────────────────────────────────--
const fullBodyA: DayTemplate = {
  name: "Full Body A",
  focus: "Squat • Press • Pull",
  splitType: "full_body",
  slots: [S.squat, S.hPush, S.hPull, S.lateral, S.core],
};
const fullBodyB: DayTemplate = {
  name: "Full Body B",
  focus: "Hinge • Overhead • Pulldown",
  splitType: "full_body",
  slots: [S.hinge, S.vPush, S.vPull, S.legPress, S.core],
};
const fullBodyC: DayTemplate = {
  name: "Full Body C",
  focus: "Legs • Chest • Back",
  splitType: "full_body",
  slots: [S.legPress, S.hPush, S.hPull, S.biceps, S.triceps],
};

const upper = (variant: "A" | "B"): DayTemplate => ({
  name: `Upper ${variant}`,
  focus: "Chest • Back • Shoulders • Arms",
  splitType: "upper_lower",
  slots: [
    variant === "A" ? S.hPush : S.vPush,
    S.vPull,
    variant === "A" ? S.vPush : S.chestAcc,
    S.hPull,
    S.biceps,
    S.triceps,
  ],
});
const lower = (variant: "A" | "B"): DayTemplate => ({
  name: `Lower ${variant}`,
  focus: "Quads • Hamstrings • Glutes • Calves",
  splitType: "upper_lower",
  slots: [
    variant === "A" ? S.squat : S.hinge,
    variant === "A" ? S.hinge : S.legPress,
    S.legCurl,
    S.glutes,
    S.calves,
    S.core,
  ],
});

const push = (variant: "A" | "B"): DayTemplate => ({
  name: `Push ${variant}`,
  focus: "Chest • Shoulders • Triceps",
  splitType: "push_pull_legs",
  slots: [S.hPush, S.vPush, S.chestAcc, S.lateral, S.triceps, S.triceps],
});
const pull = (variant: "A" | "B"): DayTemplate => ({
  name: `Pull ${variant}`,
  focus: "Back • Rear Delts • Biceps",
  splitType: "push_pull_legs",
  slots: [S.vPull, S.hPull, S.rearDelt, S.biceps, S.biceps, S.core],
});
const legs = (variant: "A" | "B"): DayTemplate => ({
  name: `Legs ${variant}`,
  focus: "Quads • Hamstrings • Glutes • Calves",
  splitType: "push_pull_legs",
  slots: [S.squat, S.hinge, S.legPress, S.legCurl, S.calves, S.core],
});

/**
 * Choose a weekly split based on training days and experience. Follows
 * conventional programming: full-body at low frequency, upper/lower at 4 days,
 * push/pull/legs at 5–6 days. Beginners stay on full-body through 3 days.
 */
export function chooseSplit(
  days: number,
  experience: string,
  emphasis: Emphasis
): DayTemplate[] {
  const d = Math.max(2, Math.min(6, days));
  const isNovice = experience === "never" || experience === "beginner";

  let templates: DayTemplate[];

  if (d <= 2) {
    templates = [fullBodyA, fullBodyB];
  } else if (d === 3) {
    templates =
      isNovice || emphasis === "rehab" || emphasis === "general"
        ? [fullBodyA, fullBodyB, fullBodyC]
        : [push("A"), pull("A"), legs("A")];
  } else if (d === 4) {
    templates = [upper("A"), lower("A"), upper("B"), lower("B")];
  } else if (d === 5) {
    templates = [push("A"), pull("A"), legs("A"), upper("B"), lower("B")];
  } else {
    templates = [
      push("A"),
      pull("A"),
      legs("A"),
      push("B"),
      pull("B"),
      legs("B"),
    ];
  }

  // Fat-loss & endurance plans bolt a conditioning finisher onto each day.
  if (emphasis === "weight_loss" || emphasis === "endurance") {
    templates = templates.map((t) => ({ ...t, slots: [...t.slots, cardioSlot] }));
  }

  return templates;
}

/** Derive the headline split label for the whole plan. */
export function splitLabelFor(days: number, experience: string): SplitType {
  const d = Math.max(2, Math.min(6, days));
  const isNovice = experience === "never" || experience === "beginner";
  if (d <= 2) return "full_body";
  if (d === 3) return isNovice ? "full_body" : "push_pull_legs";
  if (d === 4) return "upper_lower";
  return "push_pull_legs";
}
