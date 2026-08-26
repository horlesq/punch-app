# ROADMAP

Build order follows a "walking skeleton" approach: get the thinnest possible end-to-end slice
working first (auth → punch → data persists), then layer features on top. This surfaces
integration issues (Supabase config, Expo setup, auth) early, while they're cheap to fix.

## Phase 0 — Project Setup
- [x] Init Expo (TS) project, Expo Router, folder structure per ARCHITECTURE.md
- [x] Init Supabase project (or local Docker instance for dev)
- [x] Run initial migration: `profiles`, `punches` tables only (minimum for skeleton)
- [x] **Write RLS policies in the same migration as each table — not a later pass** (see
  ARCHITECTURE.md Security section). Even for the skeleton's two tables.
- [x] Supabase client wired into app (`/src/lib/supabase.ts`)
- [x] i18n setup: `i18next`/`react-i18next` config, `/src/locales/en.json` with skeleton keys
- [x] Basic env config (.env for Supabase URL/key), `.env.example` committed

## Phase 1 — Walking Skeleton
- [x] Auth: login screen, Supabase Auth wired up, session persistence
- [x] Role-based routing: admin lands on admin tabs, employee lands on employee tabs
  (role check can be hardcoded/manual at first — one seeded admin, one seeded employee)
- [x] **Layout-level role guard** on admin routes (redirect non-admins), not just hidden tabs
- [x] Employee Punch screen: punch in → writes row to `punches`, punch out → updates row
- [x] Punch status reflects correctly on screen reload (reads current open punch from DB)
- [x] Add `/src/locales/ro.json` as the second language to validate the i18n setup actually works
- **Goal: one employee can log in, punch in, punch out, and it's really in the database.**

## Phase 2 — Employee Core
- [x] History screen: list past punches for logged-in employee
- [x] Break deduction calculation (pure function in `payCalculations.ts`, unit tested)
- [x] My Pay screen: current week hours + pay (read-only, using employee's `hourly_rate`)
- [x] Missed punch correction: submit form (writes to `punch_corrections`)
- [x] Correction auto-approve path & manual-approve display flow
- [x] Language picker screen (profile/account settings), updates `profiles.locale`, applies immediately

## Phase 3 — Admin Core
- [x] Migration: add `business_settings`, `punch_corrections`, `pay_periods`, `audit_log` tables
- [x] Admin: Employees screen — list, add employee (creates Supabase Auth user + profile),
  set/edit hourly rate, deactivate
- [x] Admin: Dashboard — currently clocked in list
- [x] Admin: Corrections review — approve/reject pending corrections (manual-approve mode)
- [x] Wire `correction_approval_mode` setting to actually switch auto vs. manual behavior

## Phase 4 — Pay & Periods
- [x] Admin: Pay Periods screen — weekly table per employee, computed on-demand
- [x] Mark week as Paid → snapshot into `pay_periods`, lock week
- [x] Unlock flow with confirmation + audit log entry
- [x] Admin: per-employee weekly breakdown drill-down view

## Phase 5 — Branding / White-label
- [x] Admin: Settings — branding section (logo upload to Supabase Storage, color pickers)
- [x] `ThemeProvider`: reads `business_settings` on load, applies colors app-wide
- [x] Default/fallback theme for fresh installs (before any branding set)
- [x] Admin: Settings — rules section (break threshold/duration, approval mode toggle)

## Phase 5.1 — Security, Profiles & UI Polish
- [x] User Profile screens (Employee & Admin) with Avatar upload (Supabase Storage)
- [x] Account settings (Change Email, Password, Language Modals)

### Phase 6: Polish & Open-Source Readiness (Complete)
- [x] Create `Logs` screen in admin tab to view `audit_log`
- [x] Full UI polish pass: ensure every screen has a Loading Skeleton, an Empty State (if applicable), and an Error State.
- [x] Minimal documentation pass (README, CONTRIBUTING, adding seed data)

---

### Phase 7: Post-v1 and Future Features
- [ ] GPS/location verification
- [ ] Overtime rules
- [ ] Multi-tenant self-serve signup
- [ ] Manager role
- [ ] Push notifications
- [ ] Payroll/tax integrations

## Explicitly Deferred (post-v1, not in current roadmap)
- GPS/location verification
- Overtime rules
- Multi-tenant self-serve signup
- Manager role
- Push notifications
- Payroll/tax integrations
