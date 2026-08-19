import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/app/_layout';
import { useTheme } from '@/src/theme/ThemeProvider';
import { signOut, changePassword, updateUserEmail } from '@/src/api/auth';
import {
  getAvailableLocales,
  updateProfileLocale,
  uploadAvatar,
} from '@/src/api/profiles';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { LanguageSelectModal } from '@/src/components/ui/LanguageSelectModal';
import { ChangeEmailModal } from '@/src/components/ui/ChangeEmailModal';
import { ChangePasswordModal } from '@/src/components/ui/ChangePasswordModal';
import { Toast } from '@/src/components/ui/Toast';

/** Profile screen — shared across admin and employee tab layouts. */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailModalError, setEmailModalError] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const availableLocales = getAvailableLocales();
  const selectedLocale = availableLocales.find((l) => l.code === currentLang) || availableLocales[0];
  const isAdmin = profile?.role === 'admin';

  /** Open image picker and upload selected avatar image */
  async function handlePickAvatar() {
    if (!profile) return;
    setStatusMessage(null);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setIsUploading(true);

      const { error } = await uploadAvatar(
        profile.id,
        asset.uri,
        asset.mimeType ?? undefined,
        asset.base64 ?? undefined,
      );

      if (error) {
        let msg = t('profile.avatarUploadError');
        if (error.message === 'FILE_TOO_LARGE') {
          msg = t('profile.avatarUploadSize');
        } else if (error.message === 'INVALID_FILE_TYPE') {
          msg = t('profile.avatarUploadType');
        }
        setStatusMessage({ text: msg, isError: true });
      } else {
        await refreshProfile();
      }
    } catch {
      setStatusMessage({ text: t('profile.avatarUploadError'), isError: true });
    } finally {
      setIsUploading(false);
    }
  }

  /** Change language and persist to Supabase profile */
  async function handleLanguageChange(lang: string) {
    setCurrentLang(lang);
    await i18n.changeLanguage(lang);
    if (profile) {
      await updateProfileLocale(profile.id, lang);
      await refreshProfile();
    }
  }

  /** Save updated email address for Admin */
  async function handleSaveEmail(newEmail: string, currentPassword: string) {
    if (!profile?.email) return;
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailModalError(t('profile.invalidEmail'));
      return;
    }

    if (!currentPassword) {
      setEmailModalError(t('profile.invalidCurrentPassword'));
      return;
    }

    setIsSavingEmail(true);
    setEmailModalError(null);

    const { error } = await updateUserEmail(
      profile.id,
      profile.email,
      currentPassword,
      cleanEmail,
    );
    setIsSavingEmail(false);

    if (error) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        setEmailModalError(t('profile.invalidCurrentPassword'));
      } else {
        setEmailModalError(t('profile.emailUpdateError'));
      }
    } else {
      setShowEmailModal(false);
      setStatusMessage({ text: t('profile.emailUpdated'), isError: false });
      await refreshProfile();
    }
  }

  /** Verify current password and update to new password */
  async function handleSavePassword(
    currentPass: string,
    newPass: string,
    confirmPass: string,
  ) {
    if (!profile?.email) return;

    if (!currentPass) {
      setPasswordModalError(t('profile.invalidCurrentPassword'));
      return;
    }

    if (newPass.length < 6) {
      setPasswordModalError(t('profile.passwordTooShort'));
      return;
    }

    if (newPass !== confirmPass) {
      setPasswordModalError(t('profile.passwordMismatch'));
      return;
    }

    setIsChangingPassword(true);
    setPasswordModalError(null);

    const { error } = await changePassword(profile.email, currentPass, newPass);
    setIsChangingPassword(false);

    if (error) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        setPasswordModalError(t('profile.invalidCurrentPassword'));
      } else {
        setPasswordModalError(t('profile.changePasswordError'));
      }
    } else {
      setShowPasswordModal(false);
      setStatusMessage({ text: t('profile.passwordChanged'), isError: false });
    }
  }

  /** Confirm and execute logout */
  async function handleConfirmLogout() {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
  }

  // Card style matching rest of app: no explicit borders, soft shadows, rounded corners
  const cardStyle = {
    backgroundColor: theme.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: insets.bottom + 40,
        }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Title Bar */}
        <Text
          style={{ color: theme.textPrimary }}
          className="font-geist-bold text-2xl mb-6"
        >
          {t('profile.title')}
        </Text>

        {/* Profile Header Card */}
        <View style={cardStyle} className="rounded-2xl p-6 items-center mb-5">
          <Pressable
            onPress={handlePickAvatar}
            disabled={isUploading}
            className="relative active:opacity-80"
          >
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name}
              role={profile?.role}
              size={96}
            />
            <View
              style={{
                backgroundColor: theme.primary,
                borderColor: theme.surfaceContainerLowest,
              }}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 shadow-sm"
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialCommunityIcons name="camera" size={16} color="#ffffff" />
              )}
            </View>
          </Pressable>
          <Pressable onPress={handlePickAvatar} disabled={isUploading} className="mt-2.5">
            <Text style={{ color: theme.primary }} className="font-geist-medium text-xs">
              {t('profile.changeAvatar')}
            </Text>
          </Pressable>

          {/* Display Name */}
          <Text
            style={{ color: theme.textPrimary }}
            className="font-geist-bold text-xl text-center mt-3"
          >
            {profile?.full_name ?? ''}
          </Text>
        </View>

        {/* Account Details Card */}
        <View style={cardStyle} className="rounded-2xl p-5 mb-5">
          {/* Email Field */}
          <View className="flex-row items-center justify-between py-1.5">
            <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm">
              {t('profile.email')}
            </Text>
            <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-sm">
              {profile?.email ?? '—'}
            </Text>
          </View>

          <View style={{ backgroundColor: theme.surfaceVariant }} className="h-px w-full my-3" />

          {/* Role Field */}
          <View className="flex-row items-center justify-between py-1.5">
            <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm">
              {t('profile.role')}
            </Text>
            <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-sm capitalize">
              {profile?.role ?? 'employee'}
            </Text>
          </View>

          {/* Hourly Rate Field — EMPLOYEES ONLY (hidden entirely for admins) */}
          {!isAdmin && profile?.hourly_rate !== undefined && (
            <>
              <View style={{ backgroundColor: theme.surfaceVariant }} className="h-px w-full my-3" />
              <View className="flex-row items-center justify-between py-1.5">
                <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm">
                  {t('profile.hourlyRate')}
                </Text>
                <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-sm">
                  ${Number(profile?.hourly_rate ?? 0).toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Language Selection Action Row */}
        <Pressable
          style={cardStyle}
          className="w-full py-4 px-5 rounded-2xl flex-row items-center justify-between mb-5 active:opacity-80"
          onPress={() => setShowLanguageModal(true)}
        >
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="translate" size={20} color={theme.textPrimary} />
            <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base">
              {t('profile.language')}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text style={{ color: theme.textSecondary }} className="font-geist-medium text-sm">
              {selectedLocale?.label}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
        </Pressable>

        {/* Change Email Button (Admin Only) */}
        {isAdmin && (
          <Pressable
            style={cardStyle}
            className="w-full py-4 px-5 rounded-2xl flex-row items-center justify-between mb-5 active:opacity-80"
            onPress={() => {
              setEmailModalError(null);
              setShowEmailModal(true);
            }}
          >
            <View className="flex-row items-center gap-3">
              <MaterialCommunityIcons name="email-edit-outline" size={20} color={theme.textPrimary} />
              <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base">
                {t('profile.changeEmail')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        )}

        {/* Change Password Button */}
        <Pressable
          style={cardStyle}
          className="w-full py-4 px-5 rounded-2xl flex-row items-center justify-between mb-5 active:opacity-80"
          onPress={() => {
            setPasswordModalError(null);
            setShowPasswordModal(true);
          }}
        >
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name="lock-reset" size={20} color={theme.textPrimary} />
            <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base">
              {t('profile.changePassword')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        {/* Destructive Log Out Button */}
        <Pressable
          style={{
            backgroundColor: theme.error,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
          className="w-full py-4 items-center rounded-2xl active:opacity-85 flex-row justify-center gap-2"
          onPress={() => setShowLogoutModal(true)}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
          <Text className="font-geist-semibold text-white text-base">
            {t('common.logOut')}
          </Text>
        </Pressable>

        {/* Language Selection Modal */}
        <LanguageSelectModal
          visible={showLanguageModal}
          currentLang={currentLang}
          availableLocales={availableLocales}
          onSelect={handleLanguageChange}
          onClose={() => setShowLanguageModal(false)}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          visible={showPasswordModal}
          isLoading={isChangingPassword}
          errorMessage={passwordModalError}
          onSave={handleSavePassword}
          onClose={() => setShowPasswordModal(false)}
        />

        {/* Change Email Modal (Admin Only) */}
        {isAdmin && (
          <ChangeEmailModal
            visible={showEmailModal}
            currentEmail={profile?.email ?? ''}
            isLoading={isSavingEmail}
            errorMessage={emailModalError}
            onSave={handleSaveEmail}
            onClose={() => setShowEmailModal(false)}
          />
        )}

        {/* Logout Confirmation Modal */}
        <ConfirmModal
          visible={showLogoutModal}
          title={t('profile.logOutConfirmTitle')}
          message={t('profile.logOutConfirmMessage')}
          confirmText={t('common.logOut')}
          cancelText={t('common.cancel')}
          isDestructive={true}
          isLoading={isLoggingOut}
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      </ScrollView>

      {/* Toast Notification Banner - Placed OUTSIDE ScrollView so it floats fixed on the screen */}
      <Toast
        visible={!!statusMessage}
        message={statusMessage?.text ?? null}
        type={statusMessage?.isError ? 'error' : 'success'}
        onDismiss={() => setStatusMessage(null)}
      />
    </View>
  );
}
