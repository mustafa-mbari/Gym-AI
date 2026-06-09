import Link from "next/link";
import { Dumbbell, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Wordmark href="/" />
      <span className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Dumbbell className="size-9" />
      </span>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          We couldn&apos;t find that page. It may have moved, or the machine code
          doesn&apos;t exist.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard">
            <Home className="size-4" /> Go to dashboard
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/equipment">Browse equipment</Link>
        </Button>
      </div>
    </div>
  );
}
