import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ColorPicker } from './ColorPicker';
import {
  DARK_ACCENT_PRESETS,
  DARK_NEUTRAL_BACKGROUND,
  DARK_NEUTRAL_BORDER_LIGHT,
  DARK_NEUTRAL_SURFACE_CONTAINER_LOWEST,
  DARK_NEUTRAL_TEXT_PRIMARY,
  DARK_PRIMARY_PRESETS,
  LIGHT_ACCENT_PRESETS,
  LIGHT_NEUTRAL_BACKGROUND,
  LIGHT_NEUTRAL_BORDER_LIGHT,
  LIGHT_NEUTRAL_SURFACE_CONTAINER_LOWEST,
  LIGHT_NEUTRAL_TEXT_PRIMARY,
  LIGHT_PRIMARY_PRESETS,
} from '@/src/theme/colors';

interface BrandingSectionProps {
  theme: any;
  businessName: string;
  setBusinessName: (v: string) => void;
  logoUrl: string | null;
  handlePickLogo: () => void;
  handleRemoveLogo: () => void;
  isUploadingLogo: boolean;
  themeMode: 'light' | 'dark';
  handleThemeModeChange: (mode: 'light' | 'dark') => void;
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  showPrimaryHexInput: boolean;
  setShowPrimaryHexInput: (v: boolean) => void;
  primaryHexInput: string;
  setPrimaryHexInput: (v: string) => void;
  showAccentHexInput: boolean;
  setShowAccentHexInput: (v: boolean) => void;
  accentHexInput: string;
  setAccentHexInput: (v: string) => void;
  handleSaveBranding: () => void;
  isSavingBranding: boolean;
  brandingSavedMsg: string | null;
  brandingErrorMsg: string | null;
  setShowResetModal: (v: boolean) => void;
}

export function BrandingSection({
  theme,
  businessName,
  setBusinessName,
  logoUrl,
  handlePickLogo,
  handleRemoveLogo,
  isUploadingLogo,
  themeMode,
  handleThemeModeChange,
  primaryColor,
  setPrimaryColor,
  accentColor,
  setAccentColor,
  showPrimaryHexInput,
  setShowPrimaryHexInput,
  primaryHexInput,
  setPrimaryHexInput,
  showAccentHexInput,
  setShowAccentHexInput,
  accentHexInput,
  setAccentHexInput,
  handleSaveBranding,
  isSavingBranding,
  brandingSavedMsg,
  brandingErrorMsg,
  setShowResetModal,
}: BrandingSectionProps) {
  const { t } = useTranslation();

  // Derived live preview colors
  const isPreviewDark = themeMode === 'dark';
  const previewBg = isPreviewDark ? DARK_NEUTRAL_BACKGROUND : LIGHT_NEUTRAL_BACKGROUND;
  const previewCardBg = isPreviewDark ? DARK_NEUTRAL_SURFACE_CONTAINER_LOWEST : LIGHT_NEUTRAL_SURFACE_CONTAINER_LOWEST;
  const previewTextPrimary = isPreviewDark ? DARK_NEUTRAL_TEXT_PRIMARY : LIGHT_NEUTRAL_TEXT_PRIMARY;
  const previewBorder = isPreviewDark ? DARK_NEUTRAL_BORDER_LIGHT : LIGHT_NEUTRAL_BORDER_LIGHT;

  return (
    <View className="mb-6 px-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="palette"
            size={22}
            color={theme.primary}
          />
          <Text
            style={{ color: theme.textPrimary }}
            className="font-geist-bold text-lg ml-2"
          >
            {t('settings.branding.title')}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowResetModal(true)}
          className="flex-row items-center px-3 py-1.5 rounded-lg active:opacity-70"
          style={{ backgroundColor: theme.surfaceVariant }}
        >
          <MaterialCommunityIcons name="restore" size={16} color={theme.textSecondary} />
          <Text
            style={{ color: theme.textSecondary }}
            className="font-geist-medium text-xs ml-1.5"
          >
            {t('settings.branding.reset')}
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: theme.surfaceContainerLowest,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
        className="rounded-2xl p-4"
      >
        {/* Business Name */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-2"
        >
          {t('settings.branding.businessName')}
        </Text>
        <TextInput
          style={{
            backgroundColor: theme.background,
            borderColor: theme.borderLight + '80',
            borderWidth: 1,
            color: theme.textPrimary,
          }}
          className="rounded-xl px-4 py-3 font-geist text-sm mb-5"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder={t('settings.branding.businessNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          maxLength={40}
        />

        {/* Logo Upload */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-2"
        >
          {t('settings.branding.logo')}
        </Text>
        <View className="flex-row items-center mb-5">
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
              className="mr-3"
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.background,
                borderColor: theme.borderLight + '60',
                borderWidth: 1,
              }}
              className="items-center justify-center mr-3"
            >
              <MaterialCommunityIcons
                name="image-outline"
                size={24}
                color={theme.textSecondary}
              />
            </View>
          )}
          <View className="flex-1">
            <Pressable
              className="rounded-xl px-4 py-2.5 active:opacity-70 mb-1"
              style={{ backgroundColor: theme.primary }}
              onPress={handlePickLogo}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  style={{ color: '#ffffff' }}
                  className="font-geist-medium text-sm text-center"
                >
                  {logoUrl
                    ? t('settings.branding.logoChange')
                    : t('settings.branding.logoUpload')}
                </Text>
              )}
            </Pressable>
            {logoUrl && (
              <Pressable
                className="active:opacity-60"
                onPress={handleRemoveLogo}
              >
                <Text
                  style={{ color: theme.error }}
                  className="font-geist-medium text-xs text-center"
                >
                  {t('settings.branding.logoRemove')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Theme Mode Segment Switcher */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-2.5"
        >
          {t('settings.branding.themeMode')}
        </Text>
        <View className="flex-row gap-3 mb-6">
          <Pressable
            style={{
              backgroundColor: themeMode === 'light' ? theme.primary : theme.background,
              borderColor: themeMode === 'light' ? theme.primary : theme.borderLight + '80',
              borderWidth: 1,
            }}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
            onPress={() => handleThemeModeChange('light')}
          >
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={18}
              color={themeMode === 'light' ? '#ffffff' : theme.textSecondary}
            />
            <Text
              style={{
                color: themeMode === 'light' ? '#ffffff' : theme.textPrimary,
              }}
              className="font-geist-semibold text-sm ml-2"
            >
              {t('settings.branding.themeModeLight')}
            </Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: themeMode === 'dark' ? theme.primary : theme.background,
              borderColor: themeMode === 'dark' ? theme.primary : theme.borderLight + '80',
              borderWidth: 1,
            }}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
            onPress={() => handleThemeModeChange('dark')}
          >
            <MaterialCommunityIcons
              name="weather-night"
              size={18}
              color={themeMode === 'dark' ? '#ffffff' : theme.textSecondary}
            />
            <Text
              style={{
                color: themeMode === 'dark' ? '#ffffff' : theme.textPrimary,
              }}
              className="font-geist-semibold text-sm ml-2"
            >
              {t('settings.branding.themeModeDark')}
            </Text>
          </Pressable>
        </View>

        {/* Primary Color */}
        <ColorPicker
          label={t('settings.branding.primaryColor')}
          selectedColor={primaryColor}
          onSelectColor={setPrimaryColor}
          showHexInput={showPrimaryHexInput}
          setShowHexInput={setShowPrimaryHexInput}
          hexInput={primaryHexInput}
          setHexInput={setPrimaryHexInput}
          presets={themeMode === 'dark' ? DARK_PRIMARY_PRESETS : LIGHT_PRIMARY_PRESETS}
          theme={theme}
          activeBorderColor={accentColor}
        />

        {/* Accent Color */}
        <ColorPicker
          label={t('settings.branding.accentColor')}
          selectedColor={accentColor}
          onSelectColor={setAccentColor}
          showHexInput={showAccentHexInput}
          setShowHexInput={setShowAccentHexInput}
          hexInput={accentHexInput}
          setHexInput={setAccentHexInput}
          presets={themeMode === 'dark' ? DARK_ACCENT_PRESETS : LIGHT_ACCENT_PRESETS}
          theme={theme}
          activeBorderColor={primaryColor}
        />

        {/* Live Preview */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-2.5"
        >
          {t('settings.branding.preview')}
        </Text>
        <View
          style={{
            backgroundColor: previewBg,
            borderColor: previewBorder,
          }}
          className="rounded-2xl p-4 border mb-5"
        >
          <View
            style={{
              backgroundColor: previewCardBg,
            }}
            className="rounded-xl p-3 border"
          >
            <View className="flex-row items-center mb-3">
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                  className="mr-2"
                />
              ) : (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: primaryColor,
                  }}
                  className="mr-2 items-center justify-center"
                >
                  <Text className="text-white text-xs font-geist-bold">
                    {(businessName || 'P')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <Text
                style={{ color: previewTextPrimary }}
                className="font-geist-semibold text-sm"
              >
                {businessName || 'Punch App'}
              </Text>
            </View>

            <Pressable
              style={{ backgroundColor: primaryColor }}
              className="rounded-xl py-3 items-center mb-3"
            >
              <Text
                style={{ color: '#ffffff' }}
                className="font-geist-semibold text-sm"
              >
                {t('punch.clockIn')}
              </Text>
            </Pressable>

            <View className="flex-row gap-2">
              <View
                style={{ backgroundColor: accentColor + '25' }}
                className="flex-1 rounded-lg py-2 items-center"
              >
                <Text
                  style={{ color: accentColor }}
                  className="font-geist-medium text-xs"
                >
                  {t('admin.payPeriods.paid')}
                </Text>
              </View>
              <View
                style={{ backgroundColor: theme.success + '25' }}
                className="flex-1 rounded-lg py-2 items-center"
              >
                <Text
                  style={{ color: theme.success }}
                  className="font-geist-medium text-xs"
                >
                  {t('admin.employees.active')}
                </Text>
              </View>
              <View
                style={{ backgroundColor: theme.warning + '25' }}
                className="flex-1 rounded-lg py-2 items-center"
              >
                <Text
                  style={{ color: theme.warning }}
                  className="font-geist-medium text-xs"
                >
                  {t('admin.payPeriods.unpaid')}
                </Text>
              </View>
            </View>
          </View>
        </View>



        {/* Save Branding Button */}
        <Pressable
          style={{ backgroundColor: theme.primary }}
          className="rounded-xl py-3.5 items-center active:opacity-80"
          onPress={handleSaveBranding}
          disabled={isSavingBranding}
        >
          {isSavingBranding ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text
              style={{ color: '#ffffff' }}
              className="font-geist-semibold text-sm"
            >
              {t('settings.branding.save')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
