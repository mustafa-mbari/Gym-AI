"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TZ_COOKIE } from "@/lib/dates";

export function Providers({ children }: { children: React.ReactNode }) {
  // Let server components resolve the user's local calendar day.
  useEffect(() => {
    document.cookie = `${TZ_COOKIE}=${new Date().getTimezoneOffset()}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
}
