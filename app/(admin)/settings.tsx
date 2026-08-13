import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import {
  getBusinessSettings,
  updateBranding,
  updateRules,
  uploadLogo,
} from '@/src/api/businessSettings';
import {
  DEFAULT_ACCENT_DARK_MODE,
  DEFAULT_ACCENT_LIGHT_MODE,
  DEFAULT_PRIMARY_DARK_MODE,
  DEFAULT_PRIMARY_LIGHT_MODE,
} from '@/src/theme/colors';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { Toast } from '@/src/components/ui/Toast';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { BrandingSection } from '@/src/components/settings/BrandingSection';
import { RulesSection } from '@/src/components/settings/RulesSection';
import { isValidHex } from '@/src/components/settings/ReanimatedColorPickerWrapper';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { theme, refreshTheme } = useTheme();

  // Branding state (Separate color pairs for Light & Dark mode)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [lightPrimary, setLightPrimary] = useState(DEFAULT_PRIMARY_LIGHT_MODE);
  const [lightAccent, setLightAccent] = useState(DEFAULT_ACCENT_LIGHT_MODE);
  const [darkPrimary, setDarkPrimary] = useState(DEFAULT_PRIMARY_DARK_MODE);
  const [darkAccent, setDarkAccent] = useState(DEFAULT_ACCENT_DARK_MODE);

  const primaryColor = themeMode === 'dark' ? darkPrimary : lightPrimary;
  const accentColor = themeMode === 'dark' ? darkAccent : lightAccent;

  const setPrimaryColor = (color: string) => {
    if (themeMode === 'dark') {
      setDarkPrimary(color);
    } else {
      setLightPrimary(color);
    }
  };

  const setAccentColor = (color: string) => {
    if (themeMode === 'dark') {
      setDarkAccent(color);
    } else {
      setLightAccent(color);
    }
  };

  const [showPrimaryHexInput, setShowPrimaryHexInput] = useState(false);
  const [showAccentHexInput, setShowAccentHexInput] = useState(false);
  const [primaryHexInput, setPrimaryHexInput] = useState('');
  const [accentHexInput, setAccentHexInput] = useState('');
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSavedMsg, setBrandingSavedMsg] = useState<string | null>(null);
  const [brandingErrorMsg, setBrandingErrorMsg] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Rules state
  const [breakThreshold, setBreakThreshold] = useState('4');
  const [breakDuration, setBreakDuration] = useState('60');
  const [correctionMode, setCorrectionMode] = useState<'auto' | 'manual'>('manual');
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesSavedMsg, setRulesSavedMsg] = useState<string | null>(null);
  const [rulesErrorMsg, setRulesErrorMsg] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Load current settings
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    setIsLoading(true);
    const { data } = await getBusinessSettings();
    if (data) {
      const mode: 'light' | 'dark' = data.theme_mode === 'dark' ? 'dark' : 'light';
      setThemeMode(mode);
      setBusinessName(data.business_name || '');
      setLogoUrl(data.logo_url || null);

      if (mode === 'dark') {
        setDarkPrimary(data.primary_color || DEFAULT_PRIMARY_DARK_MODE);
        setDarkAccent(data.accent_color || DEFAULT_ACCENT_DARK_MODE);
        setLightPrimary(DEFAULT_PRIMARY_LIGHT_MODE);
        setLightAccent(DEFAULT_ACCENT_LIGHT_MODE);
      } else {
        setLightPrimary(data.primary_color || DEFAULT_PRIMARY_LIGHT_MODE);
        setLightAccent(data.accent_color || DEFAULT_ACCENT_LIGHT_MODE);
        setDarkPrimary(DEFAULT_PRIMARY_DARK_MODE);
        setDarkAccent(DEFAULT_ACCENT_DARK_MODE);
      }

      setBreakThreshold(String(data.break_threshold_hours ?? 4));
      setBreakDuration(String(data.break_duration_minutes ?? 60));
      setCorrectionMode(
        data.correction_approval_mode === 'auto' ? 'auto' : 'manual'
      );
    }
    setIsLoading(false);
  }

  // Handle switching theme mode (Light / Dark)
  function handleThemeModeChange(newMode: 'light' | 'dark') {
    if (newMode === themeMode) return;
    setThemeMode(newMode);
    setShowPrimaryHexInput(false);
    setShowAccentHexInput(false);
  }

  // ── Logo Upload ──────────────────────────────────────────────────────────
  async function handlePickLogo() {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert(t('settings.branding.errorUploading'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const mimeType = (asset.mimeType || '').toLowerCase();
    const uriLower = uri.toLowerCase();

    const isImage =
      mimeType.startsWith('image/') ||
      uriLower.includes('.png') ||
      uriLower.includes('.jpg') ||
      uriLower.includes('.jpeg') ||
      uriLower.includes('.webp') ||
      uriLower.startsWith('blob:') ||
      uriLower.startsWith('data:image/');

    if (!isImage) {
      setBrandingErrorMsg(t('settings.branding.errorUploadType'));
      return;
    }

    setIsUploadingLogo(true);
    setBrandingErrorMsg(null);

    const { url, error } = await uploadLogo(uri, asset.mimeType);

    setIsUploadingLogo(false);

    if (error) {
      if (error.message === 'FILE_TOO_LARGE') {
        setBrandingErrorMsg(t('settings.branding.errorUploadSize'));
      } else if (error.message === 'INVALID_FILE_TYPE') {
        setBrandingErrorMsg(t('settings.branding.errorUploadType'));
      } else {
        setBrandingErrorMsg(t('settings.branding.errorUploading'));
      }
      return;
    }

    if (url) {
      setLogoUrl(url);
    }
  }

  function handleRemoveLogo() {
    setLogoUrl(null);
  }

  // ── Save Branding ────────────────────────────────────────────────────────
  async function handleSaveBranding() {
    setIsSavingBranding(true);
    setBrandingSavedMsg(null);
    setBrandingErrorMsg(null);

    // Validate hex values before saving
    if (!isValidHex(primaryColor)) {
      setBrandingErrorMsg(t('settings.branding.errorInvalidHex'));
      setIsSavingBranding(false);
      return;
    }
    if (accentColor && !isValidHex(accentColor)) {
      setBrandingErrorMsg(t('settings.branding.errorInvalidHex'));
      setIsSavingBranding(false);
      return;
    }

    const { error } = await updateBranding(
      businessName.trim(),
      logoUrl,
      primaryColor,
      accentColor,
      themeMode
    );

    setIsSavingBranding(false);

    if (error) {
      setBrandingErrorMsg(t('settings.branding.errorSaving'));
    } else {
      setBrandingSavedMsg(t('settings.branding.saved'));
      await refreshTheme();
    }
  }

  function handleConfirmResetToDefaults() {
    setThemeMode('light');
    setBusinessName('Punch App');
    setLogoUrl(null);
    setLightPrimary(DEFAULT_PRIMARY_LIGHT_MODE);
    setLightAccent(DEFAULT_ACCENT_LIGHT_MODE);
    setDarkPrimary(DEFAULT_PRIMARY_DARK_MODE);
    setDarkAccent(DEFAULT_ACCENT_DARK_MODE);
    setShowPrimaryHexInput(false);
    setShowAccentHexInput(false);
    setPrimaryHexInput('');
    setAccentHexInput('');
    setShowResetModal(false);
  }

  // ── Save Rules ───────────────────────────────────────────────────────────
  async function handleSaveRules() {
    setIsSavingRules(true);
    setRulesSavedMsg(null);
    setRulesErrorMsg(null);

    const thresholdNum = parseFloat(breakThreshold) || 4;
    const durationNum = parseInt(breakDuration, 10) || 60;

    const clampedThreshold = Math.max(1, Math.min(12, thresholdNum));
    const clampedDuration = Math.max(0, Math.min(120, durationNum));

    const { error } = await updateRules(
      clampedThreshold,
      clampedDuration,
      correctionMode
    );

    setIsSavingRules(false);

    if (error) {
      setRulesErrorMsg(t('settings.rules.errorSaving'));
    } else {
      setRulesSavedMsg(t('settings.rules.saved'));
      setBreakThreshold(String(clampedThreshold));
      setBreakDuration(String(clampedDuration));
      setTimeout(() => setRulesSavedMsg(null), 3000);
    }
  }

  if (isLoading) {
    return <SettingsSkeleton theme={theme} />;
  }

  const activeToast = brandingErrorMsg
    ? { type: 'error' as const, message: brandingErrorMsg, onDismiss: () => setBrandingErrorMsg(null) }
    : brandingSavedMsg
    ? { type: 'success' as const, message: brandingSavedMsg, onDismiss: () => setBrandingSavedMsg(null) }
    : rulesErrorMsg
    ? { type: 'error' as const, message: rulesErrorMsg, onDismiss: () => setRulesErrorMsg(null) }
    : rulesSavedMsg
    ? { type: 'success' as const, message: rulesSavedMsg, onDismiss: () => setRulesSavedMsg(null) }
    : null;

  return (
    <ScreenWrapper>
      {activeToast && (
        <Toast
          visible={true}
          message={activeToast.message}
          type={activeToast.type}
          onDismiss={activeToast.onDismiss}
        />
      )}

      <View className="py-4">
        {/* Branding & Styling Section */}
        <BrandingSection
          theme={theme}
          businessName={businessName}
          setBusinessName={setBusinessName}
          logoUrl={logoUrl}
          handlePickLogo={handlePickLogo}
          handleRemoveLogo={handleRemoveLogo}
          isUploadingLogo={isUploadingLogo}
          themeMode={themeMode}
          handleThemeModeChange={handleThemeModeChange}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          showPrimaryHexInput={showPrimaryHexInput}
          setShowPrimaryHexInput={setShowPrimaryHexInput}
          primaryHexInput={primaryHexInput}
          setPrimaryHexInput={setPrimaryHexInput}
          showAccentHexInput={showAccentHexInput}
          setShowAccentHexInput={setShowAccentHexInput}
          accentHexInput={accentHexInput}
          setAccentHexInput={setAccentHexInput}
          handleSaveBranding={handleSaveBranding}
          isSavingBranding={isSavingBranding}
          brandingSavedMsg={brandingSavedMsg}
          brandingErrorMsg={brandingErrorMsg}
          setShowResetModal={setShowResetModal}
        />

        {/* Business Rules Section */}
        <RulesSection
          theme={theme}
          breakThreshold={breakThreshold}
          setBreakThreshold={setBreakThreshold}
          breakDuration={breakDuration}
          setBreakDuration={setBreakDuration}
          correctionMode={correctionMode}
          setCorrectionMode={setCorrectionMode}
          handleSaveRules={handleSaveRules}
          isSavingRules={isSavingRules}
          rulesSavedMsg={rulesSavedMsg}
          rulesErrorMsg={rulesErrorMsg}
        />

        {/* Reset Confirmation Modal */}
        <ConfirmModal
          visible={showResetModal}
          title={t('settings.branding.resetConfirmTitle')}
          message={t('settings.branding.resetConfirmMessage')}
          confirmText={t('settings.branding.reset')}
          isDestructive={true}
          onConfirm={handleConfirmResetToDefaults}
          onCancel={() => setShowResetModal(false)}
        />
      </View>
    </ScreenWrapper>
  );
}

function SettingsSkeleton({ theme }: { theme: any }) {
  return (
    <View
      style={{ backgroundColor: theme.background }}
      className="flex-1 p-4"
    >
      <View
        style={{ backgroundColor: theme.surfaceContainerLowest }}
        className="rounded-2xl p-4 mb-6 h-96 animate-pulse"
      />
      <View
        style={{ backgroundColor: theme.surfaceContainerLowest }}
        className="rounded-2xl p-4 h-64 animate-pulse"
      />
    </View>
  );
}
