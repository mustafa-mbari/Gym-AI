import {
  DIFFICULTIES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_TYPES,
  GOALS,
  MUSCLE_GROUPS,
} from "@/lib/constants";

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
