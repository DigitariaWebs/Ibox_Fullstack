import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { useAuth } from '../../contexts/AuthContext';
import { confirmationSchema } from '../../validation/signUpSchemas';

interface ConfirmationScreenProps {
  navigation: any;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ navigation }) => {
  const { 
    signUpData, 
    resetSignUpData, 
    registerUser, 
    isRegistering, 
    registrationError,
    connectionStatus,
    validateCurrentStep,
    getCompletionPercentage 
  } = useSignUp();
  const { completeOnboarding } = useAuth();
  
  const [confirmAll, setConfirmAll] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    // Clear any previous validation errors
    setValidationErrors([]);

    if (!confirmAll) {
      Alert.alert('Confirmation Required', 'Please confirm that all information is correct.');
      return;
    }

    // Check connection status
    if (connectionStatus === 'disconnected') {
      Alert.alert(
        'Connection Error', 
        'Unable to connect to server. Please check your internet connection and try again.'
      );
      return;
    }

    // Pre-validate all data
    const validation = validateCurrentStep(7); // Final validation
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      Alert.alert(
        'Incomplete Information',
        `Please complete the following:\n\n${validation.errors.join('\n')}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    try {
      // Call real API registration
      const result = await registerUser();

      if (result.success) {
        // Complete onboarding
        await completeOnboarding();

        // Show success message
        Alert.alert(
          'Registration Successful!',
          `Welcome to iBox, ${signUpData.firstName}! Your ${signUpData.accountType} account has been created successfully.`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                resetSignUpData();
                // Navigate to appropriate home screen based on user type
                const userType = signUpData.accountType;
                if (userType === 'customer') {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen' }],
                  });
                } else if (userType === 'transporter') {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'TransporterHomeScreen' }],
                  });
                }
                console.log('✅ Registration completed, navigating to', userType, 'home screen');
              }
            }
          ]
        );
      } else {
        // Registration failed
        Alert.alert(
          'Registration Failed',
          result.message || 'Something went wrong. Please try again.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration submission error:', error);
      Alert.alert(
        'Registration Error',
        error.message || 'Network error. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: handleSubmit },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getAccountTypeDetails = () => {
    return signUpData.accountType === 'customer' 
      ? {
          icon: 'user',
          title: 'Customer Account',
          subtitle: 'Ready to find reliable transporters for your deliveries'
        }
      : {
          icon: 'truck',
          title: 'Transporter Account',
          subtitle: 'Ready to start earning by helping with deliveries'
        };
  };

  const accountDetails = getAccountTypeDetails();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 7 of 7</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Icon name="check" type="Feather" size={32} color={Colors.white} />
            </View>
            <Text style={styles.successTitle}>Almost there!</Text>
            <Text style={styles.successSubtitle}>
              Review your information and confirm to complete your registration
            </Text>
            
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getCompletionPercentage()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {getCompletionPercentage()}% Complete
              </Text>
            </View>

            {/* Connection Status */}
            {connectionStatus !== 'connected' && (
              <View style={styles.connectionWarning}>
                <Icon 
                  name={connectionStatus === 'checking' ? 'wifi' : 'wifi-off'} 
                  type="Feather" 
                  size={16} 
                  color={connectionStatus === 'checking' ? Colors.warning : Colors.error} 
                />
                <Text style={[
                  styles.connectionText, 
                  { color: connectionStatus === 'checking' ? Colors.warning : Colors.error }
                ]}>
                  {connectionStatus === 'checking' ? 'Checking connection...' : 'No internet connection'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Account Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Icon name={accountDetails.icon} type="Feather" size={24} color={Colors.primary} />
              <View style={styles.summaryTitleContainer}>
                <Text style={styles.summaryTitle}>{accountDetails.title}</Text>
                <Text style={styles.summarySubtitle}>{accountDetails.subtitle}</Text>
              </View>
            </View>
          </View>
          
          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="user" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{signUpData.firstName} {signUpData.lastName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{signUpData.email}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{signUpData.phone}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Language</Text>
                <Text style={styles.infoValue}>
                  {signUpData.language === 'en' ? 'English' : 'Français'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Address Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="map-pin" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Address</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Primary Address</Text>
                <Text style={styles.infoValue}>{signUpData.defaultAddress}</Text>
              </View>
              {signUpData.secondaryAddress && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Secondary Address</Text>
                  <Text style={styles.infoValue}>{signUpData.secondaryAddress}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Account-specific Information */}
          {signUpData.accountType === 'customer' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="settings" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Account Preferences</Text>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Account Type</Text>
                  <Text style={styles.infoValue}>
                    {signUpData.isBusiness ? 'Business Account' : 'Personal Account'}
                  </Text>
                </View>
                {signUpData.isBusiness && (
                  <>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Company Name</Text>
                      <Text style={styles.infoValue}>{signUpData.companyName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Tax ID</Text>
                      <Text style={styles.infoValue}>{signUpData.taxId}</Text>
                    </View>
                  </>
                )}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Payment Method</Text>
                  <Text style={styles.infoValue}>
                    {signUpData.paymentData ? 
                      `**** **** **** ${signUpData.paymentData.cardNumber.slice(-4)}` : 
                      'To be added later'
                    }
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Vehicle Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="truck" type="Feather" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Vehicle Type</Text>
                    <Text style={styles.infoValue}>{signUpData.vehicleType?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>License Plate</Text>
                    <Text style={styles.infoValue}>{signUpData.plate}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Payload Capacity</Text>
                    <Text style={styles.infoValue}>{signUpData.payloadKg} kg</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Vehicle Photos</Text>
                    <Text style={styles.infoValue}>
                      {signUpData.vehiclePhotos?.length || 0} uploaded
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Compliance Status */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="shield" type="Feather" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Verification Status</Text>
                </View>
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                    <Text style={styles.statusText}>Driver's License Uploaded</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                    <Text style={styles.statusText}>Insurance Document Uploaded</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                    <Text style={styles.statusText}>Background Check Consent</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Icon name="check-circle" type="Feather" size={16} color={Colors.success} />
                    <Text style={styles.statusText}>Banking Information Added</Text>
                  </View>
                </View>
              </View>
            </>
          )}
          
          {/* Confirmation Checkbox */}
          <View style={styles.confirmationSection}>
            <TouchableOpacity 
              style={styles.confirmationContainer}
              onPress={() => setConfirmAll(!confirmAll)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.checkbox,
                confirmAll && styles.checkboxChecked
              ]}>
                {confirmAll && (
                  <Icon name="check" type="Feather" size={16} color={Colors.white} />
                )}
              </View>
              <View style={styles.confirmationText}>
                <Text style={styles.confirmationLabel}>
                  I confirm that all information provided is accurate and complete
                </Text>
                <Text style={styles.confirmationDescription}>
                  By proceeding, I agree to the Terms of Service and Privacy Policy
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Next Steps */}
          <View style={styles.nextStepsCard}>
            <View style={styles.nextStepsHeader}>
              <Icon name="compass" type="Feather" size={18} color={Colors.info} />
              <Text style={styles.nextStepsTitle}>What happens next?</Text>
            </View>
            <View style={styles.nextStepsList}>
              {signUpData.accountType === 'customer' ? (
                <>
                  <Text style={styles.nextStepText}>
                    • Browse available transporters in your area
                  </Text>
                  <Text style={styles.nextStepText}>
                    • Post delivery requests and get quotes
                  </Text>
                  <Text style={styles.nextStepText}>
                    • Track your packages in real-time
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextStepText}>
                    • We'll review your documents (24-48 hours)
                  </Text>
                  <Text style={styles.nextStepText}>
                    • Once approved, start browsing delivery opportunities
                  </Text>
                  <Text style={styles.nextStepText}>
                    • Begin earning with your first delivery
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isRegistering ? "Creating account..." : "Complete registration"}
          onPress={handleSubmit}
          variant="primary"
          disabled={!confirmAll || isRegistering || connectionStatus === 'disconnected'}
          style={styles.submitButton}
          loading={isRegistering}
          icon={!isRegistering && <Icon name="check" type="Feather" size={20} color={Colors.white} />}
        />
        
        {/* Error display */}
        {registrationError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" type="Feather" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{registrationError}</Text>
          </View>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <View style={styles.validationContainer}>
            <Icon name="info" type="Feather" size={16} color={Colors.warning} />
            <Text style={styles.validationText}>
              Please complete: {validationErrors.join(', ')}
            </Text>
          </View>
        )}
      </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitleContainer: {
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  summarySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
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
  infoGrid: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusGrid: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  confirmationSection: {
    marginVertical: 24,
  },
  confirmationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  confirmationText: {
    flex: 1,
  },
  confirmationLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  confirmationDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  nextStepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextStepsTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextStepsList: {
    gap: 8,
  },
  nextStepText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  submitButton: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
    flex: 1,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  validationText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '500',
    flex: 1,
  },
});

export default ConfirmationScreen;