import { supabase } from '@/src/lib/supabase';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';
import type { Tables } from '@/src/types/database';

export type Profile = Tables<'profiles'>;
export type ProfileWithEmail = Profile & { email?: string };

/**
 * Fetch the profile row for the given user ID, enriched with Auth email.
 */
export async function getProfile(
  userId: string,
): Promise<{ data: ProfileWithEmail | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  let email: string | undefined;
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    email = authUser?.user?.email;
  } catch {
    // ignore if admin client unavailable
  }

  return { data: { ...data, email }, error: null };
}

/**
 * Update the locale for a user profile.
 */
export async function updateProfileLocale(
  userId: string,
  locale: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ locale })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Fetch all employee profiles, ordered by full_name.
 * Admin-only (RLS enforces this).
 */
export async function getAllEmployees(): Promise<{
  data: Profile[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'employee')
    .order('full_name', { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

/**
 * Create a new employee: creates a Supabase Auth user, then updates
 * their auto-created profile row with role, full_name, and hourly_rate.
 *
 * Requires the service_role client (supabaseAdmin).
 *
 * @returns The generated password (must be shown to admin once) and the new profile.
 */
export async function createEmployee(
  fullName: string,
  email: string,
  hourlyRate: number,
): Promise<{ data: { profile: Profile; password: string } | null; error: Error | null }> {
  // Generate a random password
  const password = generateRandomPassword();

  // 1. Create the auth user via admin API
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { data: null, error: new Error(authError?.message ?? 'Failed to create auth user') };
  }

  const userId = authData.user.id;

  // 2. Update the auto-created profile row
  //    (the on_auth_user_created trigger creates a profile with role='employee' and full_name=email)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: fullName,
      hourly_rate: hourlyRate,
      role: 'employee',
    })
    .eq('id', userId);

  if (profileError) {
    return { data: null, error: new Error(profileError.message) };
  }

  // 3. Fetch the updated profile
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return { data: null, error: new Error(fetchError?.message ?? 'Failed to fetch new profile') };
  }

  return { data: { profile: profile as Profile, password }, error: null };
}

/**
 * Update an employee's profile fields (full_name, hourly_rate, is_active).
 * Admin-only (RLS enforces this).
 */
export async function updateEmployee(
  userId: string,
  updates: { full_name?: string; hourly_rate?: number; is_active?: boolean },
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Deactivate an employee by setting is_active = false.
 * Does NOT delete the user or any historical data.
 */
export async function deactivateEmployee(
  userId: string,
): Promise<{ error: Error | null }> {
  return updateEmployee(userId, { is_active: false });
}



/**
 * Generate a random 12-character password with mixed case, digits, and symbols.
 */
function generateRandomPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
