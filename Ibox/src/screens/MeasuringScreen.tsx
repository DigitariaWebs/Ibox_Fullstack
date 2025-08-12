import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  FadeIn,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Colors } from '../config/colors';

type RootStackParamList = {
  Measuring: {
    service: string;
    startLocation: string;
    startLocationCoords: {latitude: number; longitude: number};
    destination: any;
    packagePhoto: string;
  };
  OrderSummary: {
    service: string;
    startLocation: string;
    startLocationCoords: {latitude: number; longitude: number};
    destination: any;
    packagePhoto: string;
    measurements: any;
  };
  [key: string]: any;
};

interface MeasuringScreenProps {
  navigation: NavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'Measuring'>;
}

const MeasuringScreen: React.FC<MeasuringScreenProps> = ({
  navigation,
  route,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [measurements, setMeasurements] = useState({
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
  });

  // Animation values
  const packageScale = useSharedValue(0.8);
  const packageRotation = useSharedValue(0);
  const scanLinePosition = useSharedValue(-100);
  const progressValue = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const steps = [
    'Analyzing package dimensions...',
    'Calculating volume and weight...',
    'Determining optimal delivery method...',
    'Finalizing measurements...',
  ];

  useEffect(() => {
    startMeasuringAnimation();
  }, []);

  const startMeasuringAnimation = () => {
    // Initial package appearance
    packageScale.value = withTiming(1, { duration: 800 });
    
    // Start rotating package
    packageRotation.value = withRepeat(
      withTiming(360, { duration: 4000 }),
      -1,
      false
    );

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Scan line animation
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(300, { duration: 2000 }),
        withDelay(500, withTiming(-100, { duration: 0 }))
      ),
      -1,
      false
    );

    // Progress animation
    progressValue.value = withTiming(1, { duration: 4000 });

    // Step progression
    setTimeout(() => runOnJS(setCurrentStep)(1), 1000);
    setTimeout(() => runOnJS(setCurrentStep)(2), 2000);
    setTimeout(() => runOnJS(setCurrentStep)(3), 3000);

    // Simulate measurements
    setTimeout(() => {
      runOnJS(setMeasurements)({
        width: Math.round((Math.random() * 20 + 10) * 10) / 10,
        height: Math.round((Math.random() * 15 + 8) * 10) / 10,
        depth: Math.round((Math.random() * 25 + 12) * 10) / 10,
        weight: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
      });
    }, 2500);

    // Navigate to next screen after 4 seconds
    setTimeout(() => {
      navigation.replace('StandardOrderSummary', {
        ...route.params,
        measurements: {
          width: Math.round((Math.random() * 20 + 10) * 10) / 10,
          height: Math.round((Math.random() * 15 + 8) * 10) / 10,
          depth: Math.round((Math.random() * 25 + 12) * 10) / 10,
          weight: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
        },
        price: {
          base: 12.50,
          size: 3.25,
          weight: 1.75,
          total: 17.50,
        },
      });
    }, 4500);
  };

  const packageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: packageScale.value },
        { rotateY: `${packageRotation.value}deg` },
      ],
    };
  });

  const scanLineAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanLinePosition.value }],
      opacity: interpolate(
        scanLinePosition.value,
        [-100, 0, 150, 300],
        [0, 1, 1, 0]
      ),
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Package Analysis</Text>
        <Text style={styles.headerSubtitle}>
          Please wait while we measure your package
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Package Visualization */}
        <View style={styles.packageContainer}>
          <Animated.View style={[styles.pulseCircle, pulseAnimatedStyle]}>
            <Animated.View style={[styles.package, packageAnimatedStyle]}>
              <Ionicons name="cube" size={80} color={Colors.primary} />
            </Animated.View>
          </Animated.View>

          {/* Measuring Lines */}
          <View style={styles.measuringLines}>
            <View style={[styles.measureLine, styles.topLine]} />
            <View style={[styles.measureLine, styles.bottomLine]} />
            <View style={[styles.measureLine, styles.leftLine]} />
            <View style={[styles.measureLine, styles.rightLine]} />
          </View>

          {/* Scan Line */}
          <Animated.View style={[styles.scanLine, scanLineAnimatedStyle]} />

          {/* Measurement Display */}
          {measurements.width > 0 && (
            <Animated.View 
              style={styles.measurementDisplay}
              entering={FadeIn.delay(2500)}
            >
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>W</Text>
                <Text style={styles.measurementValue}>{measurements.width}cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>H</Text>
                <Text style={styles.measurementValue}>{measurements.height}cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>D</Text>
                <Text style={styles.measurementValue}>{measurements.depth}cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Weight</Text>
                <Text style={styles.measurementValue}>{measurements.weight}kg</Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.currentStep}>{steps[currentStep]}</Text>
          
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
          </View>

          <View style={styles.stepIndicators}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index <= currentStep && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  packageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${Colors.primary}20`,
  },
  package: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measuringLines: {
    position: 'absolute',
    width: 250,
    height: 250,
  },
  measureLine: {
    position: 'absolute',
    backgroundColor: Colors.primary,
  },
  topLine: {
    top: 20,
    left: 50,
    right: 50,
    height: 2,
  },
  bottomLine: {
    bottom: 20,
    left: 50,
    right: 50,
    height: 2,
  },
  leftLine: {
    left: 20,
    top: 50,
    bottom: 50,
    width: 2,
  },
  rightLine: {
    right: 20,
    top: 50,
    bottom: 50,
    width: 2,
  },
  scanLine: {
    position: 'absolute',
    left: 50,
    right: 50,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  measurementDisplay: {
    position: 'absolute',
    bottom: -80,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  measurementItem: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  progressSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  currentStep: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 22,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
});

export default MeasuringScreen;