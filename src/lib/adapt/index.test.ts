import { describe, expect, it } from "vitest";

import { computeAdaptation, NEUTRAL_ADAPTATION } from "@/lib/adapt";
import {
  makeCheckin,
  makeProfile,
  makeSession,
  makeWeight,
  weeklySessions,
} from "@/lib/test-fixtures";
import type { DailyCheckin } from "@/types";

// Monday of the "current" week — only data before it may be consulted.
const WEEK = "2026-06-08";
const profile = makeProfile(); // fat_loss, 3 days/week
const plan = { days_per_week: 3 };

function adapt(args: {
  checkins?: DailyCheckin[];
  sessions?: ReturnType<typeof weeklySessions>;
  measurements?: ReturnType<typeof makeWeight>[];
  profileOverrides?: Parameters<typeof makeProfile>[0];
}) {
  return computeAdaptation({
    weekStart: WEEK,
    profile: args.profileOverrides ? makeProfile(args.profileOverrides) : profile,
    plan,
    checkins: args.checkins ?? [],
    sessions: args.sessions ?? [],
    measurements: args.measurements ?? [],
  });
}

/** Check-ins for every day of the week before WEEK. */
function lastWeekCheckins(values: Partial<DailyCheckin>): DailyCheckin[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) =>
    makeCheckin(`2026-06-0${1 + i}`, values)
  );
}

describe("computeAdaptation", () => {
  it("stays neutral with no history (cold start)", () => {
    expect(adapt({})).toEqual({ ...NEUTRAL_ADAPTATION, weekStart: WEEK });
    // under a week of history is still a cold start
    const young = adapt({ checkins: [makeCheckin("2026-06-05")] });
    expect(young.volumeModifier).toBe(1);
    expect(young.flags).toEqual([]);
  });

  it("schedules a deload every 6th training week when adherence holds", () => {
    const sessions = weeklySessions([
      "2026-04-27",
      "2026-05-04",
      "2026-05-11",
      "2026-05-18",
      "2026-05-25",
      "2026-06-01",
    ]);
    const state = adapt({ sessions });
    expect(state.deload).toBe(true);
    expect(state.volumeModifier).toBe(0.6);
    expect(state.flags).toContain("deload");
    expect(state.reasons.join(" ")).toMatch(/deload/i);
  });

  it("forces a deload when readiness collapses but adherence is high", () => {
    const sessions = weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"]);
    const state = adapt({
      sessions,
      checkins: lastWeekCheckins({ feel: "poor", energy: 2, sleep: 3, soreness: 9 }),
    });
    expect(state.deload).toBe(true);
    expect(state.flags).toContain("low_readiness");
  });

  it("adds recovery (not deload) when readiness AND adherence are low", () => {
    const sessions = weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"], 1);
    const state = adapt({
      sessions,
      checkins: lastWeekCheckins({ soreness: 8 }),
    });
    expect(state.deload).toBe(false);
    expect(state.extraRecovery).toBe(true);
    expect(state.volumeModifier).toBe(0.8);
  });

  it("trims volume on low adherence", () => {
    const sessions = weeklySessions(["2026-05-25", "2026-06-01"], 1);
    const state = adapt({ sessions });
    expect(state.volumeModifier).toBe(0.8);
    expect(state.flags).toContain("volume_down");
    expect(state.flags).toContain("low_adherence");
  });

  it("nudges volume up when adherence and readiness are both high", () => {
    const sessions = weeklySessions([
      "2026-05-11",
      "2026-05-18",
      "2026-05-25",
      "2026-06-01",
    ]);
    const state = adapt({
      sessions,
      checkins: lastWeekCheckins({ feel: "good", energy: 8, sleep: 8, soreness: 2 }),
    });
    expect(state.volumeModifier).toBe(1.15);
    expect(state.flags).toContain("volume_up");
  });

  it("flags a plateau without changing training volume", () => {
    const sessions = weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"]);
    const state = adapt({
      sessions,
      measurements: [
        makeWeight("2026-05-19", 84.0),
        makeWeight("2026-05-26", 84.1),
        makeWeight("2026-06-02", 83.9),
      ],
    });
    expect(state.plateau).toBe(true);
    expect(state.flags).toContain("plateau");
    expect(state.volumeModifier).toBe(1);
  });

  it("ignores plateaus for goals that don't move the scale", () => {
    const sessions = weeklySessions(["2026-05-18", "2026-05-25", "2026-06-01"]);
    const state = adapt({
      sessions,
      measurements: [
        makeWeight("2026-05-19", 84.0),
        makeWeight("2026-05-26", 84.1),
        makeWeight("2026-06-02", 83.9),
      ],
      profileOverrides: { goals: ["general_fitness"] },
    });
    expect(state.plateau).toBe(false);
  });

  it("is stable within the week: intra-week data never changes the state", () => {
    const sessions = weeklySessions([
      "2026-05-11",
      "2026-05-18",
      "2026-05-25",
      "2026-06-01",
    ]);
    const checkins = lastWeekCheckins({ feel: "good", energy: 8, sleep: 8, soreness: 2 });
    const before = adapt({ sessions, checkins });
    const after = adapt({
      sessions: [...sessions, makeSession("2026-06-08"), makeSession("2026-06-10")],
      checkins: [
        ...checkins,
        makeCheckin("2026-06-08", { feel: "poor", energy: 1, sleep: 1, soreness: 10 }),
      ],
    });
    expect(after).toEqual(before);
  });
});
