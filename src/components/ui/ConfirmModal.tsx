import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { colors } from '@/src/theme/colors';

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
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Overlay Backdrop */}
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        {/* Modal Card */}
        <View
          className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Title */}
          <Text className="font-geist-semibold text-xl text-on-surface mb-2">
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text className="font-inter text-sm text-on-surface-variant mb-6 leading-5">
              {message}
            </Text>
          ) : null}

          {/* Actions */}
          <View className="flex-row justify-end gap-3">
            {/* Cancel Button */}
            {cancelText ? (
              <Pressable
                className="flex-1 bg-surface-container rounded-xl py-3 items-center active:opacity-70"
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text className="font-geist-medium text-on-surface text-sm">
                  {cancelText}
                </Text>
              </Pressable>
            ) : null}

            {/* Confirm Button */}
            <Pressable
              className={`flex-1 rounded-xl py-3 items-center active:opacity-80 ${
                isDestructive ? 'bg-error' : 'bg-primary'
              }`}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text className="font-geist-semibold text-white text-sm">
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
