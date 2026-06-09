import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Stable string hash → used to pick a deterministic gradient. */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * A branded gradient tile used in place of real photography (catalog images
 * are null by default). Looks intentional, never broken, and needs no network.
 */
export function MediaPlaceholder({
  seed,
  icon = "Dumbbell",
  className,
  iconClassName,
}: {
  seed: string;
  icon?: string;
  className?: string;
  iconClassName?: string;
}) {
  const h = hash(seed);
  // Bias hues toward the emerald→teal→blue end for brand cohesion.
  const hue1 = 140 + (h % 80); // 140–220
  const hue2 = 150 + ((h >> 3) % 110); // 150–260
  const angle = 110 + (h % 60);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, hsl(${hue1} 62% 42%), hsl(${hue2} 58% 30%))`,
      }}
    >
      {/* subtle grid texture */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <Icon
        name={icon}
        className={cn("relative size-1/3 text-white/85", iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}
