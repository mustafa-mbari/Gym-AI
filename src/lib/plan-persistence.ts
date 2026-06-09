import type { SupabaseClient } from "@supabase/supabase-js";

import { planForProfile } from "@/lib/plan";
import { rowToProfile } from "@/lib/queries";

/**
 * Persist the user's active workout plan into the relational tables
 * (`workout_plans` → `workout_days` → `workout_exercises`).
 *
 * One active plan per user, keyed by the user id, so it can be refreshed
 * in place without orphaning `training_sessions.plan_id`. Returns the plan id
 * (the user id) on success, or `null` if anything went wrong — callers treat a
 * null as "don't stamp a plan_id".
 */
export async function ensureActivePlan(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profileRow) return null;

  const plan = planForProfile(rowToProfile(profileRow));
  const planId = userId;

  const { error: planErr } = await supabase.from("workout_plans").upsert(
    {
      id: planId,
      profile_id: userId,
      name: plan.name,
      goal: plan.goal,
      experience: plan.experience,
      split_type: plan.split_type,
      days_per_week: plan.days_per_week,
      session_minutes: plan.session_minutes,
      weeks: plan.weeks,
      summary: plan.summary,
      status: "active",
    },
    { onConflict: "id" }
  );
  if (planErr) return null;

  // Refresh days + exercises (cascade clears the old children).
  await supabase.from("workout_days").delete().eq("plan_id", planId);

  const dayRows = plan.days.map((d) => ({
    id: crypto.randomUUID(),
    plan_id: planId,
    day_index: d.index,
    name: d.name,
    focus: d.focus,
    estimated_minutes: d.estimated_minutes,
  }));
  const { error: daysErr } = await supabase.from("workout_days").insert(dayRows);
  if (daysErr) return planId; // plan row exists; children are best-effort

  const exerciseRows = plan.days.flatMap((d, i) =>
    d.exercises.map((e, j) => ({
      workout_day_id: dayRows[i].id,
      exercise_slug: e.exercise_slug,
      order_index: j,
      sets: e.sets,
      reps: e.reps,
      rest_seconds: e.rest_seconds,
      tempo: e.tempo,
      notes: e.notes,
      superset_group: e.superset_group,
    }))
  );
  if (exerciseRows.length) {
    await supabase.from("workout_exercises").insert(exerciseRows);
  }

  return planId;
}
