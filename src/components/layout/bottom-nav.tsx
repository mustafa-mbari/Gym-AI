"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine } from "lucide-react";

import { MOBILE_NAV_ITEMS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Floating scan button */}
      <Link
        href="/scan"
        aria-label="Scan a machine"
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 lg:hidden"
      >
        <ScanLine className="size-6" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-safe lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn("size-5", active && "scale-110")}
                  strokeWidth={active ? 2.4 : 2}
                />
                {item.mobileLabel ?? item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
