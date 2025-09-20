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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import SignupBackground from '../../components/SignupBackground';
import IOSButton from '../../components/iOSButton';
import apiService from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ModernOTPVerificationScreenProps {
  navigation: any;
  route: any;
}

const ModernOTPVerificationScreen: React.FC<ModernOTPVerificationScreenProps> = ({ navigation, route }) => {
  const { accountType, firstName, lastName, email, phone } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef(
    Array(6).fill(0).map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
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

  const handleOTPChange = (value: string, index: number) => {
    // Handle paste
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).replace(/[^0-9]/g, '');
      if (pastedCode.length === 6) {
        const digits = pastedCode.split('');
        setOtp(digits);
        setError('');
        
        // Animate all cells
        digits.forEach((_, i) => {
          Animated.spring(scaleAnimations[i], {
            toValue: 1.1,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(scaleAnimations[i], {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          });
        });
        
        // Auto verify
        setTimeout(() => handleVerify(pastedCode), 300);
        return;
      }
    }
    
    // Single digit input
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    
    // Animate current cell
    if (digit) {
      Animated.sequence([
        Animated.spring(scaleAnimations[index], {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimations[index], {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Auto-focus next input
    if (digit && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }
    
    // Auto-verify when all digits entered
    if (newOtp.every(d => d !== '') && digit) {
      setTimeout(() => handleVerify(newOtp.join('')), 300);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous cell if current is empty
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        
        // Animate previous cell
        Animated.sequence([
          Animated.spring(scaleAnimations[index - 1], {
            toValue: 0.9,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnimations[index - 1], {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (otp[index]) {
        // Clear current cell
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async (otpToVerify?: string) => {
    const otpString = otpToVerify || otp.join('');
    console.log('🔍 OTP Verification Debug:', { otpString, length: otpString.length });

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      shakeInputs();
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 Verifying OTP:', otpString);
      const response = await apiService.verifyOTP(email, otpString);
      
      if (response.success) {
        console.log('✅ OTP verified successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        shakeInputs();
        setOtp(['', '', '', '', '', '']); // Clear the OTP input
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 200);
      }
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      setError(error.message || 'Verification failed. Please try again.');
      shakeInputs();
      setOtp(['', '', '', '', '', '']); // Clear the OTP input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResendCooldown(30);
        setOtp(['', '', '', '', '', '']);
        setError('');
        
        // Focus first input
        inputRefs.current[0]?.focus();
        
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

  const isFormValid = otp.every(d => d !== '');

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
        <View style={styles.content}>
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

          {/* OTP Input with modern design */}
          <View style={styles.otpWrapper}>
            <Animated.View
              style={[
                styles.otpContainer,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              {otp.map((digit, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.otpCell,
                    { transform: [{ scale: scaleAnimations[index] }] }
                  ]}
                >
                  <View style={[
                    styles.otpCellBorder,
                    digit && styles.otpCellFilled,
                    error && styles.otpCellError,
                    inputRefs.current[index]?.isFocused?.() && styles.otpCellFocused
                  ]}>
                    <TextInput
                      ref={(ref) => inputRefs.current[index] = ref}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOTPChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={6} // Allow paste
                      textAlign="center"
                      autoFocus={index === 0}
                      selectTextOnFocus
                      returnKeyType="next"
                      placeholder="•"
                      placeholderTextColor="#E0E0E0"
                    />
                    {digit && (
                      <View style={styles.digitHighlight}>
                        <LinearGradient
                          colors={[Colors.primary + '20', Colors.primary + '00']}
                          style={styles.digitGlow}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.otpCellDot}>
                    {digit ? (
                      <LinearGradient
                        colors={[Colors.primary, '#8B5CF6']}
                        style={styles.otpCellDotFilled}
                      />
                    ) : (
                      <View style={styles.otpCellDotEmpty} />
                    )}
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
            
            {/* Visual hint */}
            <View style={styles.otpHint}>
              <MaterialCommunityIcons 
                name="gesture-tap" 
                size={16} 
                color="rgba(255, 255, 255, 0.6)" 
              />
              <Text style={styles.otpHintText}>
                Tap to enter code
              </Text>
            </View>
          </View>

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
        </View>
      </KeyboardAvoidingView>
    </SignupBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
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
  otpWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  otpCell: {
    alignItems: 'center',
  },
  otpCellBorder: {
    width: 52,
    height: 64,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  otpCellFilled: {
    borderColor: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  otpCellError: {
    borderColor: '#FF2D55',
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
  },
  otpCellFocused: {
    borderColor: Colors.white,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    width: '100%',
    height: '100%',
    padding: 0,
    backgroundColor: 'transparent',
  },
  otpInputFilled: {
    color: Colors.white,
  },
  digitHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  digitGlow: {
    flex: 1,
  },
  otpCellDot: {
    marginTop: 8,
    alignItems: 'center',
  },
  otpCellDotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  otpCellDotFilled: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  otpHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  otpHintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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