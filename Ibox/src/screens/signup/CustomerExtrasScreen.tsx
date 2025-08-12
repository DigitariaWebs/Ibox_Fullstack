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
  Switch,
} from 'react-native';
import { Button, Text, Icon, Input } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { customerExtrasSchema } from '../../validation/signUpSchemas';
import { PaymentInput } from '../../components/PaymentInput';

interface CustomerExtrasScreenProps {
  navigation: any;
}

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface FormData {
  paymentData: PaymentData | null;
  isBusiness: boolean;
  companyName: string;
  taxId: string;
}

const CustomerExtrasScreen: React.FC<CustomerExtrasScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    paymentData: null,
    isBusiness: signUpData.isBusiness || false,
    companyName: signUpData.companyName || '',
    taxId: signUpData.taxId || '',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);
  const [skipPayment, setSkipPayment] = useState(false);
  const [isPaymentValid, setIsPaymentValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData, skipPayment, isPaymentValid]);

  const validateForm = async () => {
    try {
      const validationData = {
        paymentToken: formData.paymentData ? 'valid' : '',
        isBusiness: formData.isBusiness,
        companyName: formData.companyName,
        taxId: formData.taxId,
      };
      await customerExtrasSchema.validate(validationData, { abortEarly: false });
      setErrors({});
      
      // Check if form is valid (payment valid or skipped, and business fields if business account)
      const paymentOk = skipPayment || isPaymentValid;
      const businessOk = !formData.isBusiness || (formData.companyName && formData.taxId);
      setIsValid(paymentOk && businessOk);
    } catch (validationErrors: any) {
      const errorObj: Partial<FormData> = {};
      validationErrors.inner?.forEach((error: any) => {
        if (error.path === 'paymentToken') return; // Skip payment validation error
        errorObj[error.path as keyof FormData] = error.message;
      });
      setErrors(errorObj);
      setIsValid(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean | PaymentData) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDataChange = (paymentData: PaymentData, valid: boolean) => {
    setIsPaymentValid(valid);
    updateField('paymentData', paymentData);
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        paymentData: skipPayment ? null : formData.paymentData,
        isBusiness: formData.isBusiness,
        companyName: formData.companyName,
        taxId: formData.taxId,
      });
      setCurrentStep(8); // Jump to confirmation for customers
      navigation.navigate('Confirmation');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSkipPayment = () => {
    setSkipPayment(true);
    updateField('paymentData', null);
    setIsPaymentValid(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 4 of 7</Text>
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
                Set up your preferences
              </Text>
              <Text style={styles.subtitle}>
                Add payment method and business details to complete your customer profile
              </Text>
            </View>
            
            {/* Payment Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="credit-card" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                {!skipPayment ? (
                  <>
                    <PaymentInput
                      onDataChange={handlePaymentDataChange}
                      style={styles.paymentInput}
                    />
                    
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkipPayment}>
                      <Text style={styles.skipButtonText}>Skip for now</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.skippedCard}>
                    <Icon name="info" type="Feather" size={20} color={Colors.info} />
                    <Text style={styles.skippedText}>
                      Payment method skipped. You can add this later in your profile settings.
                    </Text>
                    <TouchableOpacity onPress={() => setSkipPayment(false)}>
                      <Text style={styles.undoLink}>Add payment method</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            {/* Business Account Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="briefcase" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Account Type</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchContent}>
                    <Text style={styles.switchLabel}>Business Account</Text>
                    <Text style={styles.switchDescription}>
                      Enable if you're shipping for a business or need invoicing features
                    </Text>
                  </View>
                  <Switch
                    value={formData.isBusiness}
                    onValueChange={(value) => updateField('isBusiness', value)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={formData.isBusiness ? Colors.white : Colors.white}
                    ios_backgroundColor={Colors.border}
                  />
                </View>
                
                {/* Business Fields */}
                {formData.isBusiness && (
                  <View style={styles.businessFields}>
                    <Input
                      placeholder="Company name"
                      value={formData.companyName}
                      onChangeText={(value) => updateField('companyName', value)}
                      error={errors.companyName}
                      leftIcon={<Icon name="building" type="Feather" size={20} color={Colors.textSecondary} />}
                      style={styles.inputField}
                    />
                    
                    <Input
                      placeholder="Tax ID / VAT number"
                      value={formData.taxId}
                      onChangeText={(value) => updateField('taxId', value)}
                      error={errors.taxId}
                      leftIcon={<Icon name="hash" type="Feather" size={20} color={Colors.textSecondary} />}
                      style={styles.inputField}
                    />
                  </View>
                )}
              </View>
            </View>
            
            {/* Benefits Card */}
            <View style={styles.benefitsCard}>
              <View style={styles.benefitsHeader}>
                <Icon name="star" type="Feather" size={18} color={Colors.primary} />
                <Text style={styles.benefitsTitle}>Customer Benefits</Text>
              </View>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                  <Text style={styles.benefitText}>Find reliable transporters in your area</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                  <Text style={styles.benefitText}>Real-time package tracking</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                  <Text style={styles.benefitText}>Secure payment processing</Text>
                </View>
                {formData.isBusiness && (
                  <View style={styles.benefitItem}>
                    <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                    <Text style={styles.benefitText}>Business invoicing and reporting</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Complete setup"
            onPress={handleNext}
            variant="primary"
            disabled={!isValid}
            style={styles.nextButton}
            icon={<Icon name="check" type="Feather" size={20} color={Colors.white} />}
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
    flex: 1,
  },
  optionalBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionContent: {
    gap: 16,
  },
  inputField: {
    marginBottom: 0,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  skippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  skippedText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  undoLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  businessFields: {
    gap: 16,
    marginTop: 16,
  },
  benefitsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  nextButton: {
    width: '100%',
  },
  paymentInput: {
    marginBottom: 16,
  },
});

export default CustomerExtrasScreen;