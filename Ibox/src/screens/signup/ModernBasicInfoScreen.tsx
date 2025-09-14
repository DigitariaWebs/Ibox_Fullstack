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
import IOSButton from '../../components/iOSButton';
import { useAuth } from '../../contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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
    } else if (phone.trim().length < 10) {
      setPhoneError('Please enter a valid phone number');
      isValid = false;
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

      if (error instanceof Error) {
        if (error.message.includes('email already exists') || error.message.includes('409')) {
          setGeneralError('An account with this email already exists');
        } else if (error.message.includes('Network')) {
          setGeneralError('Network error. Please check your connection');
        } else {
          setGeneralError('Signup failed. Please try again');
        }
      } else {
        setGeneralError('Signup failed. Please try again');
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
              <View style={styles.generalErrorContainer}>
                <Icon name="alert-circle" type="Feather" size={16} color={Colors.error} />
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
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

              <ModernInput
                label="Phone Number"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError('');
                  if (generalError) setGeneralError('');
                }}
                leftIcon="phone"
                keyboardType="phone-pad"
                error={phoneError}
                variant="outlined"
                isRequired={true}
                helpText="Include country code (e.g., +1 234-567-8900)"
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
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