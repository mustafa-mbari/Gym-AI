"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { DEMO_CHECKINS_COOKIE, getTodayISO } from "@/lib/queries";
import { diffDaysISO } from "@/lib/dates";
import { checkinSchema, type CheckinInput } from "@/lib/validations";

type ActionResult = { ok: boolean; error?: string; demo?: boolean };

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 180, // 180 days
  sameSite: "lax" as const,
};

/** Demo cookie size budget: keep only the newest N daily entries. */
const DEMO_KEEP = 21;

function revalidateCompanionPages() {
  revalidatePath("/dashboard");
  revalidatePath("/journey");
  revalidatePath("/progress");
}

/**
 * Upsert today's check-in (re-submitting the same day edits it). The client
 * supplies its local calendar date; the server only sanity-checks it against
 * its own notion of today to within a day of timezone skew.
 */
export async function submitCheckin(input: CheckinInput): Promise<ActionResult> {
  const parsed = checkinSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some answers look invalid. Please review." };
  }

  const serverToday = await getTodayISO();
  if (Math.abs(diffDaysISO(serverToday, parsed.data.date)) > 1) {
    return { ok: false, error: "Check-ins can only be logged for today." };
  }

  const row = {
    date: parsed.data.date,
    feel: parsed.data.feel,
    energy: parsed.data.energy,
    sleep: parsed.data.sleep,
    soreness: parsed.data.soreness,
    mood: parsed.data.mood ?? null,
    weight_kg: parsed.data.weight_kg ?? null,
    note: parsed.data.note?.trim() || null,
  };

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("daily_checkins")
        .upsert({ profile_id: user.id, ...row }, { onConflict: "profile_id,date" });
      if (error) return { ok: false, error: error.message };

      // Dual-write the weight into the measurements series so every existing
      // consumer (charts, stats, pace) keeps reading one source. Editing the
      // same day's check-in updates that day's auto-entry instead of stacking.
      if (row.weight_kg != null) {
        const { data: existing } = await supabase
          .from("measurements")
          .select("id")
          .eq("profile_id", user.id)
          .eq("notes", "Daily check-in")
          .gte("measured_at", `${row.date}T00:00:00`)
          .lte("measured_at", `${row.date}T23:59:59`)
          .limit(1)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("measurements")
            .update({ weight_kg: row.weight_kg })
            .eq("id", existing.id);
        } else {
          await supabase.from("measurements").insert({
            profile_id: user.id,
            measured_at: new Date().toISOString(),
            weight_kg: row.weight_kg,
            notes: "Daily check-in",
          });
        }
      }

      revalidateCompanionPages();
      return { ok: true };
    }
  }

  // Demo: upsert into the cookie, newest entries only (4KB cookie budget).
  const store = await cookies();
  let rows: Array<typeof row> = [];
  try {
    rows = JSON.parse(store.get(DEMO_CHECKINS_COOKIE)?.value ?? "[]");
  } catch {
    rows = [];
  }
  rows = [...rows.filter((r) => r.date !== row.date), row]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-DEMO_KEEP);
  store.set(DEMO_CHECKINS_COOKIE, JSON.stringify(rows), COOKIE_OPTS);

  revalidateCompanionPages();
  return { ok: true, demo: true };
}
