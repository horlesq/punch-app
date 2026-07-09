/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        primaryLight: '#1E293B',
        accent: '#3B82F6',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceVariant: '#F1F5F9',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        textInverse: '#FFFFFF',
        borderLight: '#E2E8F0',
        error: '#EF4444',
        success: '#10B981',
        successLight: '#D1FAE5',
        warning: '#F59E0B',
      }
    },
  },
  plugins: [],
}
