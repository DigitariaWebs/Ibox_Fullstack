import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Animated,
  ViewStyle
} from 'react-native';
import { Text } from '../ui';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';

interface ModernInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'outlined' | 'filled';
  helpText?: string;
  isRequired?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  lightTheme?: boolean; // For use on dark/gradient backgrounds
}

const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  variant = 'outlined',
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  helpText,
  isRequired = false,
  showCharacterCount = false,
  maxLength,
  lightTheme = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const labelAnimValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderColorAnimValue = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);

    Animated.parallel([
      Animated.timing(labelAnimValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderColorAnimValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);

    if (!value) {
      Animated.timing(labelAnimValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    Animated.timing(borderColorAnimValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    onBlur?.(e);
  };

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
    onRightIconPress?.();
  };

  // Label position animation
  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 44 : 16,
    fontSize: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    top: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 8],
    }),
    color: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        lightTheme ? 'rgba(255, 255, 255, 0.8)' : Colors.textSecondary,
        isFocused ? Colors.primary : (lightTheme ? 'rgba(255, 255, 255, 0.9)' : Colors.textSecondary)
      ],
    }),
    backgroundColor: variant === 'outlined' ? (lightTheme ? 'rgba(255, 255, 255, 0.95)' : Colors.background) : 'transparent',
    paddingHorizontal: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 4],
    }),
    zIndex: 1,
  };

  // Border color animation
  const borderColor = borderColorAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.error : (variant === 'outlined' ? Colors.textSecondary + '40' : 'transparent'),
      error ? Colors.error : Colors.primary
    ],
  });

  const containerStyles = [
    styles.container,
    variant === 'outlined' ? styles.outlined : styles.filled,
    { borderColor },
    error && styles.error,
    containerStyle,
  ];

  const inputStyles = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
  ];

  return (
    <View style={styles.wrapper}>
      <Animated.View style={containerStyles}>
        {/* Label */}
        <Animated.Text style={labelStyle}>
          {label}{isRequired && ' *'}
        </Animated.Text>

        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon
              name={leftIcon}
              type="Feather"
              size={20}
              color={isFocused ? Colors.primary : Colors.textSecondary}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={inputStyles}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor={Colors.textSecondary}
          selectionColor={Colors.primary}
          maxLength={maxLength}
          {...props}
        />

        {/* Right Icon / Password Toggle */}
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={secureTextEntry ? handlePasswordToggle : onRightIconPress}
            activeOpacity={0.7}
          >
            <Icon
              name={
                secureTextEntry
                  ? (isPasswordVisible ? 'eye-off' : 'eye')
                  : (rightIcon || 'help-circle')
              }
              type="Feather"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" type="Feather" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Help Text and Character Count */}
      {(helpText || showCharacterCount) && !error && (
        <View style={styles.helpContainer}>
          {helpText && (
            <Text style={[
              styles.helpText,
              { color: lightTheme ? 'rgba(255, 255, 255, 0.8)' : Colors.textSecondary }
            ]}>
              {helpText}
            </Text>
          )}
          {showCharacterCount && maxLength && (
            <Text style={[
              styles.characterCount,
              { color: lightTheme ? 'rgba(255, 255, 255, 0.8)' : Colors.textSecondary }
            ]}>
              {value?.length || 0}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  container: {
    position: 'relative',
    minHeight: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlined: {
    borderWidth: 1.5,
    backgroundColor: Colors.background,
  },
  filled: {
    backgroundColor: Colors.surface,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  error: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 2,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    top: 18,
    padding: 4,
    zIndex: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginLeft: 6,
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginHorizontal: 4,
  },
  helpText: {
    fontSize: 12,
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ModernInput;