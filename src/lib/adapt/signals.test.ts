import { describe, expect, it } from "vitest";

import {
  readinessScore,
  weightSlopeKgPerWeek,
  windowSignals,
} from "@/lib/adapt/signals";
import type { DailyCheckin, Measurement, TrainingSession } from "@/types";

function checkin(partial: Partial<DailyCheckin> & { date: string }): DailyCheckin {
  return {
    id: `c-${partial.date}`,
    profile_id: "u",
    feel: "good",
    energy: 6,
    sleep: 6,
    soreness: 3,
    mood: null,
    weight_kg: null,
    note: null,
    created_at: `${partial.date}T08:00:00.000Z`,
    ...partial,
  };
}

function session(dateISO: string, status: TrainingSession["status"] = "completed"): TrainingSession {
  return {
    id: `s-${dateISO}`,
    profile_id: "u",
    plan_id: null,
    day_index: 0,
    day_name: "Day",
    status,
    started_at: `${dateISO}T18:00:00.000Z`,
    completed_at: null,
    duration_seconds: 3600,
    total_volume_kg: 8000,
    notes: null,
  };
}

function weightAt(dateISO: string, kg: number): Measurement {
  return {
    id: `m-${dateISO}`,
    profile_id: "u",
    measured_at: `${dateISO}T07:00:00.000Z`,
    weight_kg: kg,
    body_fat_pct: null,
    waist_cm: null,
    chest_cm: null,
    arms_cm: null,
    legs_cm: null,
    shoulders_cm: null,
    neck_cm: null,
    hips_cm: null,
    notes: null,
  };
}

describe("readinessScore", () => {
  it("scores a balanced day in the middle of the range", () => {
    // 10·(0.4·6 + 0.35·6 + 0.25·8) = 65, +5 for "good"
    expect(readinessScore({ feel: "good", energy: 6, sleep: 6, soreness: 3 })).toBe(70);
  });

  it("clamps to the 0–100 range", () => {
    expect(
      readinessScore({ feel: "excellent", energy: 10, sleep: 10, soreness: 1 })
    ).toBe(100);
    expect(
      readinessScore({ feel: "poor", energy: 1, sleep: 1, soreness: 10 })
    ).toBeGreaterThanOrEqual(0);
  });

  it("rewards better wellness monotonically", () => {
    const low = readinessScore({ feel: "poor", energy: 3, sleep: 4, soreness: 8 });
    const high = readinessScore({ feel: "excellent", energy: 9, sleep: 8, soreness: 2 });
    expect(high).toBeGreaterThan(low);
  });
});

describe("weightSlopeKgPerWeek", () => {
  it("needs at least 3 points", () => {
    expect(
      weightSlopeKgPerWeek([
        { date: "2026-06-01", weightKg: 84 },
        { date: "2026-06-08", weightKg: 83 },
      ])
    ).toBeNull();
  });

  it("recovers a clean linear trend", () => {
    const points = [0, 7, 14, 21].map((d, i) => ({
      date: `2026-06-${String(1 + d).padStart(2, "0")}`,
      weightKg: 84 - i * 0.5,
    }));
    expect(weightSlopeKgPerWeek(points)).toBeCloseTo(-0.5, 2);
  });
});

describe("windowSignals", () => {
  it("computes adherence from completed sessions vs the weekly plan", () => {
    const s = windowSignals({
      fromISO: "2026-06-01",
      toISO: "2026-06-15", // 2 weeks
      daysPerWeek: 4,
      checkins: [],
      sessions: [
        session("2026-06-01"),
        session("2026-06-03"),
        session("2026-06-08"),
        session("2026-06-10"),
        session("2026-06-12", "skipped"), // ignored
        session("2026-06-20"), // outside window
      ],
      measurements: [],
    });
    expect(s.sessionsPlanned).toBe(8);
    expect(s.sessionsCompleted).toBe(4);
    expect(s.adherencePct).toBe(50);
  });

  it("averages check-in wellness inside the window only", () => {
    const s = windowSignals({
      fromISO: "2026-06-01",
      toISO: "2026-06-08",
      daysPerWeek: 3,
      checkins: [
        checkin({ date: "2026-05-31", energy: 1 }), // outside
        checkin({ date: "2026-06-02", energy: 4, sleep: 5, soreness: 6 }),
        checkin({ date: "2026-06-04", energy: 8, sleep: 7, soreness: 2 }),
      ],
      sessions: [],
      measurements: [],
    });
    expect(s.checkinDays).toBe(2);
    expect(s.avgEnergy).toBe(6);
    expect(s.avgSleep).toBe(6);
    expect(s.avgSoreness).toBe(4);
    expect(s.avgReadiness).not.toBeNull();
  });

  it("reports a weight rate from in-window measurements", () => {
    const s = windowSignals({
      fromISO: "2026-05-18",
      toISO: "2026-06-15",
      daysPerWeek: 4,
      checkins: [],
      sessions: [],
      measurements: [
        weightAt("2026-05-18", 86),
        weightAt("2026-05-25", 85.4),
        weightAt("2026-06-01", 84.9),
        weightAt("2026-06-08", 84.3),
      ],
    });
    expect(s.weightRateKgPerWeek).toBeLessThan(-0.4);
    expect(s.weightRateKgPerWeek).toBeGreaterThan(-0.7);
  });
});
