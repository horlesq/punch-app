-- =============================================================================
-- Migration: Add missing RLS policy for Admin to insert punches
-- Required when admins approve missed shift corrections (which creates a new punch row)
-- =============================================================================

create policy "Admin can insert punches"
  on public.punches for insert
  with check (public.is_admin());
