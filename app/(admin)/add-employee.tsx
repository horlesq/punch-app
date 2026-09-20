import React, { useState } from 'react';
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

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { createEmployee } from '@/src/api/profiles';
import { writeAuditEntry } from '@/src/api/auditLog';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { profile: adminProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successModalData, setSuccessModalData] = useState<{ title: string; message: string } | null>(null);

  function validateEmail(emailStr: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr);
  }

  async function handleSubmit() {
    if (!adminProfile) return;

    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage(t('admin.addEmployee.errorNameRequired'));
      return;
    }
    if (!email.trim()) {
      setErrorMessage(t('admin.addEmployee.errorEmailRequired'));
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMessage(t('admin.addEmployee.errorEmailInvalid'));
      return;
    }
    if (!hourlyRate.trim()) {
      setErrorMessage(t('admin.addEmployee.errorRateRequired'));
      return;
    }
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      setErrorMessage(t('admin.addEmployee.errorRateInvalid'));
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await createEmployee(fullName.trim(), email.trim(), rate);

    if (error || !data) {
      setErrorMessage(error?.message ?? t('admin.addEmployee.errorGeneric'));
      setIsSubmitting(false);
      return;
    }

    // Write audit entry
    await writeAuditEntry(
      adminProfile.id,
      'employee_created',
      'profile',
      data.profile.id,
      null,
      { full_name: fullName.trim(), email: email.trim(), hourly_rate: rate },
    );

    setIsSubmitting(false);

    // Show the generated password to the admin via ConfirmModal
    setSuccessModalData({
      title: t('admin.addEmployee.passwordTitle'),
      message: t('admin.addEmployee.passwordMessage', {
        name: fullName.trim(),
        password: data.password,
      }),
    });
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
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-2xl mb-6">
          {t('admin.addEmployee.title')}
        </Text>

        {/* Full Name */}
        <View className="mb-6">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('admin.addEmployee.fullName')}
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.surfaceContainerLowest,
              color: theme.textPrimary,
              borderColor: theme.borderLight + '60',
              borderWidth: 1,
            }}
            className="rounded-xl p-4 font-inter text-base"
            placeholder={t('admin.addEmployee.fullNamePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View className="mb-6">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('admin.addEmployee.email')}
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.surfaceContainerLowest,
              color: theme.textPrimary,
              borderColor: theme.borderLight + '60',
              borderWidth: 1,
            }}
            className="rounded-xl p-4 font-inter text-base"
            placeholder={t('admin.addEmployee.emailPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Hourly Rate */}
        <View className="mb-8">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('admin.addEmployee.hourlyRate')}
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.surfaceContainerLowest,
              color: theme.textPrimary,
              borderColor: theme.borderLight + '60',
              borderWidth: 1,
            }}
            className="rounded-xl p-4 font-inter text-base"
            placeholder={t('admin.addEmployee.hourlyRatePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Error message */}
        {errorMessage && (
          <Text style={{ color: theme.error }} className="text-center text-sm mb-4">{errorMessage}</Text>
        )}

        {/* Submit button */}
        <Pressable
          className="rounded-xl p-4 items-center active:opacity-80"
          style={{ backgroundColor: theme.primary, opacity: isSubmitting ? 0.6 : 1 }}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff' }} className="font-geist-semibold text-base">
              {t('admin.addEmployee.submit')}
            </Text>
          )}
        </Pressable>

        {/* Cancel link */}
        <Pressable
          className="mt-4 items-center active:opacity-60"
          onPress={() => router.back()}
        >
          <Text style={{ color: theme.accent }} className="font-geist-medium text-sm">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Password Alert Modal */}
      <ConfirmModal
        visible={!!successModalData}
        title={successModalData?.title ?? ''}
        message={successModalData?.message}
        confirmText={t('common.close')}
        cancelText={null}
        onConfirm={() => {
          setSuccessModalData(null);
          router.back();
        }}
        onCancel={() => {
          setSuccessModalData(null);
          router.back();
        }}
      />
    </KeyboardAvoidingView>
  );
}
