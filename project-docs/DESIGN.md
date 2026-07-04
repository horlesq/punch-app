# DESIGN

## 1. Visual Direction

**Style:** Minimal/utility-first, with friendly touches — not a cold dashboard, not a flashy
consumer app. Reasoning: the core action (punch in/out) must be instant and unmistakable, while
numbers (hours, pay) should feel clear and trustworthy. A neutral, restrained base also means
any business's logo/colors layer on top cleanly without clashing.

- Generous tap targets (this gets used one-handed, often quickly, possibly with gloves)
- High contrast for the punch in/out button — it's the single most important control in the app
- Rounded corners (friendly, modern) rather than sharp/dense
- Clean sans-serif type, generous spacing, minimal decoration
- Numbers (hours/pay) get visual weight — slightly larger, clear hierarchy — since that's what
  Admin cares about most

## 2. Theming / White-label System

Branding is **not** hardcoded — it's driven by the `business_settings` table (see
ARCHITECTURE.md) and applied at runtime via a `ThemeProvider`.

**What's themeable:**
- `primary_color` — used for main actions (punch button, primary CTAs, active tab)
- `accent_color` — secondary highlights (optional, falls back to a neutral if not set)
- `logo_url` — shown on login screen and admin dashboard header

**What's NOT themeable (stays consistent across all instances):**
- Layout, spacing, typography scale, iconography
- Neutral grays, error/success/warning colors (red/green/yellow stay semantic regardless of brand)
- This keeps the app recognizable as "the same app" across instances, just recolored —
  important for an open-source project's identity and for users who manage multiple instances.

**Default theme (before any branding is set):** neutral slate/blue palette, generic placeholder
logo (e.g. a simple icon), so the app looks complete and usable out of the box before an Admin
configures anything.

**Implementation:** `ThemeProvider` reads `business_settings` once on app load, exposes colors
via context/hook (e.g. `useTheme()`), components reference theme tokens rather than hardcoded
hex values.

## 3. Navigation Structure

Bottom tab bar, different tab sets per role — keeps the core action one tap away at all times
rather than buried behind a dashboard.

**Employee tabs:**
1. **Punch** — home tab, default screen on login. Big punch in/out button, current status
   ("Clocked in since 8:02 AM" / "Not clocked in").
2. **History** — list of past punches, with ability to flag a missed punch / submit correction.
3. **My Pay** — current week hours + pay, past weeks, paid/unpaid status.

**Admin tabs:**
1. **Dashboard** — overview: who's currently clocked in, pending corrections needing review,
   quick links.
2. **Employees** — list, add/edit employee, set hourly rate, activate/deactivate.
3. **Pay Periods** — weekly table per employee: hours, pay, mark as paid, unlock if needed.
4. **Settings** — branding (logo/colors), break rules, correction approval mode.

## 4. Key Screens (detail)

### Employee: Punch (home)
- Large status indicator: clocked in / clocked out, since when.
- One large button: "Punch In" or "Punch Out" (label/color changes based on state).
- Today's running total hours shown subtly below.

### Employee: History
- Chronological list of shifts: date, in-time, out-time, total (with break deducted noted).
- Tap a shift → option to "Report missed punch" if in/out is missing or wrong.
- Correction form: pick correct time(s), optional reason, submit.
- Pending corrections show a clear "Pending approval" badge.

### Employee: My Pay
- Current week card: hours, pay, "Unpaid" / "Paid" badge.
- List of past weeks below, same format.

### Employee/Admin: Language Setting
- Available to both roles, not just Admin — a simple language picker (e.g. in a profile/account
  screen, accessible from any tab via a settings icon).
- Defaults to English on first login; changing it applies immediately, no restart.
- List of available languages is driven by what's present in `/src/locales/` — not hardcoded
  in the UI, so a contributor adding a new translation file makes it selectable automatically.

### Admin: Dashboard
- "Currently clocked in" list (live).
- "Pending corrections" count/list with quick approve/reject.
- Shortcut to this week's pay summary.

### Admin: Employees
- List of employees with name, rate, active status.
- Add Employee: name, email (for login), hourly rate.
- Edit Employee: update rate (note: doesn't retroactively change paid history), deactivate.

### Admin: Pay Periods
- Table: Employee | Hours | Pay | Status (Paid/Unpaid) | Action.
- Tap a row → shift-level breakdown for that employee/week.
- "Mark as Paid" button → locks the week.
- If locked, show "Unlock" option with a confirmation warning (creates audit log entry).

### Admin: Settings
- Branding section: logo upload, primary color picker, accent color picker, live preview.
- Rules section: break threshold hours (default 4), break duration minutes (default 60),
  correction approval mode toggle (auto/manual).

## 5. Resolved Design Decisions

- **Color picker:** Both — a curated preset palette for quick selection, plus a custom hex/RGB
  picker for businesses with specific brand colors.
- **Dark mode:** Not a separate toggle in v1. Branding color system is the only theming layer;
  no independent light/dark mode switch.
