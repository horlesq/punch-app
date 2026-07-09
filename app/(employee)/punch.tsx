import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import {
  closePunch,
  createPunch,
  getCurrentOpenPunch,
  type Punch,
} from '@/src/api/punches';

export default function PunchScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [openPunch, setOpenPunch] = useState<Punch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isClockedIn = openPunch !== null;

  /** Fetch the current open punch on mount and after each punch action. */
  const loadOpenPunch = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);
    const { data, error } = await getCurrentOpenPunch(profile.id);

    if (error) {
      setErrorMessage(t('punch.errorGeneric'));
    } else {
      setOpenPunch(data);
      setErrorMessage(null);
    }

    setIsLoading(false);
  }, [profile, t]);

  useEffect(() => {
    loadOpenPunch();
  }, [loadOpenPunch]);

  /** Handle clock in / clock out. */
  async function handlePunch() {
    if (!profile) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    if (isClockedIn && openPunch) {
      // Clock out
      const { error } = await closePunch(openPunch.id);

      if (error) {
        setErrorMessage(t('punch.errorGeneric'));
      } else {
        setOpenPunch(null);
      }
    } else {
      // Clock in
      const { data, error } = await createPunch(profile.id);

      if (error) {
        setErrorMessage(t('punch.errorGeneric'));
      } else {
        setOpenPunch(data);
      }
    }

    setIsSubmitting(false);
  }

  /** Format the clock-in timestamp for display. */
  function formatClockInTime(): string {
    if (!openPunch) return '';

    const date = new Date(openPunch.clock_in_at);

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-background px-6">
      {/* Status text */}
      <Text className="mb-10 text-center text-textSecondary text-lg">
        {isClockedIn
          ? t('punch.clockedInSince', { time: formatClockInTime() })
          : t('punch.notClockedIn')}
      </Text>

      {/* Big punch button */}
      <Pressable
        className={`w-52 h-52 rounded-full justify-center items-center shadow-md elevation-4 ${
          isClockedIn ? 'bg-error' : 'bg-success'
        }`}
        style={({ pressed }) => ({
          opacity: pressed || isSubmitting ? 0.8 : 1,
        })}
        onPress={handlePunch}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="large" className="text-textInverse" color="#FFFFFF" />
        ) : (
          <Text className="font-bold text-center text-textInverse text-2xl">
            {isClockedIn ? t('punch.clockOut') : t('punch.clockIn')}
          </Text>
        )}
      </Pressable>

      {/* Error message */}
      {errorMessage ? (
        <Text className="mt-6 text-center text-error text-sm">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
