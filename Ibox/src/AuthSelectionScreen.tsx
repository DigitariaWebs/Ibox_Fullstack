import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Button, Text } from './ui';
import { Icon } from './ui/Icon';
import { Colors } from './config/colors';
import { useTranslation } from './config/i18n';
import { useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
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

  const getCurrentLanguage = () => {
    return locale === 'fr' ? 'FR' : 'EN';
  };

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
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Main Text */}
        <View style={styles.textContainer}>
          <Text variant="h2" weight="bold" style={styles.mainTitle}>
            {t('explore_possibilities')}
          </Text>
          <Text variant="h2" weight="bold" style={styles.mainTitle}>
            {t('nearby')}
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('log_in')}
            onPress={handleLoginPress}
            variant="primary"
            style={styles.primaryButton}
            icon={<Icon name="log-in" type="Feather" size={22} color={Colors.white} />}
          />
          
          <Button
            title={isGoogleLoading ? "Signing in..." : "Continue with Google"}
            onPress={handleGoogleSignIn}
            variant="secondary"
            style={styles.googleButton}
            icon={<Icon name="google" type="FontAwesome" size={22} color={Colors.primary} />}
            disabled={isGoogleLoading || !request}
            loading={isGoogleLoading}
          />
        </View>
        
        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.languageSelector}
            onPress={() => navigation?.navigate('LanguageSelection')}
          >
            <Text style={styles.languageIcon}>🌐</Text>
            <Text style={styles.languageText}>
              {getCurrentLanguage()} (US)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Modal */}
      {isLoginModalVisible && (
        <LoginModal
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
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
  },
  mainTitle: {
    fontSize: 48,
    lineHeight: 56,
    color: Colors.white,
    textAlign: 'left',
    letterSpacing: -1,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderRadius: 28,
    minHeight: 56,
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
    borderRadius: 28,
    minHeight: 56,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageIcon: {
    fontSize: 20,
  },
  languageText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthSelectionScreen; 