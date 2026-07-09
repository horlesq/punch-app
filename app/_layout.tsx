import React, { createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Redirect, Slot, useSegments } from 'expo-router';

import { useSession, type SessionState } from '@/src/hooks/useSession';
import '@/src/lib/i18n';
import '../global.css';

/**
 * Auth context — lets any descendant read session/profile without prop-drilling.
 * Components should use `useAuth()` to access this.
 */
const AuthContext = createContext<SessionState>({
  isLoading: true,
  session: null,
  profile: null,
});

export function useAuth(): SessionState {
  return useContext(AuthContext);
}

/** Inner layout handles auth-based redirects. */
function RootLayoutInner() {
  const sessionState = useSession();
  const segments = useSegments();

  // Show a loading spinner while the initial session check is in progress.
  if (sessionState.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  // Check if the user is currently on an auth route (e.g. login, register).
  const inAuthGroup = segments[0] === '(auth)';

  // If there is no session and not already on an auth screen, redirect to login.
  if (!sessionState.session && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // If authenticated but still on an auth screen, redirect to the app.
  if (sessionState.session && inAuthGroup) {
    return <Redirect href="/" />;
  }

  // Render the matched child route.
  return (
    <AuthContext.Provider value={sessionState}>
      <Slot />
    </AuthContext.Provider>
  );
}

/**
 * Root layout — wraps the entire app and imports global.css,
 * handles auth-based redirects.
 */
export default function RootLayout() {
  return <RootLayoutInner />;
}
