"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { onboardingDefaults, type OnboardingData } from "@/lib/validations";

export const TOTAL_STEPS = 7;

interface OnboardingStore {
  step: number;
  data: OnboardingData;
  setStep: (n: number) => void;
  next: () => void;
  back: () => void;
  update: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
}

/** Wizard state, persisted to localStorage so progress survives refreshes. */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 0,
      data: onboardingDefaults,
      setStep: (n) =>
        set({ step: Math.max(0, Math.min(TOTAL_STEPS - 1, n)) }),
      next: () => set((s) => ({ step: Math.min(TOTAL_STEPS - 1, s.step + 1) })),
      back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
      reset: () => set({ step: 0, data: onboardingDefaults }),
    }),
    { name: "jym-onboarding", version: 1 }
  )
);
