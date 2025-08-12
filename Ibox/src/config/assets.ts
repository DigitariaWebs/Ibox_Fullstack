/**
 * Central registry of static image resources. Keeps import paths out
 * of component code for cleaner, consistent asset access.
 */
export const Icons = {
  app: require("../../assets/icon.png"),
  adaptive: require("../../assets/adaptive-icon.png"),
  favicon: require("../../assets/favicon.png"),
  splash: require("../../assets/splash-icon.png"),
} as const;

export type IconKey = keyof typeof Icons;

export const Images = {
  // Add domain-specific images here, e.g.:
  // hero: require("../../assets/images/hero.png"),
  front_car: require("../../assets/images/front_car.png"),
  back_car: require("../../assets/images/back_car.png"),
  side_car: require("../../assets/images/side_car.png"),
  plate: require("../../assets/images/plate.png"),
  license: require("../../assets/images/license.png"),
  cheque: require("../../assets/images/cheque.png"),
} as const;

export const PaymentLogos = {
  visa: require("../../assets/images/logos/visa.png"),
  mastercard: require("../../assets/images/logos/mastercard.png"),
  amex: require("../../assets/images/logos/amex.png"),
  apple: require("../../assets/images/logos/apple.png"),
  gpay: require("../../assets/images/logos/gpay.png"),
  stripe: require("../../assets/images/logos/stripe.png"),
} as const;

export type ImageKey = keyof typeof Images;
export type PaymentLogoKey = keyof typeof PaymentLogos; 