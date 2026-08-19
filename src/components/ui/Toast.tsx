import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  Layout,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ToastProps {
  visible: boolean;
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  durationMs?: number;
}

/**
 * Animated Toast component for floating feedback notifications.
 * Uses a Portal on Web so it stays sticky at the top of the browser viewport regardless of scrolling.
 */
export function Toast({
  visible,
  message,
  type = 'info',
  onDismiss,
  durationMs = 4000,
}: ToastProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && onDismiss && durationMs > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss, durationMs]);

  if (!visible || !message) return null;

  const iconName =
    type === 'success'
      ? 'check-circle-outline'
      : type === 'error'
      ? 'alert-circle-outline'
      : 'information-outline';

  const isDark = theme.themeMode === 'dark';

  const iconColor =
    type === 'success'
      ? theme.success
      : type === 'error'
      ? theme.error
      : theme.primary;

  const textColor =
    type === 'success'
      ? theme.success
      : type === 'error'
      ? theme.error
      : theme.textPrimary;

  // The tint overlay color (like the previous version, slightly stronger)
  const tintColor =
    type === 'success'
      ? isDark
        ? theme.success + '35'
        : theme.success + '20'
      : type === 'error'
      ? isDark
        ? theme.error + '35'
        : theme.error + '20'
      : theme.primary + (isDark ? '35' : '15');

  const toastContent = (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(250)}
      layout={Layout.springify()}
      style={{
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        top: Math.max(insets.top, 20) + 10,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none' as any,
        zIndex: 999999,
        elevation: 999,
      }}
      className="items-center px-4"
    >
      {/* 
        Solid Base View: Prevents any content from bleeding through.
        We apply the shadow to this base view.
      */}
      <View
        style={{
          backgroundColor: theme.surfaceContainerLowest, // 100% Solid Opaque
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 8,
          pointerEvents: 'auto' as any,
          borderRadius: 16,
        }}
        className="max-w-md w-full"
      >
        {/* 
          Tint Overlay View: Applies the pastel/tinted color the user liked
          over the solid white/black base.
        */}
        <View
          style={{
            backgroundColor: tintColor,
            borderRadius: 16,
          }}
          className="flex-row items-center px-4 py-3.5 w-full"
        >
        <MaterialCommunityIcons
          name={iconName}
          size={22}
          color={iconColor}
          style={{ marginRight: 10 }}
        />
        <Text
          style={{ color: textColor }}
          className="font-geist-medium text-sm flex-1 mr-2"
          numberOfLines={3}
        >
          {message}
        </Text>

        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            className="p-1 active:opacity-60"
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={textColor}
            />
          </Pressable>
        )}
        </View>
      </View>
    </Animated.View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(toastContent, document.body);
  }

  return toastContent;
}
