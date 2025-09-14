import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Image, Alert } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Text } from './ui';
import { Icon } from './ui/Icon';
import IOSButton from './components/iOSButton';
import { Colors } from './config/colors';
import { Fonts } from './config/fonts';
import { PaymentLogos } from './config/assets';
import { useTranslation } from './config/i18n';
import { useAuth } from './contexts/AuthContext';
import ModernLoginModal from './components/ModernLoginModal';
import googleAuthService from './services/googleAuth';
import { GOOGLE_CLIENT_IDS } from './config/googleAuth';
import apiService from './services/api';

// Complete the web browser session for OAuth
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

interface AuthSelectionScreenProps {
  navigation?: any;
}

const AuthSelectionScreen: React.FC<AuthSelectionScreenProps> = ({
  navigation,
}) => {
  const { t, locale } = useTranslation();
  const { login } = useAuth();
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-20);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(40);

  // Google Auth configuration - Using Expo's default client for demo
  // This works immediately in Expo Go without any setup!
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
    // For iOS, we need to provide an iosClientId (using the same Expo test ID)
    iosClientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
    // For Android
    androidClientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
    // This is Expo's official test client ID that works in Expo Go
    scopes: ['profile', 'email'],
  });

  // Initialize video player with expo-video
  const player = useVideoPlayer(require('../assets/videos/selectVideo.mp4'), player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    // Initialize entrance animations
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    logoTranslateY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 200 }));

    textOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(600, withSpring(0, { damping: 25, stiffness: 250 }));

    buttonsOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    buttonsTranslateY.value = withDelay(900, withSpring(0, { damping: 20, stiffness: 200 }));

    // Cleanup function
    return () => {
      player.release();
    };
  }, [player]);

  // Handle Google authentication response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleSuccess(authentication.idToken);
      }
    }
  }, [response]);


  const handleLoginPress = () => {
    setIsLoginModalVisible(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔑 Initiating Google Sign-in...');
      
      // Prompt the user to sign in with Google
      const result = await promptAsync();
      
      if (result?.type === 'cancel') {
        console.log('User cancelled Google sign-in');
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      Alert.alert(
        'Sign-In Error',
        'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      console.log('✅ Got Google ID token, sending to backend...');
      
      // Send the ID token to your real backend
      // Use the same API URL from the service
      const apiUrl = apiService.getConfig().baseUrl.replace('/api/v1', '');
      const response = await fetch(`${apiUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userType: 'customer',
          language: locale,
        }),
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success && data.data) {
        // Store tokens from backend
        const { user, tokens } = data.data;
        
        // Store tokens in API service
        await apiService.storeTokens(tokens.accessToken, tokens.refreshToken);
        
        // Update auth context with real user from backend
        await login(user, user.userType);
        
        console.log('✅ Google sign-in successful with backend!');
        
        // Navigate to appropriate screen based on user type
        if (user.userType === 'transporter') {
          navigation?.navigate('TransporterMain');
        } else {
          navigation?.navigate('CustomerMain');
        }
      } else {
        throw new Error(data.message || 'Backend authentication failed');
      }
    } catch (error) {
      console.error('❌ Backend authentication error:', error);
      Alert.alert(
        'Sign-In Error',
        'Failed to authenticate with backend. Please make sure the backend server is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginModalClose = () => {
    setIsLoginModalVisible(false);
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Video Background */}
      <VideoView
        style={StyleSheet.absoluteFillObject}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
        nativeControls={false}
      />
      
      {/* Dark Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Main Text */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Ship with </Text>
            <Text style={styles.specialWord}>confidence</Text>
          </View>
          <Text style={styles.subtitle}>
            Connect with trusted transporters worldwide
          </Text>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
          <IOSButton
            title="Sign In"
            onPress={handleLoginPress}
            isVisible={true}
            style={styles.primaryButton}
          />

          <IOSButton
            title={isGoogleLoading ? "Signing in..." : "Continue with Google"}
            onPress={handleGoogleSignIn}
            isVisible={true}
            style={styles.googleButton}
            loading={isGoogleLoading}
            disabled={isGoogleLoading || !request}
            textColor={Colors.textPrimary}
            icon={
              <Image
                source={PaymentLogos.google}
                style={styles.googleIcon}
                resizeMode="contain"
              />
            }
          />
        </Animated.View>
        
      </View>

      {/* Modern Login Modal */}
      {isLoginModalVisible && (
        <ModernLoginModal
          visible={isLoginModalVisible}
          onClose={handleLoginModalClose}
          navigation={navigation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 50,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8,
    paddingVertical: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 48,
    lineHeight: 56,
    color: Colors.white,
    letterSpacing: -1,
    fontWeight: '600',
  },
  specialWord: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontSize: 52,
    lineHeight: 56,
    color: Colors.white,
    letterSpacing: -0.5,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 19,
    lineHeight: 26,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'left',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  buttonContainer: {
    gap: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
});

export default AuthSelectionScreen; 