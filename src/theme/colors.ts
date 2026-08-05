/**
 * Theme constants & color preset definitions — used as defaults
 * when business_settings hasn't been configured or when switching theme modes.
 *
 * All components read colors via useTheme(), never from this file directly.
 */

/** Default brand colors for Light mode */
export const DEFAULT_PRIMARY_LIGHT_MODE = '#0F172A';
export const DEFAULT_ACCENT_LIGHT_MODE = '#3B82F6';

/** Default brand colors for Dark mode */
export const DEFAULT_PRIMARY_DARK_MODE = '#3B82F6';
export const DEFAULT_ACCENT_DARK_MODE = '#A78BFA';

/** Semantic colors — FIXED, never overridden by branding */
export const SEMANTIC_ERROR = '#ba1a1a';
export const SEMANTIC_SUCCESS = '#10B981';
export const SEMANTIC_SUCCESS_LIGHT = '#D1FAE5';
export const SEMANTIC_WARNING = '#F59E0B';

/** Light Theme Neutral Layout Colors */
export const LIGHT_NEUTRAL_BACKGROUND = '#f7f9fb';
export const LIGHT_NEUTRAL_SURFACE = '#f7f9fb';
export const LIGHT_NEUTRAL_SURFACE_CONTAINER_LOWEST = '#ffffff';
export const LIGHT_NEUTRAL_SURFACE_VARIANT = '#e0e3e5';
export const LIGHT_NEUTRAL_TEXT_PRIMARY = '#0F172A';
export const LIGHT_NEUTRAL_TEXT_SECONDARY = '#45464d';
export const LIGHT_NEUTRAL_TEXT_INVERSE = '#ffffff';
export const LIGHT_NEUTRAL_BORDER_LIGHT = '#E2E8F0';

/** Dark Theme Neutral Layout Colors */
export const DARK_NEUTRAL_BACKGROUND = '#121212';
export const DARK_NEUTRAL_SURFACE = '#121212';
export const DARK_NEUTRAL_SURFACE_CONTAINER_LOWEST = '#1C1C1E';
export const DARK_NEUTRAL_SURFACE_VARIANT = '#2C2C2E';
export const DARK_NEUTRAL_TEXT_PRIMARY = '#F5F5F5';
export const DARK_NEUTRAL_TEXT_SECONDARY = '#A1A1AA';
export const DARK_NEUTRAL_TEXT_INVERSE = '#121212';
export const DARK_NEUTRAL_BORDER_LIGHT = '#3A3A3C';

/** Curated Primary Color Presets for Light Mode */
export const LIGHT_PRIMARY_PRESETS = [
  { hex: '#0F172A', name: 'Slate' },
  { hex: '#1E3A5F', name: 'Navy' },
  { hex: '#166534', name: 'Forest' },
  { hex: '#0F766E', name: 'Teal' },
  { hex: '#2563EB', name: 'Royal Blue' },
  { hex: '#7C3AED', name: 'Deep Purple' },
  { hex: '#BE123C', name: 'Crimson' },
  { hex: '#C2410C', name: 'Burnt Orange' },
];

/** Curated Accent Color Presets for Light Mode */
export const LIGHT_ACCENT_PRESETS = [
  { hex: '#3B82F6', name: 'Royal Blue' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#0E7490', name: 'Deep Cyan' },
  { hex: '#B45309', name: 'Deep Amber' },
  { hex: '#9333EA', name: 'Vivid Purple' },
  { hex: '#DB2777', name: 'Fuchsia' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#0369A1', name: 'Ocean Blue' },
];

/** Curated Primary Color Presets for Dark Mode */
export const DARK_PRIMARY_PRESETS = [
  { hex: '#3B82F6', name: 'Vivid Blue' },
  { hex: '#21C074', name: 'Emerald' },
  { hex: '#06B6D4', name: 'Cyan' },
  { hex: '#10B981', name: 'Mint' },
  { hex: '#A855F7', name: 'Violet' },
  { hex: '#F43F5E', name: 'Rose Coral' },
  { hex: '#F59E0B', name: 'Amber Gold' },
  { hex: '#818CF8', name: 'Lavender Indigo' },
];

/** Curated Accent Color Presets for Dark Mode */
export const DARK_ACCENT_PRESETS = [
  { hex: '#A78BFA', name: 'Soft Purple' },
  { hex: '#34D399', name: 'Pastel Mint' },
  { hex: '#60A5FA', name: 'Light Blue' },
  { hex: '#38BDF8', name: 'Sky Blue' },
  { hex: '#FBBF24', name: 'Warm Amber' },
  { hex: '#FB7185', name: 'Coral Pink' },
  { hex: '#22D3EE', name: 'Electric Cyan' },
  { hex: '#4ADE80', name: 'Neon Lime' },
];

/** Backward compatibility exports */
export const LIGHT_COLOR_PRESETS = LIGHT_PRIMARY_PRESETS;
export const DARK_COLOR_PRESETS = DARK_PRIMARY_PRESETS;

/**
 * Derives a lighter variant of a hex color by blending toward white.
 */
export function lightenColor(hex: string, amount: number = 0.15): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) || 0;
  const g = parseInt(cleaned.substring(2, 4), 16) || 0;
  const b = parseInt(cleaned.substring(4, 6), 16) || 0;

  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
