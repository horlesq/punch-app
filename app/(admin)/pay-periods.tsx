import React, { useCallback, useMemo, useState } from 'react';
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

import { useAuth } from '@/app/_layout';
import { getAllEmployees, type Profile } from '@/src/api/profiles';
import { getPunchesForAllEmployeesInWeek, type Punch } from '@/src/api/punches';
import { getBusinessSettings } from '@/src/api/businessSettings';
import {
  getAllPayPeriodsForWeek,
  createPayPeriod,
  type PayPeriod,
} from '@/src/api/payPeriods';
import { writeAuditEntry } from '@/src/api/auditLog';
import { calculateWeekTotals } from '@/src/utils/payCalculations';
import { PayPeriodsSkeleton } from '@/src/components/ui/Skeleton';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { colors } from '@/src/theme/colors';

/** Get the Monday of the ISO week containing `date`. */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Get the Sunday of the ISO week starting on `monday`. */
function getWeekSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

/** Format a date for display: "Jul 28" */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Format a date as YYYY-MM-DD for API queries and DB keys. */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface EmployeeRow {
  employee: Profile;
  totalHours: number;
  totalPay: number;
  isPaid: boolean;
  isLocked: boolean;
  payPeriod: PayPeriod | null;
}

export default function PayPeriodsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile: adminProfile } = useAuth();

  // Week navigation state — default to current week's Monday
  const [weekMonday, setWeekMonday] = useState<Date>(() => getWeekMonday(new Date()));
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mark as paid confirmation modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<EmployeeRow | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  // Business settings
  const [breakThreshold, setBreakThreshold] = useState(4);
  const [breakDuration, setBreakDuration] = useState(60);

  // Memoize derived week date objects and strings so object references are stable across renders
  const weekSunday = useMemo(() => getWeekSunday(weekMonday), [weekMonday]);
  const weekStartStr = useMemo(() => toDateString(weekMonday), [weekMonday]);
  const weekEndStr = useMemo(() => toDateString(weekSunday), [weekSunday]);

  // Determine current week vs future week
  const currentWeekMonday = useMemo(() => getWeekMonday(new Date()), []);
  const isCurrentWeek = useMemo(
    () => weekMonday.getTime() === currentWeekMonday.getTime(),
    [weekMonday, currentWeekMonday]
  );
  const isFutureWeek = useMemo(
    () => weekMonday.getTime() > currentWeekMonday.getTime(),
    [weekMonday, currentWeekMonday]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const startIso = weekMonday.toISOString();
    const endIso = weekSunday.toISOString();

    const [employeesResult, punchesResult, payPeriodsResult, settingsResult] =
      await Promise.all([
        getAllEmployees(),
        getPunchesForAllEmployeesInWeek(startIso, endIso),
        getAllPayPeriodsForWeek(weekStartStr),
        getBusinessSettings(),
      ]);

    if (employeesResult.error || punchesResult.error) {
      setErrorMessage(t('admin.payPeriods.errorLoading'));
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

    // Index pay periods by employee_id for quick lookup
    const payPeriodMap = new Map<string, PayPeriod>();
    for (const pp of payPeriodsResult.data) {
      payPeriodMap.set(pp.employee_id, pp);
    }

    // Group punches by employee_id
    const punchesByEmployee = new Map<string, Punch[]>();
    for (const punch of punchesResult.data) {
      const existing = punchesByEmployee.get(punch.employee_id) ?? [];
      existing.push(punch);
      punchesByEmployee.set(punch.employee_id, existing);
    }

    // Build rows for every employee
    const employeeRows: EmployeeRow[] = employeesResult.data.map((employee) => {
      const payPeriod = payPeriodMap.get(employee.id) ?? null;
      const isLocked = payPeriod?.locked ?? false;
      const isPaid = payPeriod?.is_paid ?? false;

      let totalHours: number;
      let totalPay: number;

      if (isLocked && payPeriod) {
        // Locked/paid: read frozen snapshot — never recompute
        totalHours = payPeriod.total_hours;
        totalPay = payPeriod.total_pay;
      } else {
        // Unlocked: compute live from punches
        const shifts = punchesByEmployee.get(employee.id) ?? [];
        const result = calculateWeekTotals(
          shifts,
          employee.hourly_rate ?? 0,
          threshold,
          duration,
        );
        totalHours = result.totalHours;
        totalPay = result.totalPay;
      }

      return {
        employee,
        totalHours,
        totalPay,
        isPaid: isLocked ? isPaid : false,
        isLocked,
        payPeriod,
      };
    });

    setRows(employeeRows);
    setIsLoading(false);
  }, [weekMonday, weekSunday, weekStartStr, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function navigateWeek(direction: -1 | 1) {
    setWeekMonday((prev) => {
      const next = new Date(prev);
      next.setUTCDate(prev.getUTCDate() + direction * 7);
      return next;
    });
  }

  function handleMarkAsPaidPress(row: EmployeeRow) {
    if (isFutureWeek || isCurrentWeek) return;
    setPayTarget(row);
    setShowPayModal(true);
  }

  async function handleConfirmMarkAsPaid() {
    if (!payTarget || !adminProfile || isFutureWeek || isCurrentWeek) return;

    setIsMarking(true);

    const { data: newPayPeriod, error } = await createPayPeriod(
      payTarget.employee.id,
      weekStartStr,
      weekEndStr,
      payTarget.totalHours,
      payTarget.totalPay,
    );

    if (error) {
      setErrorMessage(t('admin.payPeriods.errorMarkingPaid'));
    } else {
      // Write audit log
      await writeAuditEntry(
        adminProfile.id,
        'week_marked_paid',
        'pay_period',
        newPayPeriod?.id ?? payTarget.employee.id,
        null,
        {
          employee_id: payTarget.employee.id,
          week_start_date: weekStartStr,
          total_hours: payTarget.totalHours,
          total_pay: payTarget.totalPay,
          locked: true,
          is_paid: true,
        },
      );
      setSuccessMessage(t('admin.payPeriods.markAsPaidSuccess'));
      await loadData();
    }

    setIsMarking(false);
    setShowPayModal(false);
    setPayTarget(null);
  }

  function handleRowPress(row: EmployeeRow) {
    if (isFutureWeek) return;
    router.push({
      pathname: '/(admin)/pay-period-detail',
      params: {
        employeeId: row.employee.id,
        weekStart: weekStartStr,
      },
    });
  }

  if (isLoading) {
    return <PayPeriodsSkeleton />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Week Selector */}
      <View className="flex-row items-center justify-between mx-4 mt-4 mb-2 p-3 bg-surface-container-lowest rounded-xl"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Pressable
          className="w-10 h-10 rounded-full bg-surface-container justify-center items-center active:opacity-60"
          onPress={() => navigateWeek(-1)}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>

        <View className="items-center">
          <Text className="font-geist-semibold text-on-surface text-base">
            {t('admin.payPeriods.weekRange', {
              start: formatShortDate(weekMonday),
              end: formatShortDate(weekSunday),
            })}
          </Text>
          {isCurrentWeek && (
            <View className="flex-row items-center bg-accent/15 px-2.5 py-0.5 rounded-full mt-1">
              <MaterialCommunityIcons name="clock-outline" size={12} color={colors.accent} />
              <Text className="font-geist-medium text-[11px] text-accent ml-1">
                {t('admin.payPeriods.currentWeek')}
              </Text>
            </View>
          )}
          {isFutureWeek && (
            <View className="flex-row items-center bg-purple-500/15 px-2.5 py-0.5 rounded-full mt-1">
              <MaterialCommunityIcons name="calendar-clock" size={12} color="#8B5CF6" />
              <Text className="font-geist-medium text-[11px] text-purple-600 ml-1">
                {t('admin.payPeriods.futureWeek')}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          className="w-10 h-10 rounded-full bg-surface-container justify-center items-center active:opacity-60"
          onPress={() => navigateWeek(1)}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Status Messages */}
      {successMessage && (
        <Text className="text-success text-center text-sm mb-2 mx-4">{successMessage}</Text>
      )}
      {errorMessage && (
        <Text className="text-error text-center text-sm mb-2 mx-4">{errorMessage}</Text>
      )}

      {/* Employee Pay Table */}
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>
        {rows.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-20">
            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textSecondary} />
            <Text className="text-on-surface-variant text-base mt-4">
              {t('admin.payPeriods.noEmployees')}
            </Text>
          </View>
        ) : (
          rows.map((row) => (
            <Pressable
              key={row.employee.id}
              disabled={isFutureWeek}
              className={`bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4 ${
                isFutureWeek ? '' : 'active:opacity-80'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
                opacity: row.employee.is_active ? 1 : 0.5,
              }}
              onPress={() => handleRowPress(row)}
            >
              {/* Employee Name + Status Badge */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-geist-semibold text-on-surface text-[15px] flex-1" numberOfLines={1}>
                  {row.employee.full_name}
                </Text>
                <View
                  className={`rounded-full px-3 py-1 ml-2 ${
                    row.isPaid
                      ? 'bg-success/15'
                      : isFutureWeek
                      ? 'bg-purple-500/15'
                      : isCurrentWeek
                      ? 'bg-accent/15'
                      : 'bg-on-surface/10'
                  }`}
                >
                  <Text
                    className={`font-geist-medium text-xs ${
                      row.isPaid
                        ? 'text-success'
                        : isFutureWeek
                        ? 'text-purple-600'
                        : isCurrentWeek
                        ? 'text-accent'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {row.isPaid
                      ? t('admin.payPeriods.paid')
                      : isFutureWeek
                      ? t('admin.payPeriods.future')
                      : isCurrentWeek
                      ? t('admin.payPeriods.inProgress')
                      : t('admin.payPeriods.unpaid')}
                  </Text>
                </View>
              </View>

              {/* Hours + Pay row */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                  <Text className="font-inter text-sm text-on-surface ml-1.5">
                    {row.totalHours.toFixed(1)}h
                  </Text>
                </View>
                <View className="flex-row items-center flex-1 justify-end">
                  <MaterialCommunityIcons name="cash" size={16} color={colors.textSecondary} />
                  <Text className="font-inter text-sm text-on-surface ml-1.5">
                    ${row.totalPay.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Mark as Paid / Week Status Button */}
              {!row.isPaid && !row.isLocked && (
                isFutureWeek ? (
                  <View className="bg-surface-container/60 rounded-lg py-2.5 items-center flex-row justify-center opacity-60">
                    <MaterialCommunityIcons name="circle-off-outline" size={14} color={colors.textSecondary} />
                    <Text className="font-geist-medium text-textSecondary text-xs ml-1.5">
                      {t('admin.payPeriods.cannotPayFuture')}
                    </Text>
                  </View>
                ) : isCurrentWeek ? (
                  <View className="bg-surface-container/60 rounded-lg py-2.5 items-center flex-row justify-center opacity-60">
                    <MaterialCommunityIcons name="clock-alert-outline" size={14} color={colors.textSecondary} />
                    <Text className="font-geist-medium text-textSecondary text-xs ml-1.5">
                      {t('admin.payPeriods.cannotPayCurrent')}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    className="bg-success/15 rounded-lg py-2.5 items-center active:opacity-80"
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleMarkAsPaidPress(row);
                    }}
                  >
                    <Text className="font-geist-semibold text-success text-sm">
                      {t('admin.payPeriods.markAsPaid')}
                    </Text>
                  </Pressable>
                )
              )}
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Mark as Paid Confirmation Modal */}
      <ConfirmModal
        visible={showPayModal}
        title={t('admin.payPeriods.markAsPaidTitle')}
        message={
          payTarget
            ? t('admin.payPeriods.markAsPaidMessage', {
                name: payTarget.employee.full_name,
                start: formatShortDate(weekMonday),
                end: formatShortDate(weekSunday),
                amount: payTarget.totalPay.toFixed(2),
                hours: payTarget.totalHours.toFixed(1),
              })
            : ''
        }
        confirmText={t('admin.payPeriods.markAsPaid')}
        cancelText={t('common.cancel')}
        isLoading={isMarking}
        onConfirm={handleConfirmMarkAsPaid}
        onCancel={() => {
          setShowPayModal(false);
          setPayTarget(null);
        }}
      />
    </View>
  );
}
