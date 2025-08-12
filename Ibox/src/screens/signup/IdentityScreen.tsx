import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Text, Icon, Input } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { identitySchema, getPasswordStrength } from '../../validation/signUpSchemas';
import PhoneNumberInput from '../../components/PhoneNumberInput';

interface IdentityScreenProps {
  navigation: any;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  legalAccepted: boolean;
}

const IdentityScreen: React.FC<IdentityScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: signUpData.firstName || '',
    lastName: signUpData.lastName || '',
    email: signUpData.email || '',
    phone: signUpData.phone || '',
    password: signUpData.password || '',
    confirmPassword: '',
    legalAccepted: signUpData.legalAccepted || false,
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  useEffect(() => {
    validateForm();
  }, [formData]);

  useEffect(() => {
    if (formData.password) {
      const strength = getPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [formData.password]);

  const validateForm = async () => {
    try {
      await identitySchema.validate(formData, { abortEarly: false });
      setErrors({});
      setIsValid(true);
    } catch (validationErrors: any) {
      const errorObj: Partial<FormData> = {};
      validationErrors.inner?.forEach((error: any) => {
        errorObj[error.path as keyof FormData] = error.message;
      });
      setErrors(errorObj);
      setIsValid(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        legalAccepted: formData.legalAccepted,
      });
      setCurrentStep(4); // Skip step 3 (OTP verification)
      navigation.navigate('AddressLocaleScreen');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return Colors.error;
      case 2:
        return Colors.warning;
      case 3:
        return '#F97316'; // orange
      case 4:
      case 5:
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const getPasswordStrengthWidth = () => {
    return `${(passwordStrength.score / 5) * 100}%`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 6</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Tell us about yourself
              </Text>
              <Text style={styles.subtitle}>
                We need some basic information to create your account
              </Text>
            </View>
            
            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Name Fields */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    placeholder="First name"
                    value={formData.firstName}
                    onChangeText={(value) => updateField('firstName', value)}
                    error={errors.firstName}
                    leftIcon={<Icon name="user" type="Feather" size={20} color={Colors.textSecondary} />}
                  />
                </View>
                <View style={styles.nameField}>
                  <Input
                    placeholder="Last name"
                    value={formData.lastName}
                    onChangeText={(value) => updateField('lastName', value)}
                    error={errors.lastName}
                  />
                </View>
              </View>
              
              {/* Email */}
              <Input
                placeholder="Email address"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                leftIcon={<Icon name="mail" type="Feather" size={20} color={Colors.textSecondary} />}
                style={styles.inputField}
              />
              
              {/* Phone */}
              <PhoneNumberInput
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                error={errors.phone}
                style={styles.inputField}
              />
              
              {/* Password */}
              <Input
                placeholder="Password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                error={errors.password}
                leftIcon={<Icon name="lock" type="Feather" size={20} color={Colors.textSecondary} />}
                style={styles.inputField}
              />
              
              {/* Password Strength Meter */}
              {formData.password && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthMeter}>
                    <View 
                      style={[
                        styles.strengthFill,
                        { 
                          width: getPasswordStrengthWidth(),
                          backgroundColor: getPasswordStrengthColor()
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                    {passwordStrength.feedback}
                  </Text>
                </View>
              )}
              
              {/* Confirm Password */}
              <Input
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry
                error={errors.confirmPassword}
                leftIcon={<Icon name="lock" type="Feather" size={20} color={Colors.textSecondary} />}
                style={styles.inputField}
              />
              
              {/* Terms & Privacy */}
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => updateField('legalAccepted', !formData.legalAccepted)}
              >
                <View style={[styles.checkbox, formData.legalAccepted && styles.checkboxChecked]}>
                  {formData.legalAccepted && (
                    <Icon name="check" type="Feather" size={16} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.checkboxText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              
              {errors.legalAccepted && (
                <Text style={styles.errorText}>{errors.legalAccepted}</Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleNext}
            variant="primary"
            disabled={!isValid}
            style={styles.nextButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color={Colors.white} />}
          />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 34,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  inputField: {
    marginBottom: 0,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthMeter: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  nextButton: {
    width: '100%',
  },
});

export default IdentityScreen;