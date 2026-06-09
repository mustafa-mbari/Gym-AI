"use client";

import * as React from "react";
import { Quote } from "lucide-react";

/**
 * The daily motivation line. Renders the deterministic message immediately,
 * then quietly upgrades to a personalised one-liner from the coach API when
 * an Anthropic key is configured (no layout shift, demo-safe).
 */
export function MotivationLine({ fallback }: { fallback: string }) {
  const [message, setMessage] = React.useState(fallback);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/daily-message")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { message?: string | null } | null) => {
        if (!cancelled && data?.message) setMessage(data.message);
      })
      .catch(() => {
        // keep the deterministic line
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <figure className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <Quote className="size-5 shrink-0 text-primary" />
      <blockquote className="text-sm italic text-muted-foreground">
        {message}
      </blockquote>
    </figure>
  );
}
