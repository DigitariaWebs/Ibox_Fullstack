import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Colors } from '../config/colors';

const AuthLoadingScreen: React.FC = () => {
  const logoOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Initial logo fade in
    logoOpacity.value = withTiming(1, { duration: 600 });
    
    // Animate the progress from left to right
    progressWidth.value = withTiming(100, { duration: 3000 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(
        progressWidth.value,
        [0, 100],
        [0, 200],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Logo with Progress Effect */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        {/* Grey Background Logo */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={[styles.logoImage, styles.greyLogo]}
          resizeMode="contain"
        />
        
        {/* Colored Logo with Clip Progress */}
        <Animated.View style={[styles.logoProgressContainer, progressAnimatedStyle]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.coloredLogoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    width: 200,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 120,
  },
  greyLogo: {
    position: 'absolute',
    tintColor: '#D1D5DB', // Light grey
    opacity: 0.5,
  },
  logoProgressContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 120,
    overflow: 'hidden',
  },
  coloredLogoImage: {
    width: 200,
    height: 120,
  },
});

export default AuthLoadingScreen; 