import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-container";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getProfile } from "@/lib/queries";
import { planForProfile } from "@/lib/plan";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const profile = await getProfile();
  if (!profile) redirect("/onboarding");

  const plan = planForProfile(profile);

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Your training schedule — move, skip or reschedule any session."
      />
      <CalendarView plan={plan} />
    </PageContainer>
  );
}
