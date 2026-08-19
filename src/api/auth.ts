import { supabase } from '@/src/lib/supabase';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

/**
 * Sign in with email and password via Supabase Auth.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Sign out the current user.
 * Falls back to local scope sign out if the server session is stale/invalid (e.g., after DB reset).
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Fall back to local scope sign out if global server logout fails
      await supabase.auth.signOut({ scope: 'local' });
    }
  } catch {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }

  return { error: null };
}

/**
 * Send a password reset email to the given address via Supabase Auth.
 */
export async function resetPassword(
  email: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Change current user password directly after verifying current password.
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ error: Error | null }> {
  // 1. Verify current password credentials
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: new Error('INVALID_CURRENT_PASSWORD') };
  }

  // 2. Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: new Error(updateError.message) };
  }

  return { error: null };
}

/**
 * Update user email address after verifying current password.
 * Uses service role client (supabaseAdmin) to immediately update and confirm email.
 */
export async function updateUserEmail(
  userId: string,
  currentEmail: string,
  currentPassword: string,
  newEmail: string,
): Promise<{ error: Error | null }> {
  const cleanEmail = newEmail.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: new Error('INVALID_EMAIL') };
  }

  // 1. Verify current password credentials
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });

  if (signInError) {
    return { error: new Error('INVALID_CURRENT_PASSWORD') };
  }

  // 2. Update email address via admin client
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email: cleanEmail,
    email_confirm: true,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}
