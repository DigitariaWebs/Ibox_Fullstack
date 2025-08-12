import React, { useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, ViewStyle, TextStyle, LayoutChangeEvent } from 'react-native';
import { Text } from './Text';
import { Colors } from '../config/colors';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
}) => {
  const packagePosition = useRef(new Animated.Value(0)).current;
  const packageOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [buttonWidth, setButtonWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setButtonWidth(width);
  };

  const handlePress = () => {
    if (disabled) return;

    // Reset animation values
    packagePosition.setValue(0);
    packageOpacity.setValue(0);
    buttonScale.setValue(1);

    // Start the animation sequence
    Animated.sequence([
      // Button press effect
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      // Show shipping icon and start moving
      Animated.parallel([
        Animated.timing(packageOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // Move shipping icon from 0 to 100% width
        Animated.timing(packagePosition, {
          toValue: 1, // 0 to 1 for percentage-based positioning
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Hide shipping icon and trigger callback
      packageOpacity.setValue(0);
      setTimeout(() => {
        onPress();
      }, 50);
    });
  };

  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.buttonSecondary, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      onLayout={handleLayout}
    >
      <Animated.View
        style={[
          styles.buttonContent,
          {
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <Text
          variant="button"
          weight="bold"
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.buttonTextSecondary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </Animated.View>

      {/* Animated Shipping Icon */}
      <Animated.View
        style={[
          styles.shippingContainer,
          {
            opacity: packageOpacity,
            transform: [
              {
                translateX: packagePosition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, buttonWidth - 30], // Move from 0 to button width minus icon width
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.shippingIcon}>🚚</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 24,
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: Colors.white,
  },
  shippingContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  shippingIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default AnimatedButton; 