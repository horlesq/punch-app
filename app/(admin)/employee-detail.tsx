import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getProfile, updateEmployee, type ProfileWithEmail } from '@/src/api/profiles';
import { getPendingCorrections } from '@/src/api/corrections';
import { writeAuditEntry } from '@/src/api/auditLog';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { EmployeeDetailSkeleton } from '@/src/components/ui/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmployeeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { employeeId } = useLocalSearchParams<{ employeeId: string }>();
  const { profile: adminProfile } = useAuth();

  const [employee, setEmployee] = useState<ProfileWithEmail | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [hasPendingCorrections, setHasPendingCorrections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    setErrorMessage(null);

    const [profileResult, correctionsResult] = await Promise.all([
      getProfile(employeeId),
      getPendingCorrections(employeeId),
    ]);

    if (profileResult.error || !profileResult.data) {
      setErrorMessage(t('admin.employeeDetail.errorLoading'));
    } else {
      setEmployee(profileResult.data);
      setEditName(profileResult.data.full_name);
      setEditRate(String(profileResult.data.hourly_rate ?? ''));
    }

    if (!correctionsResult.error) {
      setHasPendingCorrections(correctionsResult.data.length > 0);
    }

    setIsLoading(false);
  }, [employeeId, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleSave() {
    if (!employee || !adminProfile) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newRate = parseFloat(editRate);
    const updates: { full_name?: string; hourly_rate?: number } = {};

    // Check what changed
    if (editName.trim() !== employee.full_name) {
      updates.full_name = editName.trim();
    }
    if (!isNaN(newRate) && newRate !== employee.hourly_rate) {
      updates.hourly_rate = newRate;
    }

    if (Object.keys(updates).length === 0) {
      setIsSaving(false);
      return;
    }

    const { error } = await updateEmployee(employee.id, updates);

    if (error) {
      setErrorMessage(t('admin.employeeDetail.errorSaving'));
    } else {
      // Write audit entries for each change
      if (updates.full_name) {
        await writeAuditEntry(
          adminProfile.id,
          'name_changed',
          'profile',
          employee.id,
          { full_name: employee.full_name },
          { full_name: updates.full_name },
        );
      }
      if (updates.hourly_rate !== undefined) {
        await writeAuditEntry(
          adminProfile.id,
          'rate_changed',
          'profile',
          employee.id,
          { hourly_rate: employee.hourly_rate },
          { hourly_rate: updates.hourly_rate },
        );
      }

      setSuccessMessage(t('admin.employeeDetail.saved'));
      // Update local state
      setEmployee({
        ...employee,
        ...updates,
      });
    }

    setIsSaving(false);
  }

  const [showToggleModal, setShowToggleModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleConfirmToggleActive() {
    if (!employee || !adminProfile) return;

    setIsToggling(true);
    const newStatus = !employee.is_active;
    const { error } = await updateEmployee(employee.id, { is_active: newStatus });

    if (error) {
      setErrorMessage(t('admin.employeeDetail.errorSaving'));
    } else {
      await writeAuditEntry(
        adminProfile.id,
        newStatus ? 'employee_reactivated' : 'employee_deactivated',
        'profile',
        employee.id,
        { is_active: employee.is_active },
        { is_active: newStatus },
      );
      setEmployee({ ...employee, is_active: newStatus });
    }

    setIsToggling(false);
    setShowToggleModal(false);
  }

  if (isLoading) {
    return <EmployeeDetailSkeleton />;
  }

  if (errorMessage && !employee) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
        <Text style={{ color: theme.error }} className="text-center mb-4">{errorMessage}</Text>
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <Text style={{ color: theme.accent }} className="font-geist-semibold">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!employee) return null;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}
    >
      <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-2xl mb-6">
        {t('admin.employeeDetail.title')}
      </Text>

      {/* Pending Corrections Notice */}
      {hasPendingCorrections && (
        <Pressable
          className="rounded-xl p-4 mb-6 flex-row items-center active:opacity-80"
          style={{ backgroundColor: theme.warning + '15' }}
          onPress={() => router.push('/(admin)/corrections-review')}
        >
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.warning} />
          <View className="flex-1 ml-3">
            <Text style={{ color: theme.warning }} className="font-geist-medium text-sm">
              {t('admin.employeeDetail.pendingCorrections')}
            </Text>
            <Text style={{ color: theme.warning }} className="font-inter text-xs mt-0.5">
              {t('admin.employeeDetail.viewCorrections')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.warning} />
        </Pressable>
      )}

      {/* Status Badge */}
      <View className="mb-6">
        <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
          {t('admin.employeeDetail.status')}
        </Text>
        <View
          style={{
            backgroundColor: employee.is_active ? theme.success + '20' : theme.error + '20',
          }}
          className="self-start rounded-full px-4 py-2"
        >
          <Text
            style={{ color: employee.is_active ? theme.success : theme.error }}
            className="font-geist-semibold text-sm"
          >
            {employee.is_active
              ? t('admin.employeeDetail.active')
              : t('admin.employeeDetail.inactive')}
          </Text>
        </View>
      </View>

      {/* Email */}
      {employee.email && (
        <View className="mb-6">
          <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
            {t('admin.employeeDetail.email')}
          </Text>
          <View style={{ backgroundColor: theme.surfaceContainerLowest }} className="rounded-xl p-4">
            <Text style={{ color: theme.textPrimary }} className="font-inter text-base">
              {employee.email}
            </Text>
          </View>
        </View>
      )}

      {/* Full Name */}
      <View className="mb-6">
        <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
          {t('admin.employeeDetail.fullName')}
        </Text>
        <TextInput
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            color: theme.textPrimary,
            borderColor: theme.borderLight + '60',
            borderWidth: 1,
          }}
          className="rounded-xl p-4 font-inter text-base"
          value={editName}
          onChangeText={setEditName}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      {/* Hourly Rate */}
      <View className="mb-6">
        <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm mb-1.5">
          {t('admin.employeeDetail.hourlyRate')}
        </Text>
        <TextInput
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            color: theme.textPrimary,
            borderColor: theme.borderLight + '60',
            borderWidth: 1,
          }}
          className="rounded-xl p-4 font-inter text-base"
          value={editRate}
          onChangeText={setEditRate}
          keyboardType="decimal-pad"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      {/* Success / Error Messages */}
      {successMessage && (
        <Text style={{ color: theme.success }} className="text-center text-sm mb-4">{successMessage}</Text>
      )}
      {errorMessage && (
        <Text style={{ color: theme.error }} className="text-center text-sm mb-4">{errorMessage}</Text>
      )}

      {/* Save Button */}
      <Pressable
        className="rounded-xl p-4 items-center active:opacity-80 mb-4"
        style={{ backgroundColor: theme.primary, opacity: isSaving ? 0.6 : 1 }}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={{ color: '#ffffff' }} className="font-geist-semibold text-base">
            {t('common.save')}
          </Text>
        )}
      </Pressable>

      {/* Deactivate / Reactivate Button */}
      <Pressable
        style={{
          backgroundColor: employee.is_active ? theme.error + '20' : theme.success + '20',
        }}
        className="rounded-xl p-4 items-center active:opacity-80"
        onPress={() => setShowToggleModal(true)}
      >
        <Text
          style={{ color: employee.is_active ? theme.error : theme.success }}
          className="font-geist-semibold text-base"
        >
          {employee.is_active
            ? t('admin.employeeDetail.deactivate')
            : t('admin.employeeDetail.reactivate')}
        </Text>
      </Pressable>

      {/* Back Button */}
      <Pressable
        className="mt-4 items-center active:opacity-60"
        onPress={() => router.back()}
      >
        <Text style={{ color: theme.accent }} className="font-geist-medium text-sm">
          {t('common.cancel')}
        </Text>
      </Pressable>

      {/* Status Toggle Confirmation Modal */}
      <ConfirmModal
        visible={showToggleModal}
        title={t(
          employee.is_active
            ? 'admin.employeeDetail.deactivateConfirmTitle'
            : 'admin.employeeDetail.reactivateConfirmTitle'
        )}
        message={t(
          employee.is_active
            ? 'admin.employeeDetail.deactivateConfirmMessage'
            : 'admin.employeeDetail.reactivateConfirmMessage',
          { name: employee.full_name }
        )}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        isDestructive={employee.is_active}
        isLoading={isToggling}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setShowToggleModal(false)}
      />
    </ScrollView>
  );
}
