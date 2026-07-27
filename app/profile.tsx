import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import { signOut } from '@/src/api/auth';
import { updateProfileLocale } from '@/src/api/profiles';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

/** Profile screen — shared across admin and employee, accessible from either nav. */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
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

      {/* Language Selector Card */}
      <View className="w-full bg-surface-container-lowest rounded-xl p-4 mb-6">
        <Text className="font-geist-semibold text-on-surface text-base mb-3">
          {t('profile.language')}
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            className={`flex-1 py-3 px-4 rounded-lg items-center ${
              currentLang === 'en' ? 'bg-primary' : 'bg-surface-container-high'
            }`}
            onPress={() => handleLanguageChange('en')}
          >
            <Text
              className={`font-geist-medium text-sm ${
                currentLang === 'en' ? 'text-on-primary' : 'text-on-surface'
              }`}
            >
              {t('profile.english')} 🇺🇸
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 py-3 px-4 rounded-lg items-center ${
              currentLang === 'ro' ? 'bg-primary' : 'bg-surface-container-high'
            }`}
            onPress={() => handleLanguageChange('ro')}
          >
            <Text
              className={`font-geist-medium text-sm ${
                currentLang === 'ro' ? 'text-on-primary' : 'text-on-surface'
              }`}
            >
              {t('profile.romanian')} 🇷🇴
            </Text>
          </Pressable>
        </View>
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
