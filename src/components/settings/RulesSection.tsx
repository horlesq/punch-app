import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface RulesSectionProps {
  theme: any;
  breakThreshold: string;
  setBreakThreshold: (v: string) => void;
  breakDuration: string;
  setBreakDuration: (v: string) => void;
  correctionMode: 'auto' | 'manual';
  setCorrectionMode: (mode: 'auto' | 'manual') => void;
  handleSaveRules: () => void;
  isSavingRules: boolean;
  rulesSavedMsg: string | null;
  rulesErrorMsg: string | null;
}

export function RulesSection({
  theme,
  breakThreshold,
  setBreakThreshold,
  breakDuration,
  setBreakDuration,
  correctionMode,
  setCorrectionMode,
  handleSaveRules,
  isSavingRules,
  rulesSavedMsg,
  rulesErrorMsg,
}: RulesSectionProps) {
  const { t } = useTranslation();

  return (
    <View className="mb-6 px-4">
      <View className="flex-row items-center mb-3">
        <MaterialCommunityIcons
          name="cog"
          size={22}
          color={theme.primary}
        />
        <Text
          style={{ color: theme.textPrimary }}
          className="font-geist-bold text-lg ml-2"
        >
          {t('settings.rules.title')}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: theme.surfaceContainerLowest,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
        className="rounded-2xl p-4"
      >
        {/* Break Threshold */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-1"
        >
          {t('settings.rules.breakThreshold')}
        </Text>
        <TextInput
          style={{
            backgroundColor: theme.background,
            borderColor: theme.borderLight + '80',
            borderWidth: 1,
            color: theme.textPrimary,
          }}
          className="rounded-xl px-4 py-3 font-geist text-sm mb-1"
          value={breakThreshold}
          onChangeText={setBreakThreshold}
          keyboardType="numeric"
          placeholder="4"
          placeholderTextColor={theme.textSecondary}
        />
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist text-xs mb-4"
        >
          {t('settings.rules.breakThresholdHint')}
        </Text>

        {/* Break Duration */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-1"
        >
          {t('settings.rules.breakDuration')}
        </Text>
        <TextInput
          style={{
            backgroundColor: theme.background,
            borderColor: theme.borderLight + '80',
            borderWidth: 1,
            color: theme.textPrimary,
          }}
          className="rounded-xl px-4 py-3 font-geist text-sm mb-1"
          value={breakDuration}
          onChangeText={setBreakDuration}
          keyboardType="numeric"
          placeholder="60"
          placeholderTextColor={theme.textSecondary}
        />
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist text-xs mb-5"
        >
          {t('settings.rules.breakDurationHint')}
        </Text>

        {/* Correction Approval Mode */}
        <Text
          style={{ color: theme.textSecondary }}
          className="font-geist-medium text-sm mb-2"
        >
          {t('settings.rules.correctionMode')}
        </Text>
        <View className="flex-row gap-3 mb-5">
          <Pressable
            style={{
              backgroundColor:
                correctionMode === 'manual'
                  ? theme.primary
                  : theme.background,
              borderColor:
                correctionMode === 'manual'
                  ? theme.primary
                  : theme.borderLight + '80',
              borderWidth: 1,
            }}
            className="flex-1 py-3 rounded-xl items-center active:opacity-80"
            onPress={() => setCorrectionMode('manual')}
          >
            <Text
              style={{
                color:
                  correctionMode === 'manual'
                    ? '#ffffff'
                    : theme.textPrimary,
              }}
              className="font-geist-medium text-sm"
            >
              {t('settings.rules.correctionModeManual')}
            </Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor:
                correctionMode === 'auto'
                  ? theme.primary
                  : theme.background,
              borderColor:
                correctionMode === 'auto'
                  ? theme.primary
                  : theme.borderLight + '80',
              borderWidth: 1,
            }}
            className="flex-1 py-3 rounded-xl items-center active:opacity-80"
            onPress={() => setCorrectionMode('auto')}
          >
            <Text
              style={{
                color:
                  correctionMode === 'auto'
                    ? '#ffffff'
                    : theme.textPrimary,
              }}
              className="font-geist-medium text-sm"
            >
              {t('settings.rules.correctionModeAuto')}
            </Text>
          </Pressable>
        </View>



        {/* Save Rules Button */}
        <Pressable
          style={{ backgroundColor: theme.primary }}
          className="rounded-xl py-3.5 items-center active:opacity-80"
          onPress={handleSaveRules}
          disabled={isSavingRules}
        >
          {isSavingRules ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text
              style={{ color: '#ffffff' }}
              className="font-geist-semibold text-sm"
            >
              {t('settings.rules.save')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
