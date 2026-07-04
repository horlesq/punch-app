-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'employee')),
  full_name text not null,
  hourly_rate numeric,
  is_active boolean not null default true,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

-- auto-create profile row when a Supabase auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'employee', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- punches
create table public.punches (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  source text not null default 'live' check (source in ('live', 'correction')),
  status text not null default 'approved' check (status in ('approved', 'pending')),
  created_at timestamptz not null default now()
);

-- RLS: profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admin can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can insert profiles"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- RLS: punches
alter table public.punches enable row level security;

create policy "Employees can read own punches"
  on public.punches for select
  using (auth.uid() = employee_id);

create policy "Employees can insert own punches"
  on public.punches for insert
  with check (auth.uid() = employee_id);

create policy "Employees can update own punches"
  on public.punches for update
  using (auth.uid() = employee_id);

create policy "Admin can read all punches"
  on public.punches for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can update all punches"
  on public.punches for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );