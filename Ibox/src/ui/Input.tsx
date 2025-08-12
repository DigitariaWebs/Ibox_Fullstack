import React, { useState } from 'react';
import { View, TextInput, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  interpolateColor,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { Text } from './Text';
import { Colors } from '../config/colors';

const AnimatedView = Animated.createAnimatedComponent(View);

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  variant = 'default',
  size = 'md',
  required = false,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = error 
      ? '#EF4444' // error color
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          ['#E5E7EB', '#2563EB'] // gray-200 to primary
        );

    return {
      borderColor,
      transform: [
        {
          scale: withSpring(isFocused ? 1.01 : 1),
        },
      ],
    };
  });

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        break;
      case 'md':
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 12;
        break;
      case 'lg':
        baseStyle.paddingHorizontal = 20;
        baseStyle.paddingVertical = 16;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.backgroundColor = Colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = '#E5E7EB';
        break;
      case 'outlined':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = '#D1D5DB';
        break;
      case 'filled':
        baseStyle.backgroundColor = '#F3F4F6';
        baseStyle.borderWidth = 0;
        break;
    }

    if (error) {
      baseStyle.borderColor = Colors.error;
    }

    return baseStyle;
  };

  const getInputTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      color: Colors.textPrimary,
      fontWeight: '400',
      letterSpacing: 0.2,
    };

    switch (size) {
      case 'sm':
        baseStyle.fontSize = 14;
        baseStyle.lineHeight = 20;
        break;
      case 'md':
        baseStyle.fontSize = 16;
        baseStyle.lineHeight = 22;
        break;
      case 'lg':
        baseStyle.fontSize = 18;
        baseStyle.lineHeight = 24;
        break;
    }

    return baseStyle;
  };

  return (
    <View style={style}>
      {/* Label */}
      {label && (
        <View style={{ marginBottom: 8, flexDirection: 'row' }}>
          <Text variant="caption" weight="medium" color="textPrimary">
            {label}
          </Text>
          {required && (
            <Text variant="caption" color="error" style={{ marginLeft: 4 }}>
              *
            </Text>
          )}
        </View>
      )}

      {/* Input */}
      <AnimatedView
        style={[getInputContainerStyle(), animatedStyle]}
      >
        <TextInput
          style={[getInputTextStyle(), { textAlignVertical: 'center' }]}
          placeholderTextColor="#9CA3AF" // More precise gray color
          onFocus={handleFocus}
          onBlur={handleBlur}
          allowFontScaling={false}
          {...props}
        />
      </AnimatedView>

      {/* Error or Hint */}
      {(error || hint) && (
        <View style={{ marginTop: 4 }}>
          {error ? (
            <Text variant="small" color="error">
              {error}
            </Text>
          ) : (
            <Text variant="small" color="textSecondary">
              {hint}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}; 