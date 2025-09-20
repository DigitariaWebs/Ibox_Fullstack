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
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Text } from './ui';
import { Icon } from './ui/Icon';
import IOSButton from './components/iOSButton';
import { Colors } from './config/colors';
import { Fonts } from './config/fonts';
import { PaymentLogos } from './config/assets';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './contexts/AuthContext';
import ModernLoginModal from './components/ModernLoginModal';
import { supabase } from './lib/supabase';

// Complete the web browser session for OAuth
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

interface AuthSelectionScreenProps {
  navigation?: any;
}

const AuthSelectionScreen: React.FC<AuthSelectionScreenProps> = ({
  navigation,
}) => {
  const { login } = useAuth();
  const navigationHook = useNavigation();
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Simple fallback for translation
  const t = (key: string) => key;
  const locale = 'en';

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-20);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(40);

  // Supabase Google Auth configuration

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

  // Handle Supabase Google authentication


  const handleLoginPress = () => {
    setIsLoginModalVisible(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔑 Initiating Supabase Google Sign-in...');
      
      // Critical: proxy redirect for Expo Go
      const redirectTo = AuthSession.makeRedirectUri({ useProxy: true });
      console.log('🔗 Redirect URI:', redirectTo);
      console.log('🔗 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('🔗 Supabase Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
      
      // Use the local redirect URI for Expo Go
      const supabaseRedirectTo = redirectTo;
      console.log('🔗 Using Supabase Redirect URI:', supabaseRedirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: supabaseRedirectTo, 
          scopes: 'openid email profile' 
        },
      });
      
      if (error) {
        console.error('❌ Supabase OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Supabase OAuth URL generated:', data.url);

      const result = await WebBrowser.openAuthSessionAsync(data.url!, supabaseRedirectTo);
      console.log('🔍 OAuth result:', result);
      
      if (result.type !== 'success') {
        console.log('User cancelled Google sign-in');
        setIsGoogleLoading(false);
        return;
      }

      console.log('✅ OAuth completed, processing URL fragment...');

      // Extract access token from URL fragment
      let sessionData = null;
      if (result.url && result.url.includes('access_token=')) {
        const url = new URL(result.url);
        const accessToken = url.hash.split('access_token=')[1]?.split('&')[0];
        
        if (accessToken) {
          console.log('✅ Access token extracted from URL');
          
          // Set the session manually using the access token
          const { data, error: sessErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: url.hash.split('refresh_token=')[1]?.split('&')[0] || ''
          });
          
          sessionData = data;
          
          if (sessErr || !sessionData.session) {
            console.error('❌ Session error:', sessErr);
            console.error('❌ Session data:', sessionData);
            throw sessErr ?? new Error('Failed to set Supabase session');
          }
          
          console.log('✅ Supabase session established!');
        } else {
          throw new Error('No access token found in URL fragment');
        }
      } else {
        throw new Error('No URL fragment with access token');
      }

      // Send Supabase access token to API to get our app tokens
      const accessToken = sessionData.session.access_token;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.22:5000';
      
      console.log('🌐 Calling backend API:', `${apiUrl}/api/v1/supabase/login`);
      console.log('🔑 Access token length:', accessToken.length);
      
      const response = await fetch(`${apiUrl}/api/v1/supabase/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      
      console.log('📡 API response status:', response.status);
      console.log('📡 API response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error response:', errorData);
        throw new Error(errorData.error || 'API login failed');
      }
      
      const tokens = await response.json();
      
      console.log('✅ Supabase Google sign-in successful!');
      console.log('👤 User data:', tokens.user);
      
      // Store the tokens manually since we have them from the backend
      // The auth context will pick them up on next app start
      // For now, just navigate to the home screen
      navigation?.navigate('HomeScreen');
      
    } catch (error) {
      console.error('❌ Supabase Google sign-in error:', error);
      Alert.alert(
        'Sign-In Error',
        'Failed to sign in with Google. Please try again.',
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
            disabled={isGoogleLoading}
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