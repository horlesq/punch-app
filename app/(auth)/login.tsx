import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { signInWithEmail } from '@/src/api/auth';
import { colors } from '@/src/theme/colors';

export default function LoginScreen() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
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
      className="flex-1 bg-surface-bright"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center p-6">
        <View className="p-8 rounded-[24px] bg-surface">
          
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-full items-center justify-center mb-6 bg-surface-container">
              <MaterialCommunityIcons name="briefcase" size={32} color={colors.primary} />
            </View>
            <Text className="text-headline-lg text-primary text-center mb-2">
              Welcome back
            </Text>
            <Text className="text-body-md text-textSecondary text-center">
              Sign in to continue to Punch App.
            </Text>
          </View>

          <View className="mb-2">
            {/* Email */}
            <Text className="text-label-md text-primary mb-2">
              Email Address
            </Text>
            <View className={`flex-row items-center border px-4 h-14 rounded-lg ${isEmailFocused ? 'bg-surface border-digital' : 'bg-surface-container-low border-outline-variant'}`}>
              <MaterialCommunityIcons name="email-outline" size={20} color={isEmailFocused ? colors.accent : colors.textSecondary} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 h-full text-body-md text-primary outline-none focus:outline-none"
                placeholder="name@company.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
              />
            </View>

            {/* Password */}
            <Text className="text-label-md text-primary mt-5 mb-2">
              Password
            </Text>
            <View className={`flex-row items-center border px-4 h-14 rounded-lg ${isPasswordFocused ? 'bg-surface border-digital' : 'bg-surface-container-low border-outline-variant'}`}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={isPasswordFocused ? colors.accent : colors.textSecondary} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 h-full text-body-md text-primary outline-none focus:outline-none"
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
              />
            </View>

            {/* Options Row */}
            <View className="flex-row justify-between items-center mt-6 mb-8">
              <Pressable className="flex-row items-center" onPress={() => setRememberMe(!rememberMe)}>
                <View className={`w-5 h-5 border items-center justify-center mr-3 rounded-sm ${rememberMe ? 'bg-primary border-primary' : 'bg-transparent border-outline-variant'}`}>
                  {rememberMe && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text className="text-label-md text-textSecondary">
                  Remember me
                </Text>
              </Pressable>
              
              <Pressable>
                <Text className="text-label-md text-primary">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Error message */}
            {errorMessage ? (
              <Text className="mb-4 text-center text-label-md text-error">
                {errorMessage}
              </Text>
            ) : null}

            {/* Submit button */}
            <Pressable
              className={`items-center justify-center h-14 rounded-lg ${(!isFormValid || isSubmitting) ? 'bg-outline-variant' : 'bg-primary'}`}
              onPress={handleLogin}
              disabled={!isFormValid || isSubmitting}
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
                ...(isFormValid && !isSubmitting ? { shadowColor: 'rgba(15, 23, 42, 0.12)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 4 } : {}),
              })}
            >
              <Text className={`text-label-md ${(!isFormValid || isSubmitting) ? 'text-textSecondary' : 'text-on-primary'}`}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center mt-10">
            <Text className="text-body-md text-textSecondary">
              Don't have an account?{' '}
              <Text className="text-primary font-geist-bold">Contact Admin</Text>
            </Text>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
