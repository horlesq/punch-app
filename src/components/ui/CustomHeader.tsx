import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

type CustomHeaderProps = {
  title?: string;
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
      }}
      className="flex-row items-center justify-between w-full px-6 pb-3"
    >
      {/* Left: Logo + Business Name */}
      <View className="flex-row items-center pt-4 flex-1 pr-4">
        {theme.logoUrl ? (
          <Image
            key={theme.logoUrl}
            source={{ uri: theme.logoUrl }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{ backgroundColor: theme.primary }}
            className="w-8 h-8 rounded-full items-center justify-center"
          >
            <MaterialCommunityIcons name="briefcase" size={18} color="#ffffff" />
          </View>
        )}
        <Text
          style={{ color: theme.textPrimary }}
          className="font-geist-bold text-base ml-3"
          numberOfLines={1}
        >
          {theme.businessName}
        </Text>
      </View>

      {/* Right: Profile Icon */}
      <Pressable
        onPress={() => router.push('/profile')}
        className="active:opacity-60 pt-4"
      >
        <UserAvatar name={profile?.full_name} size={32} />
      </Pressable>
    </View>
  );
}
