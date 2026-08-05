import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReanimatedColorPickerWrapper } from './ReanimatedColorPickerWrapper';

interface ColorPickerProps {
  label: string;
  selectedColor: string;
  onSelectColor: (c: string) => void;
  showHexInput: boolean;
  setShowHexInput: (v: boolean) => void;
  hexInput: string;
  setHexInput: (v: string) => void;
  presets: Array<{ hex: string; name: string }>;
  theme: any;
  activeBorderColor?: string;
}

export function ColorPicker({
  label,
  selectedColor,
  onSelectColor,
  showHexInput,
  setShowHexInput,
  hexInput,
  setHexInput,
  presets,
  theme,
  activeBorderColor,
}: ColorPickerProps) {
  const highlightColor = activeBorderColor || theme.accent;

  return (
    <View className="mb-5">
      <Text
        style={{ color: theme.textSecondary }}
        className="font-geist-medium text-sm mb-2.5"
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2.5 mb-2">
        {(presets || []).map((preset) => {
          const isSelected = selectedColor.toLowerCase() === preset.hex.toLowerCase();
          return (
            <Pressable
              key={preset.hex}
              onPress={() => {
                onSelectColor(preset.hex);
                setShowHexInput(false);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? highlightColor : theme.borderLight + '60',
                padding: 2,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.surfaceContainerLowest,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: preset.hex,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#ffffff"
                  />
                )}
              </View>
            </Pressable>
          );
        })}
        {/* Custom button */}
        <Pressable
          onPress={() => {
            setShowHexInput(!showHexInput);
            setHexInput(selectedColor);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: showHexInput ? highlightColor : theme.borderLight + '80',
            borderStyle: 'dashed',
            backgroundColor: theme.surfaceContainerLowest,
          }}
          className="items-center justify-center"
        >
          <MaterialCommunityIcons
            name="palette-outline"
            size={18}
            color={showHexInput ? highlightColor : theme.textSecondary}
          />
        </Pressable>
      </View>

      {showHexInput && (
        <ReanimatedColorPickerWrapper
          selectedColor={selectedColor}
          onSelectColor={onSelectColor}
          theme={theme}
          hexInput={hexInput}
          setHexInput={setHexInput}
        />
      )}
    </View>
  );
}
