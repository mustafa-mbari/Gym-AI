import { describe, expect, it } from "vitest";

import { buildJourney, inferTarget } from "@/lib/journey";
import { addDaysISO } from "@/lib/dates";
import {
  makeCheckin,
  makeProfile,
  makeWeight,
  weeklySessions,
} from "@/lib/test-fixtures";
import type { Goal } from "@/types";

const TODAY = "2026-06-10";

/** Weekly weigh-ins ending yesterday-ish, declining at `ratePerWeek` kg/wk. */
function trend(weeks: number, startKg: number, ratePerWeek: number) {
  return Array.from({ length: weeks }, (_, i) =>
    makeWeight(
      addDaysISO(TODAY, -7 * (weeks - 1 - i) - 1),
      +(startKg + ratePerWeek * i).toFixed(1)
    )
  );
}

describe("inferTarget", () => {
  it.each<[Goal, "weight" | "consistency"]>([
    ["lose_weight", "weight"],
    ["fat_loss", "weight"],
    ["build_muscle", "weight"],
    ["strength", "weight"],
    ["endurance", "consistency"],
    ["general_fitness", "consistency"],
    ["athletic_performance", "consistency"],
    ["rehabilitation", "consistency"],
    ["health", "consistency"],
  ])("classifies %s as a %s journey", (goal, kind) => {
    const target =
      goal === "build_muscle"
        ? inferTarget(makeProfile({ goals: [goal], target_weight_kg: 90 }), [])
        : inferTarget(makeProfile({ goals: [goal] }), []);
    expect(target.kind).toBe(kind);
  });

  it("falls back to consistency without a target weight", () => {
    const target = inferTarget(
      makeProfile({ goals: ["lose_weight"], target_weight_kg: null }),
      []
    );
    expect(target.kind).toBe("consistency");
  });

  it("derives direction and planned rate", () => {
    const down = inferTarget(makeProfile(), [makeWeight("2026-05-01", 86)]);
    expect(down).toMatchObject({
      kind: "weight",
      direction: "down",
      plannedRateKgPerWeek: 0.6,
    });
    const up = inferTarget(
      makeProfile({ goals: ["build_muscle"], target_weight_kg: 92 }),
      []
    );
    expect(up).toMatchObject({ kind: "weight", direction: "up", plannedRateKgPerWeek: 0.25 });
  });
});

describe("buildJourney — weight journeys", () => {
  const profile = makeProfile(); // 84 kg → 76 kg, fat_loss

  it("reports on-track pace when losing at the planned rate", () => {
    const j = buildJourney({
      todayISO: TODAY,
      profile,
      measurements: trend(4, 86, -0.6),
      sessions: weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"]),
      checkins: [],
    });
    expect(j.pace.status).toBe("on_track");
    expect(j.pace.actualPerWeek).toBeCloseTo(0.6, 1);
    expect(j.pace.requiredPerWeek).toBe(0.6);
    expect(j.etaISO).toBe(j.plannedEtaISO);
    expect(j.progressPct).toBeGreaterThan(0);
  });

  it("reports ahead with a positive deltaWeeks when faster than plan", () => {
    const j = buildJourney({
      todayISO: TODAY,
      profile,
      measurements: trend(4, 87, -1.0),
      sessions: [],
      checkins: [],
    });
    expect(j.pace.status).toBe("ahead");
    expect(j.pace.deltaWeeks ?? 0).toBeGreaterThan(0);
  });

  it("clamps the ETA to a two-year horizon on a glacial pace", () => {
    const j = buildJourney({
      todayISO: TODAY,
      profile,
      measurements: trend(4, 84.2, -0.05),
      sessions: [],
      checkins: [],
    });
    expect(j.pace.status).toBe("behind");
    expect(j.etaISO).toBe(addDaysISO(TODAY, 104 * 7));
  });

  it("detects achieved and pending milestones", () => {
    const measurements = [
      makeWeight("2026-04-01", 89),
      ...trend(4, 86, -0.6),
    ];
    const j = buildJourney({
      todayISO: TODAY,
      profile,
      measurements,
      sessions: [],
      checkins: [],
    });
    const byId = Object.fromEntries(j.milestones.map((m) => [m.id, m]));
    expect(byId["first-kg"].achieved).toBe(true);
    expect(byId["first-kg"].achievedDate).not.toBeNull();
    expect(byId["pct-100"].achieved).toBe(false);
    expect(byId["pct-100"].projectedDate).not.toBeNull();
    expect(byId["pct-100"].progressPct).toBeGreaterThan(0);
    expect(byId["pct-100"].progressPct).toBeLessThan(100);
  });
});

describe("buildJourney — consistency journeys", () => {
  const profile = makeProfile({ goals: ["general_fitness"] }); // 3 days/week

  it("paces sessions per week against the commitment", () => {
    const j = buildJourney({
      todayISO: TODAY,
      profile,
      measurements: [],
      sessions: weeklySessions([
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01",
      ]),
      checkins: [],
    });
    expect(j.target.kind).toBe("consistency");
    expect(j.pace.status).toBe("on_track");
    const byId = Object.fromEntries(j.milestones.map((m) => [m.id, m]));
    expect(byId["workout-1"].achieved).toBe(true);
    expect(byId["workout-10"].achieved).toBe(true); // 12 sessions
    expect(byId["workout-25"].achieved).toBe(false);
  });
});

describe("buildJourney — success probability", () => {
  const profile = makeProfile();

  it("stays within the 5–95 band at the extremes", () => {
    const great = buildJourney({
      todayISO: TODAY,
      profile,
      measurements: trend(4, 87, -1.2),
      sessions: weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"]),
      checkins: Array.from({ length: 14 }, (_, i) =>
        makeCheckin(addDaysISO(TODAY, -(i + 1)))
      ),
    });
    expect(great.successProbability).toBeLessThanOrEqual(95);
    expect(great.successProbability).toBeGreaterThanOrEqual(5);

    const grim = buildJourney({
      todayISO: TODAY,
      profile,
      measurements: trend(4, 84, 0.3), // moving the wrong way
      sessions: [],
      checkins: [],
    });
    expect(grim.successProbability).toBeLessThanOrEqual(95);
    expect(grim.successProbability).toBeGreaterThanOrEqual(5);
    expect(grim.successProbability).toBeLessThan(great.successProbability);
  });

  it("is monotonic in adherence", () => {
    const measurements = trend(4, 86, -0.6);
    const low = buildJourney({
      todayISO: TODAY,
      profile,
      measurements,
      sessions: [],
      checkins: [],
    });
    const high = buildJourney({
      todayISO: TODAY,
      profile,
      measurements,
      sessions: weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"]),
      checkins: [],
    });
    expect(high.successProbability).toBeGreaterThanOrEqual(low.successProbability);
  });
});
