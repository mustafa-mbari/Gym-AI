<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JYM project conventions

**Next.js 16 specifics that bite (verified against bundled docs):**
- `cookies()`, `headers()`, and route `params` / `searchParams` are **async** — always `await` them.
- Middleware is renamed to **`proxy`** — session handling lives in `src/proxy.ts` (`export function proxy`). The proxy runs on the Node.js runtime.
- `next build` no longer runs ESLint; the `eslint` key was removed from `next.config`. Turbopack is the default for dev and build.
- `images.domains` is deprecated — use `images.remotePatterns`.

**Architecture rules:**
- The reference catalog (exercises, equipment) is **static TS data** in `src/data/`. The app reads it directly; `npm run seed` mirrors it into Supabase. Keep both in sync via the `Exercise`/`Equipment` types in `src/types`.
- Option lists live once in `src/lib/constants.ts` (`as const`) and drive both UI and the union types in `src/types`. Add an option there, not inline.
- The workout plan is a **pure function of the profile** (`src/lib/plan`). Prefer recomputing over persisting; keep the generator deterministic (no `Math.random`).
- Everything must keep working in **demo mode** (no Supabase env): guard backend calls with `isSupabaseConfigured` and fall back to `src/lib/demo.ts`.
- shadcn registry is gated in this environment — hand-author UI primitives in `src/components/ui/` (modern `data-slot` style) instead of `shadcn add`.
- Run `npm run typecheck` before committing.

