/**
 * The daily engine — answers "what should this member do today?".
 *
 * `buildDailyBrief` is a pure function over today's date plus everything we
 * know (profile, adapted plan, check-ins, sessions, schedule). The scheduled
 * workout is resolved with exactly the calendar's logic (overrides win, then
 * the weekly cadence), so the Today hub and the calendar always agree.
 */
import { readinessScore } from "@/lib/adapt/signals";
import { isoDayOfWeek } from "@/lib/dates";
import {
  ageFromBirthDate,
  bmr,
  calorieTarget,
  tdee,
} from "@/lib/fitness";
import { patternFor, type SchedulePayload } from "@/lib/schedule";
import { GOAL_EMPHASIS } from "@/lib/plan/schemes";
import { computeConsistency } from "@/lib/journey/habits";
import { pickMessage, type MessageContext } from "./messages";
import type {
  AdaptationState,
  DailyBrief,
  DailyCheckin,
  DailyWorkout,
  Journey,
  Profile,
  TrainingSession,
  WorkoutPlan,
} from "@/types";

function resolveWorkout(args: {
  todayISO: string;
  plan: WorkoutPlan;
  sessions: TrainingSession[];
  schedule: SchedulePayload | null;
  readiness: number | null;
  soreness: number | null;
  extraRecovery: boolean;
}): DailyWorkout {
  const { todayISO, plan, sessions, schedule } = args;

  // Already trained today?
  const doneToday = sessions.find(
    (s) =>
      s.status === "completed" && s.started_at.slice(0, 10) === todayISO
  );
  if (doneToday) {
    return {
      kind: "done",
      completedName: doneToday.day_name ?? "Workout",
    };
  }

  // Calendar override wins; otherwise the default weekly cadence.
  let dayIndex: number | null = null;
  const override = schedule?.entries[todayISO];
  if (schedule?.cleared[todayISO]) {
    dayIndex = null;
  } else if (override) {
    dayIndex = override.status === "skipped" ? null : override.dayIndex;
  } else {
    const pattern = patternFor(plan.days_per_week);
    const idx = pattern.indexOf(isoDayOfWeek(todayISO));
    dayIndex = idx === -1 ? null : idx;
  }

  if (dayIndex == null || plan.days.length === 0) {
    const suggestion = args.extraRecovery
      ? "Recovery focus today: a 20–30 min walk, some light stretching, and an early night."
      : "Rest day — a brisk 20–30 min walk and good hydration keep the engine ticking.";
    return { kind: "rest", suggestion };
  }

  const day = plan.days[dayIndex % plan.days.length];

  let intensityNote: string | null = null;
  if (args.soreness != null && args.soreness >= 8) {
    intensityNote =
      "You're very sore — go light, skip anything painful, and treat this as a movement session.";
  } else if (args.readiness != null && args.readiness < 35) {
    intensityNote =
      "Rough day — cut each exercise by one working set and stop 3 reps shy of failure. Showing up is the win.";
  } else if (args.readiness != null && args.readiness < 55) {
    intensityNote =
      "Energy is middling — keep loads moderate and make every rep technically clean.";
  }

  return {
    kind: "training",
    dayIndex: day.index,
    name: day.name,
    focus: day.focus,
    estimatedMinutes: day.estimated_minutes,
    intensityNote,
  };
}

export function buildDailyBrief(args: {
  todayISO: string;
  profile: Profile;
  /** The (already adapted) plan. */
  plan: WorkoutPlan;
  adaptation: AdaptationState;
  journey: Journey | null;
  todayCheckin: DailyCheckin | null;
  checkins: DailyCheckin[];
  sessions: TrainingSession[];
  schedule: SchedulePayload | null;
}): DailyBrief {
  const {
    todayISO,
    profile,
    plan,
    adaptation,
    journey,
    todayCheckin,
    checkins,
    sessions,
    schedule,
  } = args;

  const streak = computeConsistency(todayISO, checkins, sessions);
  const readiness = todayCheckin ? readinessScore(todayCheckin) : null;

  const workout = resolveWorkout({
    todayISO,
    plan,
    sessions,
    schedule,
    readiness,
    soreness: todayCheckin?.soreness ?? null,
    extraRecovery: adaptation.extraRecovery || adaptation.deload,
  });

  const primaryGoal = profile.goals[0] ?? "general_fitness";
  const emphasis = GOAL_EMPHASIS[primaryGoal];

  // ── Nutrition: targets from the TDEE math, tightened on a plateau ────────
  const age = profile.age ?? ageFromBirthDate(profile.birth_date) ?? 30;
  const resting = bmr({
    weightKg: profile.weight_kg ?? 0,
    heightCm: profile.height_cm ?? 0,
    age,
    gender: profile.gender,
  });
  const target = calorieTarget({
    tdeeKcal: tdee(resting, profile.daily_activity),
    weightKg: profile.weight_kg ?? 0,
    primaryGoal,
  });
  let calories = target.calories;
  let nutritionNote = target.note;
  if (adaptation.plateau && calories > 0) {
    if (emphasis === "weight_loss") {
      calories = Math.round(calories * 0.9);
      nutritionNote =
        "Plateau-breaker: calories tightened ~10% this week. Weigh and log honestly — small leaks sink fat loss.";
    } else if (emphasis === "hypertrophy") {
      calories = Math.round(calories * 1.05);
      nutritionNote =
        "Scale has stalled — calories nudged up ~5% to keep the gaining trend alive.";
    }
  }
  const waterL = profile.weight_kg
    ? +Math.min(4, Math.max(2, profile.weight_kg * 0.035)).toFixed(1)
    : 2.5;

  // ── Activity ─────────────────────────────────────────────────────────────
  let steps = emphasis === "weight_loss" ? 10000 : 7000;
  if (adaptation.plateau && emphasis === "weight_loss") steps += 1000;
  const activityNote =
    workout.kind === "rest"
      ? "Rest day, so daily movement does the heavy lifting — spread the steps across the day."
      : "Steps outside the gym keep your calorie burn honest on training days too.";

  // ── Recovery ─────────────────────────────────────────────────────────────
  const sleepTargetH = 8;
  const recoveryNotes: string[] = [];
  if (adaptation.deload) {
    recoveryNotes.push("Deload week — sleep and easy movement do the real work.");
  } else if (adaptation.extraRecovery) {
    recoveryNotes.push("Recovery emphasis this week: add 10 minutes of mobility after each session.");
  }
  if (todayCheckin && todayCheckin.sleep <= 4) {
    recoveryNotes.push("Last night was short — aim for an earlier night tonight; loads feel heavier on poor sleep.");
  }
  if (todayCheckin && todayCheckin.soreness >= 6) {
    recoveryNotes.push("Soreness is up — light cardio and stretching today will clear it faster than full rest.");
  }
  if (recoveryNotes.length === 0) {
    recoveryNotes.push(`Aim for ${sleepTargetH}h of sleep — it's the cheapest performance enhancer there is.`);
  }

  // ── Reviews due ──────────────────────────────────────────────────────────
  const hasHistory = streak.totalWorkouts + streak.totalCheckins > 0;
  let reviewDue: DailyBrief["reviewDue"] = null;
  if (hasHistory && todayISO.endsWith("-01")) reviewDue = "monthly";
  else if (hasHistory && isoDayOfWeek(todayISO) === 1) reviewDue = "weekly";

  // ── Today's single objective (first matching priority) ──────────────────
  let objective: string;
  if (reviewDue === "monthly") {
    objective = "Your monthly review is in — check how the month tracked against the roadmap.";
  } else if (reviewDue === "weekly") {
    objective = "Your weekly review is ready — see what's changing this week and why.";
  } else if (workout.kind === "done") {
    objective = `${workout.completedName} is done — hit your protein and sleep targets to bank it.`;
  } else if (
    workout.kind === "rest" &&
    journey?.pace.status === "behind"
  ) {
    objective = `Rest day, but you're behind pace — make the ${steps.toLocaleString()} steps non-negotiable today.`;
  } else if (workout.kind === "training") {
    objective = `Complete ${workout.name} (${workout.focus}) — ~${workout.estimatedMinutes} min.`;
  } else if (adaptation.plateau) {
    objective = "Plateau-breaker day: nail the calorie target and get your steps in.";
  } else {
    objective = "Recovery day — move a little, sleep a lot, and check in so tomorrow's coaching is sharp.";
  }

  // ── Motivation context ───────────────────────────────────────────────────
  const milestoneNear = journey?.milestones.some(
    (m) => !m.achieved && m.progressPct >= 80
  );
  let ctx: MessageContext;
  if (adaptation.deload) ctx = "deload";
  else if (readiness != null && readiness < 35) ctx = "low_readiness";
  else if (milestoneNear) ctx = "milestone_near";
  else if (journey?.pace.status === "behind") ctx = "behind";
  else if (journey?.pace.status === "ahead") ctx = "ahead";
  else if (streak.checkinStreakDays >= 5 || streak.workoutStreakWeeks >= 4)
    ctx = "streak";
  else if (workout.kind === "training") ctx = "training";
  else ctx = "rest";

  return {
    date: todayISO,
    objective,
    workout,
    readiness,
    needsCheckin: !todayCheckin,
    nutrition: {
      calories,
      protein: target.protein,
      waterL,
      note: nutritionNote,
    },
    activity: { steps, note: activityNote },
    recovery: { sleepTargetH, notes: recoveryNotes },
    motivation: pickMessage(ctx, todayISO, profile.id),
    streak,
    reviewDue,
  };
}
