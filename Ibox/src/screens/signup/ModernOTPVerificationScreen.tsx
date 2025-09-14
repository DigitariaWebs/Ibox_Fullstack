import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import SignupBackground from '../../components/SignupBackground';
import IOSButton from '../../components/iOSButton';
import apiService from '../../services/api';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ModernOTPVerificationScreenProps {
  navigation: any;
  route: any;
}

const ModernOTPVerificationScreen: React.FC<ModernOTPVerificationScreenProps> = ({ navigation, route }) => {
  const { accountType, firstName, lastName, email, phone } = route.params;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const inputRef = useRef<TextInput>(null);

  // Animation values
  const contentOpacity = useSharedValue(0);
  const shakeAnimation = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    contentOpacity.value = withTiming(1, { duration: 300 });

    // Send initial OTP when screen loads
    sendInitialOTP();

    // Start resend cooldown
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendInitialOTP = async () => {
    try {
      console.log('📧 Sending initial OTP to:', email);
      const response = await apiService.sendOTP(email, firstName);
      if (response.success) {
        console.log('✅ OTP sent successfully');
      } else {
        console.error('❌ Failed to send OTP:', response.message);
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('❌ OTP send error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please check your connection.');
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleanValue);
    setError('');

    // Auto-submit when all 6 digits are entered
    if (cleanValue.length === 6) {
      setTimeout(() => {
        handleVerify(cleanValue);
      }, 100);
    }
  };

  const handleCellPress = (index: number) => {
    setFocusedIndex(index);
    inputRef.current?.focus();

    // Set cursor position
    setTimeout(() => {
      inputRef.current?.setNativeProps({
        selection: { start: index, end: index }
      });
    }, 10);
  };

  const handleVerify = async (otpToVerify?: string) => {
    const otpString = otpToVerify || otp;
    console.log('🔍 OTP Verification Debug:', { otpString, length: otpString.length });

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      // Shake animation
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 Verifying OTP:', otpString);
      const response = await apiService.verifyOTP(email, otpString);
      
      if (response.success) {
        console.log('✅ OTP verified successfully');
        // Navigate to password setup
        navigation.navigate('ModernPasswordSetup', {
          accountType,
          firstName,
          lastName,
          email,
          phone,
        });
      } else {
        setError(response.message || 'Invalid verification code. Please try again.');
        // Shake animation
        shakeAnimation.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        setOtp(''); // Clear the OTP input
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      }
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      setError(error.message || 'Verification failed. Please try again.');
      // Shake animation
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      setOtp(''); // Clear the OTP input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      console.log('🔄 Resending OTP to:', email);
      const response = await apiService.sendOTP(email, firstName);
      
      if (response.success) {
        console.log('✅ OTP resent successfully');
        setResendCooldown(30);
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.error('❌ Failed to resend OTP:', response.message);
        Alert.alert('Error', 'Failed to resend verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please check your connection.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const otpContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const isFormValid = otp.length === 6;

  return (
    <SignupBackground
      currentStep={3}
      totalSteps={5}
      onBack={handleBack}
    >

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, contentStyle]}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.iconContainer}>
              <Icon name="mail" type="Feather" size={48} color={Colors.white} />
            </View>
            <Text style={styles.title}>Check your </Text>
            <Text style={styles.titleSpecial}>email</Text>
            <Text style={styles.subtitle}>
              We sent a verification code to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Hidden TextInput for actual input handling */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            selectionColor="transparent"
          />

          {/* Visual OTP Display */}
          <Animated.View style={[styles.otpContainer, otpContainerStyle]}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.otpCell,
                  otp[index] && styles.otpCellFilled,
                  focusedIndex === index && styles.otpCellFocused,
                  error && styles.otpCellError
                ]}
                onPress={() => handleCellPress(index)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.otpText,
                  otp[index] && styles.otpTextFilled
                ]}>
                  {otp[index] || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" type="Feather" size={16} color="#FF2D55" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0}
              style={styles.resendButton}
            >
              <Text style={[
                styles.resendButtonText,
                resendCooldown > 0 && styles.resendButtonTextDisabled
              ]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <View style={styles.buttonContainer}>
            <IOSButton
              title={isLoading ? "Verifying..." : "Verify Email"}
              onPress={handleVerify}
              isVisible={true}
              loading={isLoading}
              disabled={!isFormValid || isLoading}
              textColor="#1F2937"
              style={styles.verifyButton}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SignupBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleSpecial: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.white,
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 32,
    marginBottom: 32,
    gap: 10,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  otpCellFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  otpCellFocused: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  otpCellError: {
    borderColor: '#FF2D55',
    backgroundColor: '#FFFFFF',
  },
  otpText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(31, 41, 55, 0.3)',
  },
  otpTextFilled: {
    color: '#1F2937',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF2D55',
    marginLeft: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    paddingBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resendButton: {
    padding: 9,
  },
  resendButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'none',
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingBottom: 32,
  },
  verifyButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
});

export default ModernOTPVerificationScreen;