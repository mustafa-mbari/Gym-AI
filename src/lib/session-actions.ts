"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ensureActivePlan } from "@/lib/plan-persistence";

export interface LoggedSet {
  exercise_slug: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rpe?: number | null;
}

interface CompleteInput {
  day_index: number;
  day_name: string;
  duration_seconds: number;
  total_volume_kg: number;
  logs: LoggedSet[];
}

/**
 * Record a finished training session — the summary row plus a per-set log for
 * every completed set (used for history and "last time" recall). Persists to
 * Supabase when authenticated; a successful no-op in demo mode.
 */
export async function completeSession(
  input: CompleteInput
): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Make sure an active plan row exists so we can link the session to it.
      const planId = await ensureActivePlan(supabase, user.id);

      const now = new Date();
      const started = new Date(now.getTime() - input.duration_seconds * 1000);

      const { data: session, error } = await supabase
        .from("training_sessions")
        .insert({
          profile_id: user.id,
          plan_id: planId,
          day_index: input.day_index,
          day_name: input.day_name,
          status: "completed",
          started_at: started.toISOString(),
          completed_at: now.toISOString(),
          duration_seconds: input.duration_seconds,
          total_volume_kg: input.total_volume_kg,
        })
        .select("id")
        .single();

      if (error) return { ok: false, error: error.message };

      if (input.logs.length && session) {
        const rows = input.logs.map((l) => ({
          session_id: session.id,
          exercise_slug: l.exercise_slug,
          set_number: l.set_number,
          reps: l.reps,
          weight_kg: l.weight_kg,
          rpe: l.rpe ?? null,
          completed: true,
        }));
        // Logs are non-fatal — a failure here shouldn't lose the session.
        await supabase.from("exercise_logs").insert(rows);
      }

      revalidatePath("/dashboard");
      revalidatePath("/workouts");
      revalidatePath("/progress");
      return { ok: true };
    }
  }
  return { ok: true, demo: true };
}
