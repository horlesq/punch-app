import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { signOut } from '@/src/api/auth';
import { updateProfileLocale } from '@/src/api/profiles';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

/** Profile screen — shared across admin and employee, accessible from either nav. */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

  async function handleLanguageChange(lang: string) {
    setCurrentLang(lang);
    await i18n.changeLanguage(lang);
    if (profile) {
      await updateProfileLocale(profile.id, lang);
    }
  }

  async function handleLogOut() {
    await signOut();
  }

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
      <View className="items-center mb-8">
        <View className="mb-4">
          <UserAvatar name={profile?.full_name} size={96} />
        </View>
        <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-2xl text-center">
          {profile?.full_name ?? ''}
        </Text>
        <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm capitalize mt-1">
          {profile?.role ?? 'Employee'}
        </Text>
      </View>

      {/* Language Selector Card */}
      <View
        style={{
          backgroundColor: theme.surfaceContainerLowest,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
        className="w-full rounded-xl p-4 mb-6"
      >
        <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base mb-3">
          {t('profile.language')}
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            style={{
              backgroundColor: currentLang === 'en' ? theme.primary : theme.surfaceVariant,
            }}
            className="flex-1 py-3 px-4 rounded-lg items-center"
            onPress={() => handleLanguageChange('en')}
          >
            <Text
              style={{
                color: currentLang === 'en' ? '#ffffff' : theme.textPrimary,
              }}
              className="font-geist-medium text-sm"
            >
              {t('profile.english')} 🇺🇸
            </Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: currentLang === 'ro' ? theme.primary : theme.surfaceVariant,
            }}
            className="flex-1 py-3 px-4 rounded-lg items-center"
            onPress={() => handleLanguageChange('ro')}
          >
            <Text
              style={{
                color: currentLang === 'ro' ? '#ffffff' : theme.textPrimary,
              }}
              className="font-geist-medium text-sm"
            >
              {t('profile.romanian')} 🇷🇴
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={{ backgroundColor: theme.error }}
        className="w-full py-4 items-center rounded-xl active:opacity-85"
        onPress={handleLogOut}
      >
        <Text className="font-geist-semibold text-white text-base">
          {t('common.logOut')}
        </Text>
      </Pressable>
    </View>
  );
}
