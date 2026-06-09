import { BatteryLow, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import type { AdaptationState } from "@/types";

function bannerMeta(adaptation: AdaptationState) {
  if (adaptation.deload)
    return { icon: BatteryLow, title: "Deload week" };
  if (adaptation.flags.includes("volume_up"))
    return { icon: TrendingUp, title: "Volume nudged up this week" };
  if (
    adaptation.flags.includes("volume_down") ||
    adaptation.flags.includes("extra_recovery")
  )
    return { icon: TrendingDown, title: "Lighter week" };
  return { icon: Sparkles, title: "This week's adjustments" };
}

/** Explains how (and why) this week's plan differs from the base program. */
export function AdaptationBanner({
  adaptation,
}: {
  adaptation: AdaptationState | null | undefined;
}) {
  if (!adaptation || adaptation.reasons.length === 0) return null;
  const { icon: Icon, title } = bannerMeta(adaptation);

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="font-semibold">{title}</p>
        <ul className="mt-1 grid gap-1 text-sm text-muted-foreground">
          {adaptation.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
