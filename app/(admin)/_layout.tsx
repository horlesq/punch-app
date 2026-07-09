import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { colors } from '@/src/theme/colors';

/**
 * Admin layout — layout-level role guard.
 * If the logged-in user's role is not 'admin', redirect to the employee home screen.
 * Renders a tab bar with Dashboard / Employees / Pay Periods / Settings.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  // Role guard: non-admin users are redirected to the employee punch screen.
  if (profile?.role !== 'admin') {
    return <Redirect href="/(employee)/punch" />;
  }

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
        name="dashboard"
        options={{ title: t('tabs.admin.dashboard') }}
      />
      <Tabs.Screen
        name="employees"
        options={{ title: t('tabs.admin.employees') }}
      />
      <Tabs.Screen
        name="pay-periods"
        options={{ title: t('tabs.admin.payPeriods') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.admin.settings') }}
      />
      {/* Hide screens that aren't primary tabs */}
      <Tabs.Screen
        name="employee-detail"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="corrections-review"
        options={{ href: null }}
      />
    </Tabs>
  );
}
