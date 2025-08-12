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
import { customerExtrasSchema } from '../../validation/signUpSchemas';

interface BusinessDetailsScreenProps {
  navigation: any;
}

interface FormData {
  companyName: string;
  taxId: string;
  businessType: string;
  industry: string;
  registrationNumber: string;
  incorporationDate: string;
  employeeCount: string;
  annualRevenue: string;
  businessWebsite: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  billingAddress: string;
  businessDescription: string;
}

const BusinessDetailsScreen: React.FC<BusinessDetailsScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    companyName: signUpData.companyName || '',
    taxId: signUpData.taxId || '',
    businessType: signUpData.businessType || '',
    industry: signUpData.industry || '',
    registrationNumber: signUpData.registrationNumber || '',
    incorporationDate: signUpData.incorporationDate || '',
    employeeCount: signUpData.employeeCount || '',
    annualRevenue: signUpData.annualRevenue || '',
    businessWebsite: signUpData.businessWebsite || '',
    businessPhone: signUpData.businessPhone || '',
    businessEmail: signUpData.businessEmail || '',
    businessAddress: signUpData.businessAddress || '',
    billingAddress: signUpData.billingAddress || '',
    businessDescription: signUpData.businessDescription || '',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = async () => {
    try {
      const validationData = {
        paymentToken: 'valid', // Skip payment validation
        isBusiness: true, // This screen is only for business accounts
        ...formData,
      };
      await customerExtrasSchema.validate(validationData, { abortEarly: false });
      setErrors({});
      setIsValid(true);
    } catch (validationErrors: any) {
      const errorObj: Partial<FormData> = {};
      validationErrors.inner?.forEach((error: any) => {
        if (error.path === 'paymentToken' || error.path === 'isBusiness') return;
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
        isBusiness: true,
        ...formData,
      });
      setCurrentStep(8); // Jump to confirmation for customers
      navigation.navigate('Confirmation');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'Corporation',
    'S-Corporation',
    'Non-Profit',
    'Other'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Construction',
    'Transportation',
    'Education',
    'Food & Beverage',
    'Professional Services',
    'Real Estate',
    'Media & Entertainment',
    'Other'
  ];

  const employeeCounts = [
    '1-5 employees',
    '6-25 employees',
    '26-100 employees',
    '101-500 employees',
    '500+ employees'
  ];

  const revenueRanges = [
    'Under $100K',
    '$100K - $500K',
    '$500K - $1M',
    '$1M - $5M',
    '$5M - $10M',
    'Over $10M'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 6 of 8</Text>
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
                Business Details
              </Text>
              <Text style={styles.subtitle}>
                Tell us more about your business to complete your professional profile
              </Text>
            </View>
            
            {/* Basic Business Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="building" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>
              
              <View style={styles.sectionContent}>
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

                <View style={styles.inputRow}>
                  <Input
                    placeholder="Business type"
                    value={formData.businessType}
                    onChangeText={(value) => updateField('businessType', value)}
                    error={errors.businessType}
                    leftIcon={<Icon name="briefcase" type="Feather" size={20} color={Colors.textSecondary} />}
                    style={[styles.inputField, styles.halfInput]}
                  />

                  <Input
                    placeholder="Industry"
                    value={formData.industry}
                    onChangeText={(value) => updateField('industry', value)}
                    error={errors.industry}
                    leftIcon={<Icon name="trending-up" type="Feather" size={20} color={Colors.textSecondary} />}
                    style={[styles.inputField, styles.halfInput]}
                  />
                </View>

                <Input
                  placeholder="Business registration number"
                  value={formData.registrationNumber}
                  onChangeText={(value) => updateField('registrationNumber', value)}
                  error={errors.registrationNumber}
                  leftIcon={<Icon name="file-text" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                />

                <View style={styles.inputRow}>
                  <Input
                    placeholder="Incorporation date (YYYY-MM-DD)"
                    value={formData.incorporationDate}
                    onChangeText={(value) => updateField('incorporationDate', value)}
                    error={errors.incorporationDate}
                    leftIcon={<Icon name="calendar" type="Feather" size={20} color={Colors.textSecondary} />}
                    style={[styles.inputField, styles.halfInput]}
                  />

                  <Input
                    placeholder="Employee count"
                    value={formData.employeeCount}
                    onChangeText={(value) => updateField('employeeCount', value)}
                    error={errors.employeeCount}
                    leftIcon={<Icon name="users" type="Feather" size={20} color={Colors.textSecondary} />}
                    style={[styles.inputField, styles.halfInput]}
                  />
                </View>

                <Input
                  placeholder="Annual revenue range"
                  value={formData.annualRevenue}
                  onChangeText={(value) => updateField('annualRevenue', value)}
                  error={errors.annualRevenue}
                  leftIcon={<Icon name="dollar-sign" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                />
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="phone" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Business Contact</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <Input
                  placeholder="Business website"
                  value={formData.businessWebsite}
                  onChangeText={(value) => updateField('businessWebsite', value)}
                  error={errors.businessWebsite}
                  leftIcon={<Icon name="globe" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                />

                <View style={styles.inputRow}>
                  <Input
                    placeholder="Business phone"
                    value={formData.businessPhone}
                    onChangeText={(value) => updateField('businessPhone', value)}
                    error={errors.businessPhone}
                    leftIcon={<Icon name="phone" type="Feather" size={20} color={Colors.textSecondary} />}
                    style={[styles.inputField, styles.halfInput]}
                    keyboardType="phone-pad"
                  />

                  <Input
                    placeholder="Business email"
                    value={formData.businessEmail}
                    onChangeText={(value) => updateField('businessEmail', value)}
                    error={errors.businessEmail}
                    leftIcon={<Icon name="mail" type="Feather" size={20} color={Colors.textSecondary} />}
                    style={[styles.inputField, styles.halfInput]}
                    keyboardType="email-address"
                  />
                </View>
              </View>
            </View>

            {/* Address Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="map-pin" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Business Address</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <Input
                  placeholder="Business headquarters address"
                  value={formData.businessAddress}
                  onChangeText={(value) => updateField('businessAddress', value)}
                  error={errors.businessAddress}
                  leftIcon={<Icon name="map-pin" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                  multiline
                  numberOfLines={2}
                />

                <Input
                  placeholder="Billing address (if different)"
                  value={formData.billingAddress}
                  onChangeText={(value) => updateField('billingAddress', value)}
                  error={errors.billingAddress}
                  leftIcon={<Icon name="credit-card" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Business Description */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="edit-3" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>About Your Business</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <Input
                  placeholder="Brief description of your business and services"
                  value={formData.businessDescription}
                  onChangeText={(value) => updateField('businessDescription', value)}
                  error={errors.businessDescription}
                  leftIcon={<Icon name="edit-3" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Business Benefits */}
            <View style={styles.benefitsCard}>
              <View style={styles.benefitsHeader}>
                <Icon name="star" type="Feather" size={18} color={Colors.primary} />
                <Text style={styles.benefitsTitle}>Business Account Benefits</Text>
              </View>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Icon name="check" type="Feather" size={14} color={Colors.success} />
                  <Text style={styles.benefitText}>Professional business profile</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check" type="Feather" size={14} color={Colors.success} />
                  <Text style={styles.benefitText}>Business invoicing and receipts</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check" type="Feather" size={14} color={Colors.success} />
                  <Text style={styles.benefitText}>Expense tracking and reporting</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check" type="Feather" size={14} color={Colors.success} />
                  <Text style={styles.benefitText}>Priority customer support</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check" type="Feather" size={14} color={Colors.success} />
                  <Text style={styles.benefitText}>Volume discounts and special rates</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Complete business setup"
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
  },
  sectionContent: {
    gap: 16,
  },
  inputField: {
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
    flex: 1,
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

export default BusinessDetailsScreen;