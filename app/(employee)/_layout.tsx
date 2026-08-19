import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Redirect, Tabs, Link } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '@/src/components/ui/CustomTabBar';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';

/**
 * Employee layout — tab bar with Punch / History / My Pay.
 */
export default function EmployeeLayout() {
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

  // Prevent admins from accidentally landing on employee tabs
  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="punch"
        options={{
          title: t('tabs.employee.punch'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gesture-tap-button" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.employee.history'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-pay"
        options={{
          title: t('tabs.employee.myPay'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="correction"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}
