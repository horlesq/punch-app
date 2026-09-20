import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Pressable,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getEmployeePunches, type Punch } from '@/src/api/punches';
import { getBusinessSettings } from '@/src/api/businessSettings';
import { getEmployeePayPeriods } from '@/src/api/payPeriods';
import { calculateWeekTotals } from '@/src/utils/payCalculations';
import { MyPaySkeleton } from '@/src/components/ui/Skeleton';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';

/** Group shifts by ISO week (Mon–Sun). Returns weeks in reverse chronological order. */
function groupByWeek(punches: Punch[]): { weekStart: Date; weekEnd: Date; shifts: Punch[] }[] {
  const weeks = new Map<string, { weekStart: Date; weekEnd: Date; shifts: Punch[] }>();

  for (const punch of punches) {
    const date = new Date(punch.clock_in_at);
    // Get Monday of this date's week
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day; // Sunday is 0
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const key = monday.toISOString().slice(0, 10);

    if (!weeks.has(key)) {
      weeks.set(key, { weekStart: monday, weekEnd: sunday, shifts: [] });
    }
    weeks.get(key)!.shifts.push(punch);
  }

  // Sort by weekStart descending
  return Array.from(weeks.values()).sort(
    (a, b) => b.weekStart.getTime() - a.weekStart.getTime(),
  );
}

/** Check if a date falls in the current ISO week. */
function isCurrentWeek(weekStart: Date): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() + diff);
  thisMonday.setUTCHours(0, 0, 0, 0);

  return weekStart.getTime() === thisMonday.getTime();
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  totalHours: number;
  totalPay: number;
  isCurrent: boolean;
  isPaid: boolean;
}

export default function MyPayScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { theme } = useTheme();

  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [breakThreshold, setBreakThreshold] = useState(4);
  const [breakDuration, setBreakDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hourlyRate = profile?.hourly_rate ?? 0;

  const loadData = useCallback(async () => {
    if (!profile) return;

    setIsLoading(true);
    setErrorMessage(null);

    const [punchesResult, settingsResult, payPeriodsResult] = await Promise.all([
      getEmployeePunches(profile.id),
      getBusinessSettings(),
      getEmployeePayPeriods(profile.id),
    ]);

    if (punchesResult.error) {
      setErrorMessage(t('myPay.errorLoading'));
      setIsLoading(false);
      return;
    }

    let threshold = 4;
    let duration = 60;

    if (!settingsResult.error && settingsResult.data) {
      threshold = settingsResult.data.break_threshold_hours;
      duration = settingsResult.data.break_duration_minutes;
      setBreakThreshold(threshold);
      setBreakDuration(duration);
    }

    const payPeriodsMap = new Map(
      (payPeriodsResult.data ?? []).map((pp) => [pp.week_start_date, pp])
    );

    const grouped = groupByWeek(punchesResult.data);
    const weekData: WeekData[] = grouped.map((group) => {
      const weekStartStr = group.weekStart.toISOString().slice(0, 10);
      const pp = payPeriodsMap.get(weekStartStr);
      const isPaid = (pp?.locked && pp?.is_paid) ?? false;

      let totalHours: number;
      let totalPay: number;

      if (isPaid && pp) {
        totalHours = pp.total_hours;
        totalPay = pp.total_pay;
      } else {
        const totals = calculateWeekTotals(
          group.shifts,
          hourlyRate,
          threshold,
          duration,
        );
        totalHours = totals.totalHours;
        totalPay = totals.totalPay;
      }

      return {
        weekStart: group.weekStart,
        weekEnd: group.weekEnd,
        totalHours,
        totalPay,
        isCurrent: isCurrentWeek(group.weekStart),
        isPaid,
      };
    });

    setWeeks(weekData);
    setIsLoading(false);
  }, [profile, hourlyRate, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function formatWeekDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  function renderWeekCard({ item }: { item: WeekData }) {
    return (
      <View
        className="rounded-xl mx-4 mb-3 p-4"
        style={{
          backgroundColor: theme.surfaceContainerLowest,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Week header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base">
            {item.isCurrent
              ? t('myPay.currentWeek')
              : t('myPay.weekOf', { date: formatWeekDate(item.weekStart) })}
          </Text>
          <View
            style={{
              backgroundColor: item.isPaid ? theme.success + '25' : theme.surfaceVariant,
            }}
            className="rounded-full px-3 py-1"
          >
            <Text
              style={{ color: item.isPaid ? theme.success : theme.textSecondary }}
              className="font-geist-semibold text-xs"
            >
              {item.isPaid ? t('myPay.paid') : t('myPay.unpaid')}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row justify-between">
          {/* Hours */}
          <View className="items-center flex-1">
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSecondary} />
            <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-lg mt-1">
              {t('myPay.totalHours', { hours: item.totalHours.toFixed(1) })}
            </Text>
          </View>

          {/* Divider */}
          <View style={{ backgroundColor: theme.borderLight }} className="w-px self-stretch mx-4" />

          {/* Pay */}
          <View className="items-center flex-1">
            <MaterialCommunityIcons name="cash" size={20} color={theme.textSecondary} />
            <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-lg mt-1">
              {t('myPay.totalPay', { amount: `$${item.totalPay.toFixed(2)}` })}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <ScreenWrapper scrollable={false}>
        <MyPaySkeleton />
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
      {/* Hourly rate header */}
      <View style={{ backgroundColor: theme.primary }} className="mx-4 mt-4 mb-2 p-4 rounded-xl">
        <Text style={{ color: '#ffffff' }} className="font-inter text-sm mb-1 opacity-90">
          {t('myPay.hourlyRate')}
        </Text>
        <Text style={{ color: '#ffffff' }} className="font-geist-bold text-2xl">
          {t('myPay.perHour', { rate: `$${hourlyRate.toFixed(2)}` })}
        </Text>
      </View>

      <View className="pt-2">
      {weeks.length === 0 ? (
        <View className="flex-1 justify-center items-center pt-20">
          <MaterialCommunityIcons name="cash-remove" size={48} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary }} className="text-base mt-4">
            {t('myPay.noData')}
          </Text>
        </View>
      ) : (
        weeks.map((item) => (
          <React.Fragment key={item.weekStart.toISOString()}>
            {renderWeekCard({ item })}
          </React.Fragment>
        ))
      )}
      </View>
    </ScreenWrapper>
  );
}
