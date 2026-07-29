-- =============================================================================
-- Phase 3: audit_log table
-- =============================================================================

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- RLS: admin-only read and insert (no backend layer, admin inserts directly)
alter table public.audit_log enable row level security;

create policy "Admin can read audit_log"
  on public.audit_log for select
  using (public.is_admin());

create policy "Admin can insert audit_log"
  on public.audit_log for insert
  with check (public.is_admin());

-- Grants
grant select, insert on table public.audit_log to authenticated, service_role;
