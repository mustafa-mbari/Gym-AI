import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

/** Small flame chip for the Today hub header. */
export function StreakChip({ days }: { days: number }) {
  const active = days > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border text-muted-foreground"
      )}
      title="Consecutive days checked in"
    >
      <Flame className={cn("size-4", active && "fill-current")} />
      {days} day{days === 1 ? "" : "s"}
    </span>
  );
}
