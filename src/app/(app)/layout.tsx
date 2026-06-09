import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile } from "@/lib/queries";
import { getServerUser } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  // Authenticated but hasn't finished onboarding yet → send them to it.
  if (isSupabaseConfigured && (!profile || !profile.onboarding_completed)) {
    redirect("/onboarding");
  }

  const user = await getServerUser();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <AppHeader profile={profile} email={user?.email} />
        <main className="flex-1 pb-24 lg:pb-10">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
