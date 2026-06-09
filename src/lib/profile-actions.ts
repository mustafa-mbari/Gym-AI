"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { onboardingToProfile } from "@/lib/plan/from-profile";
import { ensureActivePlan } from "@/lib/plan-persistence";
import { DEMO_PROFILE_COOKIE } from "@/lib/queries";
import {
  measurementSchema,
  onboardingSchema,
  profileUpdateSchema,
  type MeasurementInput,
  type OnboardingData,
  type ProfileUpdate,
} from "@/lib/validations";
import type { Profile } from "@/types";

type ActionResult = { ok: boolean; error?: string; demo?: boolean };

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 180, // 180 days
  sameSite: "lax" as const,
};

/** Strip non-column / server-managed fields before writing to Postgres. */
function profileToRow(profile: Profile) {
  const { created_at, ...rest } = profile;
  void created_at;
  return { ...rest, updated_at: new Date().toISOString() };
}

export async function saveOnboarding(
  input: OnboardingData
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some answers look invalid. Please review." };
  }

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const profile = onboardingToProfile(parsed.data, user.id);
      const { error } = await supabase
        .from("profiles")
        .upsert(profileToRow(profile));
      if (error) return { ok: false, error: error.message };
      // Persist the freshly generated plan into the relational tables.
      await ensureActivePlan(supabase, user.id);
      revalidatePath("/", "layout");
      return { ok: true };
    }
  }

  // Demo persistence: stash the profile in a cookie the server can read back.
  const profile = onboardingToProfile(parsed.data, "demo-user");
  const store = await cookies();
  store.set(DEMO_PROFILE_COOKIE, JSON.stringify(profile), COOKIE_OPTS);
  revalidatePath("/", "layout");
  return { ok: true, demo: true };
}

export async function updateProfile(
  input: ProfileUpdate
): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid profile changes." };

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) return { ok: false, error: error.message };
      // Re-sync the persisted plan in case training inputs changed.
      await ensureActivePlan(supabase, user.id);
      revalidatePath("/", "layout");
      return { ok: true };
    }
  }

  // Demo: merge into the cookie profile.
  const store = await cookies();
  const raw = store.get(DEMO_PROFILE_COOKIE)?.value;
  if (raw) {
    try {
      const merged = { ...JSON.parse(raw), ...parsed.data };
      store.set(DEMO_PROFILE_COOKIE, JSON.stringify(merged), COOKIE_OPTS);
    } catch {
      // ignore
    }
  }
  revalidatePath("/", "layout");
  return { ok: true, demo: true };
}

export async function saveMeasurement(
  input: MeasurementInput
): Promise<ActionResult> {
  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid measurement." };

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("measurements").insert({
        profile_id: user.id,
        measured_at: new Date().toISOString(),
        ...parsed.data,
      });
      if (error) return { ok: false, error: error.message };
      revalidatePath("/progress");
      revalidatePath("/dashboard");
      return { ok: true };
    }
  }

  // Demo mode: measurements aren't persisted, but we report success so the UI
  // flow stays intact.
  return { ok: true, demo: true };
}

export async function clearDemoProfile(): Promise<ActionResult> {
  const store = await cookies();
  store.delete(DEMO_PROFILE_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true, demo: true };
}
