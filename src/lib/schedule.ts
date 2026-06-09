/**
 * Calendar scheduling helpers. The weekly training cadence is derived
 * deterministically from the plan's days-per-week; users then move / skip /
 * reschedule individual sessions (overrides live in the schedule store).
 */
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type ScheduleStatus = "planned" | "completed" | "skipped";

export interface ScheduleEntry {
  date: string; // yyyy-MM-dd
  dayIndex: number; // index into plan.days
  status: ScheduleStatus;
}

export const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

/** Which weekdays (0=Sun … 6=Sat) host a session for a given weekly frequency. */
export const WEEKDAY_PATTERNS: Record<number, number[]> = {
  2: [1, 4], // Mon, Thu
  3: [1, 3, 5], // Mon, Wed, Fri
  4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5], // Mon–Fri
  6: [1, 2, 3, 4, 5, 6], // Mon–Sat
};

export function patternFor(daysPerWeek: number): number[] {
  const d = Math.max(2, Math.min(6, daysPerWeek || 3));
  return WEEKDAY_PATTERNS[d] ?? [1, 3, 5];
}

/** Default plan-day index for a date, or null on a rest day. */
export function defaultDayIndex(
  date: Date,
  daysPerWeek: number
): number | null {
  const pattern = patternFor(daysPerWeek);
  const idx = pattern.indexOf(getDay(date));
  return idx === -1 ? null : idx;
}

/** 6-week grid (Mon-first) covering the month of `cursor`. */
export function monthGrid(cursor: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });
}

/** The Mon–Sun week containing `cursor`. */
export function weekDates(cursor: Date): Date[] {
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const STATUS_META: Record<
  ScheduleStatus,
  { label: string; tone: string; dot: string }
> = {
  planned: {
    label: "Planned",
    tone: "text-primary",
    dot: "bg-primary",
  },
  completed: {
    label: "Completed",
    tone: "text-primary",
    dot: "bg-primary",
  },
  skipped: {
    label: "Skipped",
    tone: "text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
};
