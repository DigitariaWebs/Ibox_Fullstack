import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Text } from '../ui';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { useAuth } from '../contexts/AuthContext';
import ModernInput from './ModernInput';
import IOSButton from './iOSButton';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.65; // Reduced height for better fit

interface ModernLoginModalProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

const ModernLoginModal: React.FC<ModernLoginModalProps> = ({ visible, onClose, navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Animation values
  const translateY = useSharedValue(MODAL_HEIGHT);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      // Smooth, direct opening animation without bounce
      opacity.value = withTiming(1, { duration: 300 });

      // Direct slide up to final position
      translateY.value = withTiming(0, {
        duration: 350,
      });

      // Subtle scale animation for depth
      scale.value = withTiming(1, {
        duration: 350,
      });
    } else {
      // Smooth closing animation
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(MODAL_HEIGHT, { duration: 300 });
      scale.value = withTiming(0.95, { duration: 250 });

      // Reset form when modal closes
      runOnJS(() => {
        setEmail('');
        setPassword('');
        setEmailError('');
        setPasswordError('');
        setGeneralError(null);
        setIsLoading(false);
      })();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setGeneralError(null);

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.trim().length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password: password.trim(),
      });

      console.log('✅ Login successful');
      handleClose();
    } catch (error) {
      console.error('❌ Login error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          setGeneralError('Invalid email or password');
        } else if (error.message.includes('Network')) {
          setGeneralError('Network error. Please check your connection');
        } else {
          setGeneralError('Login failed. Please try again');
        }
      } else {
        setGeneralError('Login failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    onClose();
    navigation?.navigate('ModernAccountType');
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const isFormValid = email.trim() && password.trim() && !emailError && !passwordError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
          style={styles.keyboardContainer}
        >
          <Animated.View style={[styles.modal, modalStyle]}>
            {/* Background with blur */}
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.98)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Icon name="x" type="Feather" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Title Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Welcome </Text>
                  <Text style={styles.titleSpecial}>back</Text>
                </View>
                <Text style={styles.subtitle}>
                  Sign in to continue your journey
                </Text>
              </View>

              {/* General Error */}
              {generalError && (
                <View style={styles.generalErrorContainer}>
                  <Icon name="alert-circle" type="Feather" size={16} color={Colors.error} />
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.formContainer}>
                <ModernInput
                  label="Email Address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                    if (generalError) setGeneralError(null);
                  }}
                  leftIcon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={emailError}
                  variant="outlined"
                />

                <ModernInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                    if (generalError) setGeneralError(null);
                  }}
                  leftIcon="lock"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={passwordError}
                  variant="outlined"
                />

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <View style={styles.buttonContainer}>
                <IOSButton
                  title={isLoading ? "Signing in..." : "Sign In"}
                  onPress={handleLogin}
                  isVisible={true}
                  loading={isLoading}
                  disabled={!isFormValid || isLoading}
                  style={[
                    styles.loginButton,
                    (!isFormValid || isLoading) && styles.loginButtonDisabled
                  ]}
                />
              </View>

              {/* Sign Up Section */}
              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>Don't have an account?</Text>
                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                  <Icon name="arrow-right" type="Feather" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
  },
  modal: {
    height: MODAL_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textSecondary + '40',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleSpecial: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.primary,
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  generalErrorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: -10,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.textSecondary + '40',
    borderColor: Colors.textSecondary + '40',
    shadowOpacity: 0,
    elevation: 0,
  },
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
    paddingVertical: 22
  },
  signUpText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  signUpButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default ModernLoginModal;