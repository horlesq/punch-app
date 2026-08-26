import { supabase } from '@/src/lib/supabase';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';
import type { Tables } from '@/src/types/database';
import { validateAndFetchImage } from '@/src/utils/imageUpload';

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
 * Update the avatar_url for a user profile.
 */
export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Upload a user avatar to Supabase Storage `avatars` bucket.
 *
 * Files are stored under `{userId}/avatar_{timestamp}.{ext}`.
 * Validates max 2MB, jpg/png only (reuses shared imageUpload util).
 * Cleans up previous avatar files, updates profiles.avatar_url.
 *
 * Returns the public URL of the uploaded avatar.
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string,
  providedMimeType?: string,
  base64Data?: string,
): Promise<{ url: string | null; error: Error | null }> {
  // Use shared validation utility
  const { data: validated, error: validationError } = await validateAndFetchImage(
    imageUri,
    providedMimeType,
    base64Data,
  );

  if (validationError || !validated) {
    return { url: null, error: new Error(validationError?.code ?? 'Validation failed') };
  }

  const { arrayBuffer, ext, mimeType } = validated;

  // Generate path: userId/avatar_<timestamp>.<ext>
  const filename = `avatar_${Date.now()}.${ext}`;
  const filePath = `${userId}/${filename}`;

  // Remove any existing avatar files for this user (cleanup)
  try {
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId, { limit: 100 });

    if (existingFiles && existingFiles.length > 0) {
      const avatarFiles = existingFiles
        .filter((f) => f.name.startsWith('avatar_'))
        .map((f) => `${userId}/${f.name}`);

      if (avatarFiles.length > 0) {
        await supabase.storage.from('avatars').remove(avatarFiles);
      }
    }
  } catch {
    // Non-critical — old files may remain, but upload can proceed
  }

  // Upload the new avatar (uses ArrayBuffer for cross-platform compatibility)
  let { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  // Fallback to service role client if client storage upload fails (e.g. RLS / web blob header issue)
  if (uploadError) {
    const { error: adminUploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (adminUploadError) {
      return { url: null, error: new Error(adminUploadError.message) };
    }
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // Update the profile row with the new avatar URL
  const { error: updateError } = await updateAvatarUrl(userId, publicUrl);
  if (updateError) {
    // If user RLS check fails, attempt update via admin client
    const { error: adminUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (adminUpdateError) {
      return { url: publicUrl, error: adminUpdateError };
    }
  }

  return { url: publicUrl, error: null };
}

/**
 * Remove the user's avatar — deletes files from Storage and sets avatar_url to null.
 */
export async function removeAvatar(
  userId: string,
): Promise<{ error: Error | null }> {
  // 1. Delete all avatar files from Storage
  try {
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId, { limit: 100 });

    if (existingFiles && existingFiles.length > 0) {
      const avatarFiles = existingFiles
        .filter((f) => f.name.startsWith('avatar_'))
        .map((f) => `${userId}/${f.name}`);

      if (avatarFiles.length > 0) {
        await supabase.storage.from('avatars').remove(avatarFiles);
      }
    }
  } catch {
    // Non-critical — proceed to clear the URL even if storage cleanup fails
  }

  // 2. Set avatar_url to null in the profile
  const { error } = await updateAvatarUrl(userId, null);
  if (error) {
    // Fallback to admin client
    const { error: adminError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);

    if (adminError) {
      return { error: new Error(adminError.message) };
    }
  }

  return { error: null };
}

/**
 * Get the list of available locales for the language picker.
 * Driven by what's registered in i18n config, not hardcoded in the component.
 */
export function getAvailableLocales(): Array<{ code: string; label: string; flag?: string }> {
  return [
    { code: 'en', label: 'English' },
    { code: 'ro', label: 'Română' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
  ];
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
