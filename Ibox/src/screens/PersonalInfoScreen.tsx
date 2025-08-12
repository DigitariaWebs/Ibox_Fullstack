import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import profileService, { UserProfile, ProfileUpdateData } from '../services/profileService';
import imageUploadService from '../services/imageUploadService';

interface PersonalInfoScreenProps {
  navigation: any;
}

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoadingProfile(true);
      const profileData = await profileService.getUserProfile();
      setProfile(profileData);
      
      // Populate form fields
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      setDateOfBirth(profileData.dateOfBirth || '');
      
      // TODO: Load address data from user addresses
      // For now, use placeholder data
      setAddress('1234 Rue Sainte-Catherine');
      setCity('Montreal');
      setPostalCode('H3G 1M8');
      
    } catch (error) {
      console.error('Failed to load profile data:', error);
      // Fallback to auth user data
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const updateData: ProfileUpdateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || undefined,
      };

      // Update profile via API
      const updatedProfile = await profileService.updateUserProfile(updateData);
      
      // Update local state
      setProfile(updatedProfile);
      
      // Update auth context if needed
      if (updateUser) {
        await updateUser({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phone: updatedProfile.phone,
        });
      }

      // Cache the updated profile
      await profileService.cacheProfileData(updatedProfile);

      Alert.alert('Success', 'Information saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to save profile information:', error);
      Alert.alert('Error', error.message || 'Failed to save information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select your birth date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const DatePickerModal = () => {
    const [tempDate, setTempDate] = useState(new Date(dateOfBirth || '1990-01-01'));
    
    const years = Array.from({length: 80}, (_, i) => new Date().getFullYear() - 18 - i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = Array.from({length: 31}, (_, i) => i + 1);

    const handleDateSelect = () => {
      const formattedDate = tempDate.toLocaleDateString('en-CA');
      setDateOfBirth(formattedDate);
      setShowDatePicker(false);
    };
    
    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Date of Birth</Text>
              <TouchableOpacity onPress={handleDateSelect}>
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnTitle}>Month</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={`month-${index}`}
                      style={[
                        styles.dateOption,
                        tempDate.getMonth() === index && styles.selectedDateOption
                      ]}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), index, tempDate.getDate()))}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        tempDate.getMonth() === index && styles.selectedDateOptionText
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnTitle}>Day</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {days.map(day => (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dateOption,
                        tempDate.getDate() === day && styles.selectedDateOption
                      ]}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day))}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        tempDate.getDate() === day && styles.selectedDateOptionText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnTitle}>Year</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={`year-${year}`}
                      style={[
                        styles.dateOption,
                        tempDate.getFullYear() === year && styles.selectedDateOption
                      ]}
                      onPress={() => setTempDate(new Date(year, tempDate.getMonth(), tempDate.getDate()))}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        tempDate.getFullYear() === year && styles.selectedDateOptionText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <ImageBackground
              source={{ 
                uri: profile?.profilePicture || `https://i.pravatar.cc/120?u=${profile?.email || 'default'}` 
              }}
              style={styles.profileImage}
              imageStyle={styles.profileImageStyle}
            >
              <TouchableOpacity 
                style={styles.editImageButton}
                onPress={async () => {
                  try {
                    setIsLoading(true);
                    const result = await imageUploadService.updateProfilePicture();
                    
                    if (result.success && result.profilePictureUrl) {
                      // Update local profile data
                      if (profile) {
                        const updatedProfile = { ...profile, profilePicture: result.profilePictureUrl };
                        setProfile(updatedProfile);
                        await profileService.cacheProfileData(updatedProfile);
                      }
                      Alert.alert('Success', 'Profile picture updated successfully!');
                    } else {
                      if (result.error && result.error !== 'Image selection cancelled') {
                        Alert.alert('Error', result.error);
                      }
                    }
                  } catch (error: any) {
                    console.error('Profile picture update error:', error);
                    Alert.alert('Error', 'Failed to update profile picture. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading || isLoadingProfile}
              >
                <Icon name="camera" type="Feather" size={14} color={Colors.white} />
              </TouchableOpacity>
            </ImageBackground>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.profileTitle}>
              {isLoadingProfile ? 'Loading Profile...' : 'Update Your Profile'}
            </Text>
            <Text style={styles.profileSubtitle}>
              {isLoadingProfile ? 'Please wait' : 'Update your personal information'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Personal Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={[styles.textInput, isLoadingProfile && styles.textInputDisabled]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor={Colors.textTertiary}
                  editable={!isLoadingProfile}
                />
              </View>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={[styles.textInput, isLoadingProfile && styles.textInputDisabled]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor={Colors.textTertiary}
                  editable={!isLoadingProfile}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.textInput, isLoadingProfile && styles.textInputDisabled]}
                value={email}
                onChangeText={setEmail}
                placeholder="john.doe@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Email should not be editable
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={[styles.textInput, isLoadingProfile && styles.textInputDisabled]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (514) 555-0123"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                editable={!isLoadingProfile}
              />
            </View>
          </View>

          {/* Address Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="1234 Main Street"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.addressRow}>
              <View style={styles.cityField}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Montreal"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.postalField}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="H3G 1M8"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="characters"
                  maxLength={7}
                />
              </View>
            </View>
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDisplayDate(dateOfBirth)}
                </Text>
                <Icon name="calendar" type="Feather" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton, 
              (isLoading || isLoadingProfile) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isLoading || isLoadingProfile}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : isLoadingProfile ? 'Loading...' : 'Save Information'}
            </Text>
            {!isLoading && !isLoadingProfile && (
              <Icon name="check" type="Feather" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <DatePickerModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageStyle: {
    borderRadius: 30,
  },
  editImageButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  textInputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.textSecondary,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cityField: {
    flex: 2,
  },
  postalField: {
    flex: 1,
  },
  datePickerButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: Colors.surface,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalCancelText: {
    fontSize: 17,
    color: Colors.textSecondary,
  },
  modalDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
  datePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 300,
  },
  dateColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  dateColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  dateScrollView: {
    maxHeight: 200,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedDateOption: {
    backgroundColor: Colors.primary,
  },
  dateOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  selectedDateOptionText: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default PersonalInfoScreen;