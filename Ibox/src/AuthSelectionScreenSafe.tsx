import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Text } from './ui';
import { Colors } from './config/colors';
import { useTranslation } from './config/i18n';

interface AuthSelectionScreenProps {
  navigation?: any;
}

const AuthSelectionScreenSafe: React.FC<AuthSelectionScreenProps> = ({
  navigation,
}) => {
  const { t, locale } = useTranslation();
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  const getCurrentLanguage = () => {
    return locale === 'fr' ? 'FR' : 'EN';
  };

  const handleLoginPress = () => {
    setIsLoginModalVisible(true);
  };

  const handleLoginModalClose = () => {
    setIsLoginModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
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
            title={t('join_neighborhood')}
            onPress={() => navigation?.navigate('Main')}
            variant="primary"
            style={styles.primaryButton}
          />
          
          <Button
            title={t('log_in')}
            onPress={handleLoginPress}
            variant="secondary"
            style={styles.secondaryButton}
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

      {/* Login Modal - Temporarily disabled for debugging */}
      {/* {isLoginModalVisible && (
        <LoginModal
          visible={isLoginModalVisible}
          onClose={handleLoginModalClose}
        />
      )} */}
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
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 0,
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

export default AuthSelectionScreenSafe;