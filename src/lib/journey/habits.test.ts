import { describe, expect, it } from "vitest";

import { computeConsistency } from "@/lib/journey/habits";
import { makeCheckin, makeSession } from "@/lib/test-fixtures";

const TODAY = "2026-06-10"; // Wednesday

describe("computeConsistency", () => {
  it("counts a check-in streak including today", () => {
    const c = computeConsistency(
      TODAY,
      [makeCheckin("2026-06-08"), makeCheckin("2026-06-09"), makeCheckin(TODAY)],
      []
    );
    expect(c.checkinStreakDays).toBe(3);
  });

  it("does not break the streak when today is still open", () => {
    const c = computeConsistency(
      TODAY,
      [makeCheckin("2026-06-07"), makeCheckin("2026-06-08"), makeCheckin("2026-06-09")],
      []
    );
    expect(c.checkinStreakDays).toBe(3);
  });

  it("breaks the streak on a missed day", () => {
    const c = computeConsistency(
      TODAY,
      [makeCheckin("2026-06-07"), makeCheckin("2026-06-09")],
      []
    );
    expect(c.checkinStreakDays).toBe(1);
  });

  it("counts consecutive training weeks, current week may be empty", () => {
    const sessions = [
      makeSession("2026-05-27"),
      makeSession("2026-06-03"),
    ];
    expect(computeConsistency(TODAY, [], sessions).workoutStreakWeeks).toBe(2);
    // …and including the current week when trained.
    expect(
      computeConsistency(TODAY, [], [...sessions, makeSession("2026-06-09")])
        .workoutStreakWeeks
    ).toBe(3);
    // a missed week in between breaks it.
    expect(
      computeConsistency(TODAY, [], [makeSession("2026-05-20"), makeSession("2026-06-09")])
        .workoutStreakWeeks
    ).toBe(1);
  });

  it("awards badges from totals and streaks", () => {
    const c = computeConsistency(TODAY, [makeCheckin(TODAY)], [makeSession("2026-06-09")]);
    const byId = Object.fromEntries(c.badges.map((b) => [b.id, b.achieved]));
    expect(byId["first-checkin"]).toBe(true);
    expect(byId["first-workout"]).toBe(true);
    expect(byId["workouts-10"]).toBe(false);
  });
});
