import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import ModernInput from '../../components/ModernInput';
import ModernPhoneInput from '../../components/ModernPhoneInput';
import IOSButton from '../../components/iOSButton';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError, isApiError } from '../../utils/ApiError';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ModernBasicInfoScreenProps {
  navigation: any;
  route: any;
}

const ModernBasicInfoScreen: React.FC<ModernBasicInfoScreenProps> = ({ navigation, route }) => {
  const { register } = useAuth();
  const { accountType } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

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
    setPasswordError('');
    setConfirmPasswordError('');
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

    // Password validation
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.trim().length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        userType: accountType,
      });

      // Navigate to success screen
      navigation.navigate('ModernSignupComplete', {
        accountType,
        firstName: firstName.trim(),
      });
    } catch (error) {
      console.error('❌ Signup error:', error);

      // Handle ApiError with structured information
      if (isApiError(error)) {
        console.log('📋 Structured error details:', error.toJSON());
        
        // Check if it's a validation error with specific field errors
        if (error.isValidationError() && error.errors && Array.isArray(error.errors)) {
          // Process validation errors from the API
          error.errors.forEach((fieldError: any) => {
            if (fieldError.field === 'phone') {
              setPhoneError(fieldError.message || 'Invalid phone number');
            } else if (fieldError.field === 'email') {
              setEmailError(fieldError.message || 'Invalid email');
            } else if (fieldError.field === 'password') {
              setPasswordError(fieldError.message || 'Invalid password');
            } else if (fieldError.field === 'firstName') {
              setFirstNameError(fieldError.message || 'Invalid first name');
            } else if (fieldError.field === 'lastName') {
              setLastNameError(fieldError.message || 'Invalid last name');
            }
          });
          
          setGeneralError('Please check your information and try again.');
        } else {
          // Set field-specific errors based on error code
          const phoneFieldError = error.getFieldError('phone');
          const emailFieldError = error.getFieldError('email');
          
          if (phoneFieldError) {
            setPhoneError(phoneFieldError);
          }
          
          if (emailFieldError) {
            setEmailError(emailFieldError);
          }
          
          // Set general error message
          setGeneralError(error.getUserFriendlyMessage());
        }
      } else if (error instanceof Error) {
        // Fallback for non-ApiError instances
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('phone number') || errorMessage.includes('phone exists')) {
          setPhoneError('A user already exists with this phone number');
          setGeneralError('This phone number is already registered. Please use a different number or sign in.');
        } else if (errorMessage.includes('email already exists') || errorMessage.includes('email exists')) {
          setEmailError('A user already exists with this email');
          setGeneralError('This email is already registered. Please use a different email or sign in.');
        } else if (errorMessage.includes('network')) {
          setGeneralError('Network error. Please check your connection and try again.');
        } else {
          setGeneralError(error.message || 'Signup failed. Please try again.');
        }
      } else {
        setGeneralError('Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() &&
                     phone.trim() && password.trim() && confirmPassword.trim() &&
                     !firstNameError && !lastNameError && !emailError &&
                     !phoneError && !passwordError && !confirmPasswordError;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0AA5A8', '#4DC5C8', '#7B68EE', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="chevron-left" type="Feather" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 3</Text>
        </View>
      </View>

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
                Create your {accountType} account
              </Text>
            </View>

            {/* General Error */}
            {generalError && (
              <Animated.View 
                entering={FadeIn}
                exiting={FadeOut}
                style={styles.generalErrorContainer}
              >
                <View style={styles.errorHeader}>
                  <Icon name="alert-circle" type="Feather" size={18} color="#FFFFFF" />
                  <Text style={styles.errorTitle}>Error</Text>
                </View>
                <Text style={styles.generalErrorText}>{generalError}</Text>
                <TouchableOpacity 
                  style={styles.errorCloseButton}
                  onPress={() => setGeneralError('')}
                >
                  <Icon name="x" type="Feather" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <ModernInput
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
                    variant="outlined"
                    isRequired={true}
                    maxLength={50}
                    lightTheme={true}
                    containerStyle={styles.inputContainer}
                  />
                </View>
                <View style={styles.nameField}>
                  <ModernInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      if (lastNameError) setLastNameError('');
                      if (generalError) setGeneralError('');
                    }}
                    autoCapitalize="words"
                    error={lastNameError}
                    variant="outlined"
                    isRequired={true}
                    maxLength={50}
                    lightTheme={true}
                    containerStyle={styles.inputContainer}
                  />
                </View>
              </View>

              <ModernInput
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
                variant="outlined"
                isRequired={true}
                helpText="We'll use this to send you order updates"
                lightTheme={true}
                containerStyle={styles.inputContainer}
              />

              <ModernPhoneInput
                label="Phone Number"
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
                isRequired={true}
                helpText="We'll use this for order updates and verification"
                lightTheme={true}
                containerStyle={styles.inputContainer}
              />

              <ModernInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                leftIcon="lock"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={passwordError}
                variant="outlined"
                isRequired={true}
                helpText="Must contain uppercase, lowercase, and a number"
                maxLength={128}
                showCharacterCount={true}
                lightTheme={true}
                containerStyle={styles.inputContainer}
              />

              <ModernInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                leftIcon="lock"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={confirmPasswordError}
                variant="outlined"
                isRequired={true}
                helpText="Re-enter your password to confirm"
                lightTheme={true}
                containerStyle={styles.inputContainer}
              />
            </View>

            {/* Sign Up Button */}
            <View style={styles.buttonContainer}>
              <IOSButton
                title={isLoading ? "Creating Account..." : "Create Account"}
                onPress={handleSignUp}
                isVisible={true}
                loading={isLoading}
                disabled={!isFormValid || isLoading}
                style={[
                  styles.signUpButton,
                  (!isFormValid || isLoading) && styles.signUpButtonDisabled
                ]}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
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
  generalErrorContainer: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  generalErrorText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  errorCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 0,
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingBottom: 32,
  },
  signUpButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
  },
  signUpButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ModernBasicInfoScreen;