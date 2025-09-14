import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface SignupBackgroundProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBackButton?: boolean;
  containerStyle?: ViewStyle;
}

const SignupBackground: React.FC<SignupBackgroundProps> = ({
  children,
  currentStep,
  totalSteps,
  onBack,
  showBackButton = true,
  containerStyle,
}) => {
  const progressAnimation = useSharedValue(0);

  React.useEffect(() => {
    progressAnimation.value = withTiming((currentStep / totalSteps) * 100, {
      duration: 800,
    });
  }, [currentStep, totalSteps]);

  const progressStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progressAnimation.value,
      [0, 100],
      [0, 100]
    );

    return {
      width: `${width}%`,
    };
  });

  const getStepText = () => {
    const stepNames = ['', 'Account', 'Details', 'Verify', 'Security', 'Complete'];
    return `${stepNames[currentStep] || 'Step'} ${currentStep}/${totalSteps}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Consistent Gradient Background */}
      <LinearGradient
        colors={['#0AA5A8', '#4DC5C8', '#7B68EE', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Enhanced Header with Progress */}
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="chevron-left" type="Feather" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}

        <View style={styles.progressSection}>
          {/* Modern Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <Text style={styles.progressText}>{getStepText()}</Text>
          </View>

          {/* Step Indicators */}
          <View style={styles.stepIndicators}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index < currentStep && styles.stepDotCompleted,
                  index === currentStep - 1 && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Placeholder for balance */}
        {showBackButton && <View style={styles.placeholder} />}
      </View>

      {/* Content Area */}
      <View style={[styles.content, containerStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    minHeight: 80,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  progressSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTrack: {
    width: 180,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotCompleted: {
    backgroundColor: Colors.white,
    transform: [{ scale: 1.2 }],
  },
  stepDotActive: {
    backgroundColor: Colors.white,
    transform: [{ scale: 1.4 }],
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
});

export default SignupBackground;