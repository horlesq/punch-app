import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';

import { signInWithEmail } from '@/src/api/auth';
import { useTheme } from '@/src/theme/ThemeProvider';
import { AppLogo } from '@/src/components/ui/AppLogo';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme, refreshTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Refresh theme branding whenever login screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshTheme();
    }, [refreshTheme])
  );

  // Reset logo error state when theme logoUrl updates
  useEffect(() => {
    setLogoError(false);
  }, [theme.logoUrl]);
  
  // Focus states for input styling
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  async function handleLogin() {
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await signInWithEmail(email.trim(), password);

    setIsSubmitting(false);

    if (error) {
      if (error.message.toLowerCase().includes('invalid')) {
        setErrorMessage(t('auth.login.errorInvalidCredentials'));
      } else {
        setErrorMessage(t('auth.login.errorGeneric'));
      }
    }
  }

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <KeyboardAvoidingView
      style={{ backgroundColor: theme.background }}
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center p-6">
        <View
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
          className="p-8 rounded-[24px]"
        >
          
          <View className="items-center mb-10">
            {/* Show business logo if set, otherwise show placeholder icon */}
            {theme.logoUrl && !logoError ? (
              <Image
                key={theme.logoUrl}
                source={{ uri: theme.logoUrl }}
                style={{ width: 64, height: 64, borderRadius: 32 }}
                resizeMode="cover"
                className="mb-6"
                onError={() => setLogoError(true)}
              />
            ) : (
              <View className="mb-6">
                <AppLogo size={64} />
              </View>
            )}
            <Text style={{ color: theme.textPrimary }} className="text-headline-lg text-center mb-2">
              {t('auth.login.title')}
            </Text>
            <Text style={{ color: theme.textSecondary }} className="text-body-md text-center">
              {t('auth.login.subtitle')}
            </Text>
          </View>

          <View className="mb-2">
            {/* Email */}
            <Text style={{ color: theme.textPrimary }} className="text-label-md mb-2">
              {t('auth.login.emailLabel')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isEmailFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-4 h-14 rounded-lg"
            >
              <MaterialCommunityIcons name="email-outline" size={20} color={isEmailFocused ? theme.accent : theme.textSecondary} style={{ marginRight: 12 }} />
              <TextInput
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full text-body-md"
                placeholder={t('auth.login.emailPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <Text style={{ color: theme.textPrimary }} className="text-label-md mt-5 mb-2">
              {t('auth.login.passwordLabel')}
            </Text>
            <View
              style={{
                backgroundColor: theme.surfaceVariant,
                borderColor: isPasswordFocused ? theme.accent : theme.borderLight,
              }}
              className="flex-row items-center border px-4 h-14 rounded-lg"
            >
              <MaterialCommunityIcons name="lock-outline" size={20} color={isPasswordFocused ? theme.accent : theme.textSecondary} style={{ marginRight: 12 }} />
              <TextInput
                style={[
                  { color: theme.textPrimary },
                  Platform.OS === 'web' ? { outline: 'none' } : undefined,
                ]}
                className="flex-1 h-full text-body-md"
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
            </View>

            {/* Options Row */}
            <View className="flex-row justify-between items-center flex-wrap gap-3 mt-6 mb-8">
              <Pressable className="flex-row items-center mr-2" onPress={() => setRememberMe(!rememberMe)}>
                <View
                  style={rememberMe ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.borderLight }}
                  className={`w-5 h-5 border items-center justify-center mr-3 rounded-sm ${rememberMe ? '' : 'bg-transparent'}`}
                >
                  {rememberMe && <MaterialCommunityIcons name="check" size={14} color="#ffffff" />}
                </View>
                <Text style={{ color: theme.textSecondary }} className="text-label-md">
                  {t('auth.login.rememberMe')}
                </Text>
              </Pressable>
              
              <Pressable>
                <Text style={{ color: theme.accent }} className="text-label-md">
                  {t('auth.login.forgotPassword')}
                </Text>
              </Pressable>
            </View>

            {/* Error message */}
            {errorMessage ? (
              <Text style={{ color: theme.error }} className="mb-4 text-center text-label-md">
                {errorMessage}
              </Text>
            ) : null}

            {/* Submit button */}
            <Pressable
              className="items-center justify-center h-14 rounded-lg"
              style={
                isFormValid && !isSubmitting
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.surfaceVariant, opacity: 0.7 }
              }
              onPress={handleLogin}
              disabled={!isFormValid || isSubmitting}
            >
              <Text
                style={{ color: (!isFormValid || isSubmitting) ? theme.textSecondary : '#ffffff' }}
                className="text-label-md font-geist-semibold"
              >
                {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center mt-8 px-2">
            <Text style={{ color: theme.textSecondary }} className="text-center font-geist-medium text-xs sm:text-sm">
              {t('auth.login.noAccount')}{' '}
              <Text style={{ color: theme.accent }} className="font-geist-bold">{t('auth.login.contactAdmin')}</Text>
            </Text>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
