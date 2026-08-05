import React from 'react';
import { Text, TextInput, View } from 'react-native';
import RNColorPicker, { Panel1, HueSlider } from 'reanimated-color-picker';

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

interface ReanimatedColorPickerWrapperProps {
  selectedColor: string;
  onSelectColor: (c: string) => void;
  theme: any;
  hexInput: string;
  setHexInput: (v: string) => void;
}

export function ReanimatedColorPickerWrapper({
  selectedColor,
  onSelectColor,
  theme,
  hexInput,
  setHexInput,
}: ReanimatedColorPickerWrapperProps) {
  // Keep initial picker value stable across re-renders to prevent reanimated state collision
  const initialPickerColor = React.useRef(
    isValidHex(selectedColor) ? selectedColor : '#3B82F6'
  ).current;

  return (
    <View
      style={{
        borderColor: theme.borderLight,
        backgroundColor: theme.surfaceVariant,
      }}
      className="border rounded-2xl p-4 mt-2"
    >
      <RNColorPicker
        value={initialPickerColor}
        onCompleteJS={({ hex }: { hex: string }) => {
          onSelectColor(hex);
          setHexInput(hex);
        }}
        style={{ gap: 14 }}
      >
        <Panel1 style={{ height: 160, borderRadius: 12 }} />
        <HueSlider style={{ height: 28, borderRadius: 14 }} />
      </RNColorPicker>

      {/* Manual Hex Code Input */}
      <View
        style={{
          borderColor: theme.borderLight,
          backgroundColor: theme.surfaceContainerLowest,
          marginTop: 14,
        }}
        className="flex-row items-center border rounded-xl px-3 py-2"
      >
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mr-1"
        >
          #
        </Text>
        <TextInput
          style={{ color: theme.textPrimary }}
          className="flex-1 font-geist text-sm"
          value={hexInput.replace('#', '')}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
            const fullHex = '#' + cleaned;
            setHexInput(fullHex);
            if (cleaned.length === 6) {
              onSelectColor(fullHex);
            }
          }}
          placeholder="0F172A"
          placeholderTextColor={theme.textSecondary}
          maxLength={6}
          autoCapitalize="characters"
        />
        {isValidHex(hexInput) && (
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: hexInput,
            }}
            className="ml-2"
          />
        )}
      </View>
    </View>
  );
}
