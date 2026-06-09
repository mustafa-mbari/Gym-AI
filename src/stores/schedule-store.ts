"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ScheduleEntry, ScheduleStatus } from "@/lib/schedule";

interface ScheduleStore {
  /** Materialised sessions keyed by yyyy-MM-dd. */
  entries: Record<string, ScheduleEntry>;
  /** Dates the user turned into rest days (so defaults don't re-fill them). */
  cleared: Record<string, true>;

  /** Fill in default sessions for dates not yet materialised or cleared. */
  ensure: (list: Array<{ date: string; dayIndex: number | null }>) => void;
  setStatus: (date: string, status: ScheduleStatus) => void;
  move: (from: string, to: string) => void;
  assign: (date: string, dayIndex: number) => void;
  makeRest: (date: string) => void;
  reset: () => void;
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      entries: {},
      cleared: {},

      ensure: (list) =>
        set((s) => {
          let changed = false;
          const entries = { ...s.entries };
          for (const { date, dayIndex } of list) {
            if (entries[date] || s.cleared[date] || dayIndex == null) continue;
            entries[date] = { date, dayIndex, status: "planned" };
            changed = true;
          }
          return changed ? { entries } : {};
        }),

      setStatus: (date, status) =>
        set((s) => {
          const e = s.entries[date];
          if (!e) return {};
          return { entries: { ...s.entries, [date]: { ...e, status } } };
        }),

      move: (from, to) =>
        set((s) => {
          const e = s.entries[from];
          if (!e || from === to) return {};
          const entries = { ...s.entries };
          delete entries[from];
          entries[to] = { date: to, dayIndex: e.dayIndex, status: "planned" };
          return {
            entries,
            cleared: { ...s.cleared, [from]: true },
          };
        }),

      assign: (date, dayIndex) =>
        set((s) => {
          const cleared = { ...s.cleared };
          delete cleared[date];
          return {
            entries: {
              ...s.entries,
              [date]: { date, dayIndex, status: "planned" },
            },
            cleared,
          };
        }),

      makeRest: (date) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[date];
          return { entries, cleared: { ...s.cleared, [date]: true } };
        }),

      reset: () => set({ entries: {}, cleared: {} }),
    }),
    { name: "jym-schedule", version: 1 }
  )
);
