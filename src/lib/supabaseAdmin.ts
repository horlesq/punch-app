import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/src/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Admin-only Supabase client using the service_role key.
 * Used exclusively for admin operations that require elevated privileges,
 * such as creating new auth users (employees).
 *
 * NEVER use this client for regular user operations.
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    storageKey: 'sb-admin-auth-token',
    autoRefreshToken: false,
    persistSession: false,
  },
});
