import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

// Base dimensions (iPhone 12 Pro)
const baseWidth = 390;
const baseHeight = 844;

// Responsive scaling functions
export const scale = (size: number): number => {
  return (deviceWidth / baseWidth) * size;
};

export const verticalScale = (size: number): number => {
  return (deviceHeight / baseHeight) * size;
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Device classifications  
export const isSmallDevice = deviceWidth < 375; // iPhone SE
export const isMediumDevice = deviceWidth >= 375 && deviceWidth < 414; // iPhone 12/13
export const isLargeDevice = deviceWidth >= 414; // iPhone Pro Max
export const isTablet = deviceWidth >= 768;

// Screen type detection
export const isIphoneX = () => {
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTV &&
    (deviceHeight === 780 || // iPhone X, Xs
      deviceHeight === 812 || // iPhone X, Xs
      deviceHeight === 844 || // iPhone 12, 12 Pro
      deviceHeight === 896 || // iPhone XR, Xs Max, 11, 11 Pro Max
      deviceHeight === 926 || // iPhone 12 Pro Max
      deviceHeight === 932)    // iPhone 14 Pro Max
  );
};

// Safe area dimensions
export const statusBarHeight = isIphoneX() ? 44 : Platform.OS === 'ios' ? 20 : 0;
export const bottomTabHeight = isIphoneX() ? 83 : 49;
export const safeAreaTop = isIphoneX() ? 44 : Platform.OS === 'ios' ? 20 : 0;
export const safeAreaBottom = isIphoneX() ? 34 : 0;

// Professional design tokens matching sidebar style
export const theme = {
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    primary: '#4A90E2',
    primaryDark: '#357ABD',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    surfaceDark: '#F3F4F6',
  },
  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(40),
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
  },
  typography: {
    h1: {
      fontSize: moderateScale(32),
      fontWeight: 'bold' as const,
      lineHeight: moderateScale(38),
    },
    h2: {
      fontSize: moderateScale(28),
      fontWeight: 'bold' as const,
      lineHeight: moderateScale(34),
    },
    h3: {
      fontSize: moderateScale(24),
      fontWeight: '600' as const,
      lineHeight: moderateScale(30),
    },
    body: {
      fontSize: moderateScale(16),
      fontWeight: '400' as const,
      lineHeight: moderateScale(24),
    },
    bodySmall: {
      fontSize: moderateScale(14),
      fontWeight: '400' as const,
      lineHeight: moderateScale(20),
    },
    caption: {
      fontSize: moderateScale(12),
      fontWeight: '400' as const,
      lineHeight: moderateScale(16),
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Layout helpers
export const getScreenPercentage = (percentage: number, dimension: 'width' | 'height' = 'height') => {
  const screenDimension = dimension === 'width' ? deviceWidth : deviceHeight;
  return (screenDimension * percentage) / 100;
};

// Responsive text sizing based on device
export const getResponsiveFontSize = (baseSize: number) => {
  if (isSmallDevice) return baseSize * 0.9;
  if (isLargeDevice) return baseSize * 1.1;
  return baseSize;
};

// Screen layout calculations
export const getScreenLayout = () => {
  const usableHeight = deviceHeight - safeAreaTop - safeAreaBottom;
  
  return {
    usableWidth: deviceWidth,
    usableHeight,
    headerHeight: getScreenPercentage(10),
    contentHeight: getScreenPercentage(75),
    buttonHeight: getScreenPercentage(15),
    cardMaxHeight: usableHeight * 0.6,
    isCompact: usableHeight < 600,
  };
};

// Button dimensions
export const buttonSizes = {
  small: {
    height: verticalScale(40),
    paddingHorizontal: scale(16),
    fontSize: moderateScale(14),
  },
  medium: {
    height: verticalScale(48),
    paddingHorizontal: scale(24),
    fontSize: moderateScale(16),
  },
  large: {
    height: verticalScale(56),
    paddingHorizontal: scale(32),
    fontSize: moderateScale(18),
  },
};

export default {
  scale,
  verticalScale,
  moderateScale,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isIphoneX,
  statusBarHeight,
  bottomTabHeight,
  safeAreaTop,
  safeAreaBottom,
  theme,
  getScreenPercentage,
  getResponsiveFontSize,
  getScreenLayout,
  buttonSizes,
};