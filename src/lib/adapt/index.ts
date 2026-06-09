/**
 * The weekly adaptation engine — the heart of "the plan evolves with you".
 *
 * `computeAdaptation` looks only at data *before* the given week's Monday, so
 * the resulting state is frozen for the whole week: the member's plan never
 * changes underneath them mid-week. Today's check-in modulates today's
 * guidance (see `src/lib/daily`), never the plan structure.
 *
 * Pure + deterministic, like the plan generator it feeds.
 */
import { addDaysISO, completedWeekStarts, diffDaysISO } from "@/lib/dates";
import { GOAL_EMPHASIS } from "@/lib/plan/schemes";
import type {
  AdaptationFlag,
  AdaptationState,
  DailyCheckin,
  Measurement,
  Profile,
  TrainingSession,
  WorkoutPlan,
} from "@/types";
import { windowSignals } from "./signals";

export { readinessScore, windowSignals } from "./signals";

/** No adjustment — used until at least one full week of history exists. */
export const NEUTRAL_ADAPTATION: AdaptationState = {
  weekStart: "",
  volumeModifier: 1,
  deload: false,
  extraRecovery: false,
  readiness: null,
  adherencePct: null,
  plateau: false,
  flags: [],
  reasons: [],
};

/** Deload every Nth completed training week. */
const DELOAD_CADENCE_WEEKS = 6;

export function computeAdaptation(args: {
  /** Monday of the CURRENT week — only data strictly before it is consulted. */
  weekStart: string;
  profile: Profile;
  plan: Pick<WorkoutPlan, "days_per_week">;
  checkins: DailyCheckin[];
  sessions: TrainingSession[];
  measurements: Measurement[];
}): AdaptationState {
  const { weekStart, profile, plan } = args;

  // Freeze the inputs to history strictly before this week.
  const checkins = args.checkins.filter((c) => c.date < weekStart);
  const sessions = args.sessions.filter(
    (s) => s.started_at.slice(0, 10) < weekStart
  );
  const measurements = args.measurements.filter(
    (m) => m.measured_at.slice(0, 10) < weekStart
  );

  const firstDates = [
    ...sessions.map((s) => s.started_at.slice(0, 10)),
    ...checkins.map((c) => c.date),
  ];
  const firstActivity = firstDates.length
    ? firstDates.reduce((a, b) => (a < b ? a : b))
    : null;

  // Cold start: nothing to adapt from yet.
  if (!firstActivity || diffDaysISO(firstActivity, weekStart) < 7) {
    return { ...NEUTRAL_ADAPTATION, weekStart };
  }

  const daysPerWeek = plan.days_per_week;
  const lastWeek = windowSignals({
    fromISO: addDaysISO(weekStart, -7),
    toISO: weekStart,
    daysPerWeek,
    checkins,
    sessions,
    measurements,
  });
  const twoWeeks = windowSignals({
    fromISO: addDaysISO(weekStart, -14),
    toISO: weekStart,
    daysPerWeek,
    checkins,
    sessions,
    measurements,
  });
  const threeWeeks = windowSignals({
    fromISO: addDaysISO(weekStart, -21),
    toISO: weekStart,
    daysPerWeek,
    checkins,
    sessions,
    measurements,
  });

  const readiness = lastWeek.avgReadiness;
  const adherence = twoWeeks.adherencePct;

  const completedSessionDates = sessions
    .filter((s) => s.status === "completed")
    .map((s) => s.started_at.slice(0, 10));
  const firstSession = completedSessionDates.length
    ? completedSessionDates.reduce((a, b) => (a < b ? a : b))
    : null;
  const trainingWeeks = firstSession
    ? completedWeekStarts(firstSession, weekStart).length
    : 0;

  const flags: AdaptationFlag[] = [];
  const reasons: string[] = [];
  let volumeModifier = 1;
  let deload = false;
  let extraRecovery = false;

  const lowReadiness =
    (readiness != null && readiness < 40) ||
    (lastWeek.avgSoreness != null && lastWeek.avgSoreness >= 7.5);

  if (
    trainingWeeks >= DELOAD_CADENCE_WEEKS &&
    trainingWeeks % DELOAD_CADENCE_WEEKS === 0 &&
    (adherence ?? 0) >= 60
  ) {
    // Planned deload cadence.
    deload = true;
    volumeModifier = 0.6;
    flags.push("deload");
    reasons.push(
      `Planned deload — you've trained ${trainingWeeks} weeks straight. This week is intentionally lighter (~60% volume) so you come back stronger.`
    );
  } else if (lowReadiness) {
    // Recovery is lagging.
    flags.push("low_readiness");
    if ((adherence ?? 0) >= 70) {
      deload = true;
      volumeModifier = 0.6;
      flags.push("deload");
      reasons.push(
        `Recovery is lagging${readiness != null ? ` (readiness ${readiness}/100 last week)` : ""} — taking a deload week to bounce back.`
      );
    } else {
      extraRecovery = true;
      volumeModifier = 0.8;
      flags.push("extra_recovery");
      reasons.push(
        "Energy and soreness signals say you need more recovery — volume is trimmed ~20% and rest periods are a touch longer this week."
      );
    }
  } else if (adherence != null && adherence < 50) {
    // Fit the plan to the life, not the other way around.
    volumeModifier = 0.8;
    flags.push("volume_down", "low_adherence");
    reasons.push(
      `You made ${twoWeeks.sessionsCompleted} of ${twoWeeks.sessionsPlanned} planned sessions over the last two weeks — the plan is trimmed so it fits your week. Consistency first; we'll build back up.`
    );
  } else if (
    adherence != null &&
    adherence >= 90 &&
    readiness != null &&
    readiness >= 70 &&
    trainingWeeks % DELOAD_CADENCE_WEEKS !== 1 // not right after a planned deload
  ) {
    volumeModifier = 1.15;
    flags.push("volume_up");
    reasons.push(
      `You hit ${adherence}% of planned sessions with readiness ${readiness}/100 — adding a set to your key movements this week.`
    );
  }

  // Plateau detection (additive — informs nutrition/activity, not volume).
  const primaryGoal = profile.goals[0] ?? "general_fitness";
  const emphasis = GOAL_EMPHASIS[primaryGoal];
  const wantsWeightChange =
    emphasis === "weight_loss" || emphasis === "hypertrophy";
  let plateau = false;
  if (
    wantsWeightChange &&
    threeWeeks.weightRateKgPerWeek != null &&
    Math.abs(threeWeeks.weightRateKgPerWeek) < 0.15 &&
    (threeWeeks.adherencePct ?? 0) >= 70
  ) {
    plateau = true;
    flags.push("plateau");
    reasons.push(
      emphasis === "weight_loss"
        ? "Your weight has been flat for ~3 weeks despite solid training — today's calorie and step targets are tightened to restart progress."
        : "Your weight has been flat for ~3 weeks — nudge calories up slightly and prioritise sleep to keep building."
    );
  }

  return {
    weekStart,
    volumeModifier,
    deload,
    extraRecovery,
    readiness,
    adherencePct: adherence,
    plateau,
    flags,
    reasons,
  };
}
