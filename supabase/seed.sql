-- =============================================================================
-- Supabase Local Development Seed File
-- Automatically populates default test accounts whenever `supabase db reset` runs
-- =============================================================================

-- 1. Create Admin Account (admin@test.com / password123)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@test.com',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'admin@test.com'),
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
);

-- Set admin role and name
update public.profiles
set role = 'admin', full_name = 'Admin User'
where id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Create Employee Account (employee@test.com / password123)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'e0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'employee@test.com',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'e0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'e0000000-0000-0000-0000-000000000001', 'email', 'employee@test.com'),
  'email',
  'e0000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
);

-- Set employee name and hourly rate
update public.profiles
set role = 'employee', full_name = 'John Employee', hourly_rate = 20.00
where id = 'e0000000-0000-0000-0000-000000000001';
