import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-container";
import { CoachChat } from "@/components/coach/coach-chat";
import { isCoachEnabled } from "@/lib/coach";

export const metadata: Metadata = { title: "Coach" };

export default function CoachPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="AI Coach"
        description="Chat with a personal trainer that knows your plan and goals."
      />
      <CoachChat enabled={isCoachEnabled} />
    </PageContainer>
  );
}
