import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/theme/ThemeProvider';

export interface ChangeEmailModalProps {
  visible: boolean;
  currentEmail: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onSave: (newEmail: string, currentPassword: string) => void;
  onClose: () => void;
}

/**
 * Modal dialog for changing admin email address, requiring current password verification.
 */
export function ChangeEmailModal({
  visible,
  currentEmail,
  isLoading = false,
  errorMessage = null,
  onSave,
  onClose,
}: ChangeEmailModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [emailInput, setEmailInput] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState('');

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmailInput(currentEmail);
      setCurrentPassword('');
      setIsEmailFocused(false);
      setIsPasswordFocused(false);
      setShowPassword(false);
    }
  }, [visible, currentEmail]);

  if (!visible) return null;

  function handleSave() {
    onSave(emailInput, currentPassword);
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
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
              {t('profile.changeEmail')}
            </Text>
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              className="p-1 rounded-full active:opacity-60"
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>

          {/* New Email Input Field */}
          <View className="mb-3.5">
            <Text
              style={{ color: theme.textPrimary }}
              className="font-geist-medium text-xs mb-1.5"
            >
              {t('profile.email')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isEmailFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-4 h-12 rounded-lg"
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={isEmailFocused ? theme.accent : theme.textSecondary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full font-geist-medium text-sm"
                placeholder="admin@example.com"
                placeholderTextColor={theme.textSecondary + '80'}
              />
            </View>
          </View>

          {/* Current Password Field */}
          <View className="mb-4">
            <Text
              style={{ color: theme.textPrimary }}
              className="font-geist-medium text-xs mb-1.5"
            >
              {t('profile.currentPassword')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isPasswordFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-4 h-12 rounded-lg"
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={isPasswordFocused ? theme.accent : theme.textSecondary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full font-geist-medium text-sm"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="p-1 active:opacity-60"
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <Text
              style={{ color: theme.error }}
              className="font-inter text-xs mb-4"
            >
              {errorMessage}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View className="flex-row justify-end gap-3 mt-1">
            <Pressable
              style={{ backgroundColor: theme.surfaceVariant }}
              className="flex-1 rounded-xl py-3 items-center active:opacity-70"
              onPress={onClose}
              disabled={isLoading}
            >
              <Text
                style={{ color: theme.textPrimary }}
                className="font-geist-medium text-sm"
              >
                {t('common.cancel')}
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 rounded-xl py-3 items-center active:opacity-80"
              style={{ backgroundColor: theme.primary }}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  style={{ color: '#ffffff' }}
                  className="font-geist-semibold text-sm"
                >
                  {t('common.save')}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
