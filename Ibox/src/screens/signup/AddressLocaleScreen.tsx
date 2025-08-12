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
import { addressSchema } from '../../validation/signUpSchemas';

interface AddressLocaleScreenProps {
  navigation: any;
}

interface FormData {
  defaultAddress: string;
  secondaryAddress: string;
  language: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const AddressLocaleScreen: React.FC<AddressLocaleScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    defaultAddress: signUpData.defaultAddress || '',
    secondaryAddress: signUpData.secondaryAddress || '',
    language: signUpData.language || 'en',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = async () => {
    try {
      await addressSchema.validate(formData, { abortEarly: false });
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

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        defaultAddress: formData.defaultAddress,
        secondaryAddress: formData.secondaryAddress,
        language: formData.language,
      });
      setCurrentStep(5);
      
      // Navigate based on account type
      if (signUpData.accountType === 'customer') {
        navigation.navigate('PaymentMethod');
      } else {
        navigation.navigate('TransporterVehicle');
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getNextDestination = () => {
    return signUpData.accountType === 'customer' 
      ? 'payment method' 
      : 'vehicle information';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 3 of 7</Text>
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
                Where are you located?
              </Text>
              <Text style={styles.subtitle}>
                Help us personalize your experience with location and language preferences
              </Text>
            </View>
            
            {/* Address Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="map-pin" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Addresses</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <Input
                  placeholder="Enter your primary address"
                  value={formData.defaultAddress}
                  onChangeText={(value) => updateField('defaultAddress', value)}
                  error={errors.defaultAddress}
                  leftIcon={<Icon name="home" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                  multiline
                  numberOfLines={2}
                />
                
                <Input
                  placeholder="Secondary address (optional)"
                  value={formData.secondaryAddress}
                  onChangeText={(value) => updateField('secondaryAddress', value)}
                  error={errors.secondaryAddress}
                  leftIcon={<Icon name="map-pin" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                  multiline
                  numberOfLines={2}
                />
                
                <View style={styles.addressHint}>
                  <Icon name="info" type="Feather" size={16} color={Colors.textTertiary} />
                  <Text style={styles.hintText}>
                    We use this to show you relevant {signUpData.accountType === 'customer' ? 'transporters' : 'delivery opportunities'} in your area
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Language Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="globe" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Language Preference</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.languageGrid}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageCard,
                        formData.language === lang.code && styles.languageCardSelected
                      ]}
                      onPress={() => updateField('language', lang.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={[
                        styles.languageLabel,
                        formData.language === lang.code && styles.languageLabelSelected
                      ]}>
                        {lang.label}
                      </Text>
                      {formData.language === lang.code && (
                        <View style={styles.languageCheck}>
                          <Icon name="check" type="Feather" size={16} color={Colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            {/* Preview Card */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Icon name="eye" type="Feather" size={18} color={Colors.primary} />
                <Text style={styles.previewTitle}>Your Profile Preview</Text>
              </View>
              <View style={styles.previewContent}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Account Type:</Text>
                  <Text style={styles.previewValue}>
                    {signUpData.accountType === 'customer' ? 'Customer' : 'Transporter'}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Name:</Text>
                  <Text style={styles.previewValue}>
                    {signUpData.firstName} {signUpData.lastName}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Location:</Text>
                  <Text style={styles.previewValue}>
                    {formData.defaultAddress || 'Not specified'}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Language:</Text>
                  <Text style={styles.previewValue}>
                    {LANGUAGES.find(l => l.code === formData.language)?.label || 'English'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={`Continue to ${getNextDestination()}`}
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
    paddingBottom: 20,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionContent: {
    gap: 16,
  },
  inputField: {
    marginBottom: 0,
  },
  addressHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    position: 'relative',
  },
  languageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: 8,
  },
  languageLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  languageLabelSelected: {
    color: Colors.white,
  },
  languageCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewContent: {
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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

export default AddressLocaleScreen;