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

export interface ChangePasswordModalProps {
  visible: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onSave: (currentPass: string, newPass: string, confirmPass: string) => void;
  onClose: () => void;
}

/**
 * Modal for changing user password by entering current password, new password, and confirming new password.
 * Uses distinct, context-specific lock icons (lock-outline, lock-plus-outline, lock-check-outline) to prevent visual repetition.
 */
export function ChangePasswordModal({
  visible,
  isLoading = false,
  errorMessage = null,
  onSave,
  onClose,
}: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isCurrentFocused, setIsCurrentFocused] = useState(false);
  const [isNewFocused, setIsNewFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsCurrentFocused(false);
      setIsNewFocused(false);
      setIsConfirmFocused(false);
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [visible]);

  if (!visible) return null;

  function handleSave() {
    onSave(currentPassword, newPassword, confirmPassword);
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
              {t('profile.changePassword')}
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

          {/* Current Password Field */}
          <View className="mb-3.5">
            <Text
              style={{ color: theme.textPrimary }}
              className="font-geist-medium text-xs mb-1.5"
            >
              {t('profile.currentPassword')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isCurrentFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-3.5 h-12 rounded-lg"
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={isCurrentFocused ? theme.accent : theme.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setIsCurrentFocused(true)}
                onBlur={() => setIsCurrentFocused(false)}
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full font-geist-medium text-sm"
              />
              <Pressable
                onPress={() => setShowCurrent(!showCurrent)}
                className="p-1 active:opacity-60"
              >
                <MaterialCommunityIcons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* New Password Field */}
          <View className="mb-3.5">
            <Text
              style={{ color: theme.textPrimary }}
              className="font-geist-medium text-xs mb-1.5"
            >
              {t('profile.newPassword')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isNewFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-3.5 h-12 rounded-lg"
            >
              <MaterialCommunityIcons
                name="lock-plus-outline"
                size={20}
                color={isNewFocused ? theme.accent : theme.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setIsNewFocused(true)}
                onBlur={() => setIsNewFocused(false)}
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full font-geist-medium text-sm"
              />
              <Pressable
                onPress={() => setShowNew(!showNew)}
                className="p-1 active:opacity-60"
              >
                <MaterialCommunityIcons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm New Password Field */}
          <View className="mb-4">
            <Text
              style={{ color: theme.textPrimary }}
              className="font-geist-medium text-xs mb-1.5"
            >
              {t('profile.confirmNewPassword')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isConfirmFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-3.5 h-12 rounded-lg"
            >
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={20}
                color={isConfirmFocused ? theme.accent : theme.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full font-geist-medium text-sm"
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                className="p-1 active:opacity-60"
              >
                <MaterialCommunityIcons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
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
