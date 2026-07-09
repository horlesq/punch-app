import { Redirect } from 'expo-router';

import { useAuth } from '@/app/_layout';

/**
 * Root index — redirects authenticated users to their role-appropriate route group.
 * Unauthenticated users are handled by the root _layout.tsx (redirected to login).
 */
export default function Index() {
  const { profile } = useAuth();

  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(employee)/punch" />;
}
