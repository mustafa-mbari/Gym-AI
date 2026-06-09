import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { WorkoutSession } from "@/components/workout/workout-session";
import { getProfile } from "@/lib/queries";
import { planForProfile } from "@/lib/plan";

export const metadata: Metadata = { title: "Workout session" };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  const { index } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/onboarding");

  const plan = planForProfile(profile);
  const day = plan.days[Number(index)];
  if (!day) notFound();

  return <WorkoutSession day={day} unit={profile.unit_system} />;
}
