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

import { getAllEmployees, type Profile } from '@/src/api/profiles';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { colors } from '@/src/theme/colors';

export default function EmployeesScreen() {
  const { t } = useTranslation();
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
        {/* Add Employee Button */}
        <Pressable
          className="bg-surface-container-lowest flex-row items-center justify-center p-4 mx-4 mb-6 rounded-xl active:opacity-60"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => router.push('/(admin)/add-employee')}
        >
          <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="font-geist-semibold text-sm ml-2">
            {t('admin.employees.addEmployee')}
          </Text>
        </Pressable>

        {/* Employee List */}
        {employees.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-20">
            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textSecondary} />
            <Text className="text-on-surface-variant text-base mt-4">
              {t('admin.employees.empty')}
            </Text>
          </View>
        ) : (
          employees.map((employee) => (
            <Pressable
              key={employee.id}
              className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4 active:opacity-80"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
                opacity: employee.is_active ? 1 : 0.5,
              }}
              onPress={() => router.push({
                pathname: '/(admin)/employee-detail',
                params: { employeeId: employee.id },
              })}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <UserAvatar name={employee.full_name} size={44} />
                  <View className="ml-3 flex-1">
                    <Text className="font-geist-semibold text-on-surface text-[15px]">
                      {employee.full_name}
                    </Text>
                    <Text className="font-inter text-xs text-on-surface-variant mt-0.5">
                      {t('admin.employees.perHour', {
                        rate: `$${(employee.hourly_rate ?? 0).toFixed(2)}`,
                      })}
                    </Text>
                  </View>
                </View>

                {/* Status badge */}
                <View
                  className={`rounded-full px-3 py-1 ${
                    employee.is_active ? 'bg-success/15' : 'bg-on-surface/10'
                  }`}
                >
                  <Text
                    className={`font-geist-medium text-xs ${
                      employee.is_active ? 'text-success' : 'text-on-surface-variant'
                    }`}
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
      </ScrollView>
    </View>
  );
}
