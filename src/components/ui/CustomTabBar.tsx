import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeProvider';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.surfaceContainerLowest,
        borderTopWidth: 1,
        borderColor: theme.borderLight,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // Expo Router translates `href: null` into a `tabBarButton: () => null` option.
        // We must check if tabBarButton exists and returns null to properly hide the tab.
        if (options.tabBarButton) {
          // Evaluate the custom button. If it renders nothing, skip this tab entirely.
          const CustomButton = options.tabBarButton;
          const renderedButton = CustomButton({
            onPress: () => {},
            onLongPress: () => {},
            accessibilityState: { selected: false },
          } as any);
          
          if (!renderedButton) {
            return null;
          }
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const color = isFocused ? theme.accent : theme.textSecondary;
        const label = options.title !== undefined ? options.title : route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-1 items-center justify-center pt-1 pb-1"
          >
            {options.tabBarIcon && options.tabBarIcon({ focused: isFocused, color, size: 28 })}
            
            <Text 
              style={{ color }}
              className={`text-[10px] mt-1.5 ${isFocused ? 'font-geist-semibold' : 'font-inter'}`}
            >
              {label}
            </Text>
            
            {/* Active Indicator Line */}
            <View 
              className="h-[3px] mt-1.5 rounded-full" 
              style={{ 
                width: 20, 
                backgroundColor: isFocused ? theme.accent : 'transparent' 
              }} 
            />
          </Pressable>
        );
      })}
    </View>
  );
}
