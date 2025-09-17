import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import SignupBackground from '../../components/SignupBackground';
import ModernPhoneInput from '../../components/ModernPhoneInput';
import IOSButton from '../../components/iOSButton';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ModernBasicInfoStepScreenProps {
  navigation: any;
  route: any;
}

const ModernBasicInfoStepScreen: React.FC<ModernBasicInfoStepScreenProps> = ({ navigation, route }) => {
  const { accountType } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Animation and UI state
  const contentOpacity = useSharedValue(0);
  const formScale = useSharedValue(0.95);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  React.useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 800 });
    formScale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, []);

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPhoneError('');
    setGeneralError('');

    // First name validation
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    } else if (firstName.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters');
      isValid = false;
    }

    // Last name validation
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    } else if (lastName.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Phone validation
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else {
      // Remove all non-digit characters except + for validation
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      
      // Check if it has a country code
      if (!cleanPhone.startsWith('+')) {
        setPhoneError('Please select a country code');
        isValid = false;
      } else {
        // Specific validation for known country codes
        if (cleanPhone.startsWith('+213')) { // Algeria
          const numberPart = cleanPhone.substring(4);
          if (numberPart.length !== 9) {
            setPhoneError('Algerian phone numbers should be 9 digits');
            isValid = false;
          }
        } else if (cleanPhone.startsWith('+216')) { // Tunisia
          const numberPart = cleanPhone.substring(4);
          if (numberPart.length !== 8) {
            setPhoneError('Tunisian phone numbers should be 8 digits');
            isValid = false;
          }
        } else if (cleanPhone.startsWith('+212')) { // Morocco
          const numberPart = cleanPhone.substring(4);
          if (numberPart.length !== 9) {
            setPhoneError('Moroccan phone numbers should be 9 digits');
            isValid = false;
          }
        } else if (cleanPhone.startsWith('+1')) { // USA/Canada
          const numberPart = cleanPhone.substring(2);
          if (numberPart.length !== 10) {
            setPhoneError('US/Canadian phone numbers should be 10 digits');
            isValid = false;
          }
        } else if (cleanPhone.startsWith('+33')) { // France
          const numberPart = cleanPhone.substring(3);
          if (numberPart.length !== 9) {
            setPhoneError('French phone numbers should be 9 digits');
            isValid = false;
          }
        } else if (cleanPhone.startsWith('+44')) { // UK
          const numberPart = cleanPhone.substring(3);
          if (numberPart.length < 10 || numberPart.length > 11) {
            setPhoneError('UK phone numbers should be 10 or 11 digits');
            isValid = false;
          }
        } else {
          // Generic validation for other countries
          if (cleanPhone.length < 10) {
            setPhoneError('Phone number is too short');
            isValid = false;
          } else if (cleanPhone.length > 20) {
            setPhoneError('Phone number is too long');
            isValid = false;
          }
        }
      }
    }

    return isValid;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to OTP verification screen
    navigation.navigate('ModernOTPVerification', {
      accountType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
  }));

  const renderModernInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options: {
      icon?: string;
      keyboardType?: any;
      autoCapitalize?: any;
      autoCorrect?: boolean;
      error?: string;
      helpText?: string;
      maxLength?: number;
      fieldName: string;
    }
  ) => {
    const isFocused = focusedField === options.fieldName;
    
    return (
      <View style={styles.modernInputWrapper}>
        {/* Label with animation */}
        <Animated.View 
          entering={FadeInDown.delay(200).springify()}
          style={styles.labelContainer}
        >
          <Text style={styles.modernLabel}>
            {label}
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        </Animated.View>

        {/* Glass morphism input container */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={[
            styles.modernInputContainer,
            isFocused && styles.modernInputFocused,
            options.error && styles.modernInputError,
          ]}
        >
          <BlurView
            intensity={80}
            tint="light"
            style={styles.blurContainer}
          >
            {options.icon && (
              <View style={styles.modernIconContainer}>
                <Icon
                  name={options.icon}
                  type="Feather"
                  size={20}
                  color={isFocused ? Colors.primary : 'rgba(255,255,255,0.6)'}
                />
              </View>
            )}
            
            <TextInput
              style={styles.modernTextInput}
              value={value}
              onChangeText={onChangeText}
              onFocus={() => {
                setFocusedField(options.fieldName);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onBlur={() => setFocusedField(null)}
              placeholder={`Enter ${label.toLowerCase()}`}
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType={options.keyboardType}
              autoCapitalize={options.autoCapitalize}
              autoCorrect={options.autoCorrect}
              maxLength={options.maxLength}
              selectionColor={Colors.primary}
            />
          </BlurView>
        </Animated.View>

        {/* Help text or error */}
        {(options.helpText || options.error) && (
          <Animated.View
            entering={FadeIn.delay(400)}
            style={styles.helpTextContainer}
          >
            {options.error ? (
              <View style={styles.errorRow}>
                <Icon name="alert-circle" type="Feather" size={14} color="#FF6B6B" />
                <Text style={styles.modernErrorText}>{options.error}</Text>
              </View>
            ) : (
              <Text style={styles.modernHelpText}>{options.helpText}</Text>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim() &&
                     !firstNameError && !lastNameError && !emailError && !phoneError;

  return (
    <SignupBackground
      currentStep={2}
      totalSteps={5}
      onBack={handleBack}
    >

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, contentStyle]}>
            {/* Title Section with enhanced styling */}
            <Animated.View 
              entering={FadeInDown.springify()}
              style={styles.titleSection}
            >
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>Tell us about</Text>
                <Text style={styles.titleSpecial}>yourself</Text>
              </View>
              <View style={styles.subtitleContainer}>
                <View style={styles.subtitleLine} />
                <Text style={styles.subtitle}>
                  Let's start with your basic information
                </Text>
                <View style={styles.subtitleLine} />
              </View>
            </Animated.View>

            {/* General Error with glass morphism */}
            {generalError && (
              <Animated.View 
                entering={FadeInDown.springify()}
                style={styles.generalErrorContainer}
              >
                <BlurView
                  intensity={90}
                  tint="light"
                  style={styles.errorBlurContainer}
                >
                  <Icon name="alert-circle" type="Feather" size={18} color="#FF6B6B" />
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                  <TouchableOpacity
                    onPress={() => setGeneralError('')}
                    style={styles.errorCloseButton}
                  >
                    <Icon name="x" type="Feather" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </BlurView>
              </Animated.View>
            )}

            {/* Form with modern inputs */}
            <Animated.View 
              style={[styles.formContainer, formAnimatedStyle]}
            >
              {/* Name fields row */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  {renderModernInput(
                    'First Name',
                    firstName,
                    (text) => {
                      setFirstName(text);
                      if (firstNameError) setFirstNameError('');
                      if (generalError) setGeneralError('');
                    },
                    {
                      icon: 'user',
                      autoCapitalize: 'words',
                      error: firstNameError,
                      maxLength: 50,
                      fieldName: 'firstName',
                    }
                  )}
                </View>
                <View style={styles.nameField}>
                  {renderModernInput(
                    'Last Name',
                    lastName,
                    (text) => {
                      setLastName(text);
                      if (lastNameError) setLastNameError('');
                      if (generalError) setGeneralError('');
                    },
                    {
                      autoCapitalize: 'words',
                      error: lastNameError,
                      maxLength: 50,
                      fieldName: 'lastName',
                    }
                  )}
                </View>
              </View>

              {/* Email field */}
              <View style={styles.emailField}>
                {renderModernInput(
                  'Email Address',
                  email,
                  (text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                    if (generalError) setGeneralError('');
                  },
                  {
                    icon: 'mail',
                    keyboardType: 'email-address',
                    autoCapitalize: 'none',
                    autoCorrect: false,
                    error: emailError,
                    helpText: "We'll send a verification code to this email",
                    fieldName: 'email',
                  }
                )}
              </View>

              {/* Phone field with enhanced styling */}
              <View style={styles.phoneFieldWrapper}>
                <Animated.View
                  entering={FadeInDown.delay(200).springify()}
                  style={styles.labelContainer}
                >
                  <Text style={styles.modernLabel}>
                    Phone Number
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                </Animated.View>
                
                <ModernPhoneInput
                  label=""
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (phoneError) setPhoneError('');
                    if (generalError) setGeneralError('');
                  }}
                  onFocus={() => {
                    if (phoneError) setPhoneError('');
                    if (generalError) setGeneralError('');
                  }}
                  error={phoneError}
                  isRequired={false}
                  lightTheme={true}
                  containerStyle={styles.phoneInputContainer}
                />
              </View>
            </Animated.View>

            {/* Next Button with enhanced design */}
            <Animated.View 
              entering={FadeInDown.delay(500).springify()}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                onPress={handleNext}
                disabled={!isFormValid}
                activeOpacity={0.8}
                style={[
                  styles.modernButton,
                  !isFormValid && styles.modernButtonDisabled,
                ]}
              >
                <BlurView
                  intensity={90}
                  tint="light"
                  style={styles.buttonBlurContainer}
                >
                  <View style={styles.buttonContent}>
                    <Text style={[
                      styles.buttonText,
                      !isFormValid && styles.buttonTextDisabled,
                    ]}>
                      Send Verification Code
                    </Text>
                    <View style={styles.buttonIconContainer}>
                      <Icon 
                        name="arrow-right" 
                        type="Feather" 
                        size={20} 
                        color={!isFormValid ? 'rgba(31,41,55,0.4)' : '#1F2937'}
                      />
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
              
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressDot} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SignupBackground>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  
  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleSpecial: {
    fontSize: 42,
    fontWeight: '400',
    color: Colors.white,
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subtitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginHorizontal: 16,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },

  // Error Container
  generalErrorContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorBlurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,107,107,0.15)',
  },
  generalErrorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 10,
    fontWeight: '500',
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  errorCloseButton: {
    padding: 4,
  },

  // Form Container
  formContainer: {
    marginBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  nameField: {
    flex: 1,
  },
  emailField: {
    marginBottom: 8,
  },
  phoneFieldWrapper: {
    marginTop: 8,
  },
  phoneInputContainer: {
    marginTop: 8,
  },

  // Modern Input Styles
  modernInputWrapper: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modernLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
    letterSpacing: -0.3,
  },
  requiredBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernInputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modernInputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  modernInputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  modernIconContainer: {
    marginRight: 12,
  },
  modernTextInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  helpTextContainer: {
    marginTop: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernErrorText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginLeft: 6,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  modernHelpText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },

  // Button Styles
  buttonContainer: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  modernButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modernButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  buttonBlurContainer: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
    letterSpacing: -0.3,
  },
  buttonTextDisabled: {
    color: 'rgba(31,41,55,0.4)',
  },
  buttonIconContainer: {
    marginLeft: 12,
    backgroundColor: 'rgba(31,41,55,0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.white,
  },
});

export default ModernBasicInfoStepScreen;