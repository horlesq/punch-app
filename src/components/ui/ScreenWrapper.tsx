import React from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme/ThemeProvider';
import { CustomHeader } from '@/src/components/ui/CustomHeader';

type ScreenWrapperProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

/**
 * ScreenWrapper provides a consistent layout with a scrollable CustomHeader
 * that disappears smoothly when scrolling down the page.
 */
export function ScreenWrapper({
  children,
  scrollable = true,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: ScreenWrapperProps) {
  const { theme } = useTheme();

  if (!scrollable) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1">
        <CustomHeader title={theme.businessName} />
        <View className="flex-1">{children}</View>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1">
      <ScrollView
        contentContainerStyle={contentContainerStyle || { paddingBottom: 32 }}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        className="flex-1"
      >
        <CustomHeader title={theme.businessName} />
        {children}
      </ScrollView>
    </View>
  );
}
