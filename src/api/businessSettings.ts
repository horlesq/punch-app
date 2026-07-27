import { supabase } from '@/src/lib/supabase';
import type { Tables } from '@/src/types/database';

export type BusinessSettings = Tables<'business_settings'>;

/**
 * Fetch the single business_settings row.
 * Every Supabase instance has exactly one row seeded by the Phase 2 migration.
 */
export async function getBusinessSettings(): Promise<{
  data: BusinessSettings | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}
