import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import { useSignUp } from '../../contexts/SignUpContext';

const { width, height } = Dimensions.get('window');

interface OnboardingEntryScreenProps {
  navigation: any;
}

const OnboardingEntryScreen: React.FC<OnboardingEntryScreenProps> = ({ navigation }) => {
  const { setCurrentStep } = useSignUp();

  // Simple animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Simple fade and slide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    setCurrentStep(1);
    navigation.navigate('AccountType');
  };

  const handleBackToAuth = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient - Same as OnboardingScreen */}
      <LinearGradient
        colors={['#0AA5A8', '#4DC5C8', '#7B68EE', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back Button */}
      <TouchableOpacity onPress={handleBackToAuth} style={styles.backButton}>
                    <Icon name="chevron-left" type="Feather" size={24} color={Colors.white} />
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            Welcome to iBox
          </Text>
          
          <Text style={styles.subtitle}>
            Connect with transporters and ship anything, anywhere with just a tap.
          </Text>
          
          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <FeatureCard 
                icon="shield" 
                title="Secure"
                description="End-to-end encryption"
              />
              <FeatureCard 
                icon="zap" 
                title="Fast"
                description="Instant connections"
              />
            </View>
            <View style={styles.featureRow}>
              <FeatureCard 
                icon="users" 
                title="Trusted"
                description="Verified transporters"
              />
              <FeatureCard 
                icon="star" 
                title="Rated"
                description="4.9★ user rating"
              />
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Create Account"
            onPress={handleGetStarted}
            variant="secondary"
            style={styles.createButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color={Colors.primary} />}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <View style={styles.featureCard}>
    <View style={styles.featureIconContainer}>
      <Icon name={icon} type="Feather" size={20} color={Colors.white} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: Colors.white,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 300,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 100,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 3,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 14,
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 12,
  },
  createButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 52,
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  loginLink: {
    color: Colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default OnboardingEntryScreen;