import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import IOSButton from '../../components/iOSButton';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ModernSignupCompleteScreenProps {
  navigation: any;
  route: any;
}

const ModernSignupCompleteScreen: React.FC<ModernSignupCompleteScreenProps> = ({ navigation, route }) => {
  const { accountType, firstName } = route.params;

  // Animation values
  const contentOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animation sequence
    contentOpacity.value = withTiming(1, { duration: 300 });
    iconScale.value = withDelay(200, withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 200 })
    ));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
  }, []);

  const handleGetStarted = () => {
    // Navigate to the main app
    if (accountType === 'customer') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'TransporterHome' }],
      });
    }
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0AA5A8', '#4DC5C8', '#7B68EE', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Progress Bar */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 3 - Complete!</Text>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Success Icon */}
        <View style={styles.iconSection}>
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <Icon name="check-circle" type="Feather" size={80} color={Colors.white} />
          </Animated.View>
        </View>

        {/* Welcome Message */}
        <Animated.View style={[styles.messageSection, textStyle]}>
          <Text style={styles.welcomeText}>Welcome to </Text>
          <Text style={styles.welcomeSpecial}>iBox</Text>
          <Text style={styles.welcomeSubtext}>
            {firstName}!
          </Text>

          <Text style={styles.description}>
            Your {accountType} account has been created successfully.
            {accountType === 'customer'
              ? " You're ready to start shipping packages with ease!"
              : " You're ready to start earning by delivering packages!"
            }
          </Text>
        </Animated.View>

        {/* Features List */}
        <Animated.View style={[styles.featuresSection, textStyle]}>
          <View style={styles.feature}>
            <Icon name="shield-check" type="Feather" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.featureText}>Secure and verified account</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="zap" type="Feather" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.featureText}>Fast and reliable service</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="headphones" type="Feather" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.featureText}>24/7 customer support</Text>
          </View>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <IOSButton
            title="Get Started"
            onPress={handleGetStarted}
            isVisible={true}
            style={styles.getStartedButton}
          />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSpecial: {
    fontSize: 36,
    fontWeight: '400',
    color: Colors.white,
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresSection: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  getStartedButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
  },
});

export default ModernSignupCompleteScreen;