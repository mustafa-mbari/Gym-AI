"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { submitCheckin } from "@/lib/checkin-actions";
import { readinessScore } from "@/lib/adapt/signals";
import { isoDay } from "@/lib/dates";
import { kgToLb, lbToKg } from "@/lib/fitness";
import { weightUnit } from "@/lib/format";
import { FEEL_OPTIONS, MOOD_OPTIONS } from "@/lib/constants";
import type { DailyCheckin, Feel, Mood, UnitSystem } from "@/types";

const SCALES: Array<{
  key: "energy" | "sleep" | "soreness";
  label: string;
  low: string;
  high: string;
}> = [
  { key: "energy", label: "Energy", low: "Drained", high: "Charged" },
  { key: "sleep", label: "Sleep quality", low: "Rough", high: "Great" },
  { key: "soreness", label: "Muscle soreness", low: "None", high: "Very sore" },
];

export function CheckinCard({
  checkin,
  unit,
}: {
  checkin: DailyCheckin | null;
  unit: UnitSystem;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [feel, setFeel] = React.useState<Feel>(checkin?.feel ?? "good");
  const [scales, setScales] = React.useState({
    energy: checkin?.energy ?? 6,
    sleep: checkin?.sleep ?? 6,
    soreness: checkin?.soreness ?? 3,
  });
  const [mood, setMood] = React.useState<Mood | null>(checkin?.mood ?? null);
  const [weight, setWeight] = React.useState(() =>
    checkin?.weight_kg != null
      ? String(
          unit === "imperial"
            ? +kgToLb(checkin.weight_kg).toFixed(1)
            : checkin.weight_kg
        )
      : ""
  );

  async function save() {
    let weight_kg: number | null = null;
    if (weight.trim() !== "") {
      const num = Number(weight);
      if (Number.isNaN(num)) {
        toast.error("Weight doesn't look like a number.");
        return;
      }
      weight_kg = +(unit === "imperial" ? lbToKg(num) : num).toFixed(1);
    }

    setPending(true);
    const res = await submitCheckin({
      date: isoDay(new Date()),
      feel,
      ...scales,
      mood,
      weight_kg,
    });
    setPending(false);
    if (res.ok) {
      toast.success(checkin ? "Check-in updated." : "Checked in — nice one!");
      setEditing(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not save your check-in.");
    }
  }

  // Compact confirmation once today's check-in exists.
  if (checkin && !editing) {
    const readiness = readinessScore(checkin);
    return (
      <Card className="border-primary/30">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <p className="text-sm">
              <span className="font-semibold">Checked in</span>
              <span className="text-muted-foreground">
                {" "}
                · feeling {checkin.feel} · readiness{" "}
              </span>
              <span className="font-semibold">{readiness}</span>
              <span className="text-muted-foreground">/100</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Edit today's check-in"
          >
            <Pencil className="size-4" /> Edit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle>Daily check-in</CardTitle>
        <p className="text-sm text-muted-foreground">
          30 seconds — it tunes today&apos;s coaching and next week&apos;s plan.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Feel */}
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="How do you feel today?">
          {FEEL_OPTIONS.map((opt) => {
            const selected = feel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setFeel(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-xs font-medium transition-all outline-none",
                  "hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                <Icon
                  name={opt.icon}
                  className={cn("size-5", selected && "text-primary")}
                />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Sliders */}
        <div className="grid gap-4">
          {SCALES.map((s) => (
            <div key={s.key} className="grid gap-1.5">
              <div className="flex items-baseline justify-between">
                <Label className="text-sm">{s.label}</Label>
                <span className="text-sm font-semibold tabular-nums">
                  {scales[s.key]}/10
                </span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[scales[s.key]]}
                onValueChange={([v]) =>
                  setScales((prev) => ({ ...prev, [s.key]: v }))
                }
                aria-label={s.label}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{s.low}</span>
                <span>{s.high}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Optional extras */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="checkin-weight" className="text-xs">
              Weight ({weightUnit(unit)}) — optional
            </Label>
            <Input
              id="checkin-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Mood — optional</Label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_OPTIONS.map((opt) => {
                const selected = mood === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMood(selected ? null : opt.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {checkin && (
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          )}
          <Button onClick={save} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {checkin ? "Update check-in" : "Check in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
