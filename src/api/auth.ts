import { supabase } from '@/src/lib/supabase';

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
