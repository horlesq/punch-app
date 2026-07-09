-- Drop the recursive policies
drop policy if exists "Admin can read all profiles" on public.profiles;
drop policy if exists "Admin can update all profiles" on public.profiles;
drop policy if exists "Admin can insert profiles" on public.profiles;

drop policy if exists "Admin can read all punches" on public.punches;
drop policy if exists "Admin can update all punches" on public.punches;

-- Create a security definer function to check admin role without triggering RLS recursion
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Recreate policies using the function
create policy "Admin can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admin can update all profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Admin can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

create policy "Admin can read all punches"
  on public.punches for select
  using (public.is_admin());

create policy "Admin can update all punches"
  on public.punches for update
  using (public.is_admin());
