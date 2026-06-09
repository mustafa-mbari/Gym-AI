"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { EQUIPMENT } from "@/data";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "All" },
  ...EQUIPMENT_CATEGORIES,
] as const;

export function EquipmentBrowser() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return EQUIPMENT.filter((e) => {
      const matchCat = category === "all" || e.category === category;
      const matchQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.muscle_groups.some((m) => m.includes(q));
      return matchCat && matchQuery;
    });
  }, [query, category]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search machines…"
          className="pl-9"
        />
      </div>

      <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c.value
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-accent"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No machines match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <EquipmentCard key={item.slug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
