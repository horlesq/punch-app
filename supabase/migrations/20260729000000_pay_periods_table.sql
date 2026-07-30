-- =============================================================================
-- Phase 4: pay_periods table — weekly pay snapshots
-- =============================================================================

create table public.pay_periods (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  total_hours numeric not null default 0,
  total_pay numeric not null default 0,
  is_paid boolean not null default false,
  paid_at timestamptz,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Unique constraint: one snapshot per employee per week
alter table public.pay_periods
  add constraint pay_periods_employee_week_unique
  unique (employee_id, week_start_date);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.pay_periods enable row level security;

-- Employee can read only their own rows
create policy "Employees can read own pay_periods"
  on public.pay_periods for select
  using (auth.uid() = employee_id);

-- Admin can read all rows
create policy "Admin can read all pay_periods"
  on public.pay_periods for select
  using (public.is_admin());

-- Admin can insert pay_periods
create policy "Admin can insert pay_periods"
  on public.pay_periods for insert
  with check (public.is_admin());

-- Admin can update pay_periods
create policy "Admin can update pay_periods"
  on public.pay_periods for update
  using (public.is_admin());

-- Admin can delete pay_periods
create policy "Admin can delete pay_periods"
  on public.pay_periods for delete
  using (public.is_admin());

-- ─── Grants ──────────────────────────────────────────────────────────────────

grant select on table public.pay_periods to authenticated, service_role;
grant insert, update, delete on table public.pay_periods to authenticated, service_role;
