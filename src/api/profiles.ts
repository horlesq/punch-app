import { supabase } from '@/src/lib/supabase';
import type { Tables } from '@/src/types/database';

export type Profile = Tables<'profiles'>;

/**
 * Fetch the profile row for the given user ID.
 */
export async function getProfile(
  userId: string,
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}
