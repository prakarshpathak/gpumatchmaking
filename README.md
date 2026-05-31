# GPU Matchmaker

Internal tool for **io.net** that matches GPU **demand** (client requirements)
against **supply** (provider inventory), scores every candidate, and surfaces a
buy recommendation per deal.

Matching and scoring run **client-side as pure functions** over the loaded data
and mirror the SQL `matches` / `requirement_coverage` views exactly — so the UI
stays auditable and the DB stays the source of truth.

## Stack

- **Vite** + **React 19**
- **Tailwind CSS v4** (via the `@tailwindcss/vite` plugin — no PostCSS config;
  the app uses core utility classes, with colors driven by inline styles)
- **lucide-react** for icons
- **Supabase** (Postgres + Auth + Row Level Security) as the backend
- Fonts: Geist (display) + Mona Sans (body), loaded via Google Fonts `@import`

## Prerequisites

- **Node 18+** (developed on Node 24 via [nvm](https://github.com/nvm-sh/nvm))
- A **Supabase** project (for live data; the app builds and runs without one,
  it just shows an empty/loading state)

## Quick start

```bash
# 1. install dependencies
npm install

# 2. create your env file and fill in your Supabase keys
cp .env.example .env
#    then edit .env:
#      VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
#      VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY

# 3. run the dev server (http://localhost:5173)
npm run dev
```

> Until the database is live and the keys are set, the app loads to a
> **"Loading pipeline…"** state — that's expected.

### Other scripts

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # eslint
```

## Environment variables

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** key (safe in the browser)   |

The anon key is safe to ship to the browser **because RLS is on** — it grants
nothing until a user authenticates. **Never** put the `service_role` key in the
frontend. `.env` is gitignored; `.env.example` is the tracked template.

## Backend (Supabase) setup

1. Create a Supabase project.
2. In the **SQL editor**, run `001_gpu_matchmaking_core.sql` (schema +
   `matches` / `requirement_coverage` views + RLS + audit triggers + seed data).
3. Turn on **Auth** (email magic-link or Google SSO). The `authenticated` RLS
   policy gives logged-in team members full read/write.

## Deploy (Vercel / Cloudflare Pages)

1. Connect the repo; framework preset **Vite** (build `npm run build`,
   output `dist`).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as env vars in the host.
3. Deploy.

## Architecture notes

- **Data layer** (`src/lib/api.js`): `loadData()` reads requirements (with their
  blacklist relation flattened) and inventory; `updateRequirement()` /
  `updateInventory()` do the writes. `src/lib/supabase.js` initializes the client
  from the `VITE_` env vars.
- **Match score** (0–100): **Price 45% / Provider 30% / Availability 25%**,
  mapping to **Strong Buy ≥80 · Buy ≥65 · Watch ≥45 · else Avoid**. Defined in
  `src/App.jsx` and kept identical to the SQL views.
- **Optimistic concurrency**: writes only land if `updated_at` matches what was
  loaded; 0 rows back ⇒ `CONFLICT`, and the UI prompts a reload instead of
  clobbering a concurrent edit.
- A requirement with `form_factor = null` matches **any** form factor of that
  model — intended.

## Project layout

```
src/
  App.jsx          # full UI + client-side matching/scoring
  index.css        # Tailwind import + base resets
  lib/
    supabase.js    # Supabase client (from VITE_ env vars)
    api.js         # loadData + optimistic-concurrency writes
```
