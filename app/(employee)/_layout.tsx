import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Redirect, Tabs, Link } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '@/src/components/ui/CustomTabBar';
import { CustomHeader } from '@/src/components/ui/CustomHeader';

import { useAuth } from '@/app/_layout';
import { PunchSkeleton } from '@/src/components/ui/Skeleton';
import { colors } from '@/src/theme/colors';

/**
 * Employee layout — tab bar with Punch / History / My Pay.
 */
export default function EmployeeLayout() {
  const { t } = useTranslation();
  const { session, profile, isLoading, isProfileLoading } = useAuth();

  // Show loading spinner after login while checking session & profile role
  if (isLoading || isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Prevent admins from accidentally landing on employee tabs
  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <CustomHeader title="Punch App" />,
      }}
    >
      <Tabs.Screen
        name="punch"
        options={{
          title: t('tabs.employee.punch'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="punch-clock" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.employee.history'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-pay"
        options={{
          title: t('tabs.employee.myPay'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="attach-money"  size={size} color={color} />
          ),
        }}
      />
      {/* Hide the correction screen from the tab bar */}
      <Tabs.Screen
        name="correction"
        options={{
          href: null,
          title: t('correction.title'),
        }}
      />
    </Tabs>
  );
}
