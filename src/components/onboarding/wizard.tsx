"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  StepBody,
  StepFitness,
  StepGoals,
  StepHealth,
  StepLifestyle,
  StepNutrition,
  StepPersonal,
} from "@/components/onboarding/steps";
import { useOnboardingStore, TOTAL_STEPS } from "@/stores/onboarding-store";
import { onboardingSchema, STEP_FIELDS } from "@/lib/validations";
import { saveOnboarding } from "@/lib/profile-actions";

const STEPS = [
  {
    title: "About you",
    subtitle: "The basics so we can personalise everything.",
    Body: StepPersonal,
  },
  {
    title: "Your training setup",
    subtitle: "Experience and the equipment you can use.",
    Body: StepFitness,
  },
  {
    title: "Goals & schedule",
    subtitle: "What you want and how often you can train.",
    Body: StepGoals,
  },
  {
    title: "Body measurements",
    subtitle: "Optional — for richer progress tracking.",
    Body: StepBody,
  },
  {
    title: "Lifestyle",
    subtitle: "Activity and sleep shape your recovery.",
    Body: StepLifestyle,
  },
  {
    title: "Nutrition",
    subtitle: "How you eat supports your goal.",
    Body: StepNutrition,
  },
  {
    title: "Health & safety",
    subtitle: "We'll train around any limitations.",
    Body: StepHealth,
  },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { step, data, next, back, setStep, reset } = useOnboardingStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Hydration guard for the persisted Zustand store — intentional mount flag.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  function validate(stepIndex: number): Record<string, string> {
    const fields = STEP_FIELDS[stepIndex] as readonly string[];
    if (!fields.length) return {};
    const res = onboardingSchema.safeParse(data);
    if (res.success) return {};
    const out: Record<string, string> = {};
    for (const issue of res.error.issues) {
      const key = String(issue.path[0]);
      if (fields.includes(key) && !out[key]) out[key] = issue.message;
    }
    return out;
  }

  function handleNext() {
    const errs = validate(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    next();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setErrors({});
    back();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinish() {
    const res = onboardingSchema.safeParse(data);
    if (!res.success) {
      // Jump to the first step containing an invalid field.
      const badField = String(res.error.issues[0]?.path[0] ?? "");
      const badStep = STEP_FIELDS.findIndex((f) =>
        (f as readonly string[]).includes(badField)
      );
      if (badStep >= 0) {
        setStep(badStep);
        setErrors(validate(badStep));
      }
      toast.error("Some answers need a quick fix.");
      return;
    }

    setSubmitting(true);
    const result = await saveOnboarding(res.data);
    if (result.ok) {
      toast.success("Your plan is ready! 🎉");
      reset();
      router.push("/plan?welcome=1");
    } else {
      setSubmitting(false);
      toast.error(result.error ?? "Something went wrong. Please try again.");
    }
  }

  const isLast = step === TOTAL_STEPS - 1;
  const current = STEPS[step];
  const Body = current.Body;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <ThemeToggle />
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {current.title}
          </h1>
          <p className="mt-1 text-muted-foreground">{current.subtitle}</p>
        </div>

        {mounted ? (
          <div key={step} className="animate-in fade-in-50 duration-300">
            <Body errors={errors} />
          </div>
        ) : (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        )}
      </main>

      <footer className="sticky bottom-0 border-t bg-background/90 backdrop-blur pb-safe">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {isLast ? (
            <Button size="lg" onClick={handleFinish} disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Build my plan
            </Button>
          ) : (
            <Button size="lg" onClick={handleNext} disabled={submitting}>
              Continue <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
