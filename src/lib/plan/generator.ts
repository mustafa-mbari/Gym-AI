/**
 * The JYM workout plan generator.
 *
 * A deterministic, exercise-science-informed engine: it selects a weekly split,
 * fills each movement slot with the best available exercise for the user's
 * equipment / experience / injuries, applies a goal-appropriate set·rep·rest
 * scheme, fits each session to the available time, and reports weekly volume.
 *
 * Pure + deterministic (same input → same plan), so it is instant, free and
 * testable. An optional LLM "coach" layer can later refine the output.
 */
import { EXERCISES } from "@/data/exercises";
import type {
  Difficulty,
  Exercise,
  Goal,
  MuscleGroup,
  PlanInput,
  PlannedExercise,
  TrainingExperience,
  WorkoutDay,
  WorkoutPlan,
} from "@/types";
import { formatMinutes } from "@/lib/format";
import {
  EMPHASIS_LABEL,
  EXPERIENCE_DIFFICULTY_CAP,
  GOAL_EMPHASIS,
  INJURY_AVOID,
  resolveEquipment,
  SCHEMES,
  type Emphasis,
  type Scheme,
  type SlotRole,
} from "./schemes";
import {
  chooseSplit,
  splitLabelFor,
  type DayTemplate,
  type Slot,
} from "./templates";

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const SPLIT_LABEL: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper / Lower",
  push_pull_legs: "Push / Pull / Legs",
};

const isTimed = (ex: Exercise, role: SlotRole) =>
  role === "cardio" || ex.force === "static" || ex.category === "cardio";

/** Average working seconds per set, used for duration estimates. */
function workSeconds(scheme: Scheme, timed: boolean): number {
  if (timed) return 45;
  const avgReps = (scheme.repLow + scheme.repHigh) / 2;
  return Math.round(avgReps * 3.5);
}

interface SelectContext {
  available: Set<string>;
  cap: number;
  avoid: Set<string>;
  emphasis: Emphasis;
  usedThisWeek: Map<string, number>;
  usedToday: Set<string>;
}

/** Is an exercise performable with the available equipment? */
function isAvailable(ex: Exercise, available: Set<string>): boolean {
  // Performable if at least one of its equipment types is available.
  return ex.equipment.some((e) => available.has(e));
}

function scoreCandidate(ex: Exercise, slot: Slot, ctx: SelectContext): number {
  let score = 0;

  // Primary-muscle alignment with the slot.
  if (slot.groups.includes(ex.category)) score += 3;
  const overlap = ex.muscle_groups.filter((g) =>
    slot.groups.includes(g)
  ).length;
  score += overlap;

  // Mechanic / force pattern fit.
  if (slot.mechanic && ex.mechanic === slot.mechanic) score += 3;
  if (slot.force && ex.force === slot.force) score += 3;

  // Compound preference for the heavy slots.
  if (
    (slot.role === "primary" || slot.role === "secondary") &&
    ex.mechanic === "compound"
  ) {
    score += 2;
  }

  // Equipment preference by training emphasis.
  const free = ex.equipment.some((e) =>
    ["barbell", "dumbbell"].includes(e)
  );
  const guided = ex.equipment.some((e) => ["machine", "cable"].includes(e));
  if (ctx.emphasis === "strength" || ctx.emphasis === "athletic") {
    if (free) score += 1.5;
  } else if (ctx.emphasis === "rehab" || ctx.emphasis === "weight_loss") {
    if (guided) score += 1.5;
  }

  // Easier movements rank slightly higher for novices (lower cap).
  if (ctx.cap === 0) score += (2 - DIFFICULTY_RANK[ex.difficulty]) * 0.5;

  // Diversify across the week (push A/B variation).
  const used = ctx.usedThisWeek.get(ex.slug) ?? 0;
  score -= used * 2;

  return score;
}

/** Pick the best exercise for a slot, progressively relaxing constraints. */
function selectExercise(slot: Slot, ctx: SelectContext): Exercise | null {
  const passes = [
    // 1. Full constraints.
    (ex: Exercise) =>
      slot.groups.some((g) => ex.muscle_groups.includes(g)) &&
      isAvailable(ex, ctx.available) &&
      DIFFICULTY_RANK[ex.difficulty] <= ctx.cap &&
      !ctx.avoid.has(ex.slug) &&
      !ctx.usedToday.has(ex.slug) &&
      (!slot.mechanic || ex.mechanic === slot.mechanic),
    // 2. Drop the mechanic requirement.
    (ex: Exercise) =>
      slot.groups.some((g) => ex.muscle_groups.includes(g)) &&
      isAvailable(ex, ctx.available) &&
      DIFFICULTY_RANK[ex.difficulty] <= ctx.cap &&
      !ctx.avoid.has(ex.slug) &&
      !ctx.usedToday.has(ex.slug),
    // 3. Allow harder movements (still avoiding contraindications).
    (ex: Exercise) =>
      slot.groups.some((g) => ex.muscle_groups.includes(g)) &&
      isAvailable(ex, ctx.available) &&
      !ctx.avoid.has(ex.slug) &&
      !ctx.usedToday.has(ex.slug),
    // 4. Last resort: any unused exercise hitting the muscle groups.
    (ex: Exercise) =>
      slot.groups.some((g) => ex.muscle_groups.includes(g)) &&
      !ctx.usedToday.has(ex.slug),
  ];

  for (const pass of passes) {
    const candidates = EXERCISES.filter(pass);
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => {
      const diff = scoreCandidate(b, slot, ctx) - scoreCandidate(a, slot, ctx);
      return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
    });
    return candidates[0];
  }
  return null;
}

function buildPlannedExercise(
  ex: Exercise,
  slot: Slot,
  emphasis: Emphasis
): PlannedExercise {
  const scheme = SCHEMES[emphasis][slot.role];
  const timed = isTimed(ex, slot.role);

  let reps: string;
  let repLow = scheme.repLow;
  let repHigh = scheme.repHigh;

  if (slot.role === "cardio") {
    reps = formatMinutes(Math.round(scheme.repLow / 60));
    repLow = repHigh = scheme.repLow;
  } else if (timed) {
    const [lo, hi] = ex.rep_range;
    reps = `${lo}–${hi}s`;
    repLow = lo;
    repHigh = hi;
  } else {
    reps = `${scheme.repLow}–${scheme.repHigh}`;
  }

  return {
    exercise_slug: ex.slug,
    name: ex.name,
    sets: slot.role === "cardio" ? 1 : scheme.sets,
    reps,
    rep_low: repLow,
    rep_high: repHigh,
    rest_seconds: scheme.rest,
    tempo: timed ? null : scheme.tempo,
    notes: ex.is_unilateral ? "Per side" : null,
    superset_group: null,
    muscle_groups: ex.muscle_groups,
  };
}

function estimateMinutes(exercises: PlannedExercise[], emphasis: Emphasis) {
  let seconds = 0;
  for (const pe of exercises) {
    const scheme = SCHEMES[emphasis][roleFromReps(pe)];
    const timed = pe.reps.includes("min") || pe.reps.includes("s");
    if (pe.reps.includes("min")) {
      seconds += pe.rep_low; // cardio block is already in seconds
      continue;
    }
    const perSet = (timed ? 45 : 35) + pe.rest_seconds;
    seconds += pe.sets * perSet;
  }
  // Add a fixed warm-up allowance.
  return Math.round(seconds / 60) + 6;
}

// Helper to back out a role bucket from a planned exercise for estimation.
function roleFromReps(_pe: PlannedExercise): SlotRole {
  return "accessory";
}

function trimToTime(
  exercises: PlannedExercise[],
  emphasis: Emphasis,
  budget: number
): PlannedExercise[] {
  const result = [...exercises];
  // Drop trailing accessory/core/cardio work first, never the top 2 lifts.
  while (
    result.length > 3 &&
    estimateMinutes(result, emphasis) > budget + 8
  ) {
    // Find last removable (not one of the first two primary slots).
    let removeIdx = -1;
    for (let i = result.length - 1; i >= 2; i--) {
      removeIdx = i;
      break;
    }
    if (removeIdx < 0) break;
    result.splice(removeIdx, 1);
  }
  return result;
}

function buildDay(
  template: DayTemplate,
  index: number,
  ctx: SelectContext,
  emphasis: Emphasis,
  budget: number
): WorkoutDay {
  ctx.usedToday = new Set();
  let cardioNote: string | null = null;
  const planned: PlannedExercise[] = [];

  for (const slot of template.slots) {
    const ex = selectExercise(slot, ctx);
    if (!ex) continue;
    ctx.usedToday.add(ex.slug);
    ctx.usedThisWeek.set(ex.slug, (ctx.usedThisWeek.get(ex.slug) ?? 0) + 1);
    if (slot.role === "cardio") {
      cardioNote = `${ex.name} — ${formatMinutes(
        Math.round(SCHEMES[emphasis].cardio.repLow / 60)
      )}`;
    }
    planned.push(buildPlannedExercise(ex, slot, emphasis));
  }

  const fitted = trimToTime(planned, emphasis, budget);
  const strength = fitted.filter(
    (p) => !p.reps.includes("min")
  );

  return {
    index,
    name: template.name,
    focus: template.focus,
    estimated_minutes: estimateMinutes(fitted, emphasis),
    exercises: strength,
    cardio: cardioNote,
  };
}

function computeWeeklyVolume(days: WorkoutDay[]): Record<string, number> {
  const vol: Record<string, number> = {};
  for (const day of days) {
    for (const ex of day.exercises) {
      const primary = ex.muscle_groups[0];
      ex.muscle_groups.forEach((g, i) => {
        if (g === "cardio" || g === "full_body") return;
        const credit = i === 0 || g === primary ? ex.sets : ex.sets * 0.5;
        vol[g] = (vol[g] ?? 0) + credit;
      });
    }
  }
  for (const k of Object.keys(vol)) vol[k] = Math.round(vol[k]);
  return vol;
}

function buildGuidance(
  emphasis: Emphasis,
  goals: Goal[],
  injuries: string[],
  days: number
): string[] {
  const tips: string[] = [];

  tips.push(
    "Progressive overload: when you hit the top of a rep range on all sets, add a small amount of weight next session."
  );

  switch (emphasis) {
    case "weight_loss":
      tips.push(
        "Keep rest short and intensity high. Finish each session with the conditioning block, and aim for 7k–10k steps daily."
      );
      break;
    case "hypertrophy":
      tips.push(
        "Take most sets within 1–2 reps of failure. Prioritise sleep and protein (~2 g/kg) to maximise growth."
      );
      break;
    case "strength":
      tips.push(
        "Treat the first lift as the priority — rest fully (2–3 min) and focus on crisp, heavy technique. Cycle intensity across the block."
      );
      break;
    case "endurance":
      tips.push(
        "Move briskly between exercises to keep your heart rate elevated. Build reps and circuits before adding load."
      );
      break;
    case "rehab":
      tips.push(
        "Stay pain-free and controlled (slow eccentrics). Stop 2–3 reps short of fatigue and progress gradually."
      );
      break;
    default:
      tips.push(
        "Train each set 1–3 reps shy of failure and stay consistent — frequency beats intensity for general fitness."
      );
  }

  if (days <= 3) {
    tips.push(
      "On non-training days, stay active with a walk or light mobility work to aid recovery."
    );
  } else {
    tips.push(
      "With this frequency, watch recovery: deload (halve your sets) every 5–6 weeks to stay fresh."
    );
  }

  // Injury-specific coaching.
  const seen = new Set<string>();
  for (const inj of injuries) {
    const entry = INJURY_AVOID[inj];
    if (entry && !seen.has(entry.note)) {
      tips.push(entry.note);
      seen.add(entry.note);
    }
  }

  if (goals.includes("lose_weight") || goals.includes("fat_loss")) {
    tips.push(
      "Pair this plan with a modest calorie deficit — see your dashboard for a personalised target."
    );
  }

  return tips;
}

/**
 * Generate a complete, personalised workout plan from a normalised profile.
 */
export function generatePlan(input: PlanInput): WorkoutPlan {
  const experience: TrainingExperience = input.experience ?? "beginner";
  const primaryGoal = input.goals[0] ?? "general_fitness";
  const emphasis = GOAL_EMPHASIS[primaryGoal];
  const cap = DIFFICULTY_RANK[EXPERIENCE_DIFFICULTY_CAP[experience]];
  const budget = input.session_minutes || 60;
  const days = Math.max(2, Math.min(6, input.available_days || 3));

  const available = resolveEquipment(input.gym_access, input.available_equipment);
  const avoid = new Set<string>();
  for (const inj of input.injuries) {
    INJURY_AVOID[inj]?.slugs.forEach((s) => avoid.add(s));
  }

  const ctx: SelectContext = {
    available,
    cap,
    avoid,
    emphasis,
    usedThisWeek: new Map(),
    usedToday: new Set(),
  };

  const templates = chooseSplit(days, experience, emphasis);
  const workoutDays = templates.map((t, i) =>
    buildDay(t, i, ctx, emphasis, budget)
  );

  const splitType = splitLabelFor(days, experience);
  const splitName = SPLIT_LABEL[splitType] ?? "Custom";
  const weeks = emphasis === "strength" ? 6 : 8;

  const summary = `A ${days}-day ${splitName} program tuned for ${EMPHASIS_LABEL[
    emphasis
  ].toLowerCase()}. Each session is built around your available equipment and fits roughly ${formatMinutes(
    budget
  )}.`;

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `plan_${Date.now()}`,
    name: `${days}-Day ${splitName} — ${EMPHASIS_LABEL[emphasis].split(" (")[0]}`,
    goal: primaryGoal,
    experience,
    split_type: splitType,
    days_per_week: days,
    session_minutes: budget,
    weeks,
    summary,
    guidance: buildGuidance(emphasis, input.goals, input.injuries, days),
    days: workoutDays,
    weekly_volume: computeWeeklyVolume(workoutDays),
    created_at: new Date().toISOString(),
  };
}

/** Convenience: primary muscle groups trained across the plan, most-first. */
export function topMuscleGroups(
  plan: WorkoutPlan,
  limit = 6
): Array<{ group: MuscleGroup; sets: number }> {
  return Object.entries(plan.weekly_volume)
    .map(([group, sets]) => ({ group: group as MuscleGroup, sets }))
    .sort((a, b) => b.sets - a.sets)
    .slice(0, limit);
}
