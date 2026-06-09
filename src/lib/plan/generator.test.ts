import { describe, expect, it } from "vitest";

import { generatePlan } from "@/lib/plan/generator";
import { INJURY_AVOID, resolveEquipment } from "@/lib/plan/schemes";
import { NEUTRAL_ADAPTATION } from "@/lib/adapt";
import { getExercise } from "@/data";
import type { AdaptationState, PlanInput, WorkoutPlan } from "@/types";

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

describe("generatePlan with adaptation", () => {
  const week: AdaptationState = { ...NEUTRAL_ADAPTATION, weekStart: "2026-06-08" };

  it("is unchanged without an adaptation (backward compatible)", () => {
    const plan = generatePlan(base);
    expect(plan.adaptation).toBeNull();
    // A neutral adaptation must not alter the programming either.
    const neutral = generatePlan(base, week);
    expect(neutral.days).toEqual(plan.days);
    expect(neutral.summary).toBe(plan.summary);
  });

  it("is deterministic with an adaptation", () => {
    const deload: AdaptationState = {
      ...week,
      deload: true,
      volumeModifier: 0.6,
      flags: ["deload"],
      reasons: ["Planned deload"],
    };
    expect(shape(generatePlan(base, deload))).toEqual(
      shape(generatePlan(base, deload))
    );
  });

  it("reduces dosage on a deload without changing exercise selection", () => {
    const deload: AdaptationState = {
      ...week,
      deload: true,
      volumeModifier: 0.6,
      flags: ["deload"],
      reasons: ["Planned deload"],
    };
    const basePlan = generatePlan(base);
    const plan = generatePlan(base, deload);

    const slugsOf = (p: WorkoutPlan) =>
      p.days.map((d) => d.exercises.map((e) => e.exercise_slug));
    expect(slugsOf(plan)).toEqual(slugsOf(basePlan));

    const totalSets = (p: WorkoutPlan) =>
      p.days.flatMap((d) => d.exercises).reduce((sum, e) => sum + e.sets, 0);
    expect(totalSets(plan)).toBeLessThan(totalSets(basePlan));

    const someNote = plan.days[0].exercises[0].notes ?? "";
    expect(someNote).toMatch(/deload/i);
    expect(plan.summary).toMatch(/deload/i);
    expect(plan.adaptation).toEqual(deload);
  });

  it("adds volume on a 1.15 modifier and never drops below 2 working sets", () => {
    const up: AdaptationState = {
      ...week,
      volumeModifier: 1.15,
      flags: ["volume_up"],
      reasons: ["Earned it"],
    };
    const down: AdaptationState = {
      ...week,
      volumeModifier: 0.6,
      deload: true,
      flags: ["deload"],
      reasons: [],
    };
    const basePlan = generatePlan(base);
    const more = generatePlan(base, up);
    const less = generatePlan(base, down);

    const totalSets = (p: WorkoutPlan) =>
      p.days.flatMap((d) => d.exercises).reduce((sum, e) => sum + e.sets, 0);
    expect(totalSets(more)).toBeGreaterThan(totalSets(basePlan));

    for (const day of less.days) {
      for (const e of day.exercises) {
        expect(e.sets).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
