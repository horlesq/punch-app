-- Grant table permissions to authenticated and service_role
grant select, insert, update, delete on table public.profiles to authenticated, service_role;
grant select, insert, update, delete on table public.punches to authenticated, service_role;

-- Ensure future tables also get these permissions automatically
alter default privileges in schema public grant all on tables to authenticated, service_role;
