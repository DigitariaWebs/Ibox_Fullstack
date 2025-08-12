import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapTransitionProps {
  children: React.ReactNode;
  onTransitionComplete?: () => void;
  isVisible: boolean;
  initialPosition?: { x: number; y: number; width: number; height: number };
}

const MapTransition: React.FC<MapTransitionProps> = ({ 
  children, 
  onTransitionComplete, 
  isVisible,
  initialPosition
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Default initial position (SearchMapOverlay approximate position)
  const defaultPosition = {
    x: 24,
    y: 150,
    width: screenWidth - 48,
    height: 200
  };

  const startPosition = initialPosition || defaultPosition;

  useEffect(() => {
    if (isVisible) {
      // Start the zoom transition with spring animation
      progress.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      }, (finished) => {
        if (finished && onTransitionComplete) {
          runOnJS(onTransitionComplete)();
        }
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      // Reverse the transition
      progress.value = withTiming(0, { duration: 350 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    // Calculate scale from initial size to full screen
    const scaleX = interpolate(
      progress.value,
      [0, 1],
      [startPosition.width / screenWidth, 1]
    );
    const scaleY = interpolate(
      progress.value,
      [0, 1],
      [startPosition.height / screenHeight, 1]
    );

    // Calculate translation to center the expansion
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [startPosition.x + startPosition.width / 2 - screenWidth / 2, 0]
    );
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [startPosition.y + startPosition.height / 2 - screenHeight / 2, 0]
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { scaleX },
        { scaleY },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
});

export default MapTransition;