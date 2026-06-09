import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEMO_PROFILE,
  demoCheckins,
  demoMeasurements,
  demoSessions,
  starterMeasurement,
} from "@/lib/demo";
import { addDaysISO, isoWeekStart, TZ_COOKIE } from "@/lib/dates";
import { computeAdaptation } from "@/lib/adapt";
import { planForProfile } from "@/lib/plan";
import { getExercise } from "@/data";
import type {
  AdaptationState,
  DailyCheckin,
  Measurement,
  Profile,
  TrainingSession,
  WorkoutPlan,
} from "@/types";

export const DEMO_PROFILE_COOKIE = "jym-demo-profile";
export const DEMO_CHECKINS_COOKIE = "jym-demo-checkins";

/**
 * The user's local calendar day ("yyyy-MM-dd"), resolved from the timezone
 * cookie the client sets on first render. Falls back to the server's UTC day
 * when the cookie is absent (only ever the very first request).
 */
export async function getTodayISO(): Promise<string> {
  const store = await cookies();
  const offset = Number.parseInt(store.get(TZ_COOKIE)?.value ?? "", 10);
  const ms = Date.now() - (Number.isFinite(offset) ? offset : 0) * 60000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Coerce a DB row into a fully-typed Profile with safe defaults. */
export function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    ...(row as unknown as Profile),
    available_equipment: (row.available_equipment as string[]) ?? [],
    goals: (row.goals as string[]) ?? [],
    injuries: (row.injuries as string[]) ?? [],
    unit_system: (row.unit_system as Profile["unit_system"]) ?? "metric",
    onboarding_completed: Boolean(row.onboarding_completed),
  } as Profile;
}

/**
 * Resolve the current profile. Order of precedence:
 *   1. Authenticated Supabase user's `profiles` row.
 *   2. The demo cookie a user produced by completing onboarding offline.
 *   3. The built-in sample profile (only when no backend is configured).
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) return rowToProfile(data);
      return null; // logged in, but onboarding not completed
    }
  }

  const store = await cookies();
  const raw = store.get(DEMO_PROFILE_COOKIE)?.value;
  if (raw) {
    try {
      return rowToProfile(JSON.parse(raw));
    } catch {
      // fall through
    }
  }

  return isSupabaseConfigured ? null : DEMO_PROFILE;
}

export async function getMeasurements(): Promise<Measurement[]> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("measurements")
        .select("*")
        .eq("profile_id", user.id)
        .order("measured_at", { ascending: true });
      return (data as Measurement[]) ?? [];
    }
  }

  // Demo: full sample history for the built-in profile, otherwise a single
  // snapshot derived from the user's onboarding answers.
  const profile = await getProfile();
  if (profile && profile.id !== "demo-user") {
    return [starterMeasurement(profile)];
  }
  return demoMeasurements();
}

/** A demo check-in stored in the cookie (compact: no server-managed fields). */
type DemoCheckinRow = Omit<DailyCheckin, "id" | "profile_id" | "created_at">;

function hydrateDemoCheckin(row: DemoCheckinRow): DailyCheckin {
  return {
    id: `demo-c-${row.date}`,
    profile_id: "demo-user",
    created_at: `${row.date}T08:00:00.000Z`,
    ...row,
    mood: row.mood ?? null,
    weight_kg: row.weight_kg ?? null,
    note: row.note ?? null,
  };
}

/**
 * Daily check-ins for the current user, oldest first. Demo mode mirrors
 * `getMeasurements`: the deterministic sample history, overlaid with any
 * check-ins the visitor logged themselves (cookie wins per date).
 */
export async function getCheckins(limitDays = 90): Promise<DailyCheckin[]> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const today = await getTodayISO();
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("profile_id", user.id)
        .gte("date", addDaysISO(today, -limitDays))
        .order("date", { ascending: true });
      return (data as DailyCheckin[]) ?? [];
    }
  }

  const today = await getTodayISO();
  const byDate = new Map<string, DailyCheckin>();
  const profile = await getProfile();
  if (profile) {
    for (const c of demoCheckins(today)) byDate.set(c.date, c);
  }
  const store = await cookies();
  const raw = store.get(DEMO_CHECKINS_COOKIE)?.value;
  if (raw) {
    try {
      for (const row of JSON.parse(raw) as DemoCheckinRow[]) {
        byDate.set(row.date, hydrateDemoCheckin(row));
      }
    } catch {
      // ignore malformed cookie
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getSessions(): Promise<TrainingSession[]> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("profile_id", user.id)
        .order("started_at", { ascending: false });
      return (data as TrainingSession[]) ?? [];
    }
  }
  return demoSessions();
}

/**
 * The most recent logged weight/reps per exercise, for "last time" recall in
 * the guided session. RLS scopes `exercise_logs` to the user, so a plain,
 * newest-first scan + first-seen-per-slug reduction is enough.
 */
export async function getLastLoggedSets(): Promise<
  Record<string, { weight_kg: number | null; reps: number | null }>
> {
  const supabase = await createClient();
  if (!supabase) return {};
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("exercise_logs")
    .select("exercise_slug, weight_kg, reps, created_at")
    .order("created_at", { ascending: false })
    .limit(400);

  const out: Record<string, { weight_kg: number | null; reps: number | null }> =
    {};
  for (const row of (data ?? []) as Array<{
    exercise_slug: string;
    weight_kg: number | null;
    reps: number | null;
  }>) {
    if (!(row.exercise_slug in out)) {
      out[row.exercise_slug] = { weight_kg: row.weight_kg, reps: row.reps };
    }
  }
  return out;
}

/** Everything the daily-companion surfaces need, loaded once per request. */
export interface CompanionData {
  profile: Profile;
  /** The profile's plan with this week's adaptation applied. */
  plan: WorkoutPlan;
  adaptation: AdaptationState;
  checkins: DailyCheckin[];
  sessions: TrainingSession[];
  measurements: Measurement[];
  todayISO: string;
}

/**
 * Load the member's full companion context: profile, history, this week's
 * adaptation state, and the adapted plan. The adaptation only consults data
 * before the current ISO week's Monday, so the plan is stable all week.
 */
export async function getCompanionData(): Promise<CompanionData | null> {
  const [profile, measurements, sessions, checkins, todayISO] =
    await Promise.all([
      getProfile(),
      getMeasurements(),
      getSessions(),
      getCheckins(),
      getTodayISO(),
    ]);
  if (!profile) return null;

  const basePlan = planForProfile(profile);
  const adaptation = computeAdaptation({
    weekStart: isoWeekStart(todayISO),
    profile,
    plan: basePlan,
    checkins,
    sessions,
    measurements,
  });
  const plan =
    adaptation.flags.length > 0
      ? planForProfile(profile, adaptation)
      : basePlan;

  return { profile, plan, adaptation, checkins, sessions, measurements, todayISO };
}

export interface StrengthSeries {
  slug: string;
  name: string;
  points: Array<{ date: string; weight: number }>; // weight in kg
}

/**
 * Top-weight-per-day for the user's most-logged exercises, for strength trend
 * charts. Empty in demo mode (no logged history).
 */
export async function getStrengthHistory(limit = 5): Promise<StrengthSeries[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exercise_logs")
    .select("exercise_slug, weight_kg, created_at")
    .order("created_at", { ascending: true })
    .limit(1000);

  // slug → (dayKey → max weight that day)
  const bySlug = new Map<string, Map<string, number>>();
  for (const row of (data ?? []) as Array<{
    exercise_slug: string;
    weight_kg: number | null;
    created_at: string;
  }>) {
    if (row.weight_kg == null) continue;
    const day = row.created_at.slice(0, 10);
    const m = bySlug.get(row.exercise_slug) ?? new Map<string, number>();
    m.set(day, Math.max(m.get(day) ?? 0, row.weight_kg));
    bySlug.set(row.exercise_slug, m);
  }

  return [...bySlug.entries()]
    .map(([slug, days]) => ({
      slug,
      name: getExercise(slug)?.name ?? slug,
      points: [...days.entries()]
        .map(([date, weight]) => ({ date, weight }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((s) => s.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, limit);
}
