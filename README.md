# JYM — AI Gym Training & Weight-Loss Planner

Your personal trainer, planner and progress tracker in one app. JYM collects a
rich profile during onboarding, then **instantly generates a personalised,
science-based workout plan** from your goals, equipment, experience and any
injuries — and coaches you through every session.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
shadcn/ui · Supabase · Zustand · React Hook Form · Zod · Recharts**.

> **Runs out of the box in demo mode.** Without any backend configured, the
> entire app is explorable with realistic sample data. Add Supabase keys to turn
> on real accounts and persistence.

---

## ✨ What's inside (by spec phase)

| Phase | Feature | Where |
| --- | --- | --- |
| 1 | **Onboarding** — 7-step wizard (personal, fitness, goals, body, lifestyle, nutrition, health) | `/onboarding` |
| 2 | **Equipment library** — 35 Gym80-style machines with instructions + QR codes | `/equipment` |
| 3 | **Exercise database** — 73 exercises with muscles, form, tips, alternatives | exercise detail dialogs |
| 4 | **AI plan generator** — split selection, set/rep/rest schemes, injury-aware exercise selection | `/plan` |
| 5 | **Schedule** — weekly split with per-day sessions | `/plan`, `/workouts` |
| 6 | **Guided session mode** — current exercise, sets, reps, rest timer, volume tracking | `/session/[index]` |
| 7 | **QR machine scanner** — scan a machine → usage + "start this exercise" | `/scan`, `/m/[code]` |
| 8 | **Progress tracking** — weight, body-fat, measurements, training volume + charts | `/progress` |
| 9 | **Dashboard** — summary cards, weight trend, weekly volume, next workout | `/dashboard` |
| — | **Analytics** — BMI, TDEE, calorie & protein targets, muscle focus | `/analytics` |

Plus: light/dark/premium theme, mobile bottom-nav + desktop sidebar, fully
responsive, accessible large touch targets.

---

## 🚀 Quick start

```bash
npm install
npm run dev          # http://localhost:3000  (demo mode — no backend needed)
```

Open the app and click **Build my plan** to walk through onboarding and get an
instant plan. Everything is interactive; nothing is persisted until you connect
Supabase.

---

## 🔌 Connecting Supabase (real accounts + persistence)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, for seeding
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Run the SQL migrations (Supabase Dashboard → SQL Editor, in order):
   - `supabase/migrations/0001_init.sql` — tables, triggers, profile auto-provisioning
   - `supabase/migrations/0002_rls.sql` — Row Level Security policies

4. (Optional) Mirror the reference catalog into the DB:

   ```bash
   npm run seed
   ```

5. **Google login:** in Supabase → Authentication → Providers → Google, add your
   OAuth credentials and set the redirect URL to
   `https://<your-domain>/auth/callback`.

Restart `npm run dev` — sign-up, login, onboarding, sessions and measurements
now persist per-user (protected by RLS).

---

## 🧠 How the plan generator works

The generator (`src/lib/plan/`) is a **deterministic, exercise-science-informed
engine** — not an LLM call. That makes plans instant, free, reproducible and
testable. Given a normalised profile it:

1. Maps the **primary goal → training emphasis** (hypertrophy, strength, fat
   loss, endurance, general, athletic, rehab).
2. Chooses a **weekly split** by training days × experience (full-body → upper/
   lower → push/pull/legs).
3. Resolves the **available equipment** from gym access + owned gear.
4. Fills each day's **movement slots** (e.g. "horizontal press", "hinge") with
   the best-scoring available exercise, honouring injury contraindications and
   diversifying across the week.
5. Applies a **goal-appropriate set·rep·rest scheme** and trims each session to
   the user's available time.
6. Reports **weekly volume per muscle group** and **coaching guidance**.

> The active plan is a pure function of the profile, so it's recomputed on the
> fly. The `workout_plans` tables exist for future editing/history.

An optional LLM "coach" layer can later refine this output — the architecture
leaves a clean seam for it.

---

## 🗂️ Architecture

```
src/
├─ app/
│  ├─ (auth)/            login, signup (+ shared split layout)
│  ├─ (app)/             authenticated shell: dashboard, plan, workouts,
│  │                     progress, equipment, analytics, settings, scan
│  ├─ session/[index]/   immersive guided workout (no app chrome)
│  ├─ m/[code]/          QR machine scan landing
│  ├─ onboarding/        multi-step wizard
│  └─ auth/callback/     OAuth / email-confirmation handler
├─ components/           ui/ (shadcn), layout/, onboarding/, plan/, charts/, …
├─ data/                 EXERCISES (73) + EQUIPMENT (35) static catalog
├─ lib/
│  ├─ plan/              generator, templates, schemes, profile bridge
│  ├─ supabase/          browser/server clients, proxy session refresh
│  ├─ fitness.ts         BMR/TDEE/BMI, unit conversions
│  ├─ stats.ts           progress analytics
│  ├─ queries.ts         server data access (DB or demo)
│  └─ *-actions.ts       server actions (auth, profile, session)
├─ stores/               Zustand onboarding store
└─ proxy.ts              Next 16 "proxy" (was middleware): auth/session
```

### Demo mode

When Supabase env vars are absent, `isSupabaseConfigured` is `false`:
the proxy becomes a pass-through, auth is bypassed, and `getProfile()` returns a
cookie-backed profile (set during onboarding) or a built-in sample. This keeps
the whole product demoable and reviewable without a database.

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed the Supabase catalog from local data |

---

## ☁️ Deployment (Vercel)

1. Push to GitHub and import the repo into Vercel.
2. Add the same env vars from `.env.local` to the Vercel project (set
   `NEXT_PUBLIC_SITE_URL` to your production URL).
3. Deploy. Add your production domain to Supabase Auth redirect URLs.

---

## 🛣️ Roadmap

- AI coach chat layered on top of the deterministic generator
- Nutrition planning & meal tracking
- Calendar drag-and-drop rescheduling
- Progress photos & body-composition trends
- Wearable integrations (Apple Health, Google Fit, Garmin)
- Additional equipment manufacturers (schema already supports it)
- Multi-language UI (i18n scaffolding in `constants.ts`)

---

Built as a complete, working foundation — every core user journey
(onboard → instant plan → guided session → scan → track) is functional today.
