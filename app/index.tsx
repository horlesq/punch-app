import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';

import { useAuth } from '@/app/_layout';
import { supabase } from '@/src/lib/supabase';

/**
 * Root index — redirects authenticated users to their role-appropriate route group.
 * Unauthenticated users are handled by the root _layout.tsx (redirected to login).
 */
export default function Index() {
  const { session, profile, isProfileLoading } = useAuth();

  // Wait for profile data to arrive before making role-based routing decisions
  if (isProfileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }
  
  // If we have a session but NO profile (fetch failed or user doesn't exist in db)
  if (session && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-6">
        <Text className="text-error text-center mb-4 font-geist-bold text-xl">Profile Error</Text>
        <Text className="text-textSecondary text-center mb-8">We couldn't load your profile. Please try logging in again.</Text>
        <Pressable 
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-on-primary font-geist-bold">Log Out</Text>
        </Pressable>
      </View>
    );
  }

  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(employee)/punch" />;
}
