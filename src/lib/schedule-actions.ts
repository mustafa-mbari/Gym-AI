"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ScheduleEntry, SchedulePayload } from "@/lib/schedule";

async function authed() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

/**
 * Load the user's stored schedule overrides. Returns `null` in demo mode so
 * the calendar falls back to its local (localStorage) store.
 */
export async function loadSchedule(): Promise<SchedulePayload | null> {
  const ctx = await authed();
  if (!ctx) return null;

  const { data } = await ctx.supabase
    .from("schedule_overrides")
    .select("date, day_index, status, cleared")
    .eq("profile_id", ctx.userId);

  const entries: Record<string, ScheduleEntry> = {};
  const cleared: Record<string, true> = {};
  for (const row of (data ?? []) as Array<{
    date: string;
    day_index: number | null;
    status: ScheduleEntry["status"];
    cleared: boolean;
  }>) {
    if (row.cleared) cleared[row.date] = true;
    else if (row.day_index != null)
      entries[row.date] = {
        date: row.date,
        dayIndex: row.day_index,
        status: row.status,
      };
  }
  return { entries, cleared };
}

export async function upsertScheduleEntry(input: {
  date: string;
  day_index: number;
  status: ScheduleEntry["status"];
}): Promise<{ ok: boolean }> {
  const ctx = await authed();
  if (!ctx) return { ok: true };
  await ctx.supabase.from("schedule_overrides").upsert(
    {
      profile_id: ctx.userId,
      date: input.date,
      day_index: input.day_index,
      status: input.status,
      cleared: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,date" }
  );
  revalidatePath("/calendar");
  return { ok: true };
}

export async function clearScheduleDate(
  date: string
): Promise<{ ok: boolean }> {
  const ctx = await authed();
  if (!ctx) return { ok: true };
  await ctx.supabase.from("schedule_overrides").upsert(
    {
      profile_id: ctx.userId,
      date,
      day_index: null,
      status: "planned",
      cleared: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,date" }
  );
  revalidatePath("/calendar");
  return { ok: true };
}

export async function moveScheduleEntry(input: {
  from: string;
  to: string;
  day_index: number;
}): Promise<{ ok: boolean }> {
  await upsertScheduleEntry({
    date: input.to,
    day_index: input.day_index,
    status: "planned",
  });
  await clearScheduleDate(input.from);
  return { ok: true };
}
