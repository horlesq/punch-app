import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { supabase } from '@/src/lib/supabase';

/**
 * Root index — redirects authenticated users to their role-appropriate route group.
 * Unauthenticated users are handled by the root _layout.tsx (redirected to login).
 */
export default function Index() {
  const { session, profile, isProfileLoading } = useAuth();
  const { theme } = useTheme();

  // Wait for profile data to arrive before making role-based routing decisions
  if (isProfileLoading) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  // If we have a session but NO profile (fetch failed or user doesn't exist in db)
  if (session && !profile) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center p-6">
        <Text style={{ color: theme.error }} className="text-center mb-4 font-geist-bold text-xl">Profile Error</Text>
        <Text style={{ color: theme.textSecondary }} className="text-center mb-8">We couldn't load your profile. Please try logging in again.</Text>
        <Pressable 
          style={{ backgroundColor: theme.primary }}
          className="px-6 py-3 rounded-lg"
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={{ color: theme.textInverse }} className="font-geist-bold">Log Out</Text>
        </Pressable>
      </View>
    );
  }

  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(employee)/punch" />;
}
