import { describe, expect, it } from "vitest";

import {
  ageFromBirthDate,
  bmi,
  bmiCategory,
  bmr,
  calorieTarget,
  cmToFtIn,
  kgToLb,
  lbToKg,
  tdee,
} from "@/lib/fitness";

describe("fitness math", () => {
  it("round-trips weight conversions", () => {
    expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 6);
  });

  it("converts cm to ft/in", () => {
    expect(cmToFtIn(180)).toEqual({ ft: 5, in: 11 });
  });

  it("computes BMI and categorises it", () => {
    expect(bmi(80, 180)).toBeCloseTo(24.69, 1);
    expect(bmiCategory(22).tone).toBe("success");
    expect(bmiCategory(31).label).toBe("Obese");
    expect(bmiCategory(17).label).toBe("Underweight");
  });

  it("applies the gender offset in BMR", () => {
    const male = bmr({ weightKg: 80, heightCm: 180, age: 30, gender: "male" });
    const female = bmr({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      gender: "female",
    });
    expect(male).toBeGreaterThan(female);
    expect(male - female).toBe(166); // +5 vs -161
  });

  it("scales TDEE by activity factor", () => {
    expect(tdee(2000, "sedentary")).toBe(2400);
    expect(tdee(2000, "very_active")).toBeGreaterThan(tdee(2000, "sedentary"));
  });

  it("creates a calorie deficit and protein target for fat loss", () => {
    const maintenance = tdee(1800, "active");
    const target = calorieTarget({
      tdeeKcal: maintenance,
      weightKg: 80,
      primaryGoal: "fat_loss",
    });
    expect(target.calories).toBeLessThan(maintenance);
    expect(target.protein).toBeGreaterThan(0);
  });

  it("derives age from a birth date", () => {
    const age = ageFromBirthDate("2000-01-01");
    expect(age).toBeGreaterThanOrEqual(25);
  });
});
