import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Redirect, Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '@/src/components/ui/CustomTabBar';
import { CustomHeader } from '@/src/components/ui/CustomHeader';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';

/**
 * Admin layout — layout-level role guard.
 * Renders a tab bar with Dashboard / Employees / Pay Periods / Settings.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const { session, profile, isLoading, isProfileLoading } = useAuth();
  const { theme } = useTheme();

  // Show loading spinner after login while checking session & profile role
  if (isLoading || isProfileLoading) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Role guard: non-admin users are redirected to the employee punch screen.
  if (profile?.role !== 'admin') {
    return <Redirect href="/(employee)/punch" />;
  }

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <CustomHeader title={t('tabs.admin.dashboard')} />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.admin.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: t('tabs.admin.employees'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay-periods"
        options={{
          title: t('tabs.admin.payPeriods'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.admin.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
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
      <Tabs.Screen
        name="add-employee"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="pay-period-detail"
        options={{ href: null }}
      />
    </Tabs>
  );
}
