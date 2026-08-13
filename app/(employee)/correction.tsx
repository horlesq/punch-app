import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { createCorrection, applyCorrection } from '@/src/api/corrections';
import { isWeekLockedForEmployee } from '@/src/api/payPeriods';
import { getBusinessSettings } from '@/src/api/businessSettings';

function getWeekStartForDateString(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    const [year, month, day] = parts;
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = d.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  return dateStr;
}

export default function CorrectionScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ punchId?: string; date?: string; clockIn?: string; clockOut?: string }>();

  function formatInitialTime(isoString?: string) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function formatDateParam(dateParam?: string): string {
    if (!dateParam) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    if (dateParam.length >= 10 && dateParam.includes('-') && !dateParam.includes('T')) {
      return dateParam.substring(0, 10);
    }
    const d = new Date(dateParam);
    if (isNaN(d.getTime())) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const punchId = params.punchId ?? null;

  const [selectedDate, setSelectedDate] = useState(formatDateParam(params.date));
  const [clockInTime, setClockInTime] = useState(formatInitialTime(params.clockIn));
  const [clockOutTime, setClockOutTime] = useState(formatInitialTime(params.clockOut));
  const [reason, setReason] = useState('');

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isClockInVisible, setClockInVisibility] = useState(false);
  const [isClockOutVisible, setClockOutVisibility] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    setSelectedDate(newDateStr);
    hideDatePicker();

    if (profile?.id) {
      checkLockedWeek(profile.id, newDateStr);
    }
  };

  const showClockInPicker = () => setClockInVisibility(true);
  const hideClockInPicker = () => setClockInVisibility(false);
  const handleConfirmClockIn = (date: Date) => {
    setClockInTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    hideClockInPicker();
  };

  const showClockOutPicker = () => setClockOutVisibility(true);
  const hideClockOutPicker = () => setClockOutVisibility(false);
  const handleConfirmClockOut = (date: Date) => {
    setClockOutTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    hideClockOutPicker();
  };

  async function checkLockedWeek(empId: string, dateStr: string) {
    const weekStart = getWeekStartForDateString(dateStr);
    const { locked } = await isWeekLockedForEmployee(empId, weekStart);
    setIsWeekLocked(locked);
    if (locked) {
      setErrorMessage(t('correction.errorWeekLocked'));
    } else {
      setErrorMessage(null);
    }
  }

  // Reset state when navigation params change (because the screen is a kept-alive tab)
  useEffect(() => {
    const initialDate = formatDateParam(params.date);
    setSelectedDate(initialDate);
    setClockInTime(formatInitialTime(params.clockIn));
    setClockOutTime(formatInitialTime(params.clockOut));
    setReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);

    if (profile?.id && initialDate) {
      checkLockedWeek(profile.id, initialDate);
    }
  }, [params.punchId, params.date, params.clockIn, params.clockOut, profile?.id]);

  /**
   * Parse a time string (e.g. "08:30") into an ISO timestamp using the punch date.
   * Returns null if the input is empty or invalid.
   */
  function parseTimeInput(timeStr: string): string | undefined {
    if (!timeStr.trim()) return undefined;

    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return undefined;
    const [year, month, day] = parts;

    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return undefined;

    const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return result.toISOString();
  }

  async function handleSubmit() {
    if (!profile) return;

    if (isWeekLocked) {
      setErrorMessage(t('correction.errorWeekLocked'));
      return;
    }

    let parsedClockIn = parseTimeInput(clockInTime);
    let parsedClockOut = parseTimeInput(clockOutTime);

    // Handle shifts crossing midnight (clock out is earlier than clock in)
    if (parsedClockOut) {
      const compareAgainst = parsedClockIn ? new Date(parsedClockIn) : new Date(selectedDate);
      if (compareAgainst && new Date(parsedClockOut) < compareAgainst) {
        const outDate = new Date(parsedClockOut);
        outDate.setDate(outDate.getDate() + 1);
        parsedClockOut = outDate.toISOString();
      }
    }

    // Must have at least one corrected time for edit, but both for missed shift
    if (punchId && !parsedClockIn && !parsedClockOut) {
      setErrorMessage(t('correction.errorNoTimes'));
      return;
    }
    
    if (!punchId && (!parsedClockIn || !parsedClockOut)) {
      setErrorMessage(t('correction.errorBothTimesRequired'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // 1. Check if auto-approve mode is enabled
    const { data: settings } = await getBusinessSettings();
    const isAutoApprove = settings?.correction_approval_mode === 'auto';

    // 2. Create the correction (marked 'approved' if auto-approve enabled)
    const { data: correction, error: createError } = await createCorrection(
      profile.id,
      punchId,
      parsedClockIn,
      parsedClockOut,
      reason || undefined,
      isAutoApprove ? 'approved' : 'pending',
    );

    if (createError || !correction) {
      if (createError?.message === 'WEEK_LOCKED') {
        setErrorMessage(t('correction.errorWeekLocked'));
      } else {
        setErrorMessage(t('correction.errorGeneric'));
      }
      setIsSubmitting(false);
      return;
    }

    // 3. Apply the correction to punches table if auto-approve enabled
    if (isAutoApprove) {
      const { error: applyError } = await applyCorrection(correction.id);

      if (applyError) {
        console.error('Auto-apply failed:', applyError);
      }
    }

    setSuccessMessage(t('correction.success'));
    setIsSubmitting(false);

    // Navigate back after a brief delay
    setTimeout(() => {
      router.push('/(employee)/history');
    }, 1500);
  }

  // Success state
  if (successMessage) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
        <MaterialCommunityIcons name="check-circle-outline" size={64} color={theme.success} />
        <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-lg mt-4 text-center">
          {successMessage}
        </Text>
      </View>
    );
  }

  function parseLocalDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  return (
    <KeyboardAvoidingView
      style={{ backgroundColor: theme.background }}
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ backgroundColor: theme.background }}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-2xl mb-6">
          {punchId ? t('correction.titleEdit') : t('correction.titleMissed')}
        </Text>

        {/* Date display */}
        <View className="mb-6">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('correction.selectDate')}
          </Text>
          {Platform.OS === 'web' ? (
            <View
              style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '60' }}
              className="rounded-xl p-4 flex-row items-center border"
            >
              <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
              <TextInput
                style={{ color: theme.textPrimary }}
                className="flex-1 font-geist-medium text-base ml-3"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={selectedDate}
                onChangeText={setSelectedDate}
                {...({ type: 'date' } as any)}
              />
            </View>
          ) : (
            <>
              <Pressable
                style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '60' }}
                className="rounded-xl p-4 flex-row items-center border"
                onPress={showDatePicker}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
                <Text style={{ color: theme.textPrimary }} className="flex-1 font-geist-medium text-base ml-3">
                  {selectedDate || 'YYYY-MM-DD'}
                </Text>
              </Pressable>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                date={parseLocalDate(selectedDate)}
              />
            </>
          )}
        </View>

        {/* Clock-in time */}
        <View className="mb-6">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('correction.clockInTime')}
          </Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={{ backgroundColor: theme.surfaceContainerLowest, color: theme.textPrimary, borderColor: theme.borderLight + '60' }}
              className="rounded-xl p-4 font-inter text-base border"
              placeholder="08:30"
              placeholderTextColor={theme.textSecondary}
              value={clockInTime}
              onChangeText={setClockInTime}
              {...({ type: 'time' } as any)}
            />
          ) : (
            <>
              <Pressable
                style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '60' }}
                className="rounded-xl p-4 flex-row items-center h-[52px] border"
                onPress={showClockInPicker}
              >
                <Text style={{ color: clockInTime ? theme.textPrimary : theme.textSecondary }} className="font-inter text-base">
                  {clockInTime || '08:30'}
                </Text>
              </Pressable>
              <DateTimePickerModal
                isVisible={isClockInVisible}
                mode="time"
                onConfirm={handleConfirmClockIn}
                onCancel={hideClockInPicker}
                date={clockInTime ? new Date(`1970-01-01T${clockInTime}:00`) : new Date()}
              />
            </>
          )}
        </View>

        {/* Clock-out time */}
        <View className="mb-6">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('correction.clockOutTime')}
          </Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={{ backgroundColor: theme.surfaceContainerLowest, color: theme.textPrimary, borderColor: theme.borderLight + '60' }}
              className="rounded-xl p-4 font-inter text-base border"
              placeholder="17:00"
              placeholderTextColor={theme.textSecondary}
              value={clockOutTime}
              onChangeText={setClockOutTime}
              {...({ type: 'time' } as any)}
            />
          ) : (
            <>
              <Pressable
                style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '60' }}
                className="rounded-xl p-4 flex-row items-center h-[52px] border"
                onPress={showClockOutPicker}
              >
                <Text style={{ color: clockOutTime ? theme.textPrimary : theme.textSecondary }} className="font-inter text-base">
                  {clockOutTime || '17:00'}
                </Text>
              </Pressable>
              <DateTimePickerModal
                isVisible={isClockOutVisible}
                mode="time"
                onConfirm={handleConfirmClockOut}
                onCancel={hideClockOutPicker}
                date={clockOutTime ? new Date(`1970-01-01T${clockOutTime}:00`) : new Date()}
              />
            </>
          )}
        </View>

        {/* Reason */}
        <View className="mb-8">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('correction.reason')}
          </Text>
          <TextInput
            style={{ backgroundColor: theme.surfaceContainerLowest, color: theme.textPrimary, borderColor: theme.borderLight + '60', minHeight: 100 }}
            className="rounded-xl p-4 font-inter text-base border"
            placeholder={t('correction.reasonPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Error message */}
        {errorMessage && (
          <Text style={{ color: theme.error }} className="text-center text-sm mb-4">{errorMessage}</Text>
        )}

        {/* Submit button */}
        <Pressable
          className="rounded-xl p-4 items-center"
          style={{
            backgroundColor: isWeekLocked ? theme.surfaceVariant : theme.primary,
            opacity: isSubmitting || isWeekLocked ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={isSubmitting || isWeekLocked}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View className="flex-row items-center justify-center">
              {isWeekLocked && (
                <MaterialCommunityIcons name="lock-outline" size={18} color={theme.textSecondary} style={{ marginRight: 6 }} />
              )}
              <Text style={{ color: isWeekLocked ? theme.textSecondary : '#ffffff' }} className="font-geist-semibold text-base">
                {punchId ? t('correction.submit') : t('correction.submitMissedShift')}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Cancel link */}
        <Pressable
          className="mt-4 items-center active:opacity-60"
          onPress={() => router.push('/(employee)/history')}
        >
          <Text style={{ color: theme.accent }} className="font-geist-medium text-sm">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
