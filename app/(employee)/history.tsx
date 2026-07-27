import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { getEmployeePunches, type Punch } from '@/src/api/punches';
import { getPendingCorrections, type PunchCorrection } from '@/src/api/corrections';
import { getBusinessSettings } from '@/src/api/businessSettings';
import { calculateShiftHours } from '@/src/utils/payCalculations';
import { colors } from '@/src/theme/colors';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();

  const [punches, setPunches] = useState<Punch[]>([]);
  const [pendingPunchIds, setPendingPunchIds] = useState<Set<string>>(new Set());
  const [pendingCorrectionsMap, setPendingCorrectionsMap] = useState<Map<string, PunchCorrection>>(new Map());
  const [breakThreshold, setBreakThreshold] = useState(4);
  const [breakDuration, setBreakDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Fetch punches, pending corrections, and business settings in parallel
    const [punchesResult, correctionsResult, settingsResult] = await Promise.all([
      getEmployeePunches(profile.id),
      getPendingCorrections(profile.id),
      getBusinessSettings(),
    ]);

    if (punchesResult.error) {
      setErrorMessage(t('history.errorLoading'));
    } else {
      let combinedPunches = [...(punchesResult.data || [])];
      
      if (!correctionsResult.error && correctionsResult.data) {
        const pendingMissed = correctionsResult.data.filter(c => c.punch_id === null && c.status === 'pending');
        for (const missed of pendingMissed) {
          if (missed.requested_clock_in_at && missed.requested_clock_out_at) {
            combinedPunches.push({
              id: `pending-${missed.id}`,
              employee_id: missed.employee_id,
              clock_in_at: missed.requested_clock_in_at,
              clock_out_at: missed.requested_clock_out_at,
              source: 'correction',
              status: 'pending',
              created_at: missed.created_at,
            });
          }
        }
      }
      
      combinedPunches.sort((a, b) => new Date(b.clock_in_at).getTime() - new Date(a.clock_in_at).getTime());
      setPunches(combinedPunches);
    }

    if (!correctionsResult.error && correctionsResult.data) {
      const ids = new Set<string>();
      const map = new Map<string, PunchCorrection>();
      for (const c of correctionsResult.data) {
        if (c.status === 'pending' && c.punch_id) {
          ids.add(c.punch_id);
          map.set(c.punch_id, c);
        }
      }
      setPendingPunchIds(ids);
      setPendingCorrectionsMap(map);
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

  /** Format a timestamp to a short date string (e.g. "Jul 9"). */
  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  /** Format a timestamp to a time string (e.g. "08:30"). */
  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function renderPunchRow({ item }: { item: Punch }) {
    const isInProgress = item.clock_out_at === null;
    const isPendingMissed = item.id.startsWith('pending-');
    const hasPendingCorrection = pendingPunchIds.has(item.id) || isPendingMissed;
    const pendingCorrection = pendingCorrectionsMap.get(item.id);

    let netHours = 0;
    let breakApplied = false;

    if (!isInProgress && item.clock_out_at) {
      const clockIn = new Date(item.clock_in_at);
      const clockOut = new Date(item.clock_out_at);
      const grossMs = clockOut.getTime() - clockIn.getTime();
      const grossHours = grossMs / (1000 * 60 * 60);

      netHours = calculateShiftHours(clockIn, clockOut, breakThreshold, breakDuration);
      breakApplied = grossHours > breakThreshold;
    }

    return (
      <View
        className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Top row: date + badges */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-geist-semibold text-on-surface text-base">
            {formatDate(item.clock_in_at)}
          </Text>
          <View className="flex-row gap-2">
            {isInProgress && (
              <View className="bg-success/15 rounded-full px-3 py-1">
                <Text className="text-success font-geist-medium text-xs">
                  {t('history.inProgress')}
                </Text>
              </View>
            )}
            {hasPendingCorrection && (
              <View 
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
                className="rounded-full px-3 py-1 flex-row items-center"
              >
                <View 
                  style={{ backgroundColor: colors.warning }}
                  className="w-1.5 h-1.5 rounded-full mr-1.5" 
                />
                <Text style={{ color: colors.warning }} className="font-geist-semibold text-xs">
                  {t('history.pendingCorrection')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Time row */}
        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
          <Text className="text-on-surface-variant text-sm ml-1.5">
            {formatTime(item.clock_in_at)}
          </Text>
          <Text className="text-on-surface-variant text-sm mx-2">→</Text>
          <Text className="text-on-surface-variant text-sm">
            {isInProgress ? '—' : formatTime(item.clock_out_at!)}
          </Text>
        </View>

        {/* Hours + break row */}
        {!isInProgress && (
          <View className="flex-row items-center mb-3">
            <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
            <Text className="text-on-surface font-geist-medium text-sm ml-1.5">
              {t('history.hoursWorked', { hours: netHours.toFixed(1) })}
            </Text>
            {breakApplied && (
              <Text className="text-on-surface-variant text-xs ml-2">
                {t('history.breakDeducted', { minutes: breakDuration })}
              </Text>
            )}
          </View>
        )}

        {/* Pending requested changes section */}
        {pendingCorrection && (() => {
          const reqClockIn = pendingCorrection.requested_clock_in_at || item.clock_in_at;
          const reqClockOut = pendingCorrection.requested_clock_out_at || item.clock_out_at;
          const reqDate = formatDate(reqClockIn);

          return (
            <View className="mt-1 mb-2 p-3 rounded-xl bg-warning/10">
              <View className="flex-row items-center flex-wrap">
                <MaterialCommunityIcons name="clock-edit-outline" size={16} color={colors.warning} />
                <Text style={{ color: colors.warning }} className="font-geist-medium text-sm ml-1.5 mr-1.5">
                  {t('history.requested')}
                </Text>
                <Text style={{ color: colors.warning }} className="font-geist-semibold text-sm">
                  {reqDate} • {formatTime(reqClockIn)} → {reqClockOut ? formatTime(reqClockOut) : '—'}
                </Text>
              </View>
              {pendingCorrection.reason ? (
                <Text className="text-on-surface-variant text-xs mt-1.5 ml-5.5 italic" numberOfLines={2}>
                  "{pendingCorrection.reason}"
                </Text>
              ) : null}
            </View>
          );
        })()}

        {/* Report button */}
        {!hasPendingCorrection && (
          <Pressable
            className="flex-row items-center self-start active:opacity-60"
            onPress={() => router.push({
              pathname: '/(employee)/correction',
              params: { 
                punchId: item.id, 
                date: item.clock_in_at,
                clockIn: item.clock_in_at,
                clockOut: item.clock_out_at || ''
              },
            })}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.accent} />
            <Text style={{ color: colors.accent }} className="font-geist-medium text-xs ml-1">
              {t('history.correctTimes')}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-error text-center mb-4">{errorMessage}</Text>
        <Pressable onPress={loadData} className="active:opacity-70">
          <Text style={{ color: colors.accent }} className="font-geist-semibold">
            {t('common.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}>
        <Pressable
          className="bg-surface-container-lowest flex-row items-center justify-center p-4 mx-4 mb-6 rounded-xl active:opacity-60"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => router.push('/(employee)/correction')}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="font-geist-semibold text-sm ml-2">
            {t('history.reportMissedShift')}
          </Text>
        </Pressable>

        {punches.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-20">
            <MaterialCommunityIcons name="history" size={48} color={colors.textSecondary} />
            <Text className="text-on-surface-variant text-base mt-4">
              {t('history.empty')}
            </Text>
          </View>
        ) : (
          punches.map((item) => (
            <React.Fragment key={item.id}>
              {renderPunchRow({ item })}
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </View>
  );
}
