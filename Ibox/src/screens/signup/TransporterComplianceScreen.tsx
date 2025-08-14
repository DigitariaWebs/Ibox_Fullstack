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
  Image,
  Alert,
} from 'react-native';
import { Button, Text, Icon, Input } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { transporterComplianceSchema } from '../../validation/signUpSchemas';
import * as ImagePicker from 'expo-image-picker';
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

  const validateForm = async () => {
    try {
      await transporterComplianceSchema.validate(formData, { abortEarly: false });
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

  const updateField = (field: keyof FormData, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        insuranceDoc: formData.insuranceDoc,
        bgCheckConsent: formData.bgCheckConsent,
      });
      setCurrentStep(7);
      navigation.navigate('TransporterBanking');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const pickLicenseImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is required to add license photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...formData.licenseImages, result.assets[0].uri];
        updateField('licenseImages', newImages);
      }
    } catch (error) {
      console.error('Error picking license image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickInsuranceDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        updateField('insuranceDoc', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking insurance document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const removeLicenseImage = (index: number) => {
    const newImages = formData.licenseImages.filter((_, i) => i !== index);
    updateField('licenseImages', newImages);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
                Compliance & Verification
              </Text>
              <Text style={styles.subtitle}>
                Upload your license and insurance documents to verify your eligibility as a transporter
              </Text>
            </View>
            
            {/* Driver's License Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="credit-card" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Driver's License</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.licenseContainer}>
                  {formData.licenseImages.map((image, index) => (
                    <View key={index} style={styles.licenseItem}>
                      <Image source={{ uri: image }} style={styles.licenseImage} />
                      <TouchableOpacity 
                        style={styles.removeLicenseButton}
                        onPress={() => removeLicenseImage(index)}
                      >
                        <Icon name="x" type="Feather" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {formData.licenseImages.length < 2 && (
                    <TouchableOpacity style={styles.addLicenseButton} onPress={pickLicenseImage}>
                      <Icon name="plus" type="Feather" size={24} color={Colors.primary} />
                      <Text style={styles.addLicenseText}>
                        Add License {formData.licenseImages.length === 0 ? 'Front' : 'Back'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Input
                  placeholder="License expiry date (YYYY-MM-DD)"
                  value={formData.licenseExpiry}
                  onChangeText={(value) => updateField('licenseExpiry', value)}
                  error={errors.licenseExpiry}
                  leftIcon={<Icon name="calendar" type="Feather" size={20} color={Colors.textSecondary} />}
                  style={styles.inputField}
                />
                
                {errors.licenseImages && (
                  <Text style={styles.errorText}>{errors.licenseImages}</Text>
                )}
                
                <View style={styles.licenseHint}>
                  <Icon name="info" type="Feather" size={16} color={Colors.info} />
                  <Text style={styles.hintText}>
                    Upload clear photos of both front and back of your driver's license. Ensure all text is readable.
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Insurance Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="shield" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Insurance Document</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                {formData.insuranceDoc ? (
                  <View style={styles.documentCard}>
                    <Icon name="file-text" type="Feather" size={24} color={Colors.primary} />
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>Insurance Document</Text>
                      <Text style={styles.documentType}>Uploaded successfully</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeDocButton}
                      onPress={() => updateField('insuranceDoc', '')}
                    >
                      <Icon name="x" type="Feather" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadButton} onPress={pickInsuranceDoc}>
                    <Icon name="upload" type="Feather" size={24} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Upload Insurance Document</Text>
                    <Text style={styles.uploadHint}>PDF or Image files accepted</Text>
                  </TouchableOpacity>
                )}
                
                {errors.insuranceDoc && (
                  <Text style={styles.errorText}>{errors.insuranceDoc}</Text>
                )}
                
                <View style={styles.insuranceHint}>
                  <Icon name="info" type="Feather" size={16} color={Colors.warning} />
                  <Text style={styles.hintText}>
                    Your vehicle insurance must be valid and cover commercial transportation activities.
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Background Check Consent */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="user-check" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Background Check</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <TouchableOpacity 
                  style={styles.consentContainer}
                  onPress={() => updateField('bgCheckConsent', !formData.bgCheckConsent)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.checkbox,
                    formData.bgCheckConsent && styles.checkboxChecked
                  ]}>
                    {formData.bgCheckConsent && (
                      <Icon name="check" type="Feather" size={16} color={Colors.white} />
                    )}
                  </View>
                  <View style={styles.consentText}>
                    <Text style={styles.consentLabel}>
                      I consent to a background check
                    </Text>
                    <Text style={styles.consentDescription}>
                      This helps ensure the safety and security of our platform for all users. 
                      Your information will be kept confidential.
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {errors.bgCheckConsent && (
                  <Text style={styles.errorText}>{errors.bgCheckConsent}</Text>
                )}
              </View>
            </View>
            
            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Icon name="check-circle" type="Feather" size={18} color={Colors.success} />
                <Text style={styles.progressTitle}>Verification Progress</Text>
              </View>
              <View style={styles.progressContent}>
                <View style={styles.progressItem}>
                  <Icon 
                    name={formData.licenseImages.length > 0 ? "check-circle" : "circle"} 
                    type="Feather" 
                    size={16} 
                    color={formData.licenseImages.length > 0 ? Colors.success : Colors.textSecondary} 
                  />
                  <Text style={styles.progressText}>Driver's License</Text>
                </View>
                <View style={styles.progressItem}>
                  <Icon 
                    name={formData.insuranceDoc ? "check-circle" : "circle"} 
                    type="Feather" 
                    size={16} 
                    color={formData.insuranceDoc ? Colors.success : Colors.textSecondary} 
                  />
                  <Text style={styles.progressText}>Insurance Document</Text>
                </View>
                <View style={styles.progressItem}>
                  <Icon 
                    name={formData.bgCheckConsent ? "check-circle" : "circle"} 
                    type="Feather" 
                    size={16} 
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
            title="Continue to banking"
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
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 16,
  },
  licenseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  licenseItem: {
    position: 'relative',
  },
  licenseImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  removeLicenseButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLicenseButton: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
  },
  addLicenseText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  inputField: {
    marginBottom: 0,
  },
  licenseHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  insuranceHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
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
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  documentType: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  removeDocButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    padding: 24,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  consentContainer: {
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
  consentText: {
    flex: 1,
  },
  consentLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContent: {
    gap: 8,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textPrimary,
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