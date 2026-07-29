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

import { getAllOpenPunches, type PunchWithEmployee } from '@/src/api/punches';
import { getPendingCorrectionsCount } from '@/src/api/corrections';
import { colors } from '@/src/theme/colors';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [openPunches, setOpenPunches] = useState<PunchWithEmployee[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [punchesResult, countResult] = await Promise.all([
      getAllOpenPunches(),
      getPendingCorrectionsCount(),
    ]);

    if (!punchesResult.error) {
      setOpenPunches(punchesResult.data);
    }

    if (!countResult.error) {
      setPendingCount(countResult.count);
    }

    setIsLoading(false);
  }, []);

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
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
    >
      {/* Currently Clocked In Section */}
      <View className="mx-4 mb-6">
        <Text className="font-geist-bold text-on-surface text-lg mb-3">
          {t('admin.dashboard.clockedIn')}
        </Text>

        {openPunches.length === 0 ? (
          <View
            className="bg-surface-container-lowest rounded-xl p-6 items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialCommunityIcons name="account-clock-outline" size={40} color={colors.textSecondary} />
            <Text className="text-on-surface-variant text-sm mt-3">
              {t('admin.dashboard.clockedInEmpty')}
            </Text>
          </View>
        ) : (
          <View
            className="bg-surface-container-lowest rounded-xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {openPunches.map((punch, index) => (
              <View
                key={punch.id}
                className={`flex-row items-center justify-between p-4 ${
                  index < openPunches.length - 1 ? 'border-b border-outline-variant/30' : ''
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-success/15 justify-center items-center mr-3">
                    <MaterialCommunityIcons name="account" size={20} color={colors.success} />
                  </View>
                  <View>
                    <Text className="font-geist-semibold text-on-surface text-[15px]">
                      {punch.employee_name}
                    </Text>
                    <Text className="font-inter text-xs text-on-surface-variant mt-0.5">
                      {t('admin.dashboard.clockedInSince', { time: formatClockInTime(punch.clock_in_at) })}
                    </Text>
                  </View>
                </View>
                <View className="bg-success/15 rounded-full px-3 py-1.5">
                  <Text className="font-geist-medium text-success text-xs">
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
        <Text className="font-geist-bold text-on-surface text-lg mb-3">
          {t('admin.dashboard.pendingCorrections')}
        </Text>

        <Pressable
          className="bg-surface-container-lowest rounded-xl p-4 active:opacity-80"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => router.push('/(admin)/corrections-review')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
                  pendingCount > 0 ? 'bg-warning/15' : 'bg-on-surface/10'
                }`}
              >
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={20}
                  color={pendingCount > 0 ? colors.warning : colors.textSecondary}
                />
              </View>
              <View>
                <Text className="font-geist-semibold text-on-surface text-[15px]">
                  {pendingCount > 0
                    ? t('admin.dashboard.pendingCorrectionsCount', { count: pendingCount })
                    : t('admin.dashboard.noPendingCorrections')}
                </Text>
                {pendingCount > 0 && (
                  <Text className="font-inter text-xs text-on-surface-variant mt-0.5">
                    {t('admin.dashboard.reviewCorrections')}
                  </Text>
                )}
              </View>
            </View>
            {pendingCount > 0 && (
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
            )}
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
