import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarRange,
  Dumbbell,
  Lightbulb,
  PartyPopper,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-container";
import { PlanDayCard } from "@/components/plan/day-card";
import { AdaptationBanner } from "@/components/plan/adaptation-banner";
import { getCompanionData } from "@/lib/queries";
import { goalLabel } from "@/lib/labels";
import { TRAINING_EXPERIENCES } from "@/lib/constants";

export const metadata: Metadata = { title: "My Plan" };

const experienceLabel = (k?: string | null) =>
  TRAINING_EXPERIENCES.find((e) => e.value === k)?.label ?? k ?? "";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const data = await getCompanionData();

  if (!data) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-10 text-primary" />
            <h2 className="text-xl font-semibold">No plan yet</h2>
            <p className="text-muted-foreground">
              Complete onboarding to generate your personalised plan.
            </p>
            <Button size="lg" asChild>
              <Link href="/onboarding">Build my plan</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const { plan, adaptation } = data;

  return (
    <PageContainer>
      <AdaptationBanner adaptation={adaptation} />
      {welcome && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <PartyPopper className="mt-0.5 size-6 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">Your personalised plan is ready!</p>
            <p className="text-sm text-muted-foreground">
              Built from your goals, equipment and schedule. Start your first
              session whenever you&apos;re ready.
            </p>
          </div>
        </div>
      )}

      <PageHeader title={plan.name} description={plan.summary}>
        <Button variant="outline" asChild>
          <Link href="/onboarding">
            <Sparkles className="size-4" /> Rebuild
          </Link>
        </Button>
        <Button asChild>
          <Link href="/workouts">
            <Dumbbell className="size-4" /> Start training
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="success" className="gap-1.5">
          <CalendarRange className="size-3.5" />
          {plan.days_per_week} days / week
        </Badge>
        <Badge variant="secondary">{goalLabel(plan.goal)}</Badge>
        <Badge variant="secondary">{experienceLabel(plan.experience)}</Badge>
        <Badge variant="secondary">{plan.weeks}-week block</Badge>
        <Badge variant="outline">~{plan.session_minutes} min / session</Badge>
      </div>

      {/* Coaching guidance */}
      <Card className="mb-6">
        <CardHeader className="flex-row items-center gap-2">
          <Lightbulb className="size-5 text-primary" />
          <CardTitle>Coach&apos;s notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {plan.guidance.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Days */}
      <div className="grid gap-5 lg:grid-cols-2">
        {plan.days.map((day) => (
          <PlanDayCard
            key={day.index}
            day={day}
            startHref={`/session/${day.index}`}
          />
        ))}
      </div>
    </PageContainer>
  );
}
