import { useEffect, useState } from 'react';

import type { Session } from '@supabase/supabase-js';

import { getProfile, type Profile } from '@/src/api/profiles';
import { supabase } from '@/src/lib/supabase';

export interface SessionState {
  /** Whether the initial session check is still loading. */
  isLoading: boolean;
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
              setIsLoading(false);
            })
            .catch((err) => {
              console.error('Failed to fetch profile:', err);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setIsLoading(false);
      });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        getProfile(newSession.user.id).then(({ data }) => {
          setProfile(data);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isLoading, session, profile };
}
