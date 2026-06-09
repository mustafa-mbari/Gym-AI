"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type CompleteInput = {
  day_index: number;
  day_name: string;
  duration_seconds: number;
  total_volume_kg: number;
};

/**
 * Record a finished training session. Persists to Supabase when authenticated;
 * a no-op (but successful) in demo mode so the flow completes.
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
      const now = new Date();
      const started = new Date(now.getTime() - input.duration_seconds * 1000);
      const { error } = await supabase.from("training_sessions").insert({
        profile_id: user.id,
        day_index: input.day_index,
        day_name: input.day_name,
        status: "completed",
        started_at: started.toISOString(),
        completed_at: now.toISOString(),
        duration_seconds: input.duration_seconds,
        total_volume_kg: input.total_volume_kg,
      });
      if (error) return { ok: false, error: error.message };
      revalidatePath("/dashboard");
      revalidatePath("/workouts");
      return { ok: true };
    }
  }
  return { ok: true, demo: true };
}
