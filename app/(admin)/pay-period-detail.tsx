import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getProfile, type Profile } from '@/src/api/profiles';
import { getPunchesForEmployeeInWeek, type Punch } from '@/src/api/punches';
import { getBusinessSettings } from '@/src/api/businessSettings';
import {
  getPayPeriod,
  unlockPayPeriod,
  type PayPeriod,
} from '@/src/api/payPeriods';
import { writeAuditEntry } from '@/src/api/auditLog';
import {
  calculateShiftHours,
  calculateShiftPay,
  calculateWeekTotals,
} from '@/src/utils/payCalculations';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { PayPeriodDetailSkeleton } from '@/src/components/ui/Skeleton';

/** Format a date as YYYY-MM-DD. */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Get the Sunday from a Monday. */
function getWeekSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

/** Format short date: "Jul 28" */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Format a time: "14:30" */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Format a date for shift rows: "Mon, Jul 28" */
function formatShiftDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Format a full date for the locked banner: "Jul 28, 2026" */
function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ShiftRow {
  punch: Punch;
  date: string;
  clockIn: string;
  clockOut: string | null;
  rawHours: number;
  breakDeducted: boolean;
  netHours: number;
  shiftPay: number;
}

export default function PayPeriodDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { employeeId, weekStart } = useLocalSearchParams<{
    employeeId: string;
    weekStart: string;
  }>();
  const { profile: adminProfile } = useAuth();

  const [employee, setEmployee] = useState<Profile | null>(null);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [payPeriod, setPayPeriod] = useState<PayPeriod | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [totalPay, setTotalPay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Unlock modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Business settings
  const [breakThreshold, setBreakThreshold] = useState(4);
  const [breakDuration, setBreakDuration] = useState(60);

  const weekMonday = useMemo(() => new Date((weekStart ?? toDateString(new Date())) + 'T00:00:00Z'), [weekStart]);
  const weekSunday = useMemo(() => getWeekSunday(weekMonday), [weekMonday]);

  const currentWeekMonday = useMemo(() => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }, []);
  const isCurrentWeek = useMemo(
    () => weekMonday.getTime() === currentWeekMonday.getTime(),
    [weekMonday, currentWeekMonday]
  );
  const isFutureWeek = useMemo(
    () => weekMonday.getTime() > currentWeekMonday.getTime(),
    [weekMonday, currentWeekMonday]
  );

  const loadData = useCallback(async () => {
    if (!employeeId || !weekStart) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const startIso = weekMonday.toISOString();
    const endIso = weekSunday.toISOString();

    const [profileResult, punchesResult, payPeriodResult, settingsResult] =
      await Promise.all([
        getProfile(employeeId),
        getPunchesForEmployeeInWeek(employeeId, startIso, endIso),
        getPayPeriod(employeeId, weekStart),
        getBusinessSettings(),
      ]);

    if (profileResult.error || !profileResult.data) {
      setErrorMessage(t('admin.payPeriodDetail.errorLoading'));
      setIsLoading(false);
      return;
    }

    setEmployee(profileResult.data);

    let threshold = 4;
    let duration = 60;
    if (!settingsResult.error && settingsResult.data) {
      threshold = settingsResult.data.break_threshold_hours;
      duration = settingsResult.data.break_duration_minutes;
      setBreakThreshold(threshold);
      setBreakDuration(duration);
    }

    const pp = payPeriodResult.data;
    setPayPeriod(pp);

    const hourlyRate = profileResult.data.hourly_rate ?? 0;

    // Build shift rows from punches
    const shiftRows: ShiftRow[] = punchesResult.data.map((punch) => {
      if (!punch.clock_out_at) {
        return {
          punch,
          date: formatShiftDate(punch.clock_in_at),
          clockIn: formatTime(punch.clock_in_at),
          clockOut: null,
          rawHours: 0,
          breakDeducted: false,
          netHours: 0,
          shiftPay: 0,
        };
      }

      const clockIn = new Date(punch.clock_in_at);
      const clockOut = new Date(punch.clock_out_at);
      const rawMs = clockOut.getTime() - clockIn.getTime();
      const rawHours = Math.max(0, rawMs / (1000 * 60 * 60));
      const netHours = calculateShiftHours(clockIn, clockOut, threshold, duration);
      const breakDeducted = rawHours > threshold;
      const shiftPay = calculateShiftPay(netHours, hourlyRate);

      return {
        punch,
        date: formatShiftDate(punch.clock_in_at),
        clockIn: formatTime(punch.clock_in_at),
        clockOut: formatTime(punch.clock_out_at),
        rawHours: Math.round(rawHours * 100) / 100,
        breakDeducted,
        netHours: Math.round(netHours * 100) / 100,
        shiftPay,
      };
    });

    setShifts(shiftRows);

    // Calculate totals
    const isLocked = pp?.locked ?? false;

    if (isLocked && pp) {
      // Locked: use frozen snapshot
      setTotalHours(pp.total_hours);
      setTotalPay(pp.total_pay);
    } else {
      // Unlocked: compute live
      const result = calculateWeekTotals(
        punchesResult.data,
        hourlyRate,
        threshold,
        duration,
      );
      setTotalHours(result.totalHours);
      setTotalPay(result.totalPay);
    }

    setIsLoading(false);
  }, [employeeId, weekStart, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleConfirmUnlock() {
    if (!payPeriod || !adminProfile) return;

    setIsUnlocking(true);

    const { error } = await unlockPayPeriod(payPeriod.id);

    if (error) {
      setErrorMessage(t('admin.payPeriodDetail.errorUnlocking'));
    } else {
      await writeAuditEntry(
        adminProfile.id,
        'week_unlocked',
        'pay_period',
        payPeriod.id,
        { locked: true },
        { locked: false },
      );
      setSuccessMessage(t('admin.payPeriodDetail.unlockSuccess'));
      await loadData();
    }

    setIsUnlocking(false);
    setShowUnlockModal(false);
  }

  if (isLoading) {
    return <PayPeriodDetailSkeleton />;
  }

  if (isFutureWeek) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
        <MaterialCommunityIcons name="calendar-clock" size={48} color={theme.textSecondary} />
        <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-lg mt-4 text-center">
          {t('admin.payPeriodDetail.futureWeekTitle')}
        </Text>
        <Text style={{ color: theme.textSecondary }} className="font-inter text-sm mt-2 text-center">
          {t('admin.payPeriodDetail.futureWeekMessage')}
        </Text>
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
        <Text style={{ color: theme.error }} className="text-center">{errorMessage ?? t('admin.payPeriodDetail.errorLoading')}</Text>
      </View>
    );
  }

  const isLocked = payPeriod?.locked ?? false;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      className="flex-1"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
    >
      {/* Header: Employee name + week range */}
      <View className="mx-4 mb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-xl">
            {employee.full_name}
          </Text>
          <Text style={{ color: theme.textSecondary }} className="font-inter text-sm mt-1">
            {formatShortDate(weekMonday)} – {formatShortDate(weekSunday)}
          </Text>
        </View>
        {isCurrentWeek && (
          <View style={{ backgroundColor: theme.accent + '20' }} className="flex-row items-center px-3 py-1 rounded-full">
            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.accent} />
            <Text style={{ color: theme.accent }} className="font-geist-medium text-xs ml-1">
              {t('admin.payPeriods.currentWeek')}
            </Text>
          </View>
        )}
        {isFutureWeek && (
          <View
            style={{ backgroundColor: theme.accent + '15' }}
            className="flex-row items-center px-3 py-1 rounded-full"
          >
            <MaterialCommunityIcons name="calendar-clock" size={14} color={theme.accent} />
            <Text style={{ color: theme.accent }} className="font-geist-medium text-xs ml-1">
              {t('admin.payPeriods.futureWeek')}
            </Text>
          </View>
        )}
      </View>

      {/* Locked Banner */}
      {isLocked && payPeriod?.paid_at && (
        <View style={{ backgroundColor: theme.success + '20' }} className="mx-4 mb-4 p-4 rounded-2xl flex-row items-center">
          <MaterialCommunityIcons name="lock" size={20} color={theme.success} />
          <Text style={{ color: theme.success }} className="font-geist-semibold text-sm ml-2.5 flex-1">
            {t('admin.payPeriodDetail.lockedBanner', {
              date: formatFullDate(payPeriod.paid_at),
            })}
          </Text>
        </View>
      )}

      {/* Messages */}
      {successMessage && (
        <Text style={{ color: theme.success }} className="text-center text-sm mb-4 mx-4">{successMessage}</Text>
      )}
      {errorMessage && (
        <Text style={{ color: theme.error }} className="text-center text-sm mb-4 mx-4">{errorMessage}</Text>
      )}

      {/* Shifts Table */}
      {shifts.length === 0 ? (
        <View className="justify-center items-center pt-12">
          <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary }} className="text-base mt-4">
            {t('admin.payPeriodDetail.noShifts')}
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
          }}
          className="mx-4 rounded-2xl overflow-hidden"
        >
          {/* Table Header */}
          <View style={{ backgroundColor: theme.surfaceVariant }} className="flex-row items-center px-3 py-3">
            <Text style={{ color: theme.textSecondary }} className="font-geist-semibold text-[10px] sm:text-[11px] tracking-wider uppercase flex-[2.3] ml-2">
              {t('admin.payPeriodDetail.date')}
            </Text>
            <Text style={{ color: theme.textSecondary }} className="font-geist-semibold text-[10px] sm:text-[11px] tracking-wider uppercase flex-[2.3]">
              {t('admin.payPeriodDetail.clockIn')} / {t('admin.payPeriodDetail.clockOut')}
            </Text>
            <Text style={{ color: theme.textSecondary }} className="font-geist-semibold text-[10px] sm:text-[11px] tracking-wider uppercase flex-[1.2] text-center">
              {t('admin.payPeriodDetail.netHours')}
            </Text>
            <Text style={{ color: theme.textSecondary }} className="font-geist-semibold text-[10px] sm:text-[11px] tracking-wider uppercase flex-[1.4] text-right mr-2">
              {t('admin.payPeriodDetail.shiftPay')}
            </Text>
          </View>

          {/* Shift Rows */}
          {shifts.map((shift, index) => (
            <View
              key={shift.punch.id}
              style={{
                borderBottomColor: index < shifts.length - 1 ? theme.borderLight + '40' : 'transparent',
                borderBottomWidth: index < shifts.length - 1 ? 1 : 0,
              }}
              className="flex-row items-center px-3 py-3.5"
            >
              {/* Date */}
              <View className="flex-[2.3]">
                <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-xs" numberOfLines={1}>
                  {shift.date}
                </Text>
              </View>

              {/* Time Interval & Break Note */}
              <View className="flex-[2.3]">
                <Text style={{ color: theme.textSecondary }} className="font-inter text-xs" numberOfLines={1}>
                  {shift.clockIn} – {shift.clockOut ?? t('admin.payPeriodDetail.inProgress')}
                </Text>
                {shift.breakDeducted && (
                  <Text style={{ color: theme.textSecondary }} className="font-inter text-[10px] opacity-70 mt-0.5" numberOfLines={1}>
                    • {t('admin.payPeriodDetail.breakDeducted')}
                  </Text>
                )}
              </View>

              {/* Net Hours */}
              <View className="flex-[1.2] items-center justify-center">
                <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-xs">
                  {shift.netHours.toFixed(1)}h
                </Text>
              </View>

              {/* Shift Pay */}
              <View className="flex-[1.4] items-end justify-center">
                <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-xs sm:text-sm">
                  ${shift.shiftPay.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Week Totals Summary Card */}
      <View
        className="mx-4 mt-4 p-4 rounded-2xl flex-row justify-between items-center"
        style={{
          backgroundColor: theme.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View>
          <Text style={{ color: '#ffffff' }} className="font-geist-medium text-xs opacity-80 uppercase tracking-wider">
            {t('admin.payPeriodDetail.totalHours')}
          </Text>
          <Text style={{ color: '#ffffff' }} className="font-geist-bold text-xl sm:text-2xl mt-0.5">
            {totalHours.toFixed(1)}h
          </Text>
        </View>
        <View className="items-end">
          <Text style={{ color: '#ffffff' }} className="font-geist-medium text-xs opacity-80 uppercase tracking-wider">
            {t('admin.payPeriodDetail.totalPay')}
          </Text>
          <Text style={{ color: '#ffffff' }} className="font-geist-bold text-xl sm:text-2xl mt-0.5">
            ${totalPay.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Unlock Button — only for locked weeks */}
      {isLocked && (
        <Pressable
          style={{ backgroundColor: theme.error + '20' }}
          className="mx-4 mt-4 rounded-2xl p-4 items-center flex-row justify-center active:opacity-80"
          onPress={() => setShowUnlockModal(true)}
        >
          <MaterialCommunityIcons name="lock-open-outline" size={18} color={theme.error} />
          <Text style={{ color: theme.error }} className="font-geist-semibold text-base ml-2">
            {t('admin.payPeriodDetail.unlock')}
          </Text>
        </Pressable>
      )}

      {/* Unlock Confirmation Modal */}
      <ConfirmModal
        visible={showUnlockModal}
        title={t('admin.payPeriodDetail.unlockTitle')}
        message={t('admin.payPeriodDetail.unlockMessage')}
        confirmText={t('admin.payPeriodDetail.unlock')}
        cancelText={t('common.cancel')}
        isDestructive
        isLoading={isUnlocking}
        onConfirm={handleConfirmUnlock}
        onCancel={() => setShowUnlockModal(false)}
      />
    </ScrollView>
  );
}
