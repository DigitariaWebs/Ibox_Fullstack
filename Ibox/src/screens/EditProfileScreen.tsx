import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PhoneNumberModal from '../components/PhoneNumberModal';

interface EditableUserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  language: 'en' | 'fr';
  dateOfBirth?: string;
  profilePicture?: string;
  // Business fields (if applicable)
  isBusiness?: boolean;
  businessDetails?: {
    companyName: string;
    taxId: string;
    businessType: string;
    website?: string;
  };
  // Transporter fields (if applicable)
  transporterDetails?: {
    vehicleType: string;
    licensePlate: string;
    payloadCapacity: number;
    licenseNumber: string;
    isAvailable: boolean;
  };
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  
  const [profile, setProfile] = useState<EditableUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal states
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  // Form validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setError(null);
      const profileData = await api.getUserProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err instanceof Error) {
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          setError('Please log in again to edit your profile.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!profile?.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profile?.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!profile?.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Check if phone number has enough digits
      const digits = profile.phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        newErrors.phone = 'Phone number must be between 10 and 15 digits';
      }
    }

    // Business validation
    if (profile?.isBusiness) {
      if (!profile.businessDetails?.companyName?.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!profile.businessDetails?.taxId?.trim()) {
        newErrors.taxId = 'Tax ID is required';
      }
      if (!profile.businessDetails?.businessType?.trim()) {
        newErrors.businessType = 'Business type is required';
      }
    }

    // Transporter validation
    if (authUser?.userType === 'transporter') {
      if (!profile?.transporterDetails?.vehicleType?.trim()) {
        newErrors.vehicleType = 'Vehicle type is required';
      }
      if (!profile?.transporterDetails?.licensePlate?.trim()) {
        newErrors.licensePlate = 'License plate is required';
      }
      if (!profile?.transporterDetails?.payloadCapacity || profile.transporterDetails.payloadCapacity <= 0) {
        newErrors.payloadCapacity = 'Valid payload capacity is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!profile || !validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare update data (exclude read-only fields)
      const updateData: any = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        language: profile.language,
        isBusiness: profile.isBusiness,
      };

      // Only include optional fields if they have values
      if (profile.dateOfBirth && profile.dateOfBirth.trim()) {
        updateData.dateOfBirth = profile.dateOfBirth;
      }
      
      if (profile.profilePicture && profile.profilePicture.trim()) {
        updateData.profilePicture = profile.profilePicture;
      }

      // Add business details if applicable
      if (profile.isBusiness && profile.businessDetails) {
        Object.assign(updateData, {
          businessDetails: profile.businessDetails
        });
      }

      console.log('🔍 Updating profile with data:', JSON.stringify(updateData, null, 2));
      await api.updateUserProfile(updateData);

      // Update transporter details if applicable
      if (authUser?.userType === 'transporter' && profile.transporterDetails) {
        console.log('🔍 Updating transporter details with data:', JSON.stringify(profile.transporterDetails, null, 2));
        await api.updateTransporterDetails(profile.transporterDetails);
      }

      setHasChanges(false);
      
      // Navigate back to Profile screen with a refresh trigger
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Profile',
          params: { refresh: true, timestamp: Date.now() },
        })
      );
      
      // Show success message briefly
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err instanceof Error) {
        setError(err.message);
        
        // Show detailed error in development
        if (__DEV__) {
          Alert.alert(
            'Debug: Update Error',
            `Error: ${err.message}\n\nPlease check the console for more details.`
          );
        }
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const updateProfile = (field: string, value: any) => {
    if (!profile) return;

    const newProfile = { ...profile };
    const keys = field.split('.');
    
    // Handle numeric fields
    if (field === 'transporterDetails.payloadCapacity' && value && typeof value === 'string') {
      value = parseFloat(value) || 0;
    }
    
    if (keys.length === 1) {
      (newProfile as any)[keys[0]] = value;
    } else if (keys.length === 2) {
      if (!newProfile[keys[0] as keyof EditableUserProfile]) {
        (newProfile as any)[keys[0]] = {};
      }
      (newProfile[keys[0] as keyof EditableUserProfile] as any)[keys[1]] = value;
    }

    setProfile(newProfile);
    setHasChanges(true);
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const renderTextInput = (
    label: string,
    field: string,
    value: string,
    placeholder: string,
    multiline = false,
    keyboardType: 'default' | 'phone-pad' | 'email-address' | 'numeric' = 'default',
    editable = true
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          !editable && styles.textInputDisabled,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => updateProfile(field, text)}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        editable={editable}
      />
      {!editable && (
        <Text style={styles.inputNote}>This field cannot be changed</Text>
      )}
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderSwitchInput = (label: string, field: string, value: boolean, description?: string) => (
    <View style={styles.inputGroup}>
      <View style={styles.switchContainer}>
        <View style={styles.switchContent}>
          <Text style={styles.inputLabel}>{label}</Text>
          {description && (
            <Text style={styles.inputDescription}>{description}</Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => updateProfile(field, newValue)}
          trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
          thumbColor={value ? Colors.primary : Colors.textSecondary}
        />
      </View>
    </View>
  );

  const renderBusinessSection = () => {
    if (authUser?.userType !== 'customer' || !profile?.isBusiness) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        
        {renderTextInput(
          'Company Name',
          'businessDetails.companyName',
          profile.businessDetails?.companyName || '',
          'Enter company name'
        )}

        {renderTextInput(
          'Tax ID',
          'businessDetails.taxId',
          profile.businessDetails?.taxId || '',
          'Enter tax identification number'
        )}

        {renderTextInput(
          'Business Type',
          'businessDetails.businessType',
          profile.businessDetails?.businessType || '',
          'e.g., Corporation, LLC, Partnership'
        )}

        {renderTextInput(
          'Website (Optional)',
          'businessDetails.website',
          profile.businessDetails?.website || '',
          'Enter website URL'
        )}
      </View>
    );
  };

  const renderTransporterSection = () => {
    if (authUser?.userType !== 'transporter') return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        {renderTextInput(
          'Vehicle Type',
          'transporterDetails.vehicleType',
          profile?.transporterDetails?.vehicleType || '',
          'e.g., Van, Truck, Car'
        )}

        {renderTextInput(
          'License Plate',
          'transporterDetails.licensePlate',
          profile?.transporterDetails?.licensePlate || '',
          'Enter license plate number'
        )}

        {renderTextInput(
          'Payload Capacity (kg)',
          'transporterDetails.payloadCapacity',
          profile?.transporterDetails?.payloadCapacity?.toString() || '',
          'Enter maximum weight capacity',
          false,
          'numeric'
        )}

        {renderTextInput(
          'License Number',
          'transporterDetails.licenseNumber',
          profile?.transporterDetails?.licenseNumber || '',
          'Enter driver license number'
        )}

        {renderSwitchInput(
          'Available for Deliveries',
          'transporterDetails.isAvailable',
          profile?.transporterDetails?.isAvailable ?? true,
          'Toggle your availability to receive delivery requests'
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleCancel}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[
              styles.saveText,
              (!hasChanges || saving) && styles.saveTextDisabled
            ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderTextInput(
            'First Name',
            'firstName',
            profile.firstName,
            'Enter first name'
          )}

          {renderTextInput(
            'Last Name',
            'lastName',
            profile.lastName,
            'Enter last name'
          )}

          {/* Phone Number Button */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TouchableOpacity
              style={[styles.phoneButton, errors.phone && styles.phoneButtonError]}
              onPress={() => setPhoneModalVisible(true)}
            >
              <Text style={[
                styles.phoneButtonText,
                !profile.phone && styles.phoneButtonPlaceholder
              ]}>
                {profile.phone || 'Tap to enter phone number'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Language Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Language</Text>
            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  profile.language === 'en' && styles.languageOptionActive
                ]}
                onPress={() => updateProfile('language', 'en')}
              >
                <Text style={[
                  styles.languageText,
                  profile.language === 'en' && styles.languageTextActive
                ]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  profile.language === 'fr' && styles.languageOptionActive
                ]}
                onPress={() => updateProfile('language', 'fr')}
              >
                <Text style={[
                  styles.languageText,
                  profile.language === 'fr' && styles.languageTextActive
                ]}>
                  Français
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderTextInput(
            'Date of Birth (Optional)',
            'dateOfBirth',
            profile.dateOfBirth || '',
            'YYYY-MM-DD'
          )}
        </View>

        {/* Business Section */}
        {authUser?.userType === 'customer' && (
          <View style={styles.section}>
            {renderSwitchInput(
              'Business Account',
              'isBusiness',
              profile.isBusiness ?? false,
              'Enable if this is a business account'
            )}
          </View>
        )}

        {renderBusinessSection()}

        {/* Transporter Section */}
        {renderTransporterSection()}

        {/* Read-only Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <Text style={styles.sectionDescription}>
            The following information cannot be changed. Contact support if you need to update these fields.
          </Text>

          {renderTextInput(
            'Email Address',
            'email',
            authUser?.email || '',
            'Email cannot be changed',
            false,
            'email-address',
            false
          )}

          {renderTextInput(
            'Account Type',
            'userType',
            authUser?.userType === 'customer' ? 'Customer' : 'Transporter',
            'Account type cannot be changed',
            false,
            'default',
            false
          )}
        </View>
      </ScrollView>

      {/* Phone Number Modal */}
      <PhoneNumberModal
        visible={phoneModalVisible}
        onClose={() => setPhoneModalVisible(false)}
        onSave={(phoneNumber) => {
          updateProfile('phone', phoneNumber);
          setPhoneModalVisible(false);
        }}
        initialValue={profile?.phone || ''}
      />
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 16,
  },
  headerButton: {
    padding: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveTextDisabled: {
    color: Colors.textTertiary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textInputMultiline: {
    paddingVertical: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  textInputDisabled: {
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
  },
  textInputError: {
    borderColor: Colors.error,
  },
  inputNote: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  languageOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  languageTextActive: {
    color: Colors.primary,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  phoneButtonError: {
    borderColor: Colors.error,
  },
  phoneButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  phoneButtonPlaceholder: {
    color: Colors.textTertiary,
  },
});

export default EditProfileScreen;