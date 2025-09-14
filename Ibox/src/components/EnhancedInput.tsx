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

interface EnhancedInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  helpText?: string;
  isRequired?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  helpText,
  isRequired = false,
  showCharacterCount = false,
  maxLength,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const labelAnimValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(labelAnimValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
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
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(!!text);
    props.onChangeText?.(text);

    if (text && labelAnimValue._value === 0) {
      Animated.timing(labelAnimValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (!text && !isFocused) {
      Animated.timing(labelAnimValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
    onRightIconPress?.();
  };

  // Label position animation
  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 52 : 20,
    fontSize: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    top: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 8],
    }),
    color: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 255, 255, 0.7)', isFocused ? Colors.primary : '#666666'],
    }),
    backgroundColor: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', '#FFFFFF'],
    }),
    paddingHorizontal: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    borderRadius: labelAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 4],
    }),
    zIndex: 1,
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {/* Floating Label */}
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
              color={isFocused ? Colors.primary : '#666666'}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
          ]}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor="transparent"
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

      {/* Help Text and Character Count */}
      {(helpText || showCharacterCount) && !error && (
        <View style={styles.helpContainer}>
          {helpText && (
            <Text style={styles.helpText}>{helpText}</Text>
          )}
          {showCharacterCount && maxLength && (
            <Text style={styles.characterCount}>
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
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  containerFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#ffffff',
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.01 }],
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    textAlignVertical: 'center',
    fontWeight: '500',
  },
  inputWithLeftIcon: {
    paddingLeft: 52,
  },
  inputWithRightIcon: {
    paddingRight: 52,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    top: 22,
    zIndex: 2,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    top: 22,
    padding: 4,
    zIndex: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    marginTop: 8,
    marginHorizontal: 4,
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});

export default EnhancedInput;