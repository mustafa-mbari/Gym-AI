import { describe, expect, it } from "vitest";

import {
  addDaysISO,
  completedWeekStarts,
  diffDaysISO,
  hashString,
  isoDayOfWeek,
  isoMonthStart,
  isoWeekStart,
} from "@/lib/dates";

describe("ISO date helpers", () => {
  it("adds and diffs days across month boundaries", () => {
    expect(addDaysISO("2026-05-30", 3)).toBe("2026-06-02");
    expect(addDaysISO("2026-06-02", -3)).toBe("2026-05-30");
    expect(diffDaysISO("2026-05-30", "2026-06-02")).toBe(3);
  });

  it("finds the ISO week's Monday", () => {
    expect(isoWeekStart("2026-06-10")).toBe("2026-06-08"); // Wed → Mon
    expect(isoWeekStart("2026-06-08")).toBe("2026-06-08"); // Mon → itself
    expect(isoWeekStart("2026-06-14")).toBe("2026-06-08"); // Sun → prior Mon
  });

  it("computes month starts and weekdays", () => {
    expect(isoMonthStart("2026-06-10")).toBe("2026-06-01");
    expect(isoDayOfWeek("2026-06-08")).toBe(1); // Monday
    expect(isoDayOfWeek("2026-06-14")).toBe(0); // Sunday
  });

  it("lists completed week starts, excluding the current week", () => {
    const weeks = completedWeekStarts("2026-05-20", "2026-06-10");
    expect(weeks).toEqual(["2026-05-18", "2026-05-25", "2026-06-01"]);
    expect(completedWeekStarts("2026-06-09", "2026-06-10")).toEqual([]);
  });

  it("hashes deterministically", () => {
    expect(hashString("2026-06-10:user")).toBe(hashString("2026-06-10:user"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});
