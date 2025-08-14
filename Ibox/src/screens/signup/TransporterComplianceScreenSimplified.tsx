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
  Alert,
} from 'react-native';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import * as DocumentPicker from 'expo-document-picker';

interface TransporterComplianceScreenProps {
  navigation: any;
}

interface FormData {
  insuranceDoc: string;
  bgCheckConsent: boolean;
}

const TransporterComplianceScreen: React.FC<TransporterComplianceScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    insuranceDoc: signUpData.insuranceDoc || '',
    bgCheckConsent: signUpData.bgCheckConsent || false,
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.insuranceDoc) {
      newErrors.insuranceDoc = 'Insurance document is required';
    }
    
    if (!formData.bgCheckConsent) {
      newErrors.bgCheckConsent = 'Background check consent is required';
    }
    
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        insuranceDoc: formData.insuranceDoc,
        bgCheckConsent: formData.bgCheckConsent,
      });
      setCurrentStep(6);
      navigation.navigate('TransporterBanking');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const pickInsuranceDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        updateField('insuranceDoc', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking insurance document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const getInsuranceFileName = () => {
    if (!formData.insuranceDoc) return 'No file selected';
    const uri = formData.insuranceDoc;
    const fileName = uri.split('/').pop() || 'Document';
    return fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 5 of 6</Text>
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
                Compliance Documents
              </Text>
              <Text style={styles.subtitle}>
                Upload your insurance document to verify your eligibility as a transporter
              </Text>
            </View>
            
            {/* Insurance Document Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="shield" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Insurance Document</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <TouchableOpacity style={styles.documentButton} onPress={pickInsuranceDoc}>
                  <Icon 
                    name={formData.insuranceDoc ? "file-text" : "upload"} 
                    type="Feather" 
                    size={24} 
                    color={formData.insuranceDoc ? Colors.success : Colors.primary} 
                  />
                  <View style={styles.documentInfo}>
                    <Text style={[
                      styles.documentText,
                      formData.insuranceDoc && styles.documentTextSuccess
                    ]}>
                      {formData.insuranceDoc ? getInsuranceFileName() : 'Upload Insurance Document'}
                    </Text>
                    <Text style={styles.documentSubtext}>
                      PDF or image file
                    </Text>
                  </View>
                  <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                
                {errors.insuranceDoc && (
                  <Text style={styles.errorText}>{errors.insuranceDoc}</Text>
                )}
                
                <View style={styles.hint}>
                  <Icon name="info" type="Feather" size={16} color={Colors.info} />
                  <Text style={styles.hintText}>
                    Upload a valid vehicle insurance certificate or policy document.
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Background Check Consent Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="user-check" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Background Check</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <TouchableOpacity 
                  style={styles.consentContainer}
                  onPress={() => updateField('bgCheckConsent', !formData.bgCheckConsent)}
                >
                  <View style={[styles.checkbox, formData.bgCheckConsent && styles.checkboxChecked]}>
                    {formData.bgCheckConsent && (
                      <Icon name="check" type="Feather" size={16} color={Colors.white} />
                    )}
                  </View>
                  <View style={styles.consentText}>
                    <Text style={styles.consentTitle}>I consent to a background check</Text>
                    <Text style={styles.consentSubtext}>
                      This helps ensure the safety and security of our platform for all users.
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {errors.bgCheckConsent && (
                  <Text style={styles.errorText}>{errors.bgCheckConsent}</Text>
                )}
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <View style={styles.progressList}>
                <View style={styles.progressItem}>
                  <Icon 
                    name={formData.insuranceDoc ? "check-circle" : "circle"} 
                    type="Feather" 
                    size={20} 
                    color={formData.insuranceDoc ? Colors.success : Colors.textSecondary} 
                  />
                  <Text style={styles.progressText}>Insurance Document</Text>
                </View>
                <View style={styles.progressItem}>
                  <Icon 
                    name={formData.bgCheckConsent ? "check-circle" : "circle"} 
                    type="Feather" 
                    size={20} 
                    color={formData.bgCheckConsent ? Colors.success : Colors.textSecondary} 
                  />
                  <Text style={styles.progressText}>Background Check Consent</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue to Banking"
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
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 16,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  documentTextSuccess: {
    color: Colors.success,
  },
  documentSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
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
  consentText: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  consentSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  progressSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  progressTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
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

export default TransporterComplianceScreen;