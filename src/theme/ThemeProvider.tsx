import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getBusinessSettings } from '@/src/api/businessSettings';
import {
  DEFAULT_PRIMARY_LIGHT_MODE,
  DEFAULT_ACCENT_LIGHT_MODE,
  DEFAULT_PRIMARY_DARK_MODE,
  DEFAULT_ACCENT_DARK_MODE,
  SEMANTIC_ERROR,
  SEMANTIC_SUCCESS,
  SEMANTIC_SUCCESS_LIGHT,
  SEMANTIC_WARNING,
  LIGHT_NEUTRAL_BACKGROUND,
  LIGHT_NEUTRAL_SURFACE,
  LIGHT_NEUTRAL_SURFACE_CONTAINER_LOWEST,
  LIGHT_NEUTRAL_SURFACE_VARIANT,
  LIGHT_NEUTRAL_TEXT_PRIMARY,
  LIGHT_NEUTRAL_TEXT_SECONDARY,
  LIGHT_NEUTRAL_TEXT_INVERSE,
  LIGHT_NEUTRAL_BORDER_LIGHT,
  DARK_NEUTRAL_BACKGROUND,
  DARK_NEUTRAL_SURFACE,
  DARK_NEUTRAL_SURFACE_CONTAINER_LOWEST,
  DARK_NEUTRAL_SURFACE_VARIANT,
  DARK_NEUTRAL_TEXT_PRIMARY,
  DARK_NEUTRAL_TEXT_SECONDARY,
  DARK_NEUTRAL_TEXT_INVERSE,
  DARK_NEUTRAL_BORDER_LIGHT,
  lightenColor,
} from '@/src/theme/colors';

export interface ThemeColors {
  // Brand colors (themeable via business_settings)
  primary: string;
  primaryLight: string;
  accent: string;

  // Theme mode ('light' | 'dark')
  themeMode: 'light' | 'dark';

  // Semantic colors (FIXED — never overridden by branding)
  error: string;
  success: string;
  successLight: string;
  warning: string;

  // Neutral/layout colors (Adapt dynamically based on themeMode)
  background: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  borderLight: string;

  // Branding metadata
  businessName: string;
  logoUrl: string | null;
}

interface ThemeContextValue {
  theme: ThemeColors;
  isThemeLoading: boolean;
  refreshTheme: () => Promise<void>;
}

const DEFAULT_BUSINESS_NAME = 'Punch App';

export function buildDefaultTheme(mode: 'light' | 'dark' = 'light'): ThemeColors {
  const isDark = mode === 'dark';
  return {
    primary: isDark ? DEFAULT_PRIMARY_DARK_MODE : DEFAULT_PRIMARY_LIGHT_MODE,
    primaryLight: lightenColor(isDark ? DEFAULT_PRIMARY_DARK_MODE : DEFAULT_PRIMARY_LIGHT_MODE),
    accent: isDark ? DEFAULT_ACCENT_DARK_MODE : DEFAULT_ACCENT_LIGHT_MODE,
    themeMode: mode,

    error: SEMANTIC_ERROR,
    success: SEMANTIC_SUCCESS,
    successLight: SEMANTIC_SUCCESS_LIGHT,
    warning: SEMANTIC_WARNING,

    background: isDark ? DARK_NEUTRAL_BACKGROUND : LIGHT_NEUTRAL_BACKGROUND,
    surface: isDark ? DARK_NEUTRAL_SURFACE : LIGHT_NEUTRAL_SURFACE,
    surfaceContainerLowest: isDark ? DARK_NEUTRAL_SURFACE_CONTAINER_LOWEST : LIGHT_NEUTRAL_SURFACE_CONTAINER_LOWEST,
    surfaceVariant: isDark ? DARK_NEUTRAL_SURFACE_VARIANT : LIGHT_NEUTRAL_SURFACE_VARIANT,
    textPrimary: isDark ? DARK_NEUTRAL_TEXT_PRIMARY : LIGHT_NEUTRAL_TEXT_PRIMARY,
    textSecondary: isDark ? DARK_NEUTRAL_TEXT_SECONDARY : LIGHT_NEUTRAL_TEXT_SECONDARY,
    textInverse: isDark ? DARK_NEUTRAL_TEXT_INVERSE : LIGHT_NEUTRAL_TEXT_INVERSE,
    borderLight: isDark ? DARK_NEUTRAL_BORDER_LIGHT : LIGHT_NEUTRAL_BORDER_LIGHT,

    businessName: DEFAULT_BUSINESS_NAME,
    logoUrl: null,
  };
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: buildDefaultTheme(),
  isThemeLoading: true,
  refreshTheme: async () => {},
});

/**
 * Hook to access theme colors and branding.
 * Every component that needs colors should use this instead of importing colors.ts.
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * ThemeProvider — reads business_settings on mount and caches the theme.
 * Dynamic neutral layout tokens adjust automatically based on theme_mode.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(buildDefaultTheme());
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  const loadTheme = useCallback(async () => {
    try {
      const { data } = await getBusinessSettings();

      if (data) {
        const themeMode: 'light' | 'dark' = data.theme_mode === 'dark' ? 'dark' : 'light';
        const isDark = themeMode === 'dark';

        const defaultPrimary = isDark ? DEFAULT_PRIMARY_DARK_MODE : DEFAULT_PRIMARY_LIGHT_MODE;
        const defaultAccent = isDark ? DEFAULT_ACCENT_DARK_MODE : DEFAULT_ACCENT_LIGHT_MODE;

        const primary = data.primary_color || defaultPrimary;
        const accent = data.accent_color || defaultAccent;

        setTheme({
          primary,
          primaryLight: lightenColor(primary),
          accent,
          themeMode,

          error: SEMANTIC_ERROR,
          success: SEMANTIC_SUCCESS,
          successLight: SEMANTIC_SUCCESS_LIGHT,
          warning: SEMANTIC_WARNING,

          background: isDark ? DARK_NEUTRAL_BACKGROUND : LIGHT_NEUTRAL_BACKGROUND,
          surface: isDark ? DARK_NEUTRAL_SURFACE : LIGHT_NEUTRAL_SURFACE,
          surfaceContainerLowest: isDark ? DARK_NEUTRAL_SURFACE_CONTAINER_LOWEST : LIGHT_NEUTRAL_SURFACE_CONTAINER_LOWEST,
          surfaceVariant: isDark ? DARK_NEUTRAL_SURFACE_VARIANT : LIGHT_NEUTRAL_SURFACE_VARIANT,
          textPrimary: isDark ? DARK_NEUTRAL_TEXT_PRIMARY : LIGHT_NEUTRAL_TEXT_PRIMARY,
          textSecondary: isDark ? DARK_NEUTRAL_TEXT_SECONDARY : LIGHT_NEUTRAL_TEXT_SECONDARY,
          textInverse: isDark ? DARK_NEUTRAL_TEXT_INVERSE : LIGHT_NEUTRAL_TEXT_INVERSE,
          borderLight: isDark ? DARK_NEUTRAL_BORDER_LIGHT : LIGHT_NEUTRAL_BORDER_LIGHT,

          businessName: data.business_name || DEFAULT_BUSINESS_NAME,
          logoUrl: data.logo_url || null,
        });
      }
    } catch {
      // Keep default theme on error
    } finally {
      setIsThemeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const refreshTheme = useCallback(async () => {
    await loadTheme();
  }, [loadTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isThemeLoading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
