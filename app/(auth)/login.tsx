import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { signInWithEmail } from '@/src/api/auth';

export default function LoginScreen() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

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
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center p-6">
        <View className="p-8 rounded-2xl bg-surface shadow-sm elevation-3">
          
          <View className="items-center mb-8">
            <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4 bg-primary">
              <SymbolView name="briefcase" size={24} tintColor="#FFFFFF" />
            </View>
            <Text className="font-bold mb-2 text-textPrimary text-xl">
              Welcome back
            </Text>
            <Text className="text-center text-textSecondary text-sm">
              Sign in to continue to Punch App.
            </Text>
          </View>

          <View className="mb-6">
            {/* Email */}
            <Text className="font-semibold mb-2 text-textPrimary text-sm">
              Email Address
            </Text>
            <View className="flex-row items-center border border-borderLight px-3 h-12 rounded-xl bg-surfaceVariant">
              <SymbolView name="envelope" size={18} tintColor="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 h-full text-textPrimary text-base"
                placeholder="name@company.com"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
              />
            </View>

            {/* Password */}
            <Text className="font-semibold mb-2 text-textPrimary text-sm mt-4">
              Password
            </Text>
            <View className="flex-row items-center border border-borderLight px-3 h-12 rounded-xl bg-surfaceVariant">
              <SymbolView name="lock" size={18} tintColor="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 h-full text-textPrimary text-base"
                placeholder="........"
                placeholderTextColor="#64748B"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
              />
            </View>

            {/* Options Row */}
            <View className="flex-row justify-between items-center mt-4 mb-2">
              <Pressable className="flex-row items-center" onPress={() => setRememberMe(!rememberMe)}>
                <View className={`w-[18px] h-[18px] border items-center justify-center mr-2 rounded border-borderLight ${rememberMe ? 'bg-primary' : 'bg-transparent'}`}>
                  {rememberMe && <SymbolView name="checkmark" size={12} tintColor="#FFFFFF" />}
                </View>
                <Text className="font-medium text-textSecondary text-sm">
                  Remember me
                </Text>
              </Pressable>
              
              <Pressable>
                <Text className="font-semibold text-textPrimary text-sm">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Error message */}
            {errorMessage ? (
              <Text className="mt-3 text-center text-error text-sm">
                {errorMessage}
              </Text>
            ) : null}

            {/* Submit button */}
            <Pressable
              className={`items-center justify-center py-4 rounded-xl mt-8 ${(!isFormValid || isSubmitting) ? 'bg-borderLight' : 'bg-primary'}`}
              onPress={handleLogin}
              disabled={!isFormValid || isSubmitting}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Text className="font-semibold text-textInverse text-base">
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center mt-2">
            <Text className="text-center text-textSecondary text-sm">
              Don't have an account?{' '}
              <Text className="text-textPrimary font-semibold">Contact Admin</Text>
            </Text>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
