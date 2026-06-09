import { describe, expect, it } from "vitest";

import { computeAdaptation } from "@/lib/adapt";
import {
  latestCompletedWeeklyReview,
  monthlyReview,
  weeklyReview,
} from "@/lib/journey/reviews";
import {
  makeProfile,
  makeWeight,
  weeklySessions,
} from "@/lib/test-fixtures";

const profile = makeProfile(); // fat_loss, 3 days/week, 84 → 76 kg
const plan = { days_per_week: 3 };

describe("weeklyReview", () => {
  // Six straight training weeks → the 7th week is a planned deload.
  const sixWeeks = [
    "2026-04-27",
    "2026-05-04",
    "2026-05-11",
    "2026-05-18",
    "2026-05-25",
    "2026-06-01",
  ];
  const sessions = weeklySessions(sixWeeks);

  it("summarises the week and stays consistent with the adaptation engine", () => {
    const review = weeklyReview({
      weekStart: "2026-06-01",
      profile,
      plan,
      checkins: [],
      sessions,
      measurements: [makeWeight("2026-05-31", 85.0), makeWeight("2026-06-06", 84.4)],
    });
    expect(review.sessionsCompleted).toBe(3);
    expect(review.sessionsPlanned).toBe(3);
    expect(review.adherencePct).toBe(100);
    expect(review.weightChangeKg).toBe(-0.6);
    expect(review.wins.length).toBeGreaterThan(0);

    // Decision === what computeAdaptation does for the following Monday.
    const next = computeAdaptation({
      weekStart: "2026-06-08",
      profile,
      plan,
      checkins: [],
      sessions,
      measurements: [],
    });
    expect(next.deload).toBe(true);
    expect(review.decision).toBe("deload");
    expect(review.reasons).toEqual(next.reasons);
  });

  it("celebrates weight moving in the goal direction", () => {
    const review = weeklyReview({
      weekStart: "2026-06-01",
      profile,
      plan,
      checkins: [],
      sessions,
      measurements: [makeWeight("2026-05-31", 85.0), makeWeight("2026-06-06", 84.4)],
    });
    expect(review.wins.join(" ")).toMatch(/0\.6 kg down/);
  });

  it("returns null from latestCompletedWeeklyReview without history", () => {
    expect(
      latestCompletedWeeklyReview({
        todayISO: "2026-06-10",
        profile,
        plan,
        checkins: [],
        sessions: [],
        measurements: [],
      })
    ).toBeNull();
  });
});

describe("monthlyReview", () => {
  it("compares actual vs expected change and computes variance", () => {
    const review = monthlyReview({
      monthStart: "2026-05-01",
      profile,
      plan,
      checkins: [],
      sessions: weeklySessions(["2026-05-04", "2026-05-11", "2026-05-18", "2026-05-25"]),
      measurements: [makeWeight("2026-04-30", 87.0), makeWeight("2026-05-30", 84.6)],
    });
    // May ≈ 4.43 weeks at −0.6 kg/wk planned.
    expect(review.expectedChangeKg).toBeCloseTo(-2.7, 1);
    expect(review.actualChangeKg).toBe(-2.4);
    expect(review.variancePct).toBeGreaterThan(80);
    expect(review.variancePct).toBeLessThanOrEqual(100);
    expect(review.summary.length).toBeGreaterThan(0);
  });

  it("raises risks when progress falls far behind plan", () => {
    const review = monthlyReview({
      monthStart: "2026-05-01",
      profile,
      plan,
      checkins: [],
      sessions: [],
      measurements: [makeWeight("2026-04-30", 87.0), makeWeight("2026-05-30", 86.9)],
    });
    expect(review.risks.length).toBeGreaterThan(0);
  });
});
