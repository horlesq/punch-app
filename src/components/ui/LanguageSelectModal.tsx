import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/theme/ThemeProvider';

export interface LocaleOption {
  code: string;
  label: string;
  flag?: string;
}

export interface LanguageSelectModalProps {
  visible: boolean;
  currentLang: string;
  availableLocales: LocaleOption[];
  onSelect: (code: string) => void;
  onClose: () => void;
}

/**
 * Scalable modal for selecting application language.
 * Accommodates any number of languages with smooth scrolling and visual checkmark indicators.
 */
export function LanguageSelectModal({
  visible,
  currentLang,
  availableLocales,
  onSelect,
  onClose,
}: LanguageSelectModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay Backdrop */}
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center p-5"
        onPress={onClose}
      >
        {/* Modal Content Card */}
        <Pressable
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
          className="w-full max-w-sm rounded-2xl p-6"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text
              style={{ color: theme.textPrimary }}
              className="font-geist-semibold text-xl"
            >
              {t('profile.language')}
            </Text>
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full active:opacity-60"
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>

          {/* Options List */}
          <ScrollView
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          >
            {availableLocales.map((loc, index) => {
              const isSelected = currentLang === loc.code;
              const isLast = index === availableLocales.length - 1;

              return (
                <Pressable
                  key={loc.code}
                  style={{
                    backgroundColor: isSelected
                      ? theme.surfaceVariant
                      : 'transparent',
                  }}
                  className={`flex-row items-center justify-between p-3.5 rounded-xl ${
                    !isLast ? 'mb-1.5' : ''
                  } active:opacity-70`}
                  onPress={() => {
                    onSelect(loc.code);
                    onClose();
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? theme.primary : theme.textPrimary,
                    }}
                    className={`font-geist-medium text-base ${
                      isSelected ? 'font-geist-semibold' : ''
                    }`}
                  >
                    {loc.label}
                  </Text>

                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
