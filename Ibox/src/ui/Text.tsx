import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Colors } from '../config/colors';

const AnimatedText = Animated.createAnimatedComponent(RNText);

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'textPrimary' | 'textSecondary';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  animated?: boolean;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'textPrimary',
  weight = 'normal',
  align = 'left',
  animated = false,
  style,
  children,
  ...props
}) => {
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {};

    // Variant styles
    switch (variant) {
      case 'h1':
        baseStyle.fontSize = 30;
        break;
      case 'h2':
        baseStyle.fontSize = 24;
        break;
      case 'h3':
        baseStyle.fontSize = 20;
        break;
      case 'h4':
        baseStyle.fontSize = 18;
        break;
      case 'body':
        baseStyle.fontSize = 16;
        break;
      case 'caption':
        baseStyle.fontSize = 14;
        break;
      case 'small':
        baseStyle.fontSize = 12;
        break;
    }

    // Color styles
    switch (color) {
      case 'primary':
        baseStyle.color = Colors.primary;
        break;
      case 'secondary':
        baseStyle.color = Colors.secondary;
        break;
      case 'error':
        baseStyle.color = Colors.error;
        break;
      case 'warning':
        baseStyle.color = Colors.warning;
        break;
      case 'info':
        baseStyle.color = Colors.info;
        break;
      case 'success':
        baseStyle.color = Colors.success;
        break;
      case 'textPrimary':
        baseStyle.color = Colors.textPrimary;
        break;
      case 'textSecondary':
        baseStyle.color = Colors.textSecondary;
        break;
    }

    // Weight styles
    switch (weight) {
      case 'normal':
        baseStyle.fontWeight = '400';
        break;
      case 'medium':
        baseStyle.fontWeight = '500';
        break;
      case 'semibold':
        baseStyle.fontWeight = '600';
        break;
      case 'bold':
        baseStyle.fontWeight = '700';
        break;
    }

    // Align styles
    switch (align) {
      case 'left':
        baseStyle.textAlign = 'left';
        break;
      case 'center':
        baseStyle.textAlign = 'center';
        break;
      case 'right':
        baseStyle.textAlign = 'right';
        break;
      case 'justify':
        baseStyle.textAlign = 'justify';
        break;
    }

    return baseStyle;
  };

  const textStyle = [getTextStyle(), style];

  if (animated) {
    return (
      <AnimatedText
        style={textStyle}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        {...props}
      >
        {children}
      </AnimatedText>
    );
  }

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
}; 