import 'react-native-gesture-handler';
import React, { createContext, useContext, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Redirect, Slot, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { 
  Inter_400Regular, 
  Inter_500Medium 
} from '@expo-google-fonts/inter';
import { 
  Geist_400Regular, 
  Geist_500Medium, 
  Geist_600SemiBold, 
  Geist_700Bold 
} from '@expo-google-fonts/geist';

import { useSession, type SessionState } from '@/src/hooks/useSession';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import '@/src/lib/i18n';
import '../global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Auth context — lets any descendant read session/profile without prop-drilling.
 * Components should use `useAuth()` to access this.
 */
const AuthContext = createContext<SessionState>({
  isLoading: true,
  isProfileLoading: true,
  session: null,
  profile: null,
  refreshProfile: async () => {},
});

export function useAuth(): SessionState {
  return useContext(AuthContext);
}

/** Inner layout handles auth-based redirects. */
function RootLayoutInner() {
  const sessionState = useSession();
  const segments = useSegments();
  const { theme } = useTheme();

  // Show a loading spinner while the initial session check is in progress.
  if (sessionState.isLoading) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
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
 * handles auth-based redirects and font loading.
 * ThemeProvider wraps everything so useTheme() is available everywhere.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
