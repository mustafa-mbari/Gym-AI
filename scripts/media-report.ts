/**
 * Photo coverage report for the catalog: which machines and exercises have a
 * real photo in public/images (or a catalog image_url), and which still show
 * the placeholder. Usage: npm run media:report
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { EQUIPMENT } from "../src/data/equipment";
import { EXERCISES } from "../src/data/exercises";

const EXTENSIONS = ["webp", "jpg", "png"];

function hasLocal(kind: "equipment" | "exercises", slug: string): boolean {
  return EXTENSIONS.some((ext) =>
    existsSync(join("public", "images", kind, `${slug}.${ext}`))
  );
}

function report(
  label: string,
  kind: "equipment" | "exercises",
  items: Array<{ slug: string; name: string; image_url: string | null }>
) {
  const missing: string[] = [];
  let covered = 0;
  for (const item of items) {
    if (item.image_url || hasLocal(kind, item.slug)) covered++;
    else missing.push(item.slug);
  }
  console.log(`\n${label}: ${covered}/${items.length} have photos`);
  if (missing.length) {
    console.log(`  Missing (drop into public/images/${kind}/<slug>.webp):`);
    for (const slug of missing) console.log(`  ✗ ${slug}`);
  }
}

report("Equipment", "equipment", EQUIPMENT);
report("Exercises", "exercises", EXERCISES);
console.log();
