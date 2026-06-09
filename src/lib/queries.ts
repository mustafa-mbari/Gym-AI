import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEMO_PROFILE,
  demoMeasurements,
  demoSessions,
  starterMeasurement,
} from "@/lib/demo";
import type { Measurement, Profile, TrainingSession } from "@/types";

export const DEMO_PROFILE_COOKIE = "jym-demo-profile";

/** Coerce a DB row into a fully-typed Profile with safe defaults. */
function rowToProfile(row: Record<string, unknown>): Profile {
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
