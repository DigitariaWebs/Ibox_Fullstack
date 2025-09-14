import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import SignupBackground from '../../components/SignupBackground';
import SimpleInput from '../../components/SimpleInput';
import IOSButton from '../../components/iOSButton';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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

  // Animation values
  const contentOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animation
    contentOpacity.value = withTiming(1, { duration: 300 });
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
      // Remove all non-digit characters for validation
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        setPhoneError('Phone number must be between 10 and 15 digits');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleNext = () => {
    if (!validateForm()) return;

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
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Tell us about </Text>
              <Text style={styles.titleSpecial}>yourself</Text>
              <Text style={styles.subtitle}>
                Let's start with your basic information
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
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <SimpleInput
                    label="First Name"
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      if (firstNameError) setFirstNameError('');
                      if (generalError) setGeneralError('');
                    }}
                    leftIcon="user"
                    autoCapitalize="words"
                    error={firstNameError}
                    isRequired={true}
                    maxLength={50}
                    containerStyle={styles.inputContainer}
                  />
                </View>
                <View style={styles.nameField}>
                  <SimpleInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      if (lastNameError) setLastNameError('');
                      if (generalError) setGeneralError('');
                    }}
                    autoCapitalize="words"
                    error={lastNameError}
                    isRequired={true}
                    maxLength={50}
                    containerStyle={styles.inputContainer}
                  />
                </View>
              </View>

              <SimpleInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                  if (generalError) setGeneralError('');
                }}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
                isRequired={true}
                helpText="We'll send a verification code to this email"
                containerStyle={styles.inputContainer}
              />

              <SimpleInput
                label="Phone Number"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError('');
                  if (generalError) setGeneralError('');
                }}
                leftIcon="phone"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                error={phoneError}
                isRequired={true}
                helpText="Enter your phone number with country code"
                containerStyle={styles.inputContainer}
              />
            </View>

            {/* Next Button */}
            <View style={styles.buttonContainer}>
              <IOSButton
                title="Send Verification Code"
                onPress={handleNext}
                isVisible={true}
                disabled={!isFormValid}
                textColor="#1F2937"
                style={styles.nextButton}
              />
            </View>
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
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  generalErrorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 40,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nameField: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 0,
  },
  buttonContainer: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  nextButton: {
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

export default ModernBasicInfoStepScreen;