import React from 'react';
import { Image, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

type UserAvatarProps = {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
};

/**
 * Renders a user's avatar image, or a generic placeholder avatar with
 * initials/icon if no profile picture is set.
 */
export function UserAvatar({ avatarUrl, name, size = 40 }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-surface-container-high"
      />
    );
  }

  // Get initials if name is provided (e.g. "John Doe" -> "JD")
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
        <Text style={{ fontSize: size * 0.38 }} className="font-geist-semibold text-primary">
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-surface-container-high items-center justify-center border border-outline-variant/40"
    >
      <MaterialCommunityIcons name="account" size={size * 0.6} color={colors.textSecondary} />
    </View>
  );
}
