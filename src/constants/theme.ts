/**
 * TattooGo MK design tokens.
 *
 * These mirror the Tailwind theme in `tailwind.config.js` so that the few
 * places that need literal values (native splash, status bar, tab bar, RN
 * APIs that don't read className) stay in lockstep with the visual contract.
 */

export const colors = {
  canvas: '#0a0a0a',
  surface: '#121212',
  elevated: '#171717',
  card: '#141414',
  line: '#262626',
  lineSoft: '#1f1f1f',
  ink: '#fafafa',
  subtle: '#a1a1aa',
  muted: '#71717a',
  accent: '#F97316',
  accentSoft: '#FB923C',
  accentStrong: '#EA580C',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;

export const radius = {
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const theme = { colors, radius, spacing } as const;
