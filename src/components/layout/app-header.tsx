import Link from "next/link";
import { ScanLine } from "lucide-react";

import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { Profile } from "@/types";

export function AppHeader({
  profile,
  email,
}: {
  profile: Profile | null;
  email?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="lg:hidden">
        <Wordmark />
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1.5">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Scan a machine"
        >
          <Link href="/scan">
            <ScanLine className="size-5" />
          </Link>
        </Button>
        <ThemeToggle />
        <UserMenu
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          email={email}
          avatarUrl={profile?.avatar_url}
        />
      </div>
    </header>
  );
}
