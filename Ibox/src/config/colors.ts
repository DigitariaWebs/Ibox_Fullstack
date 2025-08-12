/**
 * Centralized color palette used throughout the app.
 * Tailwind-compatible hex values are provided so they align
 * with the design tokens in `tailwind.config.js`.
 */
export const Colors = {
  /** Primary brand color (Tailwind blue-600) */
  primary: '#0AA5A8',
  primaryDark: '#088A8D',
  primaryLight: '#4DC5C8',

  /** Secondary brand color (Tailwind emerald-500) */
  secondary: '#10B981',

  /** UI backgrounds */
  background: '#FFFFFF',
  surface: '#F3F4F6', // gray-100
  surfaceDark: '#E5E7EB',

  /** Text */
  textPrimary: '#1F2937',
  textSecondary: '#6B7280', // gray-500
  textTertiary: '#9CA3AF',

  /** Semantic */
  error: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  info: '#3B82F6', // blue-500
  success: '#22C55E', // green-500

  /** Border colors */
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  /** Other colors */
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const satisfies Record<string, string>;

export type ColorKey = keyof typeof Colors;

/**
 * Helper that returns a Tailwind class string given a color key and optional shade.
 * Example: `twColor("primary")` returns `text-[#2563EB]`.
 */
export const twColor = (key: ColorKey, cssProp: "text" | "bg" | "border" = "text") =>
  `${cssProp}-[${Colors[key]}]`; 