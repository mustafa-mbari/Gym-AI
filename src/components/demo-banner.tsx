import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
      <Info className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="font-medium">You&apos;re exploring JYM in demo mode.</p>
        <p className="mt-0.5 text-muted-foreground">
          Everything is interactive with sample data. Connect a Supabase project
          (see <code className="rounded bg-muted px-1">.env.example</code>) to
          enable real accounts and saving.
        </p>
      </div>
    </div>
  );
}
