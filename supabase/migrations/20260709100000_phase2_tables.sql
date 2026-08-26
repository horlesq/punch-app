-- =============================================================================
-- Phase 2: business_settings + punch_corrections tables
-- =============================================================================

-- ─── business_settings (single-row config) ──────────────────────────────────
create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'PunchApp',
  logo_url text,
  primary_color text not null default '#0F172A',
  accent_color text,
  break_threshold_hours numeric not null default 4,
  break_duration_minutes integer not null default 60,
  correction_approval_mode text not null default 'manual'
    check (correction_approval_mode in ('auto', 'manual')),
  timezone text not null default 'UTC',
  enabled_features jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS: all authenticated can read; only admin can write
alter table public.business_settings enable row level security;

create policy "All authenticated can read business_settings"
  on public.business_settings for select
  using (true);

create policy "Admin can insert business_settings"
  on public.business_settings for insert
  with check (public.is_admin());

create policy "Admin can update business_settings"
  on public.business_settings for update
  using (public.is_admin());

create policy "Admin can delete business_settings"
  on public.business_settings for delete
  using (public.is_admin());

-- Grants
grant select on table public.business_settings to authenticated, service_role;
grant insert, update, delete on table public.business_settings to authenticated, service_role;

-- Seed default row
insert into public.business_settings (
  business_name,
  primary_color,
  break_threshold_hours,
  break_duration_minutes,
  correction_approval_mode,
  timezone
) values (
  'PunchApp',
  '#0F172A',
  4,
  60,
  'manual',
  'UTC'
);

-- ─── punch_corrections ─────────────────────────────────────────────────────
create table public.punch_corrections (
  id uuid primary key default gen_random_uuid(),
  punch_id uuid references public.punches(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  requested_clock_in_at timestamptz,
  requested_clock_out_at timestamptz,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS: employee can create/read their own; admin can read/write all
alter table public.punch_corrections enable row level security;

create policy "Employees can read own corrections"
  on public.punch_corrections for select
  using (auth.uid() = employee_id);

create policy "Employees can create own corrections"
  on public.punch_corrections for insert
  with check (auth.uid() = employee_id);

create policy "Admin can read all corrections"
  on public.punch_corrections for select
  using (public.is_admin());

create policy "Admin can update all corrections"
  on public.punch_corrections for update
  using (public.is_admin());

create policy "Admin can insert corrections"
  on public.punch_corrections for insert
  with check (public.is_admin());

create policy "Admin can delete corrections"
  on public.punch_corrections for delete
  using (public.is_admin());

-- Grants
grant select, insert, update, delete on table public.punch_corrections to authenticated, service_role;
