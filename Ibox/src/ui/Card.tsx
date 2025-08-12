import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Colors } from '../config/colors';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  animated = false,
  children,
  style,
  ...props
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
    };

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.backgroundColor = Colors.surface;
        break;
      case 'elevated':
        baseStyle.backgroundColor = '#FFFFFF';
        baseStyle.shadowColor = '#000';
        baseStyle.shadowOffset = { width: 0, height: 2 };
        baseStyle.shadowOpacity = 0.1;
        baseStyle.shadowRadius = 8;
        baseStyle.elevation = 4;
        break;
      case 'outlined':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = '#E5E7EB';
        break;
    }

    // Padding styles
    switch (padding) {
      case 'none':
        break;
      case 'sm':
        baseStyle.padding = 12;
        break;
      case 'md':
        baseStyle.padding = 16;
        break;
      case 'lg':
        baseStyle.padding = 24;
        break;
    }

    return baseStyle;
  };

  const cardStyle = [getCardStyle(), style];

  if (animated) {
    return (
      <MotiView
        from={{
          opacity: 0,
          scale: 0.9,
          translateY: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          translateY: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          translateY: -20,
        }}
        transition={{
          type: 'timing',
          duration: 300,
        }}
        style={cardStyle}
        {...props}
      >
        {children}
      </MotiView>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}; 