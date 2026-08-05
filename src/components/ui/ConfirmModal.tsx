import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string | null;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Cross-platform modal component for confirmations (destructive or standard).
 * Works identically across Web, iOS, and Android.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Overlay Backdrop */}
      <View className="flex-1 bg-black/60 justify-center items-center p-5">
        {/* Modal Card */}
        <View
          className="w-full max-w-sm rounded-2xl p-6"
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Title */}
          <Text
            style={{ color: theme.textPrimary }}
            className="font-geist-semibold text-xl mb-2"
          >
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text
              style={{ color: theme.textSecondary }}
              className="font-inter text-sm mb-6 leading-5"
            >
              {message}
            </Text>
          ) : null}

          {/* Actions */}
          <View className="flex-row justify-end gap-3">
            {/* Cancel Button */}
            {cancelText ? (
              <Pressable
                style={{ backgroundColor: theme.surfaceVariant }}
                className="flex-1 rounded-xl py-3 items-center active:opacity-70"
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text
                  style={{ color: theme.textPrimary }}
                  className="font-geist-medium text-sm"
                >
                  {cancelText}
                </Text>
              </Pressable>
            ) : null}

            {/* Confirm Button */}
            <Pressable
              className="flex-1 rounded-xl py-3 items-center active:opacity-80"
              style={{
                backgroundColor: isDestructive ? theme.error : theme.primary,
              }}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  style={{ color: '#ffffff' }}
                  className="font-geist-semibold text-sm"
                >
                  {confirmText}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
