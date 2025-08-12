import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  interpolateColor,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Colors } from '../config/colors';

const AnimatedView = Animated.createAnimatedComponent(View);

interface SearchInputProps extends Omit<TextInputProps, 'onFocus' | 'onBlur'> {
  placeholder?: string;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'rounded' | 'bordered';
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  showClearButton = true,
  size = 'md',
  variant = 'default',
  value,
  onChangeText,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
  };

  const handleChangeText = (text: string) => {
    setInputValue(text);
    onChangeText?.(text);
  };

  const handleClear = () => {
    setInputValue('');
    onChangeText?.('');
    onClear?.();
  };

  const handleSubmit = () => {
    onSearch?.(inputValue);
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['#E5E7EB', '#2563EB'] // gray-200 to primary
    );

    return {
      borderColor,
      transform: [
        {
          scale: withSpring(isFocused ? 1.02 : 1),
        },
      ],
    };
  });

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
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
        baseStyle.borderRadius = 8;
        break;
      case 'rounded':
        baseStyle.backgroundColor = Colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = '#E5E7EB';
        baseStyle.borderRadius = 999;
        break;
      case 'bordered':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = '#D1D5DB';
        baseStyle.borderRadius = 8;
        break;
    }

    return baseStyle;
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: Colors.textPrimary,
    };

    switch (size) {
      case 'sm':
        baseStyle.fontSize = 14;
        break;
      case 'md':
        baseStyle.fontSize = 16;
        break;
      case 'lg':
        baseStyle.fontSize = 18;
        break;
    }

    return baseStyle;
  };

  return (
    <AnimatedView
      style={[getContainerStyle(), animatedContainerStyle, style]}
    >
      {/* Search Icon */}
      <MotiView
        animate={{
          scale: isFocused ? 1.1 : 1,
          rotate: isFocused ? '5deg' : '0deg',
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
        style={{ marginRight: 8 }}
      >
        <View style={{ 
          width: 20, 
          height: 20, 
          backgroundColor: Colors.textSecondary, 
          borderRadius: 10 
        }} />
      </MotiView>

      {/* Text Input */}
      <TextInput
        style={getInputStyle()}
        placeholder={placeholder}
        placeholderTextColor="#6B7280" // gray-500
        value={inputValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        {...props}
      />

      {/* Clear Button */}
      {showClearButton && inputValue.length > 0 && (
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            type: 'timing',
            duration: 150,
          }}
        >
          <TouchableOpacity
            onPress={handleClear}
            style={{ 
              marginLeft: 8, 
              padding: 4 
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={{ 
              width: 16, 
              height: 16, 
              backgroundColor: Colors.textSecondary, 
              borderRadius: 8 
            }} />
          </TouchableOpacity>
        </MotiView>
      )}
    </AnimatedView>
  );
}; 