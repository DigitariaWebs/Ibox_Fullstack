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

interface CustomerAccountTypeScreenProps {
  navigation: any;
}

interface FormData {
  isBusiness: boolean;
}

const CustomerAccountTypeScreen: React.FC<CustomerAccountTypeScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    isBusiness: signUpData.isBusiness || false,
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = async () => {
    // For this screen, we just need to ensure an account type is selected
    setIsValid(true);
    setErrors({});
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        isBusiness: formData.isBusiness,
      });
      
      if (formData.isBusiness) {
        // Navigate to business details screen
        setCurrentStep(6);
        navigation.navigate('BusinessDetails');
      } else {
        // Go directly to confirmation for personal accounts
        setCurrentStep(8);
        navigation.navigate('Confirmation');
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 5 of 7</Text>
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
                Account preferences
              </Text>
              <Text style={styles.subtitle}>
                Tell us about your account type and business details if applicable
              </Text>
            </View>
            
            {/* Account Type Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="briefcase" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Account Type</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.accountTypeGrid}>
                  {/* Personal Account Card */}
                  <TouchableOpacity
                    style={[
                      styles.accountTypeCard,
                      !formData.isBusiness && styles.accountTypeCardSelected
                    ]}
                    onPress={() => updateField('isBusiness', false)}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name="user" 
                      type="Feather" 
                      size={24} 
                      color={!formData.isBusiness ? Colors.white : Colors.primary} 
                    />
                    <Text style={[
                      styles.accountTypeLabel,
                      !formData.isBusiness && styles.accountTypeLabelSelected
                    ]}>
                      Personal Account
                    </Text>
                    <Text style={[
                      styles.accountTypeDescription,
                      !formData.isBusiness && styles.accountTypeDescriptionSelected
                    ]}>
                      For individual shipping needs
                    </Text>
                    {!formData.isBusiness && (
                      <View style={styles.accountTypeCheck}>
                        <Icon name="check" type="Feather" size={16} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Business Account Card */}
                  <TouchableOpacity
                    style={[
                      styles.accountTypeCard,
                      formData.isBusiness && styles.accountTypeCardSelected
                    ]}
                    onPress={() => updateField('isBusiness', true)}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name="briefcase" 
                      type="Feather" 
                      size={24} 
                      color={formData.isBusiness ? Colors.white : Colors.primary} 
                    />
                    <Text style={[
                      styles.accountTypeLabel,
                      formData.isBusiness && styles.accountTypeLabelSelected
                    ]}>
                      Business Account
                    </Text>
                    <Text style={[
                      styles.accountTypeDescription,
                      formData.isBusiness && styles.accountTypeDescriptionSelected
                    ]}>
                      For business shipping and invoicing
                    </Text>
                    {formData.isBusiness && (
                      <View style={styles.accountTypeCheck}>
                        <Icon name="check" type="Feather" size={16} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                
              </View>
            </View>
            
          </View>
        </ScrollView>
        
        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={formData.isBusiness ? "Continue to business details" : "Complete setup"}
            onPress={handleNext}
            variant="primary"
            disabled={!isValid}
            style={styles.nextButton}
            icon={<Icon name={formData.isBusiness ? "arrow-right" : "check"} type="Feather" size={20} color={Colors.white} />}
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
  accountTypeGrid: {
    gap: 12,
  },
  accountTypeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    position: 'relative',
  },
  accountTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  accountTypeLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  accountTypeLabelSelected: {
    color: Colors.white,
  },
  accountTypeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  accountTypeDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  accountTypeCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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

export default CustomerAccountTypeScreen;