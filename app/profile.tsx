import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { signOut } from '@/src/api/auth';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

/** Profile screen — shared across admin and employee, accessible from either nav. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  async function handleLogOut() {
    await signOut();
  }

  return (
    <View className="flex-1 justify-center items-center px-6 bg-background">
      <View className="items-center mb-8">
        <View className="mb-4">
          <UserAvatar name={profile?.full_name} size={96} />
        </View>
        <Text className="font-geist-bold text-on-surface text-2xl text-center">
          {profile?.full_name ?? ''}
        </Text>
        <Text className="font-geist-medium text-textSecondary text-sm capitalize mt-1">
          {profile?.role ?? 'Employee'}
        </Text>
      </View>

      <Pressable
        className="w-full py-4 items-center bg-error rounded-xl active:opacity-85"
        onPress={handleLogOut}
      >
        <Text className="font-geist-semibold text-on-primary text-base">
          {t('common.logOut')}
        </Text>
      </Pressable>
    </View>
  );
}
