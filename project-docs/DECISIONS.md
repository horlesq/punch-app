# DECISIONS

> Running log of key decisions and the reasoning behind them. Add to this file as new decisions
> get made during development — don't just change PRD/ARCHITECTURE/DESIGN silently, log the
> "why" here too so it isn't re-litigated later.

---

**Roles: Admin + Employee only, no Manager tier.**
Keeps permission logic simple for v1. Can be added later if a real need emerges.

**Punch-in/out: simple tap, no GPS verification.**
Decided against location checks for v1 — adds complexity (permissions, battery, accuracy edge
cases) without a confirmed need yet.

**Missed punch correction with configurable approval mode (auto vs. manual).**
Real-world necessity — employees will forget to punch in/out. Admin controls trust level per
business via `correction_approval_mode` setting.

**Break deduction: automatic, threshold-based, not a separate punch action.**
Default: shifts over 4 hours auto-deduct 1 hour. Both numbers admin-configurable. Decided
against a separate "punch out for lunch" action to keep the core flow at just two taps
(in/out) — break deduction is a calculation rule, not a user action.

**Pay calculation: raw hours × rate, no overtime rules in v1.**
Overtime rules vary a lot by jurisdiction/business and add real complexity. Deferred until
there's a confirmed need.

**Deployment model: separate deploy per business (white-label), not multi-tenant SaaS.**
Each business runs its own instance (own Supabase project + own app build). Simplifies data
model significantly (no `tenant_id` needed anywhere) at the cost of more deploy overhead per
business — acceptable tradeoff for an open-source, self-hosted project.

**Backend: Supabase (self-hostable), not custom Node backend.**
Supabase is genuinely open source and self-hostable via Docker — using it doesn't compromise
the project's open-source identity. At the scale of "one business's employees," a custom
backend would mean rebuilding Auth/REST/DB tooling for no real scalability benefit, since
Supabase is just Postgres underneath. Employees/admins never see the Supabase dashboard —
it's an implementation detail, not a user-facing dependency.

**Mobile framework: React Native + Expo.**
No native modules needed for v1 feature set (no GPS, no background services), so Expo's faster
setup/build process is pure upside.

**Branding (logo/colors): configured in-app by Admin, not at deploy/code time.**
Lets anyone self-hosting an instance rebrand it without touching code — important for an
open-source project meant to be deployed by non-developers too.

**Pay rate visibility: employees can see their own rate.**
Reasonable transparency; employees don't see others' rates.

**Paid weeks: locked after marking paid, but admin can explicitly unlock.**
Protects pay history integrity (rate changes shouldn't retroactively alter paid history) while
still allowing correction of genuine mistakes. Unlocking is logged via `audit_log`.

**Audit log: full trail for corrections and locked-week overrides.**
Anything touching pay history needs to be auditable — both for trust and for resolving disputes.

**Business locations/sites: not supported in v1.**
Single business, single location per instance. No site/branch tagging on punches.

**Pay period calculation: on-demand, not scheduled.**
Weekly totals computed when Admin opens the Pay Periods screen, not via a cron/Edge Function.
Simpler to build and test; a `pay_periods` row is only persisted at the moment a week is marked
Paid (snapshot).

**Color customization: presets + custom hex/RGB picker, no separate dark mode.**
Covers both "quick and easy" and "exact brand match" needs without the added scope of a fully
independent dark mode system.

**Build order: walking skeleton first.**
Phase 1 gets the thinnest possible slice (auth → punch in/out → persisted in DB) working
end-to-end before adding feature breadth, to surface integration issues early.

---

## Added after first pre-coding review pass

**Row Level Security (RLS): mandatory from Phase 0, not a later hardening pass.**
App-level role checks (hiding UI) are not a security boundary on their own — the database must
independently refuse to hand over data to the wrong user. Retrofitting RLS onto tables that
already have real data is far more disruptive than designing it in from the first migration.

**Role-based route guarding: layout-level redirect, not just hidden nav links.**
Hiding admin tabs from employees in the UI doesn't stop direct navigation to an admin route.
A layout-level guard (check role, redirect if mismatched) is required, working alongside RLS
for defense in depth.

**Correction-affecting-already-reviewed-week: log it, even before lock.**
If a correction changes a week's total after Admin has already looked at the number but before
marking it Paid, that's currently invisible. Decided to log a lightweight audit entry in this
case too — not just on locked-week overrides — since it's cheap now and painful to add later.

**`hourly_rate` history: not tracked separately — covered by pay snapshot instead.**
Considered adding a rate-history table so "what was their rate on date X" is always knowable.
Decided against it for v1: snapshotting `total_pay` at the moment a week is marked Paid already
covers the actual risk (retroactive rate changes altering paid history). Revisit only if a real
need for full rate history emerges.

**Per-employee correction approval override: deferred, not designed in.**
Considered letting `correction_approval_mode` be overridable per-employee (not just business-
wide). Decided this is speculative for v1 — no confirmed need yet — so the schema stays a single
business-level setting. Flagged here in case it comes up again so it's not re-debated from
scratch.

**Language/locale: per-user setting, fully extensible, default English.**
Each user (admin or employee) picks their own language independently of business branding.
"Fully extensible" means adding a language should require adding one file
(`/src/locales/<code>.json`) and one registration line — no other code changes, so open-source
contributors can add translations without deep codebase knowledge. Chose `i18next` +
`react-i18next` as the library: mature, supports this exact lazy-file pattern. Stored as
`profiles.locale`, defaults to `'en'`, falls back to English for any missing key in another
language.

---

## Added during second pre-coding review (architecture robustness pass)

**Data-access layer: added now, before any feature code exists.**
Components/screens never call Supabase directly — all reads/writes go through
`/src/api/<entity>.ts`. Reasoning: without this, a future change to how something is calculated
or stored (e.g. adding overtime rules, changing how pay periods are computed) means touching
every component that happens to use that data. With it, the same change touches one file.
Cheap to set up now (one extra layer of functions), expensive to retrofit once dozens of
components call Supabase directly.

**`metadata jsonb` safety-valve column: rejected.**
Considered adding a flexible `metadata jsonb` column to `punches`/`profiles` as a place to bolt
on small future attributes without a migration. Decided against it — explicit migrations keep
the schema honest and readable, which matters more for an open-source project other people will
read and contribute to than the convenience of skipping a migration. New attributes get real
columns via real migrations, even small ones.

**`enabled_features` jsonb on `business_settings`: added instead.**
Unlike the rejected generic `metadata` column, this one has a specific, bounded purpose: toggling
genuinely optional future modules (GPS verification, overtime rules, etc.) on/off per deployment,
consistent with how branding/rules are already admin-controlled. Not a substitute for proper
schema design — structured data still gets real columns/tables; this is only for on/off flags.

**Migration discipline: sequential, one-change-per-file, never edit a shipped migration.**
Standard practice, but stated explicitly so Antigravity doesn't "fix" an old migration in place
when something needs correcting — corrections are new migrations, since editing history breaks
anyone who already applied the original.

**General "adding a new feature" procedure: documented in ARCHITECTURE.md Section 10.**
A repeatable checklist (migration+RLS → API layer → utils → screen → routing → log decision) so
future feature work doesn't require re-deriving the right order of operations each time.

---

**`business_settings` readable by unauthenticated (anon) users.**
The login screen must display business branding (logo, colors, business name) before any user is authenticated. Since Supabase Auth requires a session to satisfy authenticated RLS policies, the ThemeProvider was falling back to default unbranded values on the login screen.
Decision: grant SELECT on `business_settings` to the `anon` role so branding loads on app start before login. This is safe because `business_settings` contains no sensitive data – only public-facing branding and non-sensitive configuration (break rules, approval mode).
Write access remains admin-only.
Similarly, the `branding` Storage bucket is set to public read so the logo URL resolves without authentication.

---

**`avatars` Storage bucket set to public read & path-scoped write policies.**
Profile avatars are readable by all authenticated users (so admins can see employee avatars in lists) and public for pre-auth contexts. Upload, update, and delete access is strictly limited to files under each user's own `{userId}/` path (`(storage.foldername(name))[1] = auth.uid()::text`).

**`profiles` table self-update RLS policy added.**
Previously, `profiles` update policy was restricted to `is_admin()`. To allow employees to change their language preference (`locale`) and avatar (`avatar_url`), a `"Users can update own locale and avatar"` policy was added (`auth.uid() = id`). Field-level protection is maintained at the API layer so users cannot mutate `role`, `hourly_rate`, or `full_name`.

