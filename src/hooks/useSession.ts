import { useCallback, useEffect, useState } from 'react';

import type { Session } from '@supabase/supabase-js';

import { getProfile, type ProfileWithEmail } from '@/src/api/profiles';
import i18n from '@/src/lib/i18n';
import { supabase } from '@/src/lib/supabase';

export interface SessionState {
  /** Whether the initial session check is still loading. */
  isLoading: boolean;
  /** Whether the profile is currently being fetched. */
  isProfileLoading: boolean;
  /** The Supabase Auth session, or null if unauthenticated. */
  session: Session | null;
  /** The user's profile row (role, full_name, locale, email), or null if not yet loaded. */
  profile: ProfileWithEmail | null;
  /** Refetches the profile for the current user. */
  refreshProfile: () => Promise<void>;
}

/**
 * Hook that reads the current Supabase Auth session and the user's profile row.
 * Subscribes to auth state changes so navigation can react to login/logout.
 */
export function useSession(): SessionState {
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileWithEmail | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await getProfile(userId);
      if (data && data.is_active === false) {
        // Deactivated employee: force sign out
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      } else {
        setProfile(data);
        if (data?.locale) {
          i18n.changeLanguage(data.locale);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    // Get the initial session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);

        if (initialSession?.user) {
          fetchProfile(initialSession.user.id).finally(() => {
            setIsProfileLoading(false);
            setIsLoading(false);
          });
        } else {
          setIsProfileLoading(false);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setIsProfileLoading(false);
        setIsLoading(false);
      });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        fetchProfile(newSession.user.id).finally(() => {
          setIsProfileLoading(false);
        });
      } else {
        setProfile(null);
        setIsProfileLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return { isLoading, isProfileLoading, session, profile, refreshProfile };
}
