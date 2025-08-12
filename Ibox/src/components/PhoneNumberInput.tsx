import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Colors } from '../config/colors';
import { Icon } from '../ui';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface PhoneNumberInputProps {
  value?: string;
  onChangeText?: (phone: string) => void;
  placeholder?: string;
  error?: string;
  style?: any;
}

// Common countries - you can expand this list
const countries: Country[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
];

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value = '',
  onChangeText,
  placeholder = 'Enter phone number',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Extract country code and phone number from current value
  const getCountryAndNumber = (phoneValue: string) => {
    if (!phoneValue) return { country: countries[0], number: '' };
    
    // Find matching country by dial code
    const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
    const matchingCountry = sortedCountries.find(country => 
      phoneValue.startsWith(country.dialCode)
    );
    
    if (matchingCountry) {
      const number = phoneValue.replace(matchingCountry.dialCode, '');
      return { country: matchingCountry, number };
    }
    
    return { country: countries[0], number: phoneValue };
  };

  const { country: selectedCountry, number: phoneNumber } = getCountryAndNumber(value);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const handleCountrySelect = (country: Country) => {
    const newPhoneValue = country.dialCode + phoneNumber;
    onChangeText?.(newPhoneValue);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleNumberChange = (number: string) => {
    // Remove any non-numeric characters except spaces and dashes
    const cleanNumber = number.replace(/[^\d\s\-]/g, '');
    const newPhoneValue = selectedCountry.dialCode + cleanNumber;
    onChangeText?.(newPhoneValue);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        {/* Country Code Selector */}
        <TouchableOpacity 
          style={styles.countrySelector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
          <Icon name="chevron-down" type="Feather" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          placeholder={placeholder}
          value={phoneNumber}
          onChangeText={handleNumberChange}
          keyboardType="phone-pad"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="x" type="Feather" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" type="Feather" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Countries List */}
            <ScrollView style={styles.countriesList} showsVerticalScrollIndicator={false}>
              {filteredCountries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    selectedCountry.code === country.code && styles.selectedCountryItem
                  ]}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                  {selectedCountry.code === country.code && (
                    <Icon name="check" type="Feather" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  errorContainer: {
    borderColor: Colors.error,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    minWidth: 100,
  },
  flag: {
    fontSize: 18,
    marginRight: 8,
  },
  dialCode: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 8,
    marginLeft: 4,
  },
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
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  countriesList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectedCountryItem: {
    backgroundColor: Colors.primaryLight,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  countryDialCode: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: 12,
    fontWeight: '600',
  },
});

export default PhoneNumberInput;