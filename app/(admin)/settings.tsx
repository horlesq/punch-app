import React from 'react';
import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

/** Placeholder screen — will be implemented in Phase 3. */
export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 justify-center items-center px-6 bg-background">
      <Text className="font-bold mb-2 text-textPrimary text-xl">
        {t('placeholder.title')}
      </Text>
      <Text className="text-center text-textSecondary text-base">
        {t('placeholder.message')}
      </Text>
    </View>
  );
}
