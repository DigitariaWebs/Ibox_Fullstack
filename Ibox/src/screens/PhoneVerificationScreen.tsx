import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  phoneNumber?: string;
}

const PhoneVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber: routePhoneNumber } = ((route as any)?.params || {}) as RouteParams;
  const { user, getCurrentUser, fetchDriverVerificationStatus } = useAuth();
  
  // State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  // Refs
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef(
    Array(6).fill(0).map(() => new Animated.Value(1))
  ).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Phone number to verify
  const phoneNumber = routePhoneNumber || user?.phone || '';
  
  // Timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  
  // Auto-send code on mount if phone exists
  useEffect(() => {
    if (phoneNumber && !codeSent) {
      sendVerificationCode();
    }
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove any non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as needed (e.g., XXX-XXX-XXXX)
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };
  
  const sendVerificationCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const endpoint = user?.userType === 'transporter' 
        ? '/driver/verification/phone/send'
        : '/users/verification/phone/send';
        
      const response = await api.post(endpoint, {});
      
      if (response.success) {
        setCodeSent(true);
        setResendTimer(60);
        setCanResend(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Code Sent!',
          `A verification code has been sent to ${formatPhoneNumber(phoneNumber)}`,
          [{ text: 'OK', onPress: () => inputRefs.current[0]?.focus() }]
        );
      } else {
        throw new Error(response.message || 'Failed to send code');
      }
    } catch (error: any) {
      console.error('Send verification error:', error);
      setError(error.message || 'Failed to send verification code');
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendVerificationCode = async () => {
    if (!canResend) return;
    
    setIsResending(true);
    setError('');
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    
    try {
      const endpoint = user?.userType === 'transporter'
        ? '/driver/verification/phone/resend'
        : '/users/verification/phone/resend';
        
      const response = await api.post(endpoint, {});
      
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Focus first input
        inputRefs.current[0]?.focus();
        
        Alert.alert(
          'Code Resent!',
          'A new verification code has been sent to your phone.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.message || 'Failed to resend code');
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };
  
  const verifyCode = async () => {
    const code = otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      shakeInputs();
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const endpoint = user?.userType === 'transporter'
        ? '/driver/verification/phone/verify'
        : '/users/verification/phone/verify';
        
      const response = await api.post(endpoint, { code });
      
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Refresh user data
        if (user?.userType === 'transporter') {
          await fetchDriverVerificationStatus();
        } else {
          await getCurrentUser();
        }
        
        Alert.alert(
          'Success!',
          'Your phone number has been verified successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Invalid code');
      }
    } catch (error: any) {
      console.error('Verify error:', error);
      setError(error.message || 'Invalid verification code');
      shakeInputs();
    } finally {
      setIsLoading(false);
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
        setTimeout(() => verifyCode(), 300);
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
      setTimeout(() => verifyCode(), 300);
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
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Verification</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary, '#8B5CF6']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="call-outline" size={40} color="white" />
              </LinearGradient>
            </View>
            
            {/* Title & Subtitle */}
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              {codeSent 
                ? `Enter the 6-digit code sent to`
                : 'We will send a verification code to'}
            </Text>
            <Text style={styles.phoneNumber}>
              {formatPhoneNumber(phoneNumber)}
            </Text>
            
            {/* OTP Input or Send Button */}
            {codeSent ? (
              <>
                {/* OTP Inputs with modern design */}
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
                      color={Colors.textTertiary} 
                    />
                    <Text style={styles.otpHintText}>
                      Tap to enter code
                    </Text>
                  </View>
                </View>
                
                {/* Error Message */}
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
                
                {/* Resend Section */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>
                    Didn't receive the code?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={resendVerificationCode}
                    disabled={!canResend || isResending}
                  >
                    <Text style={[
                      styles.resendLink,
                      (!canResend || isResending) && styles.resendLinkDisabled
                    ]}>
                      {isResending 
                        ? 'Sending...'
                        : canResend 
                          ? 'Resend' 
                          : `Resend in ${formatTime(resendTimer)}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Send Code Button */
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendVerificationCode}
                disabled={isLoading || !phoneNumber}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary, '#8B5CF6']}
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Verification Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        
        {/* Bottom Actions */}
        {codeSent && (
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[styles.verifyButton, (!otp.every(d => d !== '') || isLoading) && styles.verifyButtonDisabled]}
              onPress={verifyCode}
              disabled={!otp.every(d => d !== '') || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  otp.every(d => d !== '') && !isLoading
                    ? [Colors.primary, '#8B5CF6']
                    : ['#E5E5E5', '#E5E5E5']
                }
                style={styles.verifyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[
                    styles.verifyButtonText,
                    (!otp.every(d => d !== '') || isLoading) && styles.verifyButtonTextDisabled
                  ]}>
                    Verify Phone Number
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 40,
  },
  sendButton: {
    width: '100%',
    marginTop: 20,
  },
  sendButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
    borderColor: '#E8E8F0',
    backgroundColor: '#FAFBFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  otpCellFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  otpCellError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '08',
  },
  otpCellFocused: {
    borderColor: Colors.primary,
    borderWidth: 3,
    backgroundColor: Colors.primary + '05',
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    width: '100%',
    height: '100%',
    padding: 0,
    backgroundColor: 'transparent',
  },
  otpInputFilled: {
    color: Colors.primary,
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
    backgroundColor: '#E0E0E0',
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
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: Colors.textTertiary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  verifyButton: {
    width: '100%',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  verifyButtonTextDisabled: {
    color: '#999',
  },
});

export default PhoneVerificationScreen;