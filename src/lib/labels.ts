import {
  DIFFICULTIES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_TYPES,
  GOALS,
  MUSCLE_GROUPS,
} from "@/lib/constants";
import type { Pace, WeeklyDecision } from "@/types";

function lookup(
  arr: ReadonlyArray<{ value: string; label: string }>,
  key: string | null | undefined
): string {
  if (!key) return "";
  return arr.find((o) => o.value === key)?.label ?? key;
}

export const muscleLabel = (k?: string | null) => lookup(MUSCLE_GROUPS, k);
export const equipmentTypeLabel = (k?: string | null) =>
  lookup(EQUIPMENT_TYPES, k);
export const categoryLabel = (k?: string | null) =>
  lookup(EQUIPMENT_CATEGORIES, k);
export const difficultyLabel = (k?: string | null) => lookup(DIFFICULTIES, k);
export const goalLabel = (k?: string | null) => lookup(GOALS, k);

/** Tailwind tone for a difficulty badge. */
export const difficultyTone = (
  d: string
): "success" | "warning" | "destructive" =>
  d === "beginner" ? "success" : d === "intermediate" ? "warning" : "destructive";

/** Human pace summary: "2 wk ahead", "15% behind pace", "On track". */
export function paceText(pace: Pace): string {
  if (pace.status === "no_data") return "Building data";
  if (pace.deltaWeeks != null && Math.abs(pace.deltaWeeks) >= 1) {
    const w = Math.abs(pace.deltaWeeks);
    return pace.deltaWeeks > 0 ? `${w} wk ahead` : `${w} wk behind`;
  }
  if (pace.ratio != null && pace.status !== "on_track") {
    const pct = Math.abs(Math.round((pace.ratio - 1) * 100));
    return pace.status === "ahead" ? `${pct}% ahead of pace` : `${pct}% behind pace`;
  }
  return "On track";
}

export const paceTone = (
  status: Pace["status"]
): "success" | "warning" | "secondary" =>
  status === "ahead" || status === "on_track"
    ? "success"
    : status === "behind"
      ? "warning"
      : "secondary";

export const WEEKLY_DECISION_LABEL: Record<WeeklyDecision, string> = {
  increase_load: "Increase load",
  keep: "Stay the course",
  reduce_load: "Reduce load",
  deload: "Deload week",
  add_recovery: "Add recovery",
};
