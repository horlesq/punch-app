import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  Image,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import {
  closePunch,
  createPunch,
  getCurrentOpenPunch,
  getEmployeePunches,
  type Punch,
} from '@/src/api/punches';
import { getBusinessSettings } from '@/src/api/businessSettings';
import { calculateShiftHours } from '@/src/utils/payCalculations';
import { PunchSkeleton } from '@/src/components/ui/Skeleton';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function PunchScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [openPunch, setOpenPunch] = useState<Punch | null>(null);
  const [recentPunches, setRecentPunches] = useState<Punch[]>([]);
  const [breakThreshold, setBreakThreshold] = useState(4);
  const [breakDuration, setBreakDuration] = useState(60);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  const isClockedIn = openPunch !== null;

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);

    const [openPunchResult, allPunchesResult, settingsResult] = await Promise.all([
      getCurrentOpenPunch(profile.id),
      getEmployeePunches(profile.id),
      getBusinessSettings(),
    ]);

    if (openPunchResult.error) {
      setErrorMessage(t('punch.errorGeneric'));
    } else {
      setOpenPunch(openPunchResult.data);
      setErrorMessage(null);
    }

    if (!allPunchesResult.error) {
      // Exclude the currently open punch from recent activity, get top 3 completed
      const closedPunches = allPunchesResult.data.filter((p) => p.clock_out_at !== null);
      setRecentPunches(closedPunches.slice(0, 3));
    }

    if (!settingsResult.error && settingsResult.data) {
      setBreakThreshold(settingsResult.data.break_threshold_hours);
      setBreakDuration(settingsResult.data.break_duration_minutes);
    }

    setIsLoading(false);
  }, [profile, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
        // Refresh data to show new shift in recent activity
        loadData();
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

  function getGreeting(): string {
    const hour = currentTime.getHours();
    if (hour < 12) return t('punch.greeting.morning');
    if (hour < 18) return t('punch.greeting.afternoon');
    return t('punch.greeting.evening');
  }

  function formatCurrentDate(): string {
    return currentTime.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatCurrentTime(): string {
    return currentTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function formatPunchRowDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatPunchRowTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (isLoading && !openPunch && recentPunches.length === 0) {
    return (
      <ScreenWrapper scrollable={false}>
        <PunchSkeleton />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="items-center w-full">
      {/* Header */}
      <View className="items-center mt-6 mb-8">
          <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-2xl mb-1.5">
            {getGreeting()}, {profile?.full_name?.split(' ')[0]}!
          </Text>
          <Text style={{ color: theme.textSecondary }} className="font-inter text-sm font-medium">
            {formatCurrentDate()}  •  {formatCurrentTime()}
          </Text>
        </View>

      {/* Punch Button & Status */}
      <View className="items-center w-full mb-12">
        <Pressable
          className="w-[260px] h-[260px] rounded-full justify-center items-center active:opacity-85"
          style={{
            backgroundColor: isClockedIn ? theme.error : theme.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 4,
          }}
          onPress={handlePunch}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name={isClockedIn ? 'stop-circle-outline' : 'gesture-tap-button'}
                size={56}
                color="#ffffff"
                className="mb-2"
              />
              <Text style={{ color: '#ffffff' }} className="font-geist-bold text-xl tracking-wider">
                {isClockedIn ? t('punch.clockOut') : t('punch.clockIn')}
              </Text>
            </>
          )}
        </Pressable>

        {/* Status Pill */}
        <View 
          className="flex-row items-center px-6 py-3.5 rounded-full mt-10"
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            elevation: 2,
          }}
        >
          <View style={{ backgroundColor: isClockedIn ? theme.success : theme.textSecondary }} className="w-2.5 h-2.5 rounded-full mr-2.5" />
          <Text style={{ color: theme.textSecondary }} className="font-inter font-semibold text-xs tracking-wider">
            {isClockedIn ? t('punch.status.onTheClock') : t('punch.status.offTheClock')}
          </Text>
        </View>

        {/* Error message */}
        {errorMessage && (
          <Text style={{ color: theme.error }} className="mt-4 text-center text-sm px-6">
            {errorMessage}
          </Text>
        )}
      </View>

      {/* Recent Activity */}
      <View className="w-full px-6 max-w-lg">
        <View className="flex-row justify-between items-end mb-4">
          <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-xl">
            {t('punch.recentActivity')}
          </Text>
          <Pressable onPress={() => router.push('/(employee)/history')} className="active:opacity-60 mb-0.5">
            <Text style={{ color: theme.accent }} className="font-geist-bold text-sm tracking-wide">
              {t('punch.viewAll')}
            </Text>
          </Pressable>
        </View>

        {/* Activity List Container */}
        <View 
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {recentPunches.length === 0 ? (
            <View className="p-8 items-center">
              <Text style={{ color: theme.textSecondary }} className="font-inter text-sm">
                {t('punch.noRecentActivity')}
              </Text>
            </View>
          ) : (
            recentPunches.map((punch, index) => {
              const clockIn = new Date(punch.clock_in_at);
              const clockOut = new Date(punch.clock_out_at!);
              const netHours = calculateShiftHours(clockIn, clockOut, breakThreshold, breakDuration);
              
              const hours = Math.floor(netHours);
              const minutes = Math.round((netHours % 1) * 60);
              
              return (
                <View
                  key={punch.id}
                  style={{ borderBottomColor: theme.borderLight }}
                  className={`flex-row items-center justify-between p-4 px-5 ${
                    index < recentPunches.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      style={{ backgroundColor: theme.surfaceVariant }}
                      className="w-10 h-10 rounded-full justify-center items-center mr-3.5"
                    >
                      <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSecondary} />
                    </View>
                    <View>
                      <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-[15px] mb-0.5">
                        {formatPunchRowDate(punch.clock_in_at)}
                      </Text>
                      <Text style={{ color: theme.textSecondary }} className="font-inter text-xs font-medium">
                        {formatPunchRowTime(punch.clock_in_at)} - {formatPunchRowTime(punch.clock_out_at!)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: theme.textPrimary }} className="font-geist-medium text-sm">
                    {hours}h {minutes.toString().padStart(2, '0')}m
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>
      </View>
    </ScreenWrapper>
  );
}
