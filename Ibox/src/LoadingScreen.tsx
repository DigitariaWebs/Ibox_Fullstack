import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated, Easing } from 'react-native';
import { Text } from './ui';
import { Colors } from './config/colors';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const progressAnimation = new Animated.Value(0);
  const logoScale = new Animated.Value(0.8);
  const logoOpacity = new Animated.Value(0);

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      // Loading complete
      setTimeout(() => {
        onLoadingComplete?.();
      }, 300);
    });
  }, []);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.loadingContainer}>
        <Text variant="body" color="textSecondary" style={styles.loadingText}>
          Loading...
        </Text>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 80,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingText: {
    marginBottom: 20,
    fontSize: 16,
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default LoadingScreen; 