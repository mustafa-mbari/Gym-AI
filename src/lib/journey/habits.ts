/**
 * Habit metrics — streaks, totals and badges. Long-term adherence beats any
 * single workout, so these power the positive-reinforcement surfaces.
 * Pure functions over explicit dates.
 */
import { addDaysISO, isoWeekStart } from "@/lib/dates";
import type { Consistency, DailyCheckin, TrainingSession } from "@/types";

interface BadgeRule {
  id: string;
  label: string;
  achieved: (c: Omit<Consistency, "badges">) => boolean;
}

const BADGE_RULES: BadgeRule[] = [
  { id: "first-checkin", label: "First check-in", achieved: (c) => c.totalCheckins >= 1 },
  { id: "checkin-7", label: "7-day check-in streak", achieved: (c) => c.checkinStreakDays >= 7 },
  { id: "checkin-30", label: "30-day check-in streak", achieved: (c) => c.checkinStreakDays >= 30 },
  { id: "first-workout", label: "First workout", achieved: (c) => c.totalWorkouts >= 1 },
  { id: "workouts-10", label: "10 workouts", achieved: (c) => c.totalWorkouts >= 10 },
  { id: "workouts-25", label: "25 workouts", achieved: (c) => c.totalWorkouts >= 25 },
  { id: "workouts-50", label: "50 workouts", achieved: (c) => c.totalWorkouts >= 50 },
  { id: "weeks-4", label: "4-week training streak", achieved: (c) => c.workoutStreakWeeks >= 4 },
  { id: "weeks-12", label: "12-week training streak", achieved: (c) => c.workoutStreakWeeks >= 12 },
];

export function computeConsistency(
  todayISO: string,
  checkins: DailyCheckin[],
  sessions: TrainingSession[]
): Consistency {
  const checkinDates = new Set(checkins.map((c) => c.date));
  const completed = sessions.filter((s) => s.status === "completed");

  // Consecutive checked-in days, counting back from today — or from yesterday
  // when today hasn't been logged yet (an open day never breaks the streak).
  let cursor = checkinDates.has(todayISO) ? todayISO : addDaysISO(todayISO, -1);
  let checkinStreakDays = 0;
  while (checkinDates.has(cursor)) {
    checkinStreakDays++;
    cursor = addDaysISO(cursor, -1);
  }

  // Consecutive ISO weeks with ≥1 completed workout (current week may still
  // be empty without breaking the streak).
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

  const base = {
    checkinStreakDays,
    workoutStreakWeeks,
    totalCheckins: checkins.length,
    totalWorkouts: completed.length,
  };

  return {
    ...base,
    badges: BADGE_RULES.map((r) => ({
      id: r.id,
      label: r.label,
      achieved: r.achieved(base),
    })),
  };
}
