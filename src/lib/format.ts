/** Presentation helpers — unit-aware weight/height + misc formatting. */
import { cmToFtIn, kgToLb } from "@/lib/fitness";
import type { UnitSystem } from "@/types";

export function formatWeight(
  kg: number | null | undefined,
  unit: UnitSystem = "metric",
  opts: { decimals?: number; withUnit?: boolean } = {}
): string {
  if (kg === null || kg === undefined || Number.isNaN(kg)) return "—";
  const { decimals = 1, withUnit = true } = opts;
  if (unit === "imperial") {
    const lb = kgToLb(kg).toFixed(decimals);
    return withUnit ? `${lb} lb` : lb;
  }
  const val = kg.toFixed(decimals);
  return withUnit ? `${val} kg` : val;
}

export function formatHeight(
  cm: number | null | undefined,
  unit: UnitSystem = "metric"
): string {
  if (cm === null || cm === undefined || Number.isNaN(cm)) return "—";
  if (unit === "imperial") {
    const { ft, in: inches } = cmToFtIn(cm);
    return `${ft}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export const weightUnit = (unit: UnitSystem) =>
  unit === "imperial" ? "lb" : "kg";
export const lengthUnit = (unit: UnitSystem) =>
  unit === "imperial" ? "in" : "cm";

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function initials(
  first?: string | null,
  last?: string | null
): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "J";
}

export function pct(value: number, opts: { decimals?: number } = {}): string {
  return `${value.toFixed(opts.decimals ?? 0)}%`;
}

/** Clamp a 0..1 ratio to a 0..100 percentage. */
export const toPercent = (ratio: number) =>
  Math.max(0, Math.min(100, Math.round(ratio * 100)));
