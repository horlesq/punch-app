import React from 'react';
import { Image, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeProvider';

type UserAvatarProps = {
  avatarUrl?: string | null;
  name?: string | null;
  role?: 'admin' | 'employee' | string | null;
  size?: number;
};

/**
 * Renders a user's avatar image, or a default placeholder avatar.
 * Admin users receive a prominent suit-and-tie admin icon (account-tie) when no picture is uploaded.
 */
export function UserAvatar({
  avatarUrl,
  name,
  role,
  size = 40,
}: UserAvatarProps) {
  const { theme } = useTheme();
  const isAdmin = role === 'admin';

  // Render uploaded image if avatarUrl is provided
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-surface-container-high"
      />
    );
  }

  // Admin users without an uploaded photo display the prominent suit-and-tie admin icon
  if (isAdmin) {
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-surface-container-high items-center justify-center border border-outline-variant/40 overflow-hidden"
      >
        <MaterialCommunityIcons
          name="account-tie"
          size={Math.round(size * 1.15)}
          color={theme.primary}
        />
      </View>
    );
  }

  // Employee initials fallback
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  if (initials) {
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-surface-container-high items-center justify-center border border-outline-variant/40"
      >
        <Text
          style={{ fontSize: size * 0.44, color: theme.primary }}
          className="font-geist-semibold"
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-surface-container-high items-center justify-center border border-outline-variant/40 overflow-hidden"
    >
      <MaterialCommunityIcons
        name="account"
        size={Math.round(size * 0.78)}
        color={theme.textSecondary}
      />
    </View>
  );
}
