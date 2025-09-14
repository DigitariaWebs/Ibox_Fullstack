import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../config/colors';
import { signupGradientColors } from '../config/gradients';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface SignupLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
}

const SignupLayout: React.FC<SignupLayoutProps> = ({ children, step, totalSteps }) => {
  const progress = Math.max(0, Math.min(1, step / totalSteps));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={signupGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});

export default SignupLayout;
