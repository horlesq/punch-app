# Punch (working title)

Open-source, white-label time tracking & pay calculation app for small businesses.
One deployment per business — each instance is fully self-contained.

See `/project-docs` for full planning docs: PRD, architecture, design, roadmap, decisions,
and agent rules (read `AGENT_RULES.md` before using any AI coding assistant on this repo).

## Stack

- React Native + Expo (TypeScript)
- Supabase (Postgres + Auth + Storage), self-hostable
- i18next for localization

## Prerequisites

- Node.js 20+ and npm
- Git
- Docker Desktop (for running Supabase locally)
- Expo Go app on your phone (optional, for testing on a real device) — or an iOS
  Simulator / Android Emulator set up locally
- Supabase CLI

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url> punch-app
cd punch-app
npm install
```

### 2. Install the Supabase CLI (if you don't have it)

```bash
npm install -g supabase
```

### 3. Start Supabase locally

This spins up Postgres, Auth, Storage, and the API in Docker containers on your machine —
no cloud account needed for local development.

```bash
supabase init      # only needed once, first time the project is set up
supabase start
```

This prints local URLs and keys, e.g.:

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
Studio URL: http://127.0.0.1:54323
```

`Studio URL` is a local web dashboard for inspecting your database — useful for debugging,
not required for the app to function.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and paste in the `API URL` and `anon key` (plus the `service_role key` for admin functions) from the `supabase start` output:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Run migrations

```bash
supabase db reset
```

This applies every file in `/supabase/migrations/` in order, including RLS policies, and
loads `supabase/seed.sql` if present (demo data for local testing).

### 6. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` / `a` in the terminal to launch
the iOS Simulator / Android Emulator.

## Testing

Run the test suite (currently focuses on pure business logic in `payCalculations.ts`):
```bash
npx jest
```

## Project Structure

See `ARCHITECTURE.md` in `/project-docs` for the full breakdown and the reasoning behind it.
Short version:

- `/app` — Expo Router screens (routing only)
- `/src/api` — the only place Supabase is called from; all data access goes through here
- `/src/utils` — pure business logic (pay math, break deduction), unit-tested
- `/src/locales` — translation files; add a language by adding one file here
- `/supabase/migrations` — sequential SQL migrations, each including its own RLS policies

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add languages, how to structure new features, and the coding conventions for this project.

## Deploying for a Business (self-hosting)

This section will be filled in once Phase 6 is reached — covers creating a real Supabase
project (cloud or self-hosted via Docker on your own server) and building the Expo app for
that specific business's branding.
