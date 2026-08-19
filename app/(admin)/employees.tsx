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
import { getAllEmployees, type Profile } from '@/src/api/profiles';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { EmployeesSkeleton } from '@/src/components/ui/Skeleton';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';

export default function EmployeesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await getAllEmployees();

    if (error) {
      setErrorMessage(t('admin.employees.errorLoading'));
    } else {
      setEmployees(data);
    }

    setIsLoading(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (isLoading) {
    return <EmployeesSkeleton />;
  }

  if (errorMessage) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-error text-center mb-4">{errorMessage}</Text>
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
      <View className="pt-4">
        {/* Add Employee Button */}
        <Pressable
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
          className="flex-row items-center justify-center p-4 mx-4 mb-6 rounded-xl active:opacity-60"
          onPress={() => router.push('/(admin)/add-employee')}
        >
          <MaterialCommunityIcons name="account-plus-outline" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary }} className="font-geist-semibold text-sm ml-2">
            {t('admin.employees.addEmployee')}
          </Text>
        </Pressable>

        {/* Employee List */}
        {employees.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-20">
            <MaterialCommunityIcons name="account-group-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary }} className="text-base mt-4">
              {t('admin.employees.empty')}
            </Text>
          </View>
        ) : (
          employees.map((employee) => (
            <Pressable
              key={employee.id}
              style={{
                backgroundColor: theme.surfaceContainerLowest,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
                opacity: employee.is_active ? 1 : 0.5,
              }}
              className="rounded-xl mx-4 mb-3 p-4 active:opacity-80"
              onPress={() => router.push({
                pathname: '/(admin)/employee-detail',
                params: { employeeId: employee.id },
              })}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <UserAvatar avatarUrl={employee.avatar_url} name={employee.full_name} role={employee.role} size={44} />
                  <View className="ml-3 flex-1">
                    <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-[15px]">
                      {employee.full_name}
                    </Text>
                    <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-0.5">
                      {t('admin.employees.perHour', {
                        rate: `$${(employee.hourly_rate ?? 0).toFixed(2)}`,
                      })}
                    </Text>
                  </View>
                </View>

                {/* Status badge */}
                <View
                  style={{
                    backgroundColor: employee.is_active ? theme.success + '25' : theme.surfaceVariant,
                  }}
                  className="rounded-full px-3 py-1"
                >
                  <Text
                    style={{ color: employee.is_active ? theme.success : theme.textSecondary }}
                    className="font-geist-medium text-xs"
                  >
                    {employee.is_active
                      ? t('admin.employees.active')
                      : t('admin.employees.inactive')}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScreenWrapper>
  );
}
