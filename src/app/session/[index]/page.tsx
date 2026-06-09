import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { WorkoutSession } from "@/components/workout/workout-session";
import { getCompanionData, getLastLoggedSets } from "@/lib/queries";

export const metadata: Metadata = { title: "Workout session" };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  const { index } = await params;
  const [data, lastSets] = await Promise.all([
    getCompanionData(),
    getLastLoggedSets(),
  ]);
  if (!data) redirect("/onboarding");

  // The adapted plan, so logged sets match what the member sees this week.
  const day = data.plan.days[Number(index)];
  if (!day) notFound();

  return (
    <WorkoutSession
      day={day}
      unit={data.profile.unit_system}
      lastSets={lastSets}
    />
  );
}
