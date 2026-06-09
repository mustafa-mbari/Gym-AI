/**
 * Weekly and monthly reviews — computed on demand over *completed* periods,
 * never persisted, so past reviews never change. The weekly decision is
 * derived by running the adaptation engine for the following Monday: the
 * review explains exactly why next week's plan looks the way it does (one
 * source of truth, no drift).
 */
import { computeAdaptation } from "@/lib/adapt";
import { windowSignals } from "@/lib/adapt/signals";
import { addDaysISO, isoWeekStart } from "@/lib/dates";
import { buildJourney, inferTarget } from "./index";
import type {
  DailyCheckin,
  Measurement,
  MonthlyReview,
  Profile,
  TrainingSession,
  WeeklyDecision,
  WeeklyReview,
  WorkoutPlan,
} from "@/types";

interface ReviewData {
  profile: Profile;
  plan: Pick<WorkoutPlan, "days_per_week">;
  checkins: DailyCheckin[];
  sessions: TrainingSession[];
  measurements: Measurement[];
}

/** Last weighed value strictly before `dateISO`, if any. */
function lastWeightBefore(
  measurements: Measurement[],
  dateISO: string
): number | null {
  let result: number | null = null;
  for (const m of measurements) {
    if (m.weight_kg == null) continue;
    if (m.measured_at.slice(0, 10) < dateISO) result = m.weight_kg;
    else break;
  }
  return result;
}

/** Review one *completed* ISO week starting at `weekStart` (a Monday). */
export function weeklyReview(
  args: ReviewData & { weekStart: string }
): WeeklyReview {
  const { weekStart, profile, plan, checkins, sessions, measurements } = args;
  const weekEndExclusive = addDaysISO(weekStart, 7);

  const sorted = [...measurements].sort((a, b) =>
    a.measured_at.localeCompare(b.measured_at)
  );
  const signals = windowSignals({
    fromISO: weekStart,
    toISO: weekEndExclusive,
    daysPerWeek: plan.days_per_week,
    checkins,
    sessions,
    measurements: sorted,
  });

  const before = lastWeightBefore(sorted, weekStart);
  const atEnd = lastWeightBefore(sorted, weekEndExclusive);
  const weightChangeKg =
    before != null && atEnd != null && atEnd !== before
      ? +(atEnd - before).toFixed(1)
      : before != null && atEnd != null
        ? 0
        : null;

  // Decision = what the adaptation engine does with this week's data.
  const next = computeAdaptation({
    weekStart: weekEndExclusive,
    profile,
    plan,
    checkins,
    sessions,
    measurements: sorted,
  });
  let decision: WeeklyDecision = "keep";
  if (next.deload) decision = "deload";
  else if (next.extraRecovery) decision = "add_recovery";
  else if (next.volumeModifier > 1) decision = "increase_load";
  else if (next.volumeModifier < 1) decision = "reduce_load";

  // Positive reinforcement — celebrate what went right.
  const wins: string[] = [];
  if (
    signals.sessionsPlanned > 0 &&
    signals.sessionsCompleted >= signals.sessionsPlanned
  ) {
    wins.push(`Hit every planned session (${signals.sessionsCompleted}/${signals.sessionsPlanned}).`);
  } else if (signals.sessionsCompleted > 0) {
    wins.push(`Completed ${signals.sessionsCompleted} workout${signals.sessionsCompleted === 1 ? "" : "s"}.`);
  }
  const target = inferTarget(profile, sorted);
  if (
    weightChangeKg != null &&
    weightChangeKg !== 0 &&
    target.kind === "weight" &&
    (target.direction === "down" ? weightChangeKg < 0 : weightChangeKg > 0)
  ) {
    wins.push(
      `${Math.abs(weightChangeKg)} kg ${target.direction} this week — right direction.`
    );
  }
  if (signals.checkinDays >= 5) {
    wins.push(`Checked in ${signals.checkinDays}/7 days — the coaching stays sharp.`);
  }
  if (signals.avgReadiness != null && signals.avgReadiness >= 70) {
    wins.push("Recovery held up well all week.");
  }
  if (wins.length === 0) {
    wins.push(
      signals.checkinDays > 0
        ? "You stayed in touch — that's the foundation. This week we rebuild momentum."
        : "A quiet week. It happens — today is the comeback."
    );
  }

  return {
    weekStart,
    weekEnd: addDaysISO(weekStart, 6),
    weightChangeKg,
    sessionsCompleted: signals.sessionsCompleted,
    sessionsPlanned: signals.sessionsPlanned,
    adherencePct: signals.adherencePct ?? 0,
    avgEnergy: signals.avgEnergy,
    avgSleep: signals.avgSleep,
    avgSoreness: signals.avgSoreness,
    checkinDays: signals.checkinDays,
    decision,
    reasons: next.reasons.length
      ? next.reasons
      : ["Everything on track — same plan, keep stacking weeks."],
    wins,
  };
}

/** The most recent fully-completed week's review, or null with no history. */
export function latestCompletedWeeklyReview(
  args: ReviewData & { todayISO: string }
): WeeklyReview | null {
  const weekStart = addDaysISO(isoWeekStart(args.todayISO), -7);
  const hasData =
    args.sessions.some((s) => s.started_at.slice(0, 10) < isoWeekStart(args.todayISO)) ||
    args.checkins.some((c) => c.date < isoWeekStart(args.todayISO));
  if (!hasData) return null;
  return weeklyReview({ ...args, weekStart });
}

/** Mondays of the last `count` completed weeks, newest first. */
export function recentWeekStarts(todayISO: string, count = 8): string[] {
  const out: string[] = [];
  let w = addDaysISO(isoWeekStart(todayISO), -7);
  for (let i = 0; i < count; i++) {
    out.push(w);
    w = addDaysISO(w, -7);
  }
  return out;
}

/** Review one *completed* calendar month starting at `monthStart`. */
export function monthlyReview(
  args: ReviewData & { monthStart: string }
): MonthlyReview {
  const { monthStart, profile, plan, checkins, sessions } = args;
  const d = new Date(`${monthStart}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const monthEndExclusive = d.toISOString().slice(0, 10);
  const weeksInMonth = (Date.parse(`${monthEndExclusive}T00:00:00Z`) - Date.parse(`${monthStart}T00:00:00Z`)) / (7 * 86400000);

  const sorted = [...args.measurements].sort((a, b) =>
    a.measured_at.localeCompare(b.measured_at)
  );
  const signals = windowSignals({
    fromISO: monthStart,
    toISO: monthEndExclusive,
    daysPerWeek: plan.days_per_week,
    checkins,
    sessions,
    measurements: sorted,
  });

  const target = inferTarget(profile, sorted);
  const expectedChangeKg =
    target.kind === "weight"
      ? +(
          (target.direction === "down" ? -1 : 1) *
          target.plannedRateKgPerWeek *
          weeksInMonth
        ).toFixed(1)
      : null;

  const before = lastWeightBefore(sorted, monthStart);
  const atEnd = lastWeightBefore(sorted, monthEndExclusive);
  const actualChangeKg =
    before != null && atEnd != null ? +(atEnd - before).toFixed(1) : null;

  const variancePct =
    expectedChangeKg != null && actualChangeKg != null && expectedChangeKg !== 0
      ? Math.round((actualChangeKg / expectedChangeKg) * 100)
      : null;

  // Milestones whose achievement date fell inside this month.
  const journey = buildJourney({
    todayISO: monthEndExclusive,
    profile,
    measurements: sorted,
    sessions,
    checkins,
  });
  const milestonesHit = journey.milestones
    .filter(
      (m) =>
        m.achievedDate != null &&
        m.achievedDate >= monthStart &&
        m.achievedDate < monthEndExclusive
    )
    .map((m) => m.label);

  const risks: string[] = [];
  if (variancePct != null && variancePct < 60) {
    risks.push(
      `Progress ran at ${Math.max(0, variancePct)}% of plan this month — review nutrition adherence and session quality.`
    );
  }
  if ((signals.adherencePct ?? 0) < 60) {
    risks.push(
      "Adherence below 60% — a smaller, more defendable schedule may serve the goal better."
    );
  }
  if (signals.checkinDays < 10) {
    risks.push("Sparse check-ins — recommendations get less personal without them.");
  }

  const summary: string[] = [
    `Completed ${signals.sessionsCompleted} of ${signals.sessionsPlanned} planned sessions (${signals.adherencePct ?? 0}%).`,
  ];
  if (actualChangeKg != null) {
    const dir = actualChangeKg < 0 ? "down" : actualChangeKg > 0 ? "up" : "flat";
    summary.push(
      `Weight ${dir === "flat" ? "held flat" : `${dir} ${Math.abs(actualChangeKg)} kg`}${
        expectedChangeKg != null ? ` vs ${Math.abs(expectedChangeKg)} kg planned` : ""
      }.`
    );
  }
  if (milestonesHit.length) {
    summary.push(`Milestones hit: ${milestonesHit.join(", ")}.`);
  }
  if (risks.length === 0) {
    summary.push("On track — the roadmap holds, no course-correction needed.");
  }

  return {
    monthStart,
    expectedChangeKg,
    actualChangeKg,
    variancePct,
    adherencePct: signals.adherencePct ?? 0,
    milestonesHit,
    risks,
    summary,
  };
}
