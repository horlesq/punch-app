import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Redirect, Tabs, Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '@/src/components/ui/CustomTabBar';

import { useAuth } from '@/app/_layout';
import { colors } from '@/src/theme/colors';

/**
 * Employee layout — tab bar with Punch / History / My Pay.
 */
export default function EmployeeLayout() {
  const { t } = useTranslation();
  const { session, profile, isLoading, isProfileLoading } = useAuth();

  // Wait until we actually have profile data before making role decisions.
  // After login, session arrives instantly but profile fetch is async —
  // without this guard we'd fall through and render employee tabs for admins.
  if (isLoading || isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color="#000000" />
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
        name="punch"
        options={{
          title: t('tabs.employee.punch'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.employee.history'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-pay"
        options={{
          title: t('tabs.employee.myPay'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
