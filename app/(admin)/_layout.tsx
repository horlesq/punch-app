import React from 'react';
import { ActivityIndicator, View, Pressable, Text } from 'react-native';

import { Redirect, Tabs, Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '@/src/components/ui/CustomTabBar';

import { useAuth } from '@/app/_layout';
import { colors } from '@/src/theme/colors';

/**
 * Admin layout — layout-level role guard.
 * Renders a tab bar with Dashboard / Employees / Pay Periods / Settings.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const { session, profile, isLoading, isProfileLoading } = useAuth();

  if (isLoading || isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // If the profile fetch completed but failed, index.tsx will catch it and show an error/logout.
  // We just want to avoid evaluating the role guard while still loading.

  // Role guard: non-admin users are redirected to the employee punch screen.
  if (profile?.role !== 'admin') {
    return <Redirect href="/(employee)/punch" />;
  }

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerRight: () => (
          <Link href="/profile" asChild>
            <Pressable className="mr-4 active:opacity-70">
              <Text className="text-primary font-geist-medium text-sm">Profile</Text>
            </Pressable>
          </Link>
        ),
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
    </Tabs>
  );
}
