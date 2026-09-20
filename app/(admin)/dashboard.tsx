import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';
import { getAllOpenPunches, type PunchWithEmployee } from '@/src/api/punches';
import { getPendingCorrectionsCount } from '@/src/api/corrections';
import { DashboardSkeleton } from '@/src/components/ui/Skeleton';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const [openPunches, setOpenPunches] = useState<PunchWithEmployee[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [punchesResult, countResult] = await Promise.all([
      getAllOpenPunches(),
      getPendingCorrectionsCount(),
    ]);

    if (punchesResult.error || countResult.error) {
      setErrorMessage(t('common.somethingWentWrong'));
    } else {
      setOpenPunches(punchesResult.data || []);
      setPendingCount(countResult.count || 0);
    }

    setIsLoading(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function formatTimeSince(isoString: string): string {
    const now = new Date();
    const clockIn = new Date(isoString);
    const diffMs = now.getTime() - clockIn.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins}m`;
  }

  function formatClockInTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (isLoading) {
    return (
      <ScreenWrapper scrollable={false}>
        <DashboardSkeleton />
      </ScreenWrapper>
    );
  }

  if (errorMessage) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
        <Text style={{ color: theme.error }} className="text-center mb-4">{errorMessage}</Text>
        <Pressable onPress={loadData} className="active:opacity-70">
          <Text style={{ color: theme.accent }} className="font-geist-semibold">
            {t('common.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      {/* Currently Clocked In Section */}
      <View className="mx-4 mb-6 mt-4">
        <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-lg mb-3">
          {t('admin.dashboard.clockedIn')}
        </Text>

        {openPunches.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.surfaceContainerLowest,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
            className="rounded-xl p-6 items-center"
          >
            <MaterialCommunityIcons name="account-clock-outline" size={40} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary }} className="text-sm mt-3">
              {t('admin.dashboard.clockedInEmpty')}
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: theme.surfaceContainerLowest,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
            className="rounded-xl overflow-hidden"
          >
            {openPunches.map((punch, index) => (
              <View
                key={punch.id}
                style={{
                  borderBottomColor: index < openPunches.length - 1 ? theme.borderLight + '40' : 'transparent',
                  borderBottomWidth: index < openPunches.length - 1 ? 1 : 0,
                }}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-success/15 justify-center items-center mr-3">
                    <MaterialCommunityIcons name="account" size={20} color={theme.success} />
                  </View>
                  <View>
                    <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-[15px]">
                      {punch.employee_name}
                    </Text>
                    <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-0.5">
                      {t('admin.dashboard.clockedInSince', { time: formatClockInTime(punch.clock_in_at) })}
                    </Text>
                  </View>
                </View>
                <View className="bg-success/15 rounded-full px-3 py-1.5">
                  <Text style={{ color: theme.success }} className="font-geist-medium text-xs">
                    {formatTimeSince(punch.clock_in_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Pending Corrections Section */}
      <View className="mx-4">
        <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-lg mb-3">
          {t('admin.dashboard.pendingCorrections')}
        </Text>

        <Pressable
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
          className="rounded-xl p-4 active:opacity-80"
          onPress={() => router.push('/(admin)/corrections-review')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                style={{
                  backgroundColor: pendingCount > 0 ? theme.warning + '25' : theme.surfaceVariant,
                }}
                className="w-10 h-10 rounded-full justify-center items-center mr-3"
              >
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={20}
                  color={pendingCount > 0 ? theme.warning : theme.textSecondary}
                />
              </View>
              <View>
                <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-[15px]">
                  {pendingCount > 0
                    ? t('admin.dashboard.pendingCorrectionsCount', { count: pendingCount })
                    : t('admin.dashboard.noPendingCorrections')}
                </Text>
                {pendingCount > 0 && (
                  <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-0.5">
                    {t('admin.dashboard.reviewCorrections')}
                  </Text>
                )}
              </View>
            </View>
            {pendingCount > 0 && (
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
            )}
          </View>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
