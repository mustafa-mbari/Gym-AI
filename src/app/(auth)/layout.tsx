import Link from "next/link";
import { ArrowLeft, Dumbbell, LineChart, ScanLine } from "lucide-react";

import { Wordmark } from "@/components/brand";

const HIGHLIGHTS = [
  { icon: Dumbbell, text: "A personalised plan in minutes" },
  { icon: ScanLine, text: "Scan machines & start instantly" },
  { icon: LineChart, text: "Track every kilo and rep" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <Wordmark href="/" className="relative text-primary-foreground" />
        <div className="relative space-y-6">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            Your personal trainer, planner and progress tracker — in one app.
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                  <h.icon className="size-5" />
                </span>
                <span className="text-primary-foreground/90">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Train smarter. Lose weight. Build muscle.
        </p>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Home
          </Link>
          <div className="lg:hidden">
            <Wordmark showMark />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
