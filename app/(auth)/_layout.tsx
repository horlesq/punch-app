import React from 'react';
import { Slot } from 'expo-router';

/**
 * Auth route group layout — renders login (and future auth screens) without
 * the tab bar or any session context requirement.
 */
export default function AuthLayout() {
  return <Slot />;
}
