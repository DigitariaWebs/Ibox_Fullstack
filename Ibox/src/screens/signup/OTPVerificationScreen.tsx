import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { otpSchema } from '../../validation/signUpSchemas';

interface OTPVerificationScreenProps {
  navigation: any;
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      validateOTP(otpString);
    } else {
      setIsValid(false);
      setError('');
    }
  }, [otp]);

  const validateOTP = async (otpString: string) => {
    try {
      await otpSchema.validate({ otp: otpString });
      setIsValid(true);
      setError('');
    } catch (validationError: any) {
      setIsValid(false);
      setError(validationError.message);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (!isValid) return;

    setIsVerifying(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, verify OTP with backend
      // For demo, accept any 6-digit code
      updateSignUpData({ otp: otpString });
      setCurrentStep(4);
      navigation.navigate('AddressLocaleScreen');
    } catch (error) {
      setError('Invalid verification code. Please try again.');
      shakeInputs();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    
    // Focus first input
    inputRefs.current[0]?.focus();
    
    // Simulate resend API call
    console.log('Resending OTP to:', signUpData.email);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2b of 7</Text>
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
              <View style={styles.iconCircle}>
                <Icon name="mail" type="Feather" size={32} color={Colors.primary} />
              </View>
            </View>
            
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Check your messages
              </Text>
              <Text style={styles.subtitle}>
                We sent a verification code to
              </Text>
              <Text style={styles.email}>
                {signUpData.email}
              </Text>
            </View>
            
            {/* OTP Input */}
            <Animated.View 
              style={[
                styles.otpContainer,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => inputRefs.current[index] = ref}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    error && styles.otpInputError
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                  selectTextOnFocus
                  returnKeyType="next"
                />
              ))}
            </Animated.View>
            
            {/* Error Message */}
            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}
            
            {/* Resend */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?{' '}
              </Text>
              <TouchableOpacity 
                onPress={handleResend}
                disabled={!canResend}
              >
                <Text style={[
                  styles.resendLink,
                  !canResend && styles.resendLinkDisabled
                ]}>
                  {canResend ? 'Resend' : `Resend in ${formatTime(resendTimer)}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Verify Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <Button
            title={isVerifying ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            variant="primary"
            disabled={!isValid || isVerifying}
            loading={isVerifying}
            style={styles.verifyButton}
          />
          
          <TouchableOpacity style={styles.backToEmailButton} onPress={handleBack}>
            <Text style={styles.backToEmailText}>
              Back to edit email
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  otpInputError: {
    borderColor: Colors.error,
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
    marginBottom: 40,
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 16,
  },
  verifyButton: {
    width: '100%',
  },
  backToEmailButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToEmailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default OTPVerificationScreen;