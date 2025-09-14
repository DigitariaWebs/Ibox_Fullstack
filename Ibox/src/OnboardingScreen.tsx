import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from './config/colors';
import { useAuth } from './contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import OnboardingText from './components/OnboardingText';
import IOSButton from './components/iOSButton';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  specialWord?: string;
  buttonText?: string;
  showButton: boolean;
}

const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();
  const navigation = useNavigation<any>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const gestureX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-30);

  // Original slide data
  const slides: OnboardingSlide[] = [
    {
      id: 1,
      title: "Ship anything \nwith a single tap.",
      specialWord: "anything",
      buttonText: "Let's Go",
      showButton: false,
    },
    {
      id: 2,
      title: "Track every parcel \nlive to your door.",
      specialWord: "live",
      buttonText: "Continue",
      showButton: false,
    },
    {
      id: 3,
      title: "Trucks, pallets, storage — \nall in one app.",
      specialWord: "all",
      buttonText: "Get Started",
      showButton: true,
    },
  ];

  // Original gradient colors
  const gradientColors = ['#0AA5A8', '#4DC5C8', '#7B68EE', '#9370DB'];

  // Logo entrance animation
  const animateLogoEntrance = () => {
    logoOpacity.value = 0;
    logoTranslateY.value = -30;

    logoOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    logoTranslateY.value = withDelay(200, withSpring(0, {
      damping: 20,
      stiffness: 150,
    }));
  };

  // Helper function to show button after slide completes
  const showButtonWithDelay = (slideIndex: number) => {
    setTimeout(() => {
      setButtonVisible(slides[slideIndex].showButton);
    }, 200);
  };

  // Slide transition function
  const goToSlide = (slideIndex: number) => {
    if (slideIndex === currentSlide) return;

    const direction = slideIndex > currentSlide ? -1 : 1;

    // Only hide button, keep text visible to avoid flicker
    setButtonVisible(false);

    // Switch content immediately, then snap in quickly from the correct side
    setCurrentSlide(slideIndex);
    currentIndex.value = slideIndex;
    translateX.value = -direction * width;
    translateX.value = withTiming(0, { duration: 160 }, () => {
      // Show button after delay, text handles its own animation
      runOnJS(showButtonWithDelay)(slideIndex);
    });
  };

  // Navigation functions
  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      completeOnboarding();
      navigation.navigate('AuthSelection');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  // Enhanced pan gesture for smooth swiping
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      gestureX.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = gestureX.value + event.translationX;
    })
    .onEnd((event) => {
      'worklet';
      const { translationX, velocityX } = event;
      const swipeThreshold = width * 0.2;
      const velocityThreshold = 800;

      if (
        (translationX > swipeThreshold || velocityX > velocityThreshold) &&
        currentSlide > 0
      ) {
        runOnJS(prevSlide)();
      } else if (
        (translationX < -swipeThreshold || velocityX < -velocityThreshold) &&
        currentSlide < slides.length - 1
      ) {
        runOnJS(nextSlide)();
      } else {
        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 300,
        });
      }
    })
    .failOffsetY([-20, 20])
    .activeOffsetX([-15, 15]);

  // Initialize logo animation and set initial button visibility
  useEffect(() => {
    animateLogoEntrance();
    setButtonVisible(slides[0].showButton);
    currentIndex.value = 0;
  }, []);

  // Remove this useEffect - we'll handle visibility in goToSlide function only

  // Current slide data
  const currentSlideData = slides[currentSlide];

  // Animated styles
  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
    ],
  }));

  // No parallax/worm for progress; keep dots static

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Main Content with Gesture Handler */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slideContainer, slideAnimatedStyle]}>
          {/* Content Section */}
          <View style={styles.contentSection}>
            <OnboardingText
              title={currentSlideData.title}
              specialWord={currentSlideData.specialWord}
              isVisible={true}
            />
          </View>

          {/* Button Section */}
          <View style={styles.buttonSection}>
            {currentSlideData.showButton && (
              <View style={styles.buttonContainer}>
                <IOSButton
                  title={currentSlideData.buttonText || 'Continue'}
                  onPress={nextSlide}
                  isVisible={buttonVisible}
                />
              </View>
            )}

            {/* Progress Indicator - static dots with larger active dot */}
            <View style={styles.progressContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentSlide && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: height * 0.15,
    paddingBottom: height * 0.08,
    paddingHorizontal: 24,
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.08,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: Colors.white,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 20,
    height: 8,
    borderRadius: 4,
    shadowColor: 'rgba(255, 255, 255, 0.6)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  // no worm/dynamic track when using static dots
});

export default OnboardingScreen;