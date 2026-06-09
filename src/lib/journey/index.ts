/**
 * The journey engine — turns a goal into a transformation roadmap with
 * milestones, pace, a projected finish date and a success-probability
 * heuristic. Pure functions over (profile, measurements, sessions, checkins);
 * nothing here is persisted, so the journey is always up to date.
 */
import { addDaysISO, diffDaysISO, isoWeekStart } from "@/lib/dates";
import { GOAL_EMPHASIS } from "@/lib/plan/schemes";
import { weightSlopeKgPerWeek } from "@/lib/adapt/signals";
import type {
  DailyCheckin,
  Journey,
  JourneyTarget,
  Measurement,
  Milestone,
  Pace,
  Profile,
  TrainingSession,
} from "@/types";

export { computeConsistency } from "./habits";

/** Safe planned rates (kg/week), aligned with `estimateWeeksToGoal`. */
const PLANNED_RATE_DOWN = 0.6;
const PLANNED_RATE_UP = 0.25;
const CONSISTENCY_HORIZON_WEEKS = 12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

function weighedPoints(measurements: Measurement[]) {
  return measurements
    .filter((m) => m.weight_kg != null)
    .map((m) => ({
      date: m.measured_at.slice(0, 10),
      weightKg: m.weight_kg as number,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * What is this member actually chasing? A target weight when the goal moves
 * the scale and one is set; otherwise a consistency journey (sessions/week
 * over a 12-week horizon).
 */
export function inferTarget(
  profile: Profile,
  measurements: Measurement[]
): JourneyTarget {
  const primaryGoal = profile.goals[0] ?? "general_fitness";
  const emphasis = GOAL_EMPHASIS[primaryGoal];
  const points = weighedPoints(measurements);
  const startKg = points[0]?.weightKg ?? profile.weight_kg ?? null;
  const currentKg =
    points[points.length - 1]?.weightKg ?? profile.weight_kg ?? null;
  const targetKg = profile.target_weight_kg;

  const scaleGoal =
    emphasis === "weight_loss" ||
    emphasis === "hypertrophy" ||
    emphasis === "strength";

  if (
    scaleGoal &&
    targetKg != null &&
    startKg != null &&
    currentKg != null &&
    Math.abs(targetKg - startKg) >= 1
  ) {
    const direction = targetKg < startKg ? "down" : "up";
    return {
      kind: "weight",
      startKg,
      currentKg,
      targetKg,
      direction,
      plannedRateKgPerWeek:
        direction === "down" ? PLANNED_RATE_DOWN : PLANNED_RATE_UP,
    };
  }

  return {
    kind: "consistency",
    weeklyTarget: profile.available_days ?? 3,
    horizonWeeks: CONSISTENCY_HORIZON_WEEKS,
  };
}

function weightMilestones(
  target: Extract<JourneyTarget, { kind: "weight" }>,
  points: Array<{ date: string; weightKg: number }>,
  todayISO: string,
  progressRateKgPerWeek: number | null
): Milestone[] {
  const { startKg, targetKg, direction } = target;
  const total = Math.abs(targetKg - startKg);
  const sign = direction === "down" ? -1 : 1;
  const done = Math.max(0, sign * (target.currentKg - startKg));

  /** First date a measurement crossed `threshold` kg of progress. */
  const crossedAt = (threshold: number): string | null => {
    for (const p of points) {
      if (sign * (p.weightKg - startKg) >= threshold - 1e-9) return p.date;
    }
    return null;
  };

  const defs: Array<{ id: string; label: string; threshold: number }> = [];
  const firstStep = Math.min(2, total);
  defs.push({
    id: "first-kg",
    label: `First ${firstStep} kg ${direction}`,
    threshold: firstStep,
  });
  for (const pctOfWay of [25, 50, 75, 100]) {
    const threshold = (total * pctOfWay) / 100;
    if (threshold <= firstStep && pctOfWay !== 100) continue;
    const atKg = +(startKg + sign * threshold).toFixed(1);
    defs.push({
      id: `pct-${pctOfWay}`,
      label: pctOfWay === 100 ? `Goal: ${atKg} kg` : `${pctOfWay}% — reach ${atKg} kg`,
      threshold,
    });
  }

  return defs.map((d) => {
    const achievedDate = crossedAt(d.threshold);
    const remaining = Math.max(0, d.threshold - done);
    const projectable =
      !achievedDate && progressRateKgPerWeek != null && progressRateKgPerWeek > 0.02;
    return {
      id: d.id,
      label: d.label,
      achieved: achievedDate != null,
      achievedDate,
      projectedDate: projectable
        ? addDaysISO(
            todayISO,
            Math.round((remaining / (progressRateKgPerWeek as number)) * 7)
          )
        : null,
      progressPct: Math.round(clamp((done / d.threshold) * 100, 0, 100)),
    };
  });
}

function consistencyMilestones(
  sessions: TrainingSession[],
  workoutStreakWeeks: number,
  todayISO: string,
  sessionsPerWeek: number | null
): Milestone[] {
  const completed = sessions
    .filter((s) => s.status === "completed")
    .map((s) => s.started_at.slice(0, 10))
    .sort();

  const countMilestone = (id: string, label: string, n: number): Milestone => {
    const achieved = completed.length >= n;
    const remaining = Math.max(0, n - completed.length);
    const projectable =
      !achieved && sessionsPerWeek != null && sessionsPerWeek > 0.2;
    return {
      id,
      label,
      achieved,
      achievedDate: achieved ? completed[n - 1] : null,
      projectedDate: projectable
        ? addDaysISO(
            todayISO,
            Math.round((remaining / (sessionsPerWeek as number)) * 7)
          )
        : null,
      progressPct: Math.round(clamp((completed.length / n) * 100, 0, 100)),
    };
  };

  const streakMilestone = (id: string, label: string, weeks: number): Milestone => ({
    id,
    label,
    achieved: workoutStreakWeeks >= weeks,
    achievedDate: null,
    projectedDate:
      workoutStreakWeeks >= weeks
        ? null
        : addDaysISO(todayISO, (weeks - workoutStreakWeeks) * 7),
    progressPct: Math.round(clamp((workoutStreakWeeks / weeks) * 100, 0, 100)),
  });

  return [
    countMilestone("workout-1", "First workout", 1),
    countMilestone("workout-10", "10 workouts", 10),
    streakMilestone("streak-4", "4-week training streak", 4),
    countMilestone("workout-25", "25 workouts", 25),
    streakMilestone("streak-12", "12-week training streak", 12),
  ];
}

export function buildJourney(args: {
  todayISO: string;
  profile: Profile;
  measurements: Measurement[];
  sessions: TrainingSession[];
  checkins: DailyCheckin[];
}): Journey {
  const { todayISO, profile, measurements, sessions, checkins } = args;
  const target = inferTarget(profile, measurements);
  const points = weighedPoints(measurements);
  const startDate = points[0]?.date ?? profile.created_at.slice(0, 10);

  const completed = sessions.filter((s) => s.status === "completed");
  const from28 = addDaysISO(todayISO, -28);
  const sessions28 = completed.filter(
    (s) => s.started_at.slice(0, 10) >= from28
  ).length;
  const sessionsPerWeek = +(sessions28 / 4).toFixed(2);
  const plannedPerWeek = profile.available_days ?? 3;

  // ── Pace ─────────────────────────────────────────────────────────────────
  let pace: Pace;
  let progressPct: number;
  let etaISO: string | null = null;
  let plannedEtaISO: string | null = null;
  let milestones: Milestone[];
  let plateau = false;

  // Workout-week streak, for consistency milestones.
  const sessionWeeks = new Set(
    completed.map((s) => isoWeekStart(s.started_at.slice(0, 10)))
  );
  let workoutStreakWeeks = 0;
  let week = isoWeekStart(todayISO);
  for (let i = 0; i < 104; i++) {
    if (sessionWeeks.has(week)) workoutStreakWeeks++;
    else if (i > 0) break;
    week = addDaysISO(week, -7);
  }

  if (target.kind === "weight") {
    const sign = target.direction === "down" ? -1 : 1;
    const recent = points.filter((p) => p.date >= from28);
    const slope = weightSlopeKgPerWeek(recent);
    // Fallback for sparse data: average rate since the start.
    const weeksElapsed = Math.max(1, diffDaysISO(startDate, todayISO) / 7);
    const fallback =
      points.length >= 2
        ? sign * ((target.currentKg - target.startKg) / weeksElapsed)
        : null;
    const actual = slope != null ? sign * slope : fallback;

    const required = target.plannedRateKgPerWeek;
    const ratio = actual != null ? +(actual / required).toFixed(2) : null;
    const remaining = Math.abs(target.targetKg - target.currentKg);
    const done = Math.max(0, sign * (target.currentKg - target.startKg));
    const total = Math.abs(target.targetKg - target.startKg);
    progressPct = Math.round(clamp((done / total) * 100, 0, 100));

    const plannedWeeksLeft = remaining / required;
    plannedEtaISO = addDaysISO(todayISO, Math.round(plannedWeeksLeft * 7));

    let etaWeeksLeft: number | null = null;
    if (remaining < 0.5) {
      etaISO = todayISO;
      etaWeeksLeft = 0;
    } else if (actual != null && actual > 0.02) {
      etaWeeksLeft = remaining / actual;
      etaISO = addDaysISO(
        todayISO,
        Math.round(clamp(etaWeeksLeft * 7, 7, 104 * 7))
      );
    }

    const deltaWeeks =
      etaWeeksLeft != null
        ? Math.round(plannedWeeksLeft - etaWeeksLeft)
        : null;

    pace = {
      actualPerWeek: actual != null ? +actual.toFixed(2) : null,
      requiredPerWeek: required,
      ratio,
      status:
        ratio == null
          ? "no_data"
          : ratio >= 1.1
            ? "ahead"
            : ratio >= 0.75
              ? "on_track"
              : "behind",
      deltaWeeks,
    };

    milestones = weightMilestones(target, points, todayISO, actual);

    // Plateau: flat scale over ~3 weeks despite wanting it to move.
    const slope21 = weightSlopeKgPerWeek(
      points.filter((p) => p.date >= addDaysISO(todayISO, -21))
    );
    plateau =
      slope21 != null && Math.abs(slope21) < 0.15 && sessions28 >= 6;
  } else {
    const required = target.weeklyTarget;
    const actual = sessions28 > 0 ? sessionsPerWeek : completed.length ? 0 : null;
    const ratio = actual != null ? +(actual / required).toFixed(2) : null;

    const weeksDone = sessionWeeks.size;
    progressPct = Math.round(
      clamp((weeksDone / target.horizonWeeks) * 100, 0, 100)
    );
    const weeksLeft = Math.max(0, target.horizonWeeks - weeksDone);
    plannedEtaISO = addDaysISO(todayISO, weeksLeft * 7);
    etaISO = plannedEtaISO;

    pace = {
      actualPerWeek: actual,
      requiredPerWeek: required,
      ratio,
      status:
        ratio == null
          ? "no_data"
          : ratio >= 1.1
            ? "ahead"
            : ratio >= 0.75
              ? "on_track"
              : "behind",
      deltaWeeks: null,
    };

    milestones = consistencyMilestones(
      sessions,
      workoutStreakWeeks,
      todayISO,
      actual
    );
  }

  // ── Success probability heuristic (5–95, monotonic in every input) ──────
  const adherence28 = clamp(sessions28 / (4 * plannedPerWeek), 0, 1.5);
  const checkins14 = checkins.filter(
    (c) => c.date >= addDaysISO(todayISO, -14) && c.date < todayISO
  ).length;
  const checkinRate14 = checkins14 / 14;

  let probability = 50;
  probability += 25 * clamp((pace.ratio ?? 1) - 1, -1, 1);
  probability += 15 * clamp((adherence28 - 0.6) / 0.4, -1, 1);
  probability += checkinRate14 >= 0.5 ? 5 : -5;
  probability -= plateau ? 10 : 0;
  const successProbability = Math.round(clamp(probability, 5, 95));

  // ── Risks ────────────────────────────────────────────────────────────────
  const risks: string[] = [];
  if (pace.status === "behind" && pace.ratio != null) {
    risks.push(
      `Pace is ${Math.round((1 - pace.ratio) * 100)}% below plan — small daily wins compound; protect the next session.`
    );
  }
  if (adherence28 < 0.5 && completed.length > 0) {
    risks.push(
      "Under half of planned sessions completed this month — consider fewer, more defendable training days."
    );
  }
  if (checkinRate14 < 0.5) {
    risks.push(
      "Few check-ins lately — daily coaching gets sharper the more you log."
    );
  }
  if (plateau) {
    risks.push("Weight has been flat for ~3 weeks — see today's plateau-breaker targets.");
  }

  return {
    target,
    startDate,
    progressPct,
    milestones,
    pace,
    etaISO,
    plannedEtaISO,
    successProbability,
    risks,
  };
}
