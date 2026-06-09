import type { Metadata } from "next";

import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = {
  title: "Build your plan",
  description: "Tell JYM about your goals to generate a personalised plan.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
