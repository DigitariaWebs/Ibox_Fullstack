import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle
} from 'react-native';
import { Text } from '../ui';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';

interface SimpleInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  leftIcon?: string;
  containerStyle?: ViewStyle;
  helpText?: string;
  isRequired?: boolean;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  error,
  leftIcon,
  containerStyle,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  helpText,
  isRequired = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label */}
      <Text style={styles.label}>
        {label}{isRequired && ' *'}
      </Text>

      {/* Input Container */}
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon
              name={leftIcon}
              type="Feather"
              size={20}
              color={isFocused ? Colors.primary : '#666666'}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            secureTextEntry && styles.inputWithRightIcon,
          ]}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor="#999999"
          selectionColor={Colors.primary}
          {...props}
        />

        {/* Password Toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={handlePasswordToggle}
            activeOpacity={0.7}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              type="Feather"
              size={18}
              color="#666666"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" type="Feather" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    marginLeft: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    minHeight: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  containerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontWeight: '500',
  },
  inputWithLeftIcon: {
    paddingLeft: 48,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 14,
    padding: 4,
    zIndex: 1,
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
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default SimpleInput;