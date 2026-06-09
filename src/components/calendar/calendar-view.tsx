"use client";

import * as React from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MoveRight,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Sofa,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlanDayCard } from "@/components/plan/day-card";
import { useScheduleStore } from "@/stores/schedule-store";
import {
  defaultDayIndex,
  isoDate,
  monthGrid,
  STATUS_META,
  WEEKDAY_LABELS,
  weekDates,
  type ScheduleEntry,
} from "@/lib/schedule";
import type { WorkoutPlan } from "@/types";
import { cn } from "@/lib/utils";

type View = "month" | "week" | "day";

export function CalendarView({ plan }: { plan: WorkoutPlan }) {
  const [view, setView] = React.useState<View>("month");
  const [cursor, setCursor] = React.useState<Date>(() => new Date());
  const [mounted, setMounted] = React.useState(false);
  const [moveFrom, setMoveFrom] = React.useState<string | null>(null);

  const { entries, ensure, setStatus, move, assign, makeRest } =
    useScheduleStore();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  // Lazily materialise default sessions for the visible range.
  const visible = React.useMemo(() => {
    if (view === "month") return monthGrid(cursor);
    if (view === "week") return weekDates(cursor);
    return [cursor];
  }, [view, cursor]);

  React.useEffect(() => {
    ensure(
      visible.map((d) => ({
        date: isoDate(d),
        dayIndex: defaultDayIndex(d, plan.days_per_week),
      }))
    );
  }, [visible, ensure, plan.days_per_week]);

  const entryFor = (d: Date): ScheduleEntry | undefined => {
    const e = entries[isoDate(d)];
    if (e && e.dayIndex < plan.days.length) return e;
    return undefined;
  };

  const title =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
        ? `${format(weekDates(cursor)[0], "MMM d")} – ${format(
            weekDates(cursor)[6],
            "MMM d"
          )}`
        : format(cursor, "EEEE, MMMM d");

  const shift = (dir: 1 | -1) =>
    setCursor((c) =>
      view === "month"
        ? addMonths(c, dir)
        : addDays(c, dir * (view === "week" ? 7 : 1))
    );

  if (!mounted) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <h2 className="ml-1 text-lg font-semibold">{title}</h2>
        </div>
        <div className="inline-flex rounded-lg border p-1">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <MonthView
          plan={plan}
          cursor={cursor}
          entryFor={entryFor}
          onPick={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      )}
      {view === "week" && (
        <WeekView
          plan={plan}
          cursor={cursor}
          entryFor={entryFor}
          onStatus={setStatus}
          onMove={setMoveFrom}
          onRest={makeRest}
          onAssign={assign}
        />
      )}
      {view === "day" && (
        <DayView
          plan={plan}
          date={cursor}
          entry={entryFor(cursor)}
          onStatus={setStatus}
          onMove={setMoveFrom}
          onRest={makeRest}
          onAssign={assign}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["planned", "completed", "skipped"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>

      <MoveDialog
        key={moveFrom ?? "none"}
        plan={plan}
        from={moveFrom}
        onClose={() => setMoveFrom(null)}
        onConfirm={(from, to) => {
          move(from, to);
          setMoveFrom(null);
        }}
      />
    </div>
  );
}

// ── Month ───────────────────────────────────────────────────────────────--
function MonthView({
  plan,
  cursor,
  entryFor,
  onPick,
}: {
  plan: WorkoutPlan;
  cursor: Date;
  entryFor: (d: Date) => ScheduleEntry | undefined;
  onPick: (d: Date) => void;
}) {
  const days = monthGrid(cursor);
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const entry = entryFor(d);
          const inMonth = isSameMonth(d, cursor);
          const today = isToday(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPick(d)}
              className={cn(
                "flex min-h-16 flex-col gap-1 border-b border-r p-1.5 text-left transition-colors hover:bg-accent/40 sm:min-h-24",
                !inMonth && "bg-muted/20 text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs",
                  today && "bg-primary font-bold text-primary-foreground"
                )}
              >
                {format(d, "d")}
              </span>
              {entry && (
                <span
                  className={cn(
                    "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:text-xs",
                    entry.status === "completed" &&
                      "bg-primary/15 text-primary",
                    entry.status === "planned" && "bg-primary/10 text-primary",
                    entry.status === "skipped" &&
                      "bg-muted text-muted-foreground line-through"
                  )}
                >
                  {entry.status === "completed" ? "✓ " : ""}
                  {plan.days[entry.dayIndex].name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Shared actions ───────────────────────────────────────────────────────--
function ActionsBar({
  plan,
  dateISO,
  entry,
  onStatus,
  onMove,
  onRest,
  onAssign,
}: {
  plan: WorkoutPlan;
  dateISO: string;
  entry?: ScheduleEntry;
  onStatus: (date: string, status: ScheduleEntry["status"]) => void;
  onMove: (from: string) => void;
  onRest: (date: string) => void;
  onAssign: (date: string, dayIndex: number) => void;
}) {
  if (!entry) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="size-4" /> Add session
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {plan.days.map((d) => (
            <DropdownMenuItem key={d.index} onSelect={() => onAssign(dateISO, d.index)}>
              {d.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {entry.status !== "completed" && (
        <Button size="sm" asChild>
          <Link href={`/session/${entry.dayIndex}`}>
            <Play className="size-3.5 fill-current" /> Start
          </Link>
        </Button>
      )}
      {entry.status === "completed" ? (
        <Button size="sm" variant="outline" onClick={() => onStatus(dateISO, "planned")}>
          <RotateCcw className="size-3.5" /> Undo
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => onStatus(dateISO, "completed")}>
          <Check className="size-3.5" /> Done
        </Button>
      )}
      {entry.status === "skipped" ? (
        <Button size="sm" variant="ghost" onClick={() => onStatus(dateISO, "planned")}>
          <RotateCcw className="size-3.5" /> Unskip
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => onStatus(dateISO, "skipped")}>
          <SkipForward className="size-3.5" /> Skip
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={() => onMove(dateISO)}>
        <MoveRight className="size-3.5" /> Move
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onRest(dateISO)} aria-label="Make rest day">
        <Sofa className="size-3.5" /> Rest
      </Button>
    </div>
  );
}

// ── Week ────────────────────────────────────────────────────────────────--
function WeekView({
  plan,
  cursor,
  entryFor,
  onStatus,
  onMove,
  onRest,
  onAssign,
}: {
  plan: WorkoutPlan;
  cursor: Date;
  entryFor: (d: Date) => ScheduleEntry | undefined;
  onStatus: (date: string, status: ScheduleEntry["status"]) => void;
  onMove: (from: string) => void;
  onRest: (date: string) => void;
  onAssign: (date: string, dayIndex: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {weekDates(cursor).map((d) => {
        const entry = entryFor(d);
        const day = entry ? plan.days[entry.dayIndex] : null;
        return (
          <Card
            key={d.toISOString()}
            className={cn(
              "flex-row items-center justify-between gap-3 p-4",
              isToday(d) && "border-primary/40"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 shrink-0 text-center">
                <p className="text-xs uppercase text-muted-foreground">
                  {format(d, "EEE")}
                </p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    isToday(d) && "text-primary"
                  )}
                >
                  {format(d, "d")}
                </p>
              </div>
              <div>
                {day ? (
                  <>
                    <p
                      className={cn(
                        "font-semibold",
                        entry?.status === "skipped" &&
                          "text-muted-foreground line-through"
                      )}
                    >
                      {day.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{day.focus}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Rest day</p>
                )}
              </div>
            </div>
            <ActionsBar
              plan={plan}
              dateISO={isoDate(d)}
              entry={entry}
              onStatus={onStatus}
              onMove={onMove}
              onRest={onRest}
              onAssign={onAssign}
            />
          </Card>
        );
      })}
    </div>
  );
}

// ── Day ─────────────────────────────────────────────────────────────────--
function DayView({
  plan,
  date,
  entry,
  onStatus,
  onMove,
  onRest,
  onAssign,
}: {
  plan: WorkoutPlan;
  date: Date;
  entry?: ScheduleEntry;
  onStatus: (date: string, status: ScheduleEntry["status"]) => void;
  onMove: (from: string) => void;
  onRest: (date: string) => void;
  onAssign: (date: string, dayIndex: number) => void;
}) {
  const dateISO = isoDate(date);
  const day = entry ? plan.days[entry.dayIndex] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {entry && (
            <Badge
              variant={entry.status === "skipped" ? "secondary" : "success"}
            >
              {STATUS_META[entry.status].label}
            </Badge>
          )}
        </div>
        <ActionsBar
          plan={plan}
          dateISO={dateISO}
          entry={entry}
          onStatus={onStatus}
          onMove={onMove}
          onRest={onRest}
          onAssign={onAssign}
        />
      </div>

      {day ? (
        <PlanDayCard day={day} startHref={`/session/${day.index}`} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sofa className="size-10 text-muted-foreground" />
            <p className="font-medium">Rest day</p>
            <p className="text-sm text-muted-foreground">
              Recover, walk, or add a session if you&apos;re feeling good.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Move dialog ──────────────────────────────────────────────────────────--
function MoveDialog({
  plan,
  from,
  onClose,
  onConfirm,
}: {
  plan: WorkoutPlan;
  from: string | null;
  onClose: () => void;
  onConfirm: (from: string, to: string) => void;
}) {
  const [to, setTo] = React.useState(() =>
    from ? isoDate(addDays(parseISO(from), 1)) : ""
  );

  const day =
    from && useScheduleStore.getState().entries[from]
      ? plan.days[useScheduleStore.getState().entries[from].dayIndex]
      : null;

  return (
    <Dialog open={!!from} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Move {day ? day.name : "session"}
            {from ? ` from ${format(parseISO(from), "MMM d")}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <label htmlFor="move-to" className="text-sm font-medium">
            New date
          </label>
          <Input
            id="move-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!from || !to}
            onClick={() => from && to && onConfirm(from, to)}
          >
            <MoveRight className="size-4" /> Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
