import React from 'react';

import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors } from '@/src/theme/colors';

/**
 * Employee layout — tab bar with Punch / History / My Pay.
 */
export default function EmployeeLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
        },
      }}
    >
      <Tabs.Screen
        name="punch"
        options={{ title: t('tabs.employee.punch') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('tabs.employee.history') }}
      />
      <Tabs.Screen
        name="my-pay"
        options={{ title: t('tabs.employee.myPay') }}
      />
    </Tabs>
  );
}
