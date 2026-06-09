import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-container";
import { SettingsForm } from "@/components/settings/settings-form";
import { getProfile } from "@/lib/queries";
import { getServerUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/onboarding");

  const user = await getServerUser();

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your profile, training preferences and appearance."
      />
      <SettingsForm
        profile={profile}
        email={user?.email}
        demo={!isSupabaseConfigured}
      />
    </PageContainer>
  );
}
