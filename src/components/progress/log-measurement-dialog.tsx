"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveMeasurement } from "@/lib/profile-actions";
import { lbToKg } from "@/lib/fitness";
import { lengthUnit, weightUnit } from "@/lib/format";
import type { MeasurementInput } from "@/lib/validations";
import type { UnitSystem } from "@/types";

type FieldKind = "weight" | "pct" | "length";
const FIELDS: Array<{ key: keyof MeasurementInput; label: string; kind: FieldKind }> = [
  { key: "weight_kg", label: "Weight", kind: "weight" },
  { key: "body_fat_pct", label: "Body fat", kind: "pct" },
  { key: "waist_cm", label: "Waist", kind: "length" },
  { key: "chest_cm", label: "Chest", kind: "length" },
  { key: "arms_cm", label: "Arms", kind: "length" },
  { key: "legs_cm", label: "Legs", kind: "length" },
  { key: "shoulders_cm", label: "Shoulders", kind: "length" },
  { key: "neck_cm", label: "Neck", kind: "length" },
];

export function LogMeasurementDialog({ unit }: { unit: UnitSystem }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [notes, setNotes] = React.useState("");

  function suffix(kind: FieldKind) {
    if (kind === "pct") return "%";
    if (kind === "weight") return weightUnit(unit);
    return lengthUnit(unit);
  }

  function toCanonical(kind: FieldKind, v: number): number {
    if (kind === "weight") return unit === "imperial" ? lbToKg(v) : v;
    if (kind === "length") return unit === "imperial" ? v * 2.54 : v;
    return v;
  }

  async function submit() {
    const payload: Record<string, number | string | null> = { notes };
    let any = false;
    for (const f of FIELDS) {
      const raw = values[f.key];
      if (raw === undefined || raw === "") continue;
      const num = Number(raw);
      if (Number.isNaN(num)) continue;
      payload[f.key] = +toCanonical(f.kind, num).toFixed(1);
      any = true;
    }
    if (!any) {
      toast.error("Enter at least one measurement.");
      return;
    }

    setPending(true);
    const res = await saveMeasurement(payload as MeasurementInput);
    setPending(false);
    if (res.ok) {
      toast.success(
        res.demo ? "Logged (demo — not persisted)." : "Measurement saved!"
      );
      setOpen(false);
      setValues({});
      setNotes("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not save.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Log measurement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a measurement</DialogTitle>
          <DialogDescription>
            Record today&apos;s numbers. Fill in whatever you have.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={f.key} className="text-xs">
                {f.label} ({suffix(f.kind)})
              </Label>
              <Input
                id={f.key}
                type="number"
                inputMode="decimal"
                step="0.1"
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notes" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling?"
            className="min-h-16"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
