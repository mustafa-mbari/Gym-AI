import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CatalogMedia } from "@/components/catalog-media";
import { categoryLabel, difficultyLabel, difficultyTone } from "@/lib/labels";
import type { Equipment } from "@/types";

export const CATEGORY_ICON: Record<string, string> = {
  chest: "Shield",
  back: "Shield",
  shoulders: "Shield",
  arms: "Dumbbell",
  legs: "Footprints",
  core: "Hexagon",
  glutes: "Footprints",
  cardio: "HeartPulse",
  functional: "Cable",
  free_weights: "Dumbbell",
};

export function EquipmentCard({ item }: { item: Equipment }) {
  return (
    <Link href={`/equipment/${item.slug}`} className="group block">
      <Card className="h-full gap-0 overflow-hidden p-0 transition-shadow group-hover:shadow-md">
        <CatalogMedia
          kind="equipment"
          slug={item.slug}
          imageUrl={item.image_url}
          alt={item.name}
          icon={CATEGORY_ICON[item.category] ?? "Dumbbell"}
          className="aspect-[4/3] w-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{item.name}</h3>
            <Badge variant={difficultyTone(item.difficulty)} className="shrink-0">
              {difficultyLabel(item.difficulty)}
            </Badge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
          <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <Badge variant="outline">{categoryLabel(item.category)}</Badge>
            <span>{item.manufacturer}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
