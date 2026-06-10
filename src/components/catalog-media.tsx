"use client";

import * as React from "react";
import Image from "next/image";

import { MediaPlaceholder } from "@/components/media-placeholder";
import { cn } from "@/lib/utils";

export type MediaKind = "equipment" | "exercises";

/**
 * Where catalog photos live, by convention:
 *   public/images/equipment/<slug>.(webp|jpg|png)
 *   public/images/exercises/<slug>.(webp|jpg|png)
 * Drop a correctly-named file in and it appears everywhere automatically.
 */
const EXTENSIONS = ["webp", "jpg", "png"] as const;

function candidates(
  kind: MediaKind,
  slug: string,
  imageUrl?: string | null
): string[] {
  const local = EXTENSIONS.map((ext) => `/images/${kind}/${slug}.${ext}`);
  return imageUrl ? [imageUrl, ...local] : local;
}

/**
 * Real photo for a catalog item (machine or exercise) with a graceful
 * fallback chain: explicit `image_url` from the catalog data → local files by
 * slug convention → the branded gradient placeholder. Never renders broken.
 */
export function CatalogMedia({
  kind,
  slug,
  imageUrl,
  alt,
  icon = "Dumbbell",
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  kind: MediaKind;
  slug: string;
  imageUrl?: string | null;
  alt: string;
  /** Lucide icon for the placeholder fallback. */
  icon?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const sources = React.useMemo(
    () => candidates(kind, slug, imageUrl),
    [kind, slug, imageUrl]
  );
  const [index, setIndex] = React.useState(0);

  // Restart the fallback chain when the item changes (e.g. paging through a
  // session) — render-time state adjustment, per React's docs.
  const itemKey = `${kind}:${slug}:${imageUrl ?? ""}`;
  const [lastKey, setLastKey] = React.useState(itemKey);
  if (lastKey !== itemKey) {
    setLastKey(itemKey);
    setIndex(0);
  }

  if (index >= sources.length) {
    return <MediaPlaceholder seed={slug} icon={icon} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={sources[index]}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  );
}
