import { describe, expect, it } from "vitest";

import { generatePlan } from "@/lib/plan/generator";
import { INJURY_AVOID, resolveEquipment } from "@/lib/plan/schemes";
import { getExercise } from "@/data";
import type { PlanInput, WorkoutPlan } from "@/types";

const base: PlanInput = {
  goals: ["build_muscle"],
  experience: "intermediate",
  gym_access: "full_gym",
  available_equipment: [],
  available_days: 4,
  session_minutes: 60,
  injuries: [],
};

// Drop the non-deterministic fields before comparing.
function shape(plan: WorkoutPlan) {
  const { id, created_at, ...rest } = plan;
  void id;
  void created_at;
  return rest;
}

describe("generatePlan", () => {
  it("is deterministic for identical input", () => {
    expect(shape(generatePlan(base))).toEqual(shape(generatePlan(base)));
  });

  it("produces one training day per available day, clamped to 2–6", () => {
    expect(generatePlan({ ...base, available_days: 2 }).days).toHaveLength(2);
    expect(generatePlan({ ...base, available_days: 5 }).days).toHaveLength(5);
    expect(generatePlan({ ...base, available_days: 6 }).days).toHaveLength(6);
    expect(generatePlan({ ...base, available_days: 9 }).days).toHaveLength(6);
    expect(generatePlan({ ...base, available_days: 1 }).days).toHaveLength(2);
  });

  it("chooses a split based on days and experience", () => {
    expect(generatePlan({ ...base, available_days: 4 }).split_type).toBe(
      "upper_lower"
    );
    expect(
      generatePlan({ ...base, experience: "beginner", available_days: 3 })
        .split_type
    ).toBe("full_body");
    expect(
      generatePlan({ ...base, experience: "intermediate", available_days: 3 })
        .split_type
    ).toBe("push_pull_legs");
  });

  it("never programs contraindicated movements for an injury", () => {
    const plan = generatePlan({ ...base, injuries: ["knee"] });
    const slugs = plan.days.flatMap((d) =>
      d.exercises.map((e) => e.exercise_slug)
    );
    for (const banned of INJURY_AVOID.knee.slugs) {
      expect(slugs).not.toContain(banned);
    }
  });

  it("only selects exercises performable with the available equipment", () => {
    const plan = generatePlan({
      ...base,
      gym_access: "bodyweight",
      available_equipment: [],
    });
    const available = resolveEquipment("bodyweight", []);
    for (const day of plan.days) {
      for (const pe of day.exercises) {
        const ex = getExercise(pe.exercise_slug);
        expect(ex, pe.exercise_slug).toBeDefined();
        expect(ex!.equipment.some((e) => available.has(e))).toBe(true);
      }
    }
  });

  it("reports weekly volume per muscle group", () => {
    const vol = generatePlan(base).weekly_volume;
    expect(Object.keys(vol).length).toBeGreaterThan(3);
    expect(Object.values(vol).every((v) => v > 0)).toBe(true);
  });

  it("adds a conditioning finisher for fat-loss plans", () => {
    const plan = generatePlan({ ...base, goals: ["fat_loss"] });
    expect(plan.days.some((d) => d.cardio)).toBe(true);
  });

  it("does not repeat an exercise within a single day", () => {
    for (const day of generatePlan(base).days) {
      const slugs = day.exercises.map((e) => e.exercise_slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});
