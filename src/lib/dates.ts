/**
 * Pure ISO-date helpers for the daily-companion engines. Everything operates
 * on "yyyy-MM-dd" strings interpreted as plain calendar days (parsed as UTC
 * internally so the math is timezone- and DST-proof). Server-side resolution
 * of the *user's* current day lives in `src/lib/queries.ts` (`getTodayISO`),
 * which needs cookie access; these helpers stay importable from anywhere.
 */

/**
 * Cookie carrying the client's `Date#getTimezoneOffset()` (minutes), set by
 * `Providers` so server components can resolve the user's local calendar day.
 */
export const TZ_COOKIE = "jym-tz";

/** Parse a "yyyy-MM-dd" string as a UTC date. */
export function parseISODay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Format a Date's *local* calendar day as "yyyy-MM-dd". */
export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add (or subtract) whole days to an ISO day string. */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODay(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function diffDaysISO(a: string, b: string): number {
  return Math.round(
    (parseISODay(b).getTime() - parseISODay(a).getTime()) / 86400000
  );
}

/** Monday of the ISO week containing `iso`. */
export function isoWeekStart(iso: string): string {
  const d = parseISODay(iso);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return addDaysISO(iso, -dow);
}

/** First day of the calendar month containing `iso`. */
export function isoMonthStart(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

/** Day-of-week for an ISO day (0=Sun … 6=Sat), matching `Date#getDay`. */
export function isoDayOfWeek(iso: string): number {
  return parseISODay(iso).getUTCDay();
}

/**
 * Mondays of all *completed* ISO weeks between `firstISO` (inclusive) and the
 * week containing `todayISO` (exclusive), oldest first.
 */
export function completedWeekStarts(
  firstISO: string,
  todayISO: string
): string[] {
  const currentWeek = isoWeekStart(todayISO);
  const out: string[] = [];
  let cursor = isoWeekStart(firstISO);
  while (cursor < currentWeek) {
    out.push(cursor);
    cursor = addDaysISO(cursor, 7);
  }
  return out;
}

/**
 * djb2 string hash — small, stable, deterministic. Powers date-keyed message
 * selection so the daily motivation rotates without `Math.random`.
 */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}
