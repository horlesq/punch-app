# PRD — Punch (working title)

> Open-source, white-label time tracking & pay calculation app for small businesses.

## 1. Problem

Small businesses (e.g. trades, HVAC, retail, field services) need a simple way for employees
to clock in/out and for the owner/admin to know exactly how many hours each employee worked
and how much they're owed — without paying for a bloated SaaS HR platform.

## 2. Target User

- **Primary (Admin):** Small business owner or office manager. Sets up employees, pay rates,
  reviews hours, knows what to pay.
- **Secondary (Employee):** Hourly worker. Just needs to punch in/out and see their own hours.

## 3. Product Identity

- Open source, self-hostable.
- **One deployment per business** (white-label model, not multi-tenant SaaS). Each business
  runs its own instance.
- Each instance should look "branded" to that business: own logo, own color scheme — configured
  by the Admin from inside the app, not by editing code.
- Outside of branding, the app should look clean and generic — no strong opinionated visual
  identity of its own.

## 4. Roles

| Role | Capabilities |
|---|---|
| **Admin** | Create/manage employee accounts, set hourly pay rate per employee, view hours worked (daily/weekly), view amount owed, mark employees as paid, approve/configure punch corrections, configure break-deduction rules, set app branding (logo, colors) |
| **Employee** | Punch in / punch out, view own punch history, submit a correction if they forgot to punch in/out |

No "Manager" role in v1 — just Admin and Employee.

## 5. Core Features (MVP)

### 5.1 Authentication
- Employee and Admin login (Supabase Auth).
- Admin creates employee accounts (employees don't self-register).

### 5.2 Punch In / Punch Out
- Simple one-tap punch in, one-tap punch out. No GPS/location verification in v1.
- Each punch event is timestamped.

### 5.3 Missed Punch Correction
- If an employee forgets to punch in or out, they can submit a correction (manually enter the
  time) after the fact.
- Admin can set correction approval mode per business:
  - **Auto-approve** — correction applies immediately.
  - **Manual approve** — correction sits as "pending" until Admin approves/rejects.

### 5.4 Break Deduction Logic
- When calculating worked hours for a shift, the app can auto-deduct a lunch break.
- Default rule: if the shift is **longer than 4 hours**, deduct a break automatically.
  - Admin can change the threshold (default 4h).
  - Admin can change the break duration deducted (default 1 hour).
- This is a calculation rule, not a separate punch action — employees don't punch out for
  lunch in v1.

### 5.5 Pay Calculation
- Each employee has an hourly rate, set by Admin.
- Pay = (worked hours − deducted break) × hourly rate. No overtime rules in v1.
- Admin views a **weekly table**: employee, hours worked, amount owed.
- Admin can mark a given employee/week as **Paid**.

### 5.6 Branding / White-label
- Admin Settings screen: upload logo, choose primary color (and likely accent color).
- App reads this branding config on load and themes itself accordingly.

## 6. Explicitly Out of Scope (v1)

- GPS / location-based punch verification.
- Overtime calculation rules.
- Multi-tenant self-serve signup (one instance = one business).
- Manager role / permission tiers beyond Admin & Employee.
- Payroll integrations, tax calculation, direct deposit, payslip generation.
- Push notifications / reminders to punch in/out.

## 7. Resolved Decisions

- **Locations:** Single business, single location per instance. No site/branch tagging in v1.
- **Pay rate visibility:** Employees can see their own hourly rate (not other employees').
- **Paid-week locking:** Once Admin marks a week as Paid, that week's punches are locked from
  further edits/corrections. Admin can explicitly unlock a paid week if a correction is truly
  needed (logged as an override).

## 8. Success Criteria (v1)

- Admin can fully onboard a business in under 10 minutes (create account, add employees, set
  rates, set branding).
- Employees can punch in/out in 1-2 taps with zero training needed.
- Admin can answer "how much do I owe this week" with zero manual calculation.
