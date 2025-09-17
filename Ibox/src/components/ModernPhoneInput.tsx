import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Popular countries data with phone length validation
const COUNTRIES = [
  { code: 'DZ', name: 'Algeria', dial_code: '+213', flag: '🇩🇿', popular: true, phoneLength: { min: 9, max: 9 }, format: 'XX XXX XX XX' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸', popular: true, phoneLength: { min: 10, max: 10 }, format: 'XXX XXX XXXX' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧', popular: true, phoneLength: { min: 10, max: 11 }, format: 'XXXX XXXXXX' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷', popular: true, phoneLength: { min: 9, max: 9 }, format: 'X XX XX XX XX' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦', popular: true, phoneLength: { min: 10, max: 10 }, format: 'XXX XXX XXXX' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺', phoneLength: { min: 9, max: 9 }, format: 'XXX XXX XXX' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', flag: '🇧🇷', phoneLength: { min: 10, max: 11 }, format: 'XX XXXXX XXXX' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳', phoneLength: { min: 11, max: 11 }, format: 'XXX XXXX XXXX' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪', phoneLength: { min: 10, max: 12 }, format: 'XXX XXXXXXXX' },
  { code: 'ES', name: 'Spain', dial_code: '+34', flag: '🇪🇸', phoneLength: { min: 9, max: 9 }, format: 'XXX XXX XXX' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳', phoneLength: { min: 10, max: 10 }, format: 'XXXXX XXXXX' },
  { code: 'IT', name: 'Italy', dial_code: '+39', flag: '🇮🇹', phoneLength: { min: 9, max: 10 }, format: 'XXX XXX XXXX' },
  { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵', phoneLength: { min: 10, max: 11 }, format: 'XX XXXX XXXX' },
  { code: 'MA', name: 'Morocco', dial_code: '+212', flag: '🇲🇦', phoneLength: { min: 9, max: 9 }, format: 'XX XXX XX XX' },
  { code: 'TN', name: 'Tunisia', dial_code: '+216', flag: '🇹🇳', phoneLength: { min: 8, max: 8 }, format: 'XX XXX XXX' },
  { code: 'EG', name: 'Egypt', dial_code: '+20', flag: '🇪🇬', phoneLength: { min: 10, max: 10 }, format: 'XXX XXX XXXX' },
  { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', flag: '🇸🇦', phoneLength: { min: 9, max: 9 }, format: 'XX XXX XXXX' },
  { code: 'AE', name: 'UAE', dial_code: '+971', flag: '🇦🇪', phoneLength: { min: 9, max: 9 }, format: 'XX XXX XXXX' },
  { code: 'TR', name: 'Turkey', dial_code: '+90', flag: '🇹🇷', phoneLength: { min: 10, max: 10 }, format: 'XXX XXX XXXX' },
  { code: 'NG', name: 'Nigeria', dial_code: '+234', flag: '🇳🇬', phoneLength: { min: 10, max: 10 }, format: 'XXX XXX XXXX' },
];

interface ModernPhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (fullNumber: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  isRequired?: boolean;
  helpText?: string;
  lightTheme?: boolean;
  containerStyle?: any;
}

const ModernPhoneInput: React.FC<ModernPhoneInputProps> = ({
  label = 'Phone Number',
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  isRequired = false,
  helpText,
  lightTheme = false,
  containerStyle,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to Algeria
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const borderAnimation = useSharedValue(0);

  // Parse the initial value if it contains a country code
  useEffect(() => {
    if (value) {
      // Check if value starts with a country code
      const matchedCountry = COUNTRIES.find(country => 
        value.startsWith(country.dial_code)
      );
      
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.replace(matchedCountry.dial_code, '').trim());
      } else {
        // If no country code, just set the number
        setPhoneNumber(value);
      }
    }
  }, []);

  // Update parent with full number whenever country or number changes
  useEffect(() => {
    if (phoneNumber) {
      // Remove spaces and non-digits from the phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      // Send the number without space (backend expects no space)
      const fullNumber = `${selectedCountry.dial_code}${cleanNumber}`;
      onChangeText(fullNumber);
    } else {
      onChangeText('');
    }
  }, [selectedCountry, phoneNumber]);

  const handleFocus = () => {
    setIsFocused(true);
    borderAnimation.value = withSpring(1);
    onFocus?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderAnimation.value = withSpring(0);
    onBlur?.();
  };

  const openCountryPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const selectCountry = (country: typeof COUNTRIES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  const filteredCountries = searchQuery
    ? COUNTRIES.filter(
        country =>
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dial_code.includes(searchQuery)
      )
    : COUNTRIES;

  // Separate popular and other countries
  const popularCountries = filteredCountries.filter(c => c.popular);
  const otherCountries = filteredCountries.filter(c => !c.popular);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(
      borderAnimation.value,
      [0, 1],
      [1.5, 2],
      Extrapolation.CLAMP
    );
    
    return {
      borderWidth,
      borderColor: borderAnimation.value > 0.5 ? Colors.primary : 
                   error ? Colors.error : 
                   lightTheme ? 'rgba(255,255,255,0.3)' : Colors.border,
    };
  });

  const renderCountryItem = ({ item }: { item: typeof COUNTRIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry.code === item.code && styles.selectedCountryItem
      ]}
      onPress={() => selectCountry(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.dial_code}</Text>
      </View>
      {selectedCountry.code === item.code && (
        <Icon name="check" type="Feather" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, lightTheme && styles.labelLight]}>
            {label}
          </Text>
          {isRequired && <Text style={styles.required}>*</Text>}
        </View>
      )}

      <Animated.View style={[
        styles.inputContainer,
        animatedBorderStyle,
        error && styles.inputError,
      ]}>
        {/* Country Selector */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={openCountryPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.selectedFlag}>{selectedCountry.flag}</Text>
          <Text style={[styles.dialCode, lightTheme && styles.dialCodeLight]}>
            {selectedCountry.dial_code}
          </Text>
          <Icon 
            name="chevron-down" 
            type="Feather" 
            size={16} 
            color={lightTheme ? 'rgba(255,255,255,0.8)' : Colors.textSecondary} 
          />
        </TouchableOpacity>

        {/* Separator */}
        <View style={[styles.separator, lightTheme && styles.separatorLight]} />

        {/* Phone Input */}
        <TextInput
          style={[styles.phoneInput, lightTheme && styles.phoneInputLight]}
          value={phoneNumber}
          onChangeText={(text) => {
            // Only allow digits
            const cleanText = text.replace(/\D/g, '');
            // Limit to max length for selected country
            const maxLength = selectedCountry.phoneLength.max;
            if (cleanText.length <= maxLength) {
              setPhoneNumber(cleanText);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={`e.g. ${selectedCountry.format.replace(/X/g, '5')}`}
          placeholderTextColor={lightTheme ? 'rgba(255,255,255,0.5)' : Colors.textSecondary}
          keyboardType="phone-pad"
          maxLength={selectedCountry.phoneLength.max}
        />
      </Animated.View>

      {/* Error Message */}
      {error && (
        <Animated.View 
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.errorContainer}
        >
          <Icon name="alert-circle" type="Feather" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      {/* Help Text or Validation Message */}
      {!error && (
        <Text style={[
          styles.helpText, 
          lightTheme && styles.helpTextLight,
          phoneNumber && phoneNumber.length >= selectedCountry.phoneLength.min && 
          phoneNumber.length <= selectedCountry.phoneLength.max && styles.helpTextSuccess
        ]}>
          {phoneNumber && phoneNumber.length < selectedCountry.phoneLength.min
            ? `Phone number should be ${selectedCountry.phoneLength.min} digits`
            : phoneNumber && phoneNumber.length > selectedCountry.phoneLength.max
            ? `Phone number should not exceed ${selectedCountry.phoneLength.max} digits`
            : phoneNumber && phoneNumber.length >= selectedCountry.phoneLength.min && phoneNumber.length <= selectedCountry.phoneLength.max
            ? `✓ Valid ${selectedCountry.name} phone number`
            : helpText || `Format: ${selectedCountry.format}`}
        </Text>
      )}

      {/* Country Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          
          <Animated.View 
            entering={SlideInDown.springify()}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <LinearGradient
              colors={[Colors.primary, '#00A896']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Country</Text>
              
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Icon name="search" type="Feather" size={18} color="rgba(255,255,255,0.7)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country or code"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </LinearGradient>

            {/* Countries List */}
            <FlatList
              data={[
                ...(popularCountries.length > 0 ? [{ type: 'header', title: 'Popular' }] : []),
                ...popularCountries,
                ...(otherCountries.length > 0 ? [{ type: 'header', title: 'All Countries' }] : []),
                ...otherCountries,
              ]}
              keyExtractor={(item, index) => 
                item.type === 'header' ? `header-${index}` : item.code
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionHeaderText}>{item.title}</Text>
                    </View>
                  );
                }
                return renderCountryItem({ item });
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
  },
  labelLight: {
    color: Colors.white,
  },
  required: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  selectedFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  dialCode: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  dialCodeLight: {
    color: Colors.textPrimary,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  separatorLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
  },
  phoneInputLight: {
    color: Colors.textPrimary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.error,
    marginLeft: 4,
  },
  helpText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  helpTextLight: {
    color: 'rgba(255,255,255,0.7)',
  },
  helpTextSuccess: {
    color: '#10B981',
    fontFamily: Fonts.SFProDisplay.Medium,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.white,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay.SemiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCountryItem: {
    backgroundColor: Colors.primary + '10',
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
  },
});

export default ModernPhoneInput;
