# ARCHITECTURE

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile app | React Native + Expo (TypeScript) | Cross-platform, no native modules needed for v1, fast builds, easy for contributors to set up |
| Backend / DB | Supabase (Postgres + Auth + Storage) | Open source, self-hostable, gives Auth + relational DB + file storage out of the box, official RN SDK |
| State management | React Context + hooks (or Zustand if complexity grows) | Keep it simple for v1; avoid over-engineering |
| Navigation | React Navigation | Standard for Expo apps |
| Styling | Theming via a Branding/Theme context (see Design doc) | Needed for white-label color/logo customization |

**Deployment model:** one Supabase project + one Expo/RN build per business. Not multi-tenant —
each business is a fully separate instance of the whole stack. No `tenant_id` columns needed
since each DB only ever holds one business's data.

## 2. Data Model

### `profiles` (extends Supabase `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, = auth.users.id) | |
| role | enum('admin', 'employee') | |
| full_name | text | |
| hourly_rate | numeric | nullable for admin, required for employee |
| is_active | boolean | default true — for deactivating employees without deleting history |
| locale | text | default 'en' — per-user language preference, e.g. 'en', 'ro' |
| created_at | timestamptz | |

### `punches`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| employee_id | uuid (FK -> profiles.id) | |
| clock_in_at | timestamptz | |
| clock_out_at | timestamptz | nullable until they punch out |
| source | text, CHECK IN ('live', 'correction') | was this a real-time punch or a backfilled correction |
| status | text, CHECK IN ('approved', 'pending') | pending only relevant if correction + manual-approval mode |
| created_at | timestamptz | |

### `punch_corrections`
> A correction request — links to the punch it's correcting (or creates a new punch if both
> in/out were missed).

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| punch_id | uuid (FK -> punches.id) | |
| employee_id | uuid (FK -> profiles.id) | |
| requested_clock_in_at | timestamptz | nullable |
| requested_clock_out_at | timestamptz | nullable |
| reason | text | optional free text from employee |
| status | text, CHECK IN ('pending', 'approved', 'rejected') | |
| reviewed_by | uuid (FK -> profiles.id) | nullable, admin who approved/rejected |
| reviewed_at | timestamptz | nullable |
| created_at | timestamptz | |

### `pay_periods` (weekly)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| employee_id | uuid (FK -> profiles.id) | |
| week_start_date | date | |
| week_end_date | date | |
| total_hours | numeric | computed from punches minus break deduction |
| total_pay | numeric | total_hours * hourly_rate at time of calculation |
| is_paid | boolean | default false |
| paid_at | timestamptz | nullable |
| locked | boolean | default false — true once marked paid |
| created_at | timestamptz | |

> Note: `total_hours`/`total_pay` could be computed on-the-fly via a view/function instead of
> stored. Storing them as a snapshot in `pay_periods` is safer once `is_paid = true`, since pay
> rate could change later and we don't want historical pay to retroactively change. Recommend:
> compute live for unpaid weeks, snapshot/freeze into this table once marked paid.

### `business_settings` (single row table, one business per instance)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | always one row |
| business_name | text | |
| logo_url | text | nullable, Supabase Storage path |
| primary_color | text | hex |
| accent_color | text | hex, nullable |
| break_threshold_hours | numeric | default 4 |
| break_duration_minutes | integer | default 60 |
| correction_approval_mode | text, CHECK IN ('auto', 'manual') | default 'manual' |
| timezone | text | default 'UTC' — IANA tz name, used for week-boundary calculations |
| enabled_features | jsonb | default '{}' — feature flags for optional modules added over time, e.g. `{"gps_verification": false}`. See Section 10. |
| created_at | timestamptz | |

### `audit_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| actor_id | uuid (FK -> profiles.id) | who made the change |
| action | text | e.g. 'correction_approved', 'week_unlocked', 'rate_changed' |
| entity_type | text | e.g. 'punch', 'pay_period' |
| entity_id | uuid | |
| old_value | jsonb | nullable |
| new_value | jsonb | nullable |
| created_at | timestamptz | |

## 3. Business Logic Notes

- **Break deduction:** computed at read-time when calculating hours for a shift —
  `if (shift_duration_hours > break_threshold_hours) shift_duration -= break_duration`.
  Pulled from `business_settings`, not hardcoded.
- **Pay calculation:** `total_pay = total_hours * profiles.hourly_rate`. Snapshot into
  `pay_periods` once paid so later rate changes don't alter history.
- **Correction approval:** if `business_settings.correction_approval_mode = 'auto'`, corrections
  apply immediately and `punches.status` is set to `approved` automatically; otherwise stays
  `pending` until Admin reviews.
- **Locked weeks:** Admin can unlock; unlocking and any resulting edit must write an
  `audit_log` entry.

## 4. Folder Structure (Expo app)

```
/app                      # Expo Router screens (or /src/screens if not using Expo Router)
  /(auth)
    login.tsx
  /(admin)
    employees.tsx
    employee-detail.tsx
    pay-periods.tsx
    settings-branding.tsx
    corrections-review.tsx
  /(employee)
    punch.tsx
    history.tsx
    my-pay.tsx
/src
  /api
    punches.ts            # all punch-related Supabase calls live here, never called directly from components
    payPeriods.ts
    employees.ts
    corrections.ts
    businessSettings.ts
    auditLog.ts
  /components
  /hooks
  /lib
    supabase.ts          # Supabase client init
    i18n.ts              # i18next config, language registration
  /locales
    en.json
    ro.json               # add more by dropping in new files here
  /theme
    ThemeProvider.tsx     # reads business_settings, provides colors/logo via context
  /types
    database.ts           # generated/typed from Supabase schema
  /utils
    payCalculations.ts     # break deduction + pay math, pure functions, unit-testable
supabase/
  migrations/              # SQL migrations, sequential, see Section 10
  seed.sql
```

## 5. Resolved Architecture Decisions

- **Pay period calculation:** computed on-demand when Admin opens the pay/weekly screen, not
  via a scheduled job. A `pay_periods` row is only written/snapshotted at the moment Admin marks
  a week as Paid. No cron/Edge Function needed for v1.
- **Routing:** Expo Router (file-based), matching the folder structure above.

## 6. Internationalization (i18n)

Per-user language preference, stored as `profiles.locale`. Architecture must be fully
extensible — contributors should be able to add a new language by adding one file, no code
changes required.

- **Library:** `i18next` + `react-i18next` (or `expo-localization` for device-default detection
  on first launch, falling back to 'en'). Mature, widely used, supports lazy-loading translation
  files — good fit for an open-source project where contributors add languages independently.
- **Translation files:** `/src/locales/en.json`, `/src/locales/ro.json`, etc. — one flat file
  per language, keyed by string ID (e.g. `"punch.button.clockIn": "Clock In"`).
- **No hardcoded user-facing strings in components.** Every piece of UI text goes through a
  `t('key')` call. This is a hard rule — see AGENT_RULES.md.
- **Adding a language = adding a file.** `/src/locales/<code>.json` + one line registering it
  in the i18n config. Document this in CONTRIBUTING.md (Phase 6) so outside contributors can
  do it without reading the whole codebase.
- **Fallback behavior:** if a key is missing in a user's chosen language, fall back to English
  rather than showing a blank string or a raw key.
- **Date/time/number formatting:** locale-aware (e.g. via `Intl` or i18next's formatting
  helpers) — punch timestamps and pay amounts should format per the user's locale, not just
  the label text.
- **On signup/first login:** default to `'en'`, user changes it in their profile/settings
  screen at any time — change applies immediately, no app restart needed.

## 7. Security — Row Level Security (RLS)

RLS policies are a **Phase 0 requirement**, not a later hardening pass — added in the same
migration that creates each table, before any real data exists. App-level role checks (hiding
admin tabs from employees) are a UX nicety, not a security boundary; the database must enforce
access on its own regardless of what the client sends.

Baseline policies needed:
- `profiles`: a user can read their own row; only admin can read/write all rows; only admin can
  update `hourly_rate` (employee cannot update their own rate).
- `punches`: employee can read/write only their own punches; admin can read/write all.
- `punch_corrections`: employee can create/read their own; admin can read/write all.
- `pay_periods`: employee can read only their own; only admin can write/update.
- `business_settings`: all authenticated users can read; only admin can write.
- `audit_log`: admin-only read; writes happen via backend logic, not direct client inserts.

## 8. Role-Based Route Guarding

Hiding admin tab links from employees in the UI is not sufficient — a guard must also run at
the route/layout level so a non-admin can't reach an admin screen by direct navigation. Combined
with RLS (above), this gives defense in depth: even if a guard is bypassed, the database still
refuses the data.

- Implement as a layout-level check (e.g. `/(admin)/_layout.tsx` reads the user's role from
  context; if not admin, redirect to the employee home).
- Same pattern in reverse isn't really needed (employees aren't excluded from much), but the
  admin guard is required.

## 9. Resolved Notes (previously open)

- **Timezone handling:** resolved — `business_settings.timezone` (IANA tz name, default 'UTC')
  defines week boundaries for pay period calculations. All `timestamptz` columns store true UTC
  instants as always; this setting only affects how "start of week" is computed for grouping.
- **Deactivated employees:** resolved — deactivating (`profiles.is_active = false`) only blocks
  new punches/login for that user. Historical `punches` and `pay_periods` rows are never deleted
  and remain fully visible in Admin's Pay Periods view. Deactivation is a flag, not a deletion.

## 10. Conventions for Extending This Architecture

These rules exist so that adding features later doesn't require relearning or restructuring —
follow them by default rather than improvising per-feature.

**Migrations:**
- Sequential numbered files (Supabase CLI default: `<timestamp>_description.sql`).
- One logical change per migration (e.g. "add locale to profiles" is its own file, not bundled
  into an unrelated change).
- **Never edit a migration that has already been run/shipped.** If a past migration was wrong,
  write a new migration that corrects it — editing history breaks anyone who already applied it.
- Every migration that creates/alters a table includes its RLS policy changes in the same file.

**Data access layer:**
- Components and screens never call `supabase.from(...)` directly. All reads/writes go through
  a function in `/src/api/<entity>.ts` (e.g. `getOpenPunch(employeeId)`, `clockIn(employeeId)`,
  `markWeekAsPaid(employeeId, weekStart)`).
- This means a future change to *how* something is calculated or stored touches one file, not
  every component that happens to use that data.
- New entity → new file in `/src/api/`, named after the entity, not the feature/screen.

**Feature flags (`business_settings.enabled_features`):**
- For genuinely optional/future modules (e.g. GPS verification, overtime rules) that may not
  apply to every deployment even once built. Toggled via this jsonb column rather than env vars,
  so Admin can control it from the app, consistent with how branding/rules already work.
- Not a substitute for proper schema design — only for true on/off feature toggles, not for
  storing structured business data (that still gets real columns/tables).

**Adding a new feature (general pattern):**
1. Data model change (if any) → new migration, including RLS.
2. Add/extend the relevant `/src/api/<entity>.ts` function(s).
3. Add/extend pure logic in `/src/utils/` if there's calculation involved (unit-test it).
4. Build the screen/component, pulling data only through the API layer and `t()` for all text.
5. Register the screen in the appropriate route group (`/(admin)` or `/(employee)`); add to tab
   layout if it needs its own tab, or link to it from an existing screen otherwise.
6. Log the decision in DECISIONS.md if it involved a real tradeoff or wasn't obvious from PRD.

**New screens — where they go:**
- Admin-facing → `/(admin)/<screen-name>.tsx`, route-guarded by the admin layout.
- Employee-facing → `/(employee)/<screen-name>.tsx`.
- Shared (e.g. language picker, profile) → a top-level route outside both groups, accessible
  from either role's navigation.

**Deferred features (GPS, overtime, manager role, multi-tenant, etc.):**
- Don't pre-build scaffolding for these. When one is actually greenlit, follow the "Adding a new
  feature" pattern above, using `enabled_features` if it's the kind of thing a business might
  want to turn on/off rather than something universal.
