import { Colors } from "./colors";
import { Fonts } from "./fonts";

/**
 * Simple theme object so components can import a single source.
 * Extend with spacing, radii, breakpoints, etc. as your design system grows.
 */
export const Theme = {
  colors: Colors,
  fonts: Fonts,
} as const;

export type ThemeType = typeof Theme; 