import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

import { useTheme } from '@/src/theme/ThemeProvider';

type AppLogoProps = {
  size?: number;
  /** Override the clock color (ring + hands). Defaults to theme.textPrimary. */
  clockColor?: string;
  /** Override the toggle pill color. Defaults to theme.accent. */
  pillColor?: string;
};

/**
 * Branded SVG logo — the Punch clock icon with a toggle pill.
 * The clock ring + hands use `theme.textPrimary` and the toggle pill uses `theme.accent`,
 * so the logo automatically adapts to whatever branding the admin has configured.
 *
 * Pass explicit `clockColor` / `pillColor` to render a preview with unsaved colors.
 */
export function AppLogo({ size = 32, clockColor, pillColor }: AppLogoProps) {
  const { theme } = useTheme();

  const clock = clockColor ?? theme.textPrimary;
  const pill = pillColor ?? theme.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      {/* Clock ring (open arc) */}
      <Path
        d="M 692.1 933.0 A 466 466 0 1 1 975.4 479.6"
        fill="none"
        stroke={clock}
        strokeWidth={70}
        strokeLinecap="round"
      />

      {/* Clock hands */}
      <Line
        x1={510} y1={504} x2={510} y2={196}
        stroke={clock}
        strokeWidth={55}
        strokeLinecap="round"
      />
      <Line
        x1={510} y1={504} x2={680} y2={623}
        stroke={clock}
        strokeWidth={55}
        strokeLinecap="round"
      />

      {/* Toggle pill with cut-out knob */}
      <Path
        fillRule="evenodd"
        fill={pill}
        d="M749,649 L749,889 A133,133 0 0 0 1015,889 L1015,649 A133,133 0 0 0 749,649 Z M946,890 A65,65 0 1 0 816,890 A65,65 0 1 0 946,890 Z"
      />
    </Svg>
  );
}
