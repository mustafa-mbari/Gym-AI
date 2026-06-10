# Catalog photos

Drop real photos here and they appear across the whole app automatically —
equipment library, machine detail pages, QR-scan pages, exercise dialogs and
the guided workout session. No code changes or rebuilds needed.

## Naming convention

One file per catalog item, named by its **slug** (the same slug you see in the
URL, e.g. `/equipment/chest-press-machine`):

```
public/images/equipment/<slug>.webp   ← machines  (e.g. chest-press-machine.webp)
public/images/exercises/<slug>.webp   ← exercises (e.g. barbell-bench-press.webp)
```

Supported extensions, tried in this order: `.webp`, `.jpg`, `.png`.

While a photo is missing, the branded gradient placeholder is shown instead —
nothing ever looks broken.

## Which photos are still missing?

```
npm run media:report
```

prints every machine and exercise slug with a ✓/✗ photo status.

Alternatively, an item's `image_url` field in `src/data/equipment.ts` /
`src/data/exercises.ts` can point to a remote URL — that takes precedence over
local files (remote hosts must be allowed via `images.remotePatterns` in
`next.config.ts`).
