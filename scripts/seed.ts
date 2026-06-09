/**
 * Seed the Supabase catalog tables (manufacturers, muscle_groups, equipment,
 * exercises) from the app's local data.
 *
 * Usage:  npm run seed
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * The app works without this (it reads the catalog from local TS data); run it
 * only if you want the reference content available in the database.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { EXERCISES } from "../src/data/exercises";
import { EQUIPMENT } from "../src/data/equipment";
import { MUSCLE_GROUPS } from "../src/lib/constants";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "\n✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
      "  Add them (Supabase → Project Settings → API) and run the SQL in\n" +
      "  supabase/migrations first, then re-run `npm run seed`.\n"
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function seed() {
  // Muscle groups
  const muscleRows = MUSCLE_GROUPS.map((m) => ({ key: m.value, name: m.label }));
  const { error: mErr } = await supabase
    .from("muscle_groups")
    .upsert(muscleRows, { onConflict: "key" });
  if (mErr) throw mErr;
  console.log(`✓ muscle_groups: ${muscleRows.length}`);

  // Manufacturers (derived from equipment)
  const manufacturers = Array.from(
    new Set(EQUIPMENT.map((e) => e.manufacturer))
  ).map((name) => ({ key: name, name }));
  const { error: manErr } = await supabase
    .from("manufacturers")
    .upsert(manufacturers, { onConflict: "key" });
  if (manErr) throw manErr;
  console.log(`✓ manufacturers: ${manufacturers.length}`);

  // Equipment
  const { error: eqErr } = await supabase
    .from("equipment")
    .upsert(EQUIPMENT, { onConflict: "slug" });
  if (eqErr) throw eqErr;
  console.log(`✓ equipment: ${EQUIPMENT.length}`);

  // Exercises (map rep_range tuple → rep_low / rep_high columns)
  const exerciseRows = EXERCISES.map((e) => {
    const { rep_range, ...rest } = e;
    return { ...rest, rep_low: rep_range[0], rep_high: rep_range[1] };
  });
  const { error: exErr } = await supabase
    .from("exercises")
    .upsert(exerciseRows, { onConflict: "slug" });
  if (exErr) throw exErr;
  console.log(`✓ exercises: ${exerciseRows.length}`);

  console.log("\n✓ Seed complete.\n");
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
