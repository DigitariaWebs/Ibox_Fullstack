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
  PanResponder,
  ScrollView,
} from 'react-native';
import { Text, Input, Button, Icon } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  withRepeat,
  withSequence,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75; // 75% for better keyboard accommodation

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const translateY = useSharedValue(MODAL_HEIGHT);
  const opacity = useSharedValue(0);
  const backgroundGradient = useSharedValue(0);
  const emailFocusProgress = useSharedValue(0);
  const passwordFocusProgress = useSharedValue(0);
  const loadingProgress = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
      });
      gestureTranslateY.value = 0;
      backgroundGradient.value = withTiming(1, { duration: 800 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(MODAL_HEIGHT, { duration: 350 }, () => {
        runOnJS(() => {
          setEmail('');
          setPassword('');
          setIsEmailFocused(false);
          setIsPasswordFocused(false);
          setIsLoading(false);
          setError(null);
          setShowPassword(false);
        })();
      });
      gestureTranslateY.value = 0;
      backgroundGradient.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  useEffect(() => {
    if (isLoading) {
      loadingProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      loadingProgress.value = withTiming(0, { duration: 300 });
    }
  }, [isLoading]);

  const handleClose = () => {
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    // Basic validation
    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Attempting login for:', trimmedEmail);
      
      // Use the actual login function from AuthContext
      await login({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      
      console.log('✅ Login successful for:', trimmedEmail);
      handleSuccessfulLogin();
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Set user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          setError('Invalid email or password');
        } else if (error.message.includes('Network')) {
          setError('Network error. Please check your connection');
        } else {
          setError(error.message || 'Login failed. Please try again');
        }
      } else {
        setError('Login failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleEmailFocus = () => {
    setIsEmailFocused(true);
    emailFocusProgress.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
  };

  const handleEmailBlur = () => {
    setIsEmailFocused(false);
    emailFocusProgress.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
  };

  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
    passwordFocusProgress.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
    passwordFocusProgress.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
  };

  const handleSuccessfulLogin = (accountType?: 'transporter' | 'customer') => {
    // Close the modal first
    onClose();
    
    // Navigation will now be handled automatically by AuthContext based on userType
    console.log('🎉 Login modal closed, AuthContext will handle navigation based on userType:', accountType || 'customer');
  };

  const handleSignUp = () => {
    // Close the modal and navigate to signup flow
    onClose();
    navigation?.navigate('OnboardingEntry');
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Respond to pan gestures only for vertical movement
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: (evt, gestureState) => {
      // Gesture started
    },
    onPanResponderMove: (evt, gestureState) => {
      // Only allow downward drag
      if (gestureState.dy > 0) {
        gestureTranslateY.value = gestureState.dy;
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const shouldClose = gestureState.dy > MODAL_HEIGHT * 0.25 || gestureState.vy > 0.5;
      
      if (shouldClose) {
        // Close the modal
        gestureTranslateY.value = withTiming(MODAL_HEIGHT, { duration: 300 });
        translateY.value = withTiming(MODAL_HEIGHT, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(onClose)();
      } else {
        // Snap back to original position
        gestureTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    },
  });

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + gestureTranslateY.value }],
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      backgroundGradient.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const animatedEmailContainerStyle = useAnimatedStyle(() => ({
    // Removed scale transform to prevent text blurriness
    opacity: interpolate(
      emailFocusProgress.value,
      [0, 1],
      [1, 1],
      Extrapolate.CLAMP
    ),
  }));

  const animatedPasswordContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      passwordFocusProgress.value,
      [0, 1],
      [1, 1],
      Extrapolate.CLAMP
    ),
  }));

  const animatedLoadingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      loadingProgress.value,
      [0, 1],
      [0.3, 1],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal Content */}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 0}
        >
          <Animated.View style={[styles.modalContent, animatedModalStyle]}>
            {/* Gradient Background */}
            <Animated.View style={[styles.gradientContainer, animatedGradientStyle]}>
              <LinearGradient
                colors={['rgba(10, 165, 168, 0.1)', 'rgba(16, 185, 129, 0.05)', 'rgba(255, 255, 255, 0.95)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            
            {/* Glassmorphism Blur */}
            <ExpoBlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
            
            {/* Interactive Green Bar for dragging */}
            <Animated.View 
              style={styles.dragHandle}
              {...panResponder.panHandlers}
            >
              <View style={styles.modernAccentBar} />
            </Animated.View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Icon name="x" type="Feather" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <View style={styles.titleContainer}>
                <Text variant="h1" weight="bold" style={styles.modernTitle}>
                  Welcome back
                </Text>
                <Text style={styles.subtitle}>
                  Sign in to your account to continue
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" type="Feather" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email Input */}
              <Animated.View style={[styles.inputContainer, animatedEmailContainerStyle]}>
                <View style={styles.modernInputWrapper}>
                  <Icon 
                    name="mail" 
                    type="Feather" 
                    size={20} 
                    color={isEmailFocused ? Colors.primary : Colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <Input
                    label={isEmailFocused || email.length > 0 ? "Email Address" : undefined}
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    variant="filled"
                    style={styles.modernEmailInput}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </Animated.View>

              {/* Password Input */}
              <Animated.View style={[styles.inputContainer, animatedPasswordContainerStyle]}>
                <View style={styles.modernInputWrapper}>
                  <Icon 
                    name="lock" 
                    type="Feather" 
                    size={20} 
                    color={isPasswordFocused ? Colors.primary : Colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <Input
                    label={isPasswordFocused || password.length > 0 ? "Password" : undefined}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    variant="filled"
                    style={styles.modernPasswordInput}
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Icon 
                      name={showPassword ? "eye-off" : "eye"} 
                      type="Feather" 
                      size={18} 
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Login Button */}
              {email.trim() && password.trim() && (
                <View style={styles.loginButtonContainer}>
                  <Button
                    title={isLoading ? "Signing in..." : "Sign In"}
                    onPress={handleLogin}
                    variant="primary"
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.loginButton}
                    glowEffect={true}
                  />
                </View>
              )}


              {/* Sign Up Section */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>
                  Don't have an account?
                </Text>
                <TouchableOpacity 
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Text style={styles.signUpButtonText}>
                    Sign Up
                  </Text>
                  <Icon name="arrow-right" type="Feather" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Bottom Policy Text (more margin) */}
              <View style={styles.bottomPolicyContainer}>
                <Text style={styles.bottomPolicyText}>
                  By continuing, you agree to our <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingContainer: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MODAL_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modernAccentBar: {
    height: 5,
    width: 80,
    backgroundColor: Colors.primary,
    borderRadius: 3,
    opacity: 0.9,
    // Add subtle shadow to make it stand out
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modernTitle: {
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  modernInputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  modernEmailInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 44,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
    // Properties for crisp text rendering
    textAlignVertical: 'center',
  },
  modernPasswordInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 44,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
    textAlignVertical: 'center',
    paddingRight: 40, // Space for the eye icon
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  loginButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  loginButton: {
    borderRadius: 16,
    minHeight: 52,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  signUpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  signUpButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomPolicyContainer: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  bottomPolicyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default LoginModal;