import { useEffect, useState } from 'react';

import type { Session } from '@supabase/supabase-js';

import { getProfile, type Profile } from '@/src/api/profiles';
import { supabase } from '@/src/lib/supabase';

export interface SessionState {
  /** Whether the initial session check is still loading. */
  isLoading: boolean;
  /** Whether the profile is currently being fetched. */
  isProfileLoading: boolean;
  /** The Supabase Auth session, or null if unauthenticated. */
  session: Session | null;
  /** The user's profile row (role, full_name, locale), or null if not yet loaded. */
  profile: Profile | null;
}

/**
 * Hook that reads the current Supabase Auth session and the user's profile row.
 * Subscribes to auth state changes so navigation can react to login/logout.
 */
export function useSession(): SessionState {
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Get the initial session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);

        if (initialSession?.user) {
          getProfile(initialSession.user.id)
            .then(({ data }) => {
              setProfile(data);
            })
            .catch((err) => {
              console.error('Failed to fetch profile:', err);
            })
            .finally(() => {
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
        setIsProfileLoading(true);
        getProfile(newSession.user.id)
          .then(({ data }) => {
            setProfile(data);
          })
          .catch((err) => {
             console.error('Auth state change profile fetch failed:', err);
          })
          .finally(() => {
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
  }, []);

  return { isLoading, isProfileLoading, session, profile };
}
