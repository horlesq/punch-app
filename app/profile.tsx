import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { signOut } from '@/src/api/auth';

/** Profile screen — shared across admin and employee, accessible from either nav. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  async function handleLogOut() {
    await signOut();
  }

  return (
    <View className="flex-1 justify-center items-center px-6 bg-background">
      <Text className="font-bold mb-8 text-textPrimary text-xl">
        {profile?.full_name ?? ''}
      </Text>

      <Pressable
        className="py-4 px-8 items-center bg-error rounded-md"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={handleLogOut}
      >
        <Text className="font-semibold text-textInverse text-base">
          {t('common.logOut')}
        </Text>
      </Pressable>
    </View>
  );
}
