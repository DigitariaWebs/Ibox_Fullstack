import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '../ui';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';

interface OnboardingTextProps {
  title: string;
  specialWord?: string;
  specialWordIndex?: number;
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

const OnboardingText: React.FC<OnboardingTextProps> = ({
  title,
  specialWord,
  specialWordIndex,
  isVisible,
  onAnimationComplete,
}) => {
  const { width } = Dimensions.get('window');
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  // Trigger animations when visibility changes
  React.useEffect(() => {
    if (isVisible) {
      // Reset values
      opacity.value = 0;
      translateY.value = 20;
      scale.value = 0.98;

      // Smooth entrance animation with delay
      const START_DELAY_MS = 400;
      opacity.value = withDelay(START_DELAY_MS, withTiming(1, { duration: 500 }));
      translateY.value = withDelay(START_DELAY_MS, withSpring(0, {
        damping: 24,
        stiffness: 240,
      }));
      scale.value = withDelay(START_DELAY_MS + 50, withSpring(1, {
        damping: 22,
        stiffness: 220,
      }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      }));
    } else {
      // Fast exit animation
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(-10, { damping: 20, stiffness: 300 });
      scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
    }
  }, [isVisible]);

  // Remove mount fallback to avoid flash/flicker

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const renderTitle = () => {
    if (!specialWord) {
      return (
        <Text style={styles.title}>
          {title}
        </Text>
      );
    }

    const normalizedSpecial = specialWord.trim().toLowerCase();
    const lines = title.split('\n');

    return (
      <View style={styles.titleContainer}>
        {lines.map((line, lineIndex) => {
          const lineWords = line.split(' ');
          return (
            <View key={lineIndex} style={{ width: '100%' }}>
              <Text style={styles.title}>
                {lineWords.map((word, wordIndex) => {
                  const clean = word.replace(/\s+/g, '').trim();
                  const isSpecialWord = clean.toLowerCase() === normalizedSpecial;

                  return (
                    <Text
                      key={wordIndex}
                      style={isSpecialWord ? styles.specialFont : styles.titleText}
                    >
                      {word}{wordIndex < lineWords.length - 1 ? ' ' : ''}
                    </Text>
                  );
                })}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {renderTitle()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  titleContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
    color: Colors.white,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 48,
    lineHeight: 56,
    color: Colors.white,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  specialFont: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'normal',
    fontSize: 52,
    lineHeight: 56,
    color: Colors.white,
    letterSpacing: 0,
    fontWeight: '400',
  },
});

export default OnboardingText;