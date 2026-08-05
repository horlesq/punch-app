import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

type CustomHeaderProps = {
  title: string;
};

export function CustomHeader({ title }: CustomHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { theme } = useTheme();

  return (
    <View 
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.surfaceContainerLowest,
        borderBottomColor: theme.borderLight + '40',
        borderBottomWidth: 1,
      }} 
      className="flex-row items-center justify-between w-full px-6 pb-2"
    >
      <View className="flex-row items-center pt-4">
        <Pressable onPress={() => router.push('/profile')} className="active:opacity-60 mr-3">
          <UserAvatar name={profile?.full_name} size={40} />
        </Pressable>
        <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-[17px]">{title}</Text>
      </View>
    </View>
  );
}
