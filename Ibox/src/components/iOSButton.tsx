import React from 'react';
import { StyleSheet, Pressable, ViewStyle, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui';
import { Colors } from '../config/colors';

const { width } = Dimensions.get('window');

interface iOSButtonProps {
  title: string;
  onPress: () => void;
  isVisible: boolean;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
  icon?: React.ReactNode;
  textColor?: string;
}

const IOSButton: React.FC<iOSButtonProps> = ({
  title,
  onPress,
  isVisible,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  onAnimationComplete,
  icon,
  textColor,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(1);
  const isPressed = useSharedValue(false);

  // Trigger haptic feedback
  const triggerHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptic feedback not supported
    }
  };

  // Entrance animation
  React.useEffect(() => {
    if (isVisible) {
      // Reset values
      opacity.value = 0;
      translateY.value = 50;
      scale.value = 0.9;

      // Smooth entrance animation
      opacity.value = withDelay(100, withTiming(1, { duration: 250 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 250 }));
      scale.value = withDelay(100, withTiming(1, { duration: 250 }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      }));
    } else {
      // Exit animation
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(30, { duration: 250 });
    }
  }, [isVisible]);

  // iOS-style tap gesture
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      if (disabled || loading) return;

      isPressed.value = true;
      scale.value = withTiming(0.95, {
        duration: 100,
      });
      buttonOpacity.value = withTiming(0.8, { duration: 100 });

      runOnJS(triggerHaptic)();
    })
    .onFinalize(() => {
      'worklet';
      if (disabled || loading) return;

      isPressed.value = false;
      scale.value = withTiming(1, {
        duration: 150,
      });
      buttonOpacity.value = withTiming(1, { duration: 150 });

      runOnJS(onPress)();
    })
    .shouldCancelWhenOutside(true);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    // Use a more subtle overlay that works with different backgrounds
    const overlayOpacity = isPressed.value ? 0.1 : 0;

    return {
      opacity: buttonOpacity.value,
    };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    opacity: isPressed.value ? 1 : 0,
    borderRadius: 12,
  }));


  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loading ? 0.6 : 1,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={[styles.button, buttonAnimatedStyle, style]}>
          <Animated.View style={overlayStyle} />
          <Animated.View style={[styles.buttonContent, textAnimatedStyle]}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.buttonText, textColor && { color: textColor }]}>
              {loading ? 'Loading...' : title}
            </Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
});

export default IOSButton;