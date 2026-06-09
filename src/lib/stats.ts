/** Derived analytics from measurements + sessions. Pure + presentation-free. */
import type { Measurement, Profile, TrainingSession } from "@/types";

export interface ProgressStats {
  startWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  weightChange: number; // negative = lost
  goalProgressPct: number; // 0..100 toward target
  toGoal: number | null; // remaining to target (abs)
  completedWorkouts: number;
  totalVolumeKg: number;
  thisWeekWorkouts: number;
  streakWeeks: number;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function computeStats(
  profile: Profile | null,
  measurements: Measurement[],
  sessions: TrainingSession[]
): ProgressStats {
  const weighed = measurements.filter((m) => m.weight_kg != null);
  const startWeight = weighed[0]?.weight_kg ?? profile?.weight_kg ?? null;
  const currentWeight =
    weighed[weighed.length - 1]?.weight_kg ?? profile?.weight_kg ?? null;
  const goalWeight = profile?.target_weight_kg ?? null;

  const weightChange =
    startWeight != null && currentWeight != null
      ? +(currentWeight - startWeight).toFixed(1)
      : 0;

  let goalProgressPct = 0;
  let toGoal: number | null = null;
  if (startWeight != null && currentWeight != null && goalWeight != null) {
    const total = Math.abs(goalWeight - startWeight);
    const done = Math.abs(currentWeight - startWeight);
    toGoal = +Math.abs(goalWeight - currentWeight).toFixed(1);
    goalProgressPct = total === 0 ? 100 : Math.max(0, Math.min(100, (done / total) * 100));
    // If they moved the wrong way, clamp progress to 0.
    const movingTowardGoal =
      (goalWeight < startWeight && currentWeight <= startWeight) ||
      (goalWeight > startWeight && currentWeight >= startWeight);
    if (!movingTowardGoal) goalProgressPct = 0;
  }

  const completed = sessions.filter((s) => s.status === "completed");
  const totalVolumeKg = completed.reduce(
    (sum, s) => sum + (s.total_volume_kg ?? 0),
    0
  );

  const now = new Date();
  const weekStart = startOfWeek(now);
  const thisWeekWorkouts = completed.filter(
    (s) => new Date(s.started_at) >= weekStart
  ).length;

  // Streak: consecutive weeks (incl. current) with ≥1 completed session.
  let streakWeeks = 0;
  for (let i = 0; i < 52; i++) {
    const wStart = new Date(weekStart);
    wStart.setDate(wStart.getDate() - i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const has = completed.some((s) => {
      const t = new Date(s.started_at);
      return t >= wStart && t < wEnd;
    });
    if (has) streakWeeks++;
    else if (i > 0) break; // allow current week to be empty without breaking
    else continue;
  }

  return {
    startWeight,
    currentWeight,
    goalWeight,
    weightChange,
    goalProgressPct: Math.round(goalProgressPct),
    toGoal,
    completedWorkouts: completed.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    thisWeekWorkouts,
    streakWeeks,
  };
}

/** Weekly completed-session counts for the last `weeks` weeks (oldest→newest). */
export function weeklyFrequency(
  sessions: TrainingSession[],
  weeks = 8
): Array<{ label: string; count: number }> {
  const completed = sessions.filter((s) => s.status === "completed");
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const out: Array<{ label: string; count: number }> = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const wStart = new Date(thisWeekStart);
    wStart.setDate(wStart.getDate() - i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const count = completed.filter((s) => {
      const t = new Date(s.started_at);
      return t >= wStart && t < wEnd;
    }).length;
    out.push({
      label: wStart.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count,
    });
  }
  return out;
}
