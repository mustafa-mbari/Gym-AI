/**
 * Shared signal extraction for the adaptation engine and the weekly/monthly
 * reviews. Pure functions over explicit date windows — callers always pass
 * the window boundaries, never `new Date()` from inside, so the math is
 * deterministic and testable.
 */
import { diffDaysISO } from "@/lib/dates";
import type { DailyCheckin, Measurement, TrainingSession } from "@/types";

/** Aggregated wellness + adherence signals over a [from, to) date window. */
export interface WindowSignals {
  /** Completed sessions / planned sessions (0–100), null with no plan info. */
  adherencePct: number | null;
  avgEnergy: number | null;
  avgSleep: number | null;
  avgSoreness: number | null;
  /** Average readiness across the window's check-ins. */
  avgReadiness: number | null;
  checkinDays: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  /** Least-squares weight slope over the window, kg/week. */
  weightRateKgPerWeek: number | null;
}

const FEEL_ADJUST: Record<DailyCheckin["feel"], number> = {
  excellent: 10,
  good: 5,
  average: 0,
  poor: -15,
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Readiness to train, 0–100, from a single check-in.
 * Energy and sleep dominate; soreness is inverted (10 = very sore).
 */
export function readinessScore(
  c: Pick<DailyCheckin, "feel" | "energy" | "sleep" | "soreness">
): number {
  const base = 10 * (0.4 * c.energy + 0.35 * c.sleep + 0.25 * (11 - c.soreness));
  return Math.round(clamp(base + FEEL_ADJUST[c.feel], 0, 100));
}

const avg = (xs: number[]): number | null =>
  xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : null;

/** Least-squares slope of (day, weight) points, converted to kg/week. */
export function weightSlopeKgPerWeek(
  points: Array<{ date: string; weightKg: number }>
): number | null {
  if (points.length < 3) return null;
  const x0 = points[0].date;
  const xs = points.map((p) => diffDaysISO(x0, p.date));
  const ys = points.map((p) => p.weightKg);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;
  return +((num / den) * 7).toFixed(3);
}

export function windowSignals(args: {
  /** Window [fromISO, toISO) in user-local calendar days. */
  fromISO: string;
  toISO: string;
  /** Planned training frequency, used to derive adherence. */
  daysPerWeek: number;
  checkins: DailyCheckin[];
  sessions: TrainingSession[];
  measurements: Measurement[];
}): WindowSignals {
  const { fromISO, toISO, daysPerWeek, checkins, sessions, measurements } = args;

  const inWindow = (dayISO: string) => dayISO >= fromISO && dayISO < toISO;

  const cs = checkins.filter((c) => inWindow(c.date));
  const completed = sessions.filter(
    (s) => s.status === "completed" && inWindow(s.started_at.slice(0, 10))
  );

  const windowDays = Math.max(0, diffDaysISO(fromISO, toISO));
  const sessionsPlanned = Math.round((windowDays / 7) * daysPerWeek);
  const adherencePct =
    sessionsPlanned > 0
      ? Math.round(
          clamp((completed.length / sessionsPlanned) * 100, 0, 150)
        )
      : null;

  const weights = measurements
    .filter((m) => m.weight_kg != null && inWindow(m.measured_at.slice(0, 10)))
    .map((m) => ({
      date: m.measured_at.slice(0, 10),
      weightKg: m.weight_kg as number,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    adherencePct,
    avgEnergy: avg(cs.map((c) => c.energy)),
    avgSleep: avg(cs.map((c) => c.sleep)),
    avgSoreness: avg(cs.map((c) => c.soreness)),
    avgReadiness: avg(cs.map((c) => readinessScore(c))),
    checkinDays: cs.length,
    sessionsCompleted: completed.length,
    sessionsPlanned,
    weightRateKgPerWeek: weightSlopeKgPerWeek(weights),
  };
}
