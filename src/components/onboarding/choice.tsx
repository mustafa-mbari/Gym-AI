"use client";

import { Check } from "lucide-react";

import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

type BaseProps<T extends string> = {
  options: readonly ChoiceOption<T>[];
  columns?: 1 | 2 | 3;
  className?: string;
};

type SingleProps<T extends string> = BaseProps<T> & {
  multi?: false;
  value: T;
  onChange: (value: T) => void;
};

type MultiProps<T extends string> = BaseProps<T> & {
  multi: true;
  value: T[];
  onChange: (value: T[]) => void;
};

/**
 * A grid of large, tappable option cards. Doubles as a radio group (single)
 * or checkbox group (multi). Designed for big mobile touch targets.
 */
export function ChoiceGroup<T extends string>(
  props: SingleProps<T> | MultiProps<T>
) {
  const { options, columns = 2, className } = props;

  const isSelected = (v: T) =>
    props.multi ? props.value.includes(v) : props.value === v;

  function toggle(v: T) {
    if (props.multi) {
      const arr = props.value;
      props.onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      props.onChange(v);
    }
  }

  return (
    <div
      role={props.multi ? "group" : "radiogroup"}
      className={cn(
        "grid gap-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        className
      )}
    >
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role={props.multi ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() => toggle(opt.value)}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all outline-none",
              "hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            {opt.icon && (
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Icon name={opt.icon} className="size-5" />
              </span>
            )}
            <span className="flex-1">
              <span className="block font-semibold leading-tight">
                {opt.label}
              </span>
              {opt.description && (
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {opt.description}
                </span>
              )}
            </span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center border-2 transition-all",
                props.multi ? "rounded-md" : "rounded-full",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {selected && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
