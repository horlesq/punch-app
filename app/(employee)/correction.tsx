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
import { createCorrection, applyCorrection } from '@/src/api/corrections';
import { getBusinessSettings } from '@/src/api/businessSettings';
import { colors } from '@/src/theme/colors';

export default function CorrectionScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
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
  const initialDateStr = formatDateParam(params.date);

  const [selectedDate, setSelectedDate] = useState(initialDateStr);

  const [clockInTime, setClockInTime] = useState(formatInitialTime(params.clockIn));
  const [clockOutTime, setClockOutTime] = useState(formatInitialTime(params.clockOut));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isClockInVisible, setClockInVisibility] = useState(false);
  const [isClockOutVisible, setClockOutVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    hideDatePicker();
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

  // Reset state when navigation params change (because the screen is a kept-alive tab)
  useEffect(() => {
    setSelectedDate(formatDateParam(params.date));
    setClockInTime(formatInitialTime(params.clockIn));
    setClockOutTime(formatInitialTime(params.clockOut));
    setReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  }, [params.punchId, params.date, params.clockIn, params.clockOut]);

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
      setErrorMessage(t('correction.errorGeneric'));
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
      <View className="flex-1 justify-center items-center bg-background px-6">
        <MaterialCommunityIcons name="check-circle-outline" size={64} color={colors.success} />
        <Text className="text-on-surface font-geist-semibold text-lg mt-4 text-center">
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
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-on-surface font-geist-semibold text-2xl mb-6">
          {punchId ? t('correction.titleEdit') : t('correction.titleMissed')}
        </Text>

        {/* Date display */}
        <View className="mb-6">
          <Text className="text-on-surface-variant font-geist-medium text-sm mb-1.5">
            {t('correction.selectDate')}
          </Text>
          {Platform.OS === 'web' ? (
            <View className="bg-surface-container-lowest rounded-xl p-4 flex-row items-center">
              <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
              <TextInput
                className="flex-1 text-on-surface font-geist-medium text-base ml-3"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={selectedDate}
                onChangeText={setSelectedDate}
                {...({ type: 'date' } as any)}
              />
            </View>
          ) : (
            <>
              <Pressable
                className="bg-surface-container-lowest rounded-xl p-4 flex-row items-center"
                onPress={showDatePicker}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
                <Text className="flex-1 text-on-surface font-geist-medium text-base ml-3">
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
          <Text className="text-on-surface-variant font-geist-medium text-sm mb-1.5">
            {t('correction.clockInTime')}
          </Text>
          {Platform.OS === 'web' ? (
            <TextInput
              className="bg-surface-container-lowest rounded-xl p-4 text-on-surface font-inter text-base"
              placeholder="08:30"
              placeholderTextColor={colors.textSecondary}
              value={clockInTime}
              onChangeText={setClockInTime}
              {...({ type: 'time' } as any)}
            />
          ) : (
            <>
              <Pressable
                className="bg-surface-container-lowest rounded-xl p-4 flex-row items-center h-[52px]"
                onPress={showClockInPicker}
              >
                <Text className={`font-inter text-base ${clockInTime ? 'text-on-surface' : 'text-on-surface-variant'}`}>
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
          <Text className="text-on-surface-variant font-geist-medium text-sm mb-1.5">
            {t('correction.clockOutTime')}
          </Text>
          {Platform.OS === 'web' ? (
            <TextInput
              className="bg-surface-container-lowest rounded-xl p-4 text-on-surface font-inter text-base"
              placeholder="17:00"
              placeholderTextColor={colors.textSecondary}
              value={clockOutTime}
              onChangeText={setClockOutTime}
              {...({ type: 'time' } as any)}
            />
          ) : (
            <>
              <Pressable
                className="bg-surface-container-lowest rounded-xl p-4 flex-row items-center h-[52px]"
                onPress={showClockOutPicker}
              >
                <Text className={`font-inter text-base ${clockOutTime ? 'text-on-surface' : 'text-on-surface-variant'}`}>
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
          <Text className="text-on-surface-variant font-geist-medium text-sm mb-1.5">
            {t('correction.reason')}
          </Text>
          <TextInput
            className="bg-surface-container-lowest rounded-xl p-4 text-on-surface font-inter text-base"
            placeholder={t('correction.reasonPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />
        </View>

        {/* Error message */}
        {errorMessage && (
          <Text className="text-error text-center text-sm mb-4">{errorMessage}</Text>
        )}

        {/* Submit button */}
        <Pressable
          className="bg-primary rounded-xl p-4 items-center active:opacity-80"
          style={{ opacity: isSubmitting ? 0.6 : 1 }}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text className="text-on-primary font-geist-semibold text-base">
              {punchId ? t('correction.submit') : t('correction.submitMissedShift')}
            </Text>
          )}
        </Pressable>

        {/* Cancel link */}
        <Pressable
          className="mt-4 items-center active:opacity-60"
          onPress={() => router.push('/(employee)/history')}
        >
          <Text style={{ color: colors.accent }} className="font-geist-medium text-sm">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
