"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  cmToFtIn,
  inToCm,
  kgToLb,
  lbToKg,
} from "@/lib/fitness";
import type { UnitSystem } from "@/types";
import { cn } from "@/lib/utils";

export function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  hint,
  error,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  error?: string;
  placeholder?: string;
}) {
  const id = React.useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          className={cn(suffix && "pr-12")}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <FieldShell label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label="Decrease"
        >
          <Minus className="size-4" />
        </Button>
        <div className="flex h-11 flex-1 items-center justify-center rounded-md border bg-muted/40 text-lg font-semibold tabular-nums">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label="Increase"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </FieldShell>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <FieldShell
      label={label}
      className="gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </FieldShell>
  );
}

/** Weight input that stores canonical kg but displays the user's unit. */
export function WeightField({
  label,
  valueKg,
  onChange,
  unit,
  error,
}: {
  label: string;
  valueKg: number;
  onChange: (kg: number) => void;
  unit: UnitSystem;
  error?: string;
}) {
  const display =
    unit === "imperial" ? Math.round(kgToLb(valueKg)) : Math.round(valueKg);

  return (
    <NumberField
      label={label}
      value={display}
      suffix={unit === "imperial" ? "lb" : "kg"}
      error={error}
      onChange={(v) => {
        if (v === null) return;
        onChange(unit === "imperial" ? lbToKg(v) : v);
      }}
    />
  );
}

/** A body-measurement field storing canonical cm, displayed in cm or inches. */
export function LengthField({
  label,
  valueCm,
  onChange,
  unit,
  placeholder,
}: {
  label: string;
  valueCm: number | null;
  onChange: (cm: number | null) => void;
  unit: UnitSystem;
  placeholder?: string;
}) {
  const imperial = unit === "imperial";
  const display =
    valueCm === null ? null : imperial ? +(valueCm / 2.54).toFixed(1) : +valueCm.toFixed(1);
  return (
    <NumberField
      label={label}
      value={display}
      suffix={imperial ? "in" : "cm"}
      step={0.5}
      placeholder={placeholder}
      onChange={(v) =>
        onChange(v === null ? null : imperial ? +(v * 2.54).toFixed(1) : v)
      }
    />
  );
}

/** Height input — single cm field (metric) or ft/in pair (imperial). */
export function HeightField({
  valueCm,
  onChange,
  unit,
  error,
}: {
  valueCm: number;
  onChange: (cm: number) => void;
  unit: UnitSystem;
  error?: string;
}) {
  if (unit === "imperial") {
    const { ft, in: inches } = cmToFtIn(valueCm);
    return (
      <FieldShell label="Height" error={error}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="number"
              inputMode="numeric"
              value={ft}
              min={3}
              max={8}
              onChange={(e) =>
                onChange(inToCm(Number(e.target.value) * 12 + inches))
              }
              className="pr-9"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              ft
            </span>
          </div>
          <div className="relative flex-1">
            <Input
              type="number"
              inputMode="numeric"
              value={inches}
              min={0}
              max={11}
              onChange={(e) =>
                onChange(inToCm(ft * 12 + Number(e.target.value)))
              }
              className="pr-9"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              in
            </span>
          </div>
        </div>
      </FieldShell>
    );
  }

  return (
    <NumberField
      label="Height"
      value={Math.round(valueCm)}
      suffix="cm"
      error={error}
      onChange={(v) => v !== null && onChange(v)}
    />
  );
}
