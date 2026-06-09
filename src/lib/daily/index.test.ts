import { describe, expect, it } from "vitest";

import { buildDailyBrief } from "@/lib/daily";
import { NEUTRAL_ADAPTATION } from "@/lib/adapt";
import { planForProfile } from "@/lib/plan";
import { bmr, calorieTarget, tdee } from "@/lib/fitness";
import { makeCheckin, makeProfile, makeSession } from "@/lib/test-fixtures";
import type { AdaptationState, DailyBrief } from "@/types";
import type { SchedulePayload } from "@/lib/schedule";

const TODAY = "2026-06-10"; // Wednesday → default training day for 3×/week
const profile = makeProfile(); // fat_loss, 3 days/week, Mon/Wed/Fri pattern
const plan = planForProfile(profile);
const neutral: AdaptationState = { ...NEUTRAL_ADAPTATION, weekStart: "2026-06-08" };

function brief(
  overrides: Partial<Parameters<typeof buildDailyBrief>[0]> = {}
): DailyBrief {
  return buildDailyBrief({
    todayISO: TODAY,
    profile,
    plan,
    adaptation: neutral,
    journey: null,
    todayCheckin: null,
    checkins: [],
    sessions: [],
    schedule: null,
    ...overrides,
  });
}

describe("buildDailyBrief — workout resolution", () => {
  it("schedules the cadence day on a default training day", () => {
    const b = brief();
    expect(b.workout.kind).toBe("training");
    if (b.workout.kind === "training") {
      expect(b.workout.dayIndex).toBe(1); // Wed = 2nd slot of Mon/Wed/Fri
      expect(b.workout.name).toBe(plan.days[1].name);
    }
  });

  it("rests on a non-pattern day", () => {
    expect(brief({ todayISO: "2026-06-11" }).workout.kind).toBe("rest"); // Thu
  });

  it("marks the day done once a session is logged today", () => {
    const b = brief({
      sessions: [makeSession(TODAY, { day_name: "Push A" })],
    });
    expect(b.workout).toEqual({ kind: "done", completedName: "Push A" });
  });

  it("lets a calendar override win over the cadence", () => {
    const schedule: SchedulePayload = {
      entries: {
        "2026-06-11": { date: "2026-06-11", dayIndex: 0, status: "planned" },
      },
      cleared: {},
    };
    const b = brief({ todayISO: "2026-06-11", schedule });
    expect(b.workout.kind).toBe("training");
    if (b.workout.kind === "training") expect(b.workout.dayIndex).toBe(0);
  });

  it("treats skipped and cleared override days as rest", () => {
    const skipped: SchedulePayload = {
      entries: { [TODAY]: { date: TODAY, dayIndex: 1, status: "skipped" } },
      cleared: {},
    };
    expect(brief({ schedule: skipped }).workout.kind).toBe("rest");
    const cleared: SchedulePayload = { entries: {}, cleared: { [TODAY]: true } };
    expect(brief({ schedule: cleared }).workout.kind).toBe("rest");
  });
});

describe("buildDailyBrief — readiness modulation", () => {
  it("tells a wrecked member to go light, without changing the workout", () => {
    const checkin = makeCheckin(TODAY, {
      feel: "poor",
      energy: 1,
      sleep: 1,
      soreness: 5,
    });
    const b = brief({ todayCheckin: checkin });
    expect(b.readiness).not.toBeNull();
    expect(b.readiness as number).toBeLessThan(35);
    expect(b.workout.kind).toBe("training");
    if (b.workout.kind === "training") {
      expect(b.workout.intensityNote).toMatch(/cut each exercise/i);
      expect(b.workout.dayIndex).toBe(1); // schedule unchanged
    }
  });

  it("suggests a movement-only session on severe soreness", () => {
    const b = brief({ todayCheckin: makeCheckin(TODAY, { soreness: 9 }) });
    if (b.workout.kind === "training") {
      expect(b.workout.intensityNote).toMatch(/sore/i);
    }
  });

  it("requests a check-in until one exists", () => {
    expect(brief().needsCheckin).toBe(true);
    expect(brief({ todayCheckin: makeCheckin(TODAY) }).needsCheckin).toBe(false);
  });
});

describe("buildDailyBrief — targets", () => {
  it("derives nutrition targets from the TDEE math", () => {
    const expected = calorieTarget({
      tdeeKcal: tdee(
        bmr({ weightKg: 84, heightCm: 180, age: 30, gender: "male" }),
        "active"
      ),
      weightKg: 84,
      primaryGoal: "fat_loss",
    });
    const b = brief();
    expect(b.nutrition.calories).toBe(expected.calories);
    expect(b.nutrition.protein).toBe(expected.protein);
    expect(b.activity.steps).toBe(10000); // weight-loss emphasis
  });

  it("tightens targets on a plateau", () => {
    const base = brief();
    const b = brief({
      adaptation: { ...neutral, plateau: true, flags: ["plateau"] },
    });
    expect(b.nutrition.calories).toBe(Math.round(base.nutrition.calories * 0.9));
    expect(b.activity.steps).toBe(11000);
    expect(b.nutrition.note).toMatch(/plateau/i);
  });
});

describe("buildDailyBrief — cadence & messaging", () => {
  it("is deterministic per (date, member)", () => {
    expect(brief().motivation).toBe(brief().motivation);
  });

  it("flags the weekly review on Mondays once history exists", () => {
    const sessions = [makeSession("2026-06-03")];
    expect(brief({ todayISO: "2026-06-08", sessions }).reviewDue).toBe("weekly");
    expect(brief({ todayISO: TODAY, sessions }).reviewDue).toBeNull();
  });

  it("flags the monthly review on the 1st", () => {
    const sessions = [makeSession("2026-06-20")];
    expect(brief({ todayISO: "2026-07-01", sessions }).reviewDue).toBe("monthly");
  });
});
