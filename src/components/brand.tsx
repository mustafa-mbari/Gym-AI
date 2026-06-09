import Link from "next/link";

import { cn } from "@/lib/utils";

/** The JYM logo mark — a stylised dumbbell in the brand emerald. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M14.4 14.4 9.6 9.6" />
        <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
        <path d="m21.5 21.5-1.4-1.4" />
        <path d="M3.9 3.9 2.5 2.5" />
        <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
      </svg>
    </span>
  );
}

export function Wordmark({
  className,
  href = "/",
  showMark = true,
}: {
  className?: string;
  href?: string;
  showMark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 font-semibold", className)}
    >
      {showMark && <Logo />}
      <span className="text-xl font-bold tracking-tight">
        JYM
        <span className="text-primary">.</span>
      </span>
    </Link>
  );
}
