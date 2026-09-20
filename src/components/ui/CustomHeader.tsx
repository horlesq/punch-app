import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { AppLogo } from '@/src/components/ui/AppLogo';

type CustomHeaderProps = {
  title?: string;
};

export function CustomHeader({ title }: CustomHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [logoError, setLogoError] = useState(false);

  // Reset error state when logoUrl changes (e.g. after re-upload)
  const logoKey = theme.logoUrl ?? '';
  React.useEffect(() => {
    setLogoError(false);
  }, [logoKey]);

  const showLogo = theme.logoUrl && !logoError;

  return (
    <View
      style={{
        paddingTop: insets.top,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
      }}
      className="flex-row items-center justify-between w-full px-6 pb-4"
    >
      {/* Left: Logo + Business Name */}
      <View className="flex-row items-center pt-4 flex-1 pr-4">
        {showLogo ? (
          <Image
            key={theme.logoUrl}
            source={{ uri: theme.logoUrl! }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            resizeMode="cover"
            onError={() => setLogoError(true)}
          />
        ) : (
          <AppLogo size={32} />
        )}
        <Text
          style={{ color: theme.textPrimary }}
          className="font-geist-bold text-2xl ml-3"
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
        <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.full_name} role={profile?.role} size={36} />
      </Pressable>
    </View>
  );
}
