# AGENT RULES

> Rules for any AI coding agent (Antigravity, etc.) working on this codebase. Read this before
> making changes.

## File Output Rules
- **Always output complete, full replacement files — never partial snippets or diffs in prose
  form.** When editing an existing file, return the entire file with the change applied, not
  just the changed lines. Partial outputs have caused integration issues in past sessions.
- When a change spans multiple files, list out and provide every affected file in full.

## Code Conventions
- TypeScript everywhere — no plain `.js` files in `/app` or `/src`.
- Functional React components with hooks only — no class components.
- **All Supabase calls go through `/src/api/<entity>.ts` — never call `supabase.from(...)`
  directly inside a component or screen.** If a needed function doesn't exist yet in the
  relevant `/src/api/` file, add it there, then call it from the component.
- Business logic (pay calculation, break deduction) lives in pure, testable functions under
  `/src/utils/`, not inline in components. Components call these functions; they don't
  reimplement the math.
- Theme/branding values always come from the `useTheme()` hook / ThemeProvider context —
  never hardcode hex colors directly in component styles.
- **No hardcoded user-facing strings.** Every piece of UI text goes through `t('key')`
  (i18next). Adding a string means adding the key to `/src/locales/en.json` first, then using
  it — never inline English text "just for now."
- Database types should be generated/kept in sync with the actual Supabase schema
  (`/src/types/database.ts`) — don't hand-write types that drift from migrations.
- All new tables/columns go through a migration file in `/supabase/migrations/`, never applied
  ad-hoc only through the Supabase dashboard.
- **Every table migration includes its RLS policies in the same migration file** — never ship
  a table without RLS, even temporarily "to get something working."

## Naming Conventions
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utils/hooks.
- DB tables/columns: `snake_case` (Postgres convention).
- Booleans prefixed clearly: `is_active`, `is_paid`, `locked` — match existing schema naming.

## Required Behaviors
- Any action that touches pay history or locked weeks (unlocking, manual corrections after
  payment) must write an `audit_log` entry. Don't skip this even for "quick fixes."
- Any new admin-configurable rule (thresholds, modes, etc.) should be stored in
  `business_settings`, not hardcoded as a constant — match the existing pattern (e.g.
  `break_threshold_hours`).
- Don't introduce new dependencies/libraries without flagging it first — keep the dependency
  footprint small, this is meant to be easy for others to self-host and contribute to.

## Testing Expectations
- Pure functions in `/src/utils/` (especially `payCalculations.ts`) should have unit tests
  covering edge cases (exactly at threshold, just under/over, zero-duration shifts, etc.).
- Don't need full E2E test coverage for v1, but don't skip unit tests on pay-math logic — this
  is the part that absolutely cannot be silently wrong.

## Things to Never Do
- Never compute pay/hours differently in two places (e.g. don't duplicate break-deduction logic
  in both a component and a util — there should be one source of truth).
- Never hardcode business name, logo, or colors anywhere — always pull from
  `business_settings` / theme context, even in placeholder/demo states.
- Never silently change a locked/paid week's data without an audit log entry and explicit
  unlock action.

## When Unsure
- If a requirement is ambiguous or not covered in PRD.md / ARCHITECTURE.md / DESIGN.md, flag it
  rather than guessing — add it to the "Open Questions" pattern (see DECISIONS.md for how past
  ambiguities were resolved) instead of silently picking an interpretation.
