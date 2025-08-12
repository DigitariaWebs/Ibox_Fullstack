import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface PhoneNumberModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (phoneNumber: string) => void;
  initialValue?: string;
}

const countries: Country[] = [
  { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
];

const PhoneNumberModal: React.FC<PhoneNumberModalProps> = ({
  visible,
  onClose,
  onSave,
  initialValue = ''
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible && initialValue) {
      // Parse the initial phone number to extract country code and number
      parseInitialPhoneNumber(initialValue);
    } else if (visible && !initialValue) {
      // Reset to default values
      setSelectedCountry(countries[0]);
      setPhoneNumber('');
    }
  }, [visible, initialValue]);

  const parseInitialPhoneNumber = (fullNumber: string) => {
    // Find the country that matches the phone number prefix
    const matchedCountry = countries.find(country => 
      fullNumber.startsWith(country.dialCode)
    );
    
    if (matchedCountry) {
      setSelectedCountry(matchedCountry);
      // Extract the phone number without country code
      const numberPart = fullNumber.substring(matchedCountry.dialCode.length);
      setPhoneNumber(numberPart);
    } else {
      // If no match found, assume it's without country code
      setSelectedCountry(countries[0]);
      setPhoneNumber(fullNumber.replace('+', ''));
    }
  };

  const handleSave = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    // Validate phone number (basic validation)
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 12) {
      Alert.alert('Error', 'Please enter a valid phone number (6-12 digits)');
      return;
    }

    const fullPhoneNumber = selectedCountry.dialCode + phoneNumber;
    onSave(fullPhoneNumber);
    onClose();
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
        setSearchQuery('');
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.dialCode}</Text>
      </View>
      {selectedCountry.code === item.code && (
        <Ionicons name="checkmark" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Phone Number</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          {!showCountryPicker ? (
            // Phone Number Input View
            <View style={styles.phoneInputContainer}>
              <Text style={styles.sectionTitle}>Enter your phone number</Text>
              
              {/* Country Selector */}
              <TouchableOpacity
                style={styles.countrySelectorButton}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={styles.countryName}>{selectedCountry.name}</Text>
                  <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Phone Number Input */}
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.dialCodeDisplay}>{selectedCountry.dialCode}</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={12}
                  autoFocus={true}
                />
              </View>

              <Text style={styles.helperText}>
                Enter your phone number without the country code
              </Text>
            </View>
          ) : (
            // Country Picker View
            <View style={styles.countryPickerContainer}>
              <Text style={styles.sectionTitle}>Select Country</Text>
              
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search countries..."
                  placeholderTextColor={Colors.textTertiary}
                  autoFocus={true}
                />
              </View>

              {/* Countries List */}
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                renderItem={renderCountryItem}
                style={styles.countriesList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cancelButton: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  phoneInputContainer: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  countrySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: Colors.background,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  countryCode: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  dialCodeDisplay: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginRight: 8,
    minWidth: 50,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  countryPickerContainer: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  countriesList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
});

export default PhoneNumberModal;