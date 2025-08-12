import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface AddAddressScreenProps {
  navigation: any;
  route: any;
}

interface Address {
  _id: string;
  type: 'primary' | 'secondary' | 'work' | 'other';
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactPerson?: string;
  contactPhone?: string;
  isDefault: boolean;
}

interface AddressForm {
  type: 'primary' | 'secondary' | 'work' | 'other';
  address: string;
  contactPerson: string;
  contactPhone: string;
}

interface FormErrors {
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  type?: string;
}

const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { editingAddress, onAddressUpdated } = route.params || {};

  const [formData, setFormData] = useState<AddressForm>({
    type: editingAddress?.type || 'primary',
    address: editingAddress?.address || '',
    contactPerson: editingAddress?.contactPerson || '',
    contactPhone: editingAddress?.contactPhone || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddressSearchModal, setShowAddressSearchModal] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Google Maps API configuration
  const GOOGLE_API_KEY = 'AIzaSyAzPxqQ9QhUq_cmXkkcE-6DcgJn-EDngzI';

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const addressTypes = [
    { key: 'primary', label: 'Principal', icon: 'home', color: '#0AA5A8' },
    { key: 'secondary', label: 'Secondaire', icon: 'map-pin', color: '#8B5CF6' },
    { key: 'work', label: 'Bureau', icon: 'briefcase', color: '#3B82F6' },
    { key: 'other', label: 'Autre', icon: 'map-pin', color: '#8B5CF6' },
  ];

  const getAddressTypeInfo = (type: string) => {
    return addressTypes.find(t => t.key === type) || addressTypes[3];
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const address = formData.address || '';
    if (!address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    } else if (address.trim().length < 10) {
      newErrors.address = 'L\'adresse doit contenir au moins 10 caractères';
    }

    const contactPerson = formData.contactPerson || '';
    if (contactPerson && contactPerson.length > 100) {
      newErrors.contactPerson = 'Le nom de contact ne peut pas dépasser 100 caractères';
    }

    const contactPhone = formData.contactPhone || '';
    if (contactPhone) {
      const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
      if (!phoneRegex.test(contactPhone.replace(/\s/g, ''))) {
        newErrors.contactPhone = 'Format de téléphone invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AddressForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const addressData = {
        type: formData.type,
        address: (formData.address || '').trim(),
        contactPerson: (formData.contactPerson || '').trim() || undefined,
        contactPhone: (formData.contactPhone || '').trim() || undefined,
        isDefault: false, // This will be handled by backend
      };

      if (editingAddress) {
        const updatedAddress = await api.updateUserAddress(editingAddress._id, addressData);
        onAddressUpdated?.(updatedAddress);
      } else {
        const newAddress = await api.addUserAddress(addressData);
        onAddressUpdated?.(newAddress);
      }

      navigation.goBack();
    } catch (error) {
      setIsLoading(false);
      console.error('Error saving address:', error);
      // You could show an error alert here
    }
  };

  // Address search functionality using Google Maps Places API
  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Searching for addresses:', query);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Address search response status:', data.status);
      
      if (data.status === 'OK') {
        console.log('✅ Found', data.predictions?.length || 0, 'address suggestions');
        const suggestions = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          main_text: prediction.structured_formatting?.main_text || prediction.description,
          secondary_text: prediction.structured_formatting?.secondary_text || '',
          full_address: prediction.description,
        }));
        setAddressSuggestions(suggestions.slice(0, 5)); // Show max 5 suggestions
      } else {
        console.log('⚠️ Address search API returned status:', data.status, data.error_message);
        setAddressSuggestions([]);
        
        // Handle specific error cases
        switch (data.status) {
          case 'REQUEST_DENIED':
            console.error('❌ API request denied - check API key');
            break;
          case 'OVER_QUERY_LIMIT':
            console.error('❌ API quota exceeded');
            break;
          case 'ZERO_RESULTS':
            console.log('ℹ️ No results found for address query:', query);
            break;
          case 'INVALID_REQUEST':
            console.error('❌ Invalid request parameters');
            break;
          default:
            console.error('❌ Unknown API error:', data.status);
        }
      }
    } catch (error) {
      console.error('❌ Address search error:', error);
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSearch = (text: string) => {
    setAddressSearchQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchAddresses(text);
    }, 300);
  };

  const handleSelectAddress = async (suggestion: any) => {
    try {
      console.log('📍 Getting place details for:', suggestion.place_id);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry,name,formatted_address,address_components,place_id,types&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📍 Place details response status:', data.status);
      
      if (data.status === 'OK' && data.result.geometry) {
        const location = data.result.geometry.location;
        const placeName = data.result.formatted_address || suggestion.full_address;
        
        console.log('✅ Place location obtained:', {
          latitude: location.lat,
          longitude: location.lng,
          name: placeName,
        });
        
        // Use the formatted address from place details for better accuracy
        handleInputChange('address', placeName);
        setAddressSuggestions([]);
        setShowAddressSearchModal(false);
        setAddressSearchQuery('');
      } else {
        console.log('⚠️ Place details API returned status:', data.status, data.error_message);
        // Fallback to using the suggestion data
        handleInputChange('address', suggestion.full_address);
        setAddressSuggestions([]);
        setShowAddressSearchModal(false);
        setAddressSearchQuery('');
      }
    } catch (error) {
      console.error('❌ Place details error:', error);
      // Fallback to using the suggestion data
      handleInputChange('address', suggestion.full_address);
      setAddressSuggestions([]);
      setShowAddressSearchModal(false);
      setAddressSearchQuery('');
    }
  };

  const openAddressSearchModal = () => {
    setAddressSearchQuery(formData.address || '');
    setShowAddressSearchModal(true);
    if (formData.address) {
      searchAddresses(formData.address);
    }
  };

  const closeAddressSearchModal = () => {
    setShowAddressSearchModal(false);
    setAddressSuggestions([]);
    setAddressSearchQuery('');
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="x" type="Feather" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, !(formData.address || '').trim() && styles.saveButtonDisabled]}
            onPress={handleSaveAddress}
            disabled={!(formData.address || '').trim() || isLoading}
          >
            <Text style={[styles.saveButtonText, !(formData.address || '').trim() && styles.saveButtonTextDisabled]}>
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Address Type Selection */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Type d'adresse</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, styles.dropdownButton]}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Icon 
                  name={getAddressTypeInfo(formData.type).icon as any} 
                  type="Feather" 
                  size={18} 
                  color={getAddressTypeInfo(formData.type).color} 
                />
                <Text style={styles.dropdownButtonText}>
                  {getAddressTypeInfo(formData.type).label}
                </Text>
                <Icon 
                  name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                  type="Feather" 
                  size={18} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <>
                  <TouchableOpacity 
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTypeDropdown(false)}
                  />
                  <View style={styles.dropdownMenu}>
                    {addressTypes.map((type, index) => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.dropdownItem,
                          formData.type === type.key && styles.dropdownItemSelected,
                          index === addressTypes.length - 1 && styles.dropdownItemLast
                        ]}
                        onPress={() => {
                          handleInputChange('type', type.key as any);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Icon 
                          name={type.icon as any} 
                          type="Feather" 
                          size={18} 
                          color={type.color} 
                        />
                        <Text style={[
                          styles.dropdownItemText,
                          formData.type === type.key && styles.dropdownItemTextSelected
                        ]}>
                          {type.label}
                        </Text>
                        {formData.type === type.key && (
                          <Icon 
                            name="check" 
                            type="Feather" 
                            size={16} 
                            color={Colors.primary} 
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Address Field */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adresse complète *</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, styles.addressButton, errors.address && styles.inputError]}
                onPress={openAddressSearchModal}
                activeOpacity={0.7}
              >
                <Icon name="search" type="Feather" size={18} color={Colors.textSecondary} />
                <Text style={[
                  styles.addressButtonText,
                  !formData.address && styles.addressButtonPlaceholder
                ]}>
                  {formData.address || 'Rechercher une adresse...'}
                </Text>
                <Icon name="chevron-right" type="Feather" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              {errors.address && (
                <Text style={styles.errorMessage}>{errors.address}</Text>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de contact (optionnel)</Text>
            
            {/* Contact Person Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Personne de contact</Text>
              <View style={[styles.inputWrapper, errors.contactPerson && styles.inputError]}>
                <Icon name="user" type="Feather" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.contactPerson || ''}
                  onChangeText={(value) => handleInputChange('contactPerson', value)}
                  placeholder="Nom de la personne de contact"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              {errors.contactPerson && (
                <Text style={styles.errorMessage}>{errors.contactPerson}</Text>
              )}
            </View>

            {/* Contact Phone Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Téléphone de contact</Text>
              <View style={[styles.inputWrapper, errors.contactPhone && styles.inputError]}>
                <Icon name="phone" type="Feather" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={formData.contactPhone || ''}
                  onChangeText={(value) => handleInputChange('contactPhone', value)}
                  placeholder="+1 (514) 123-4567"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.contactPhone && (
                <Text style={styles.errorMessage}>{errors.contactPhone}</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Address Search Modal */}
      <Modal
        visible={showAddressSearchModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeAddressSearchModal}
      >
        <SafeAreaView style={styles.addressSearchContainer}>
          {/* Header */}
          <View style={styles.addressSearchHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton} 
              onPress={closeAddressSearchModal}
            >
              <Icon name="x" type="Feather" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.addressSearchTitle}>Rechercher une adresse</Text>
            <View style={styles.modalBackButton} />
          </View>

          {/* Search Input */}
          <View style={styles.addressSearchInputContainer}>
            <View style={styles.addressSearchInputWrapper}>
              <Icon name="search" type="Feather" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.addressSearchInput}
                value={addressSearchQuery}
                onChangeText={handleAddressSearch}
                placeholder="Tapez votre adresse..."
                placeholderTextColor={Colors.textTertiary}
                autoFocus={true}
              />
              {isSearching ? (
                <View style={styles.searchLoadingIndicator}>
                  <Text style={styles.searchLoadingText}>•••</Text>
                </View>
              ) : addressSearchQuery ? (
                <TouchableOpacity 
                  onPress={() => {
                    setAddressSearchQuery('');
                    setAddressSuggestions([]);
                  }}
                  style={styles.searchClearButton}
                >
                  <Icon name="x" type="Feather" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Suggestions List */}
          <ScrollView 
            style={styles.addressSearchResults}
            contentContainerStyle={styles.addressSearchResultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {addressSuggestions.length > 0 ? (
              <>
                <Text style={styles.resultsHeader}>Suggestions d'adresses</Text>
                {addressSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.addressSearchResultItem}
                    onPress={() => handleSelectAddress(suggestion)}
                  >
                    <View style={styles.resultIcon}>
                      <Icon name="map-pin" type="Feather" size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={styles.resultMainText}>{suggestion.main_text}</Text>
                      <Text style={styles.resultSecondaryText}>{suggestion.secondary_text}</Text>
                    </View>
                    <Icon name="arrow-up-right" type="Feather" size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </>
            ) : addressSearchQuery.length >= 3 && !isSearching ? (
              <View style={styles.noResultsContainer}>
                <Icon name="search" type="Feather" size={48} color={Colors.textTertiary} />
                <Text style={styles.noResultsTitle}>Aucune adresse trouvée</Text>
                <Text style={styles.noResultsText}>
                  Essayez de modifier votre recherche ou vérifiez l'orthographe
                </Text>
              </View>
            ) : addressSearchQuery.length > 0 && addressSearchQuery.length < 3 ? (
              <View style={styles.minCharsContainer}>
                <Icon name="type" type="Feather" size={48} color={Colors.textTertiary} />
                <Text style={styles.minCharsText}>
                  Tapez au moins 3 caractères pour rechercher
                </Text>
              </View>
            ) : (
              <View style={styles.searchHintContainer}>
                <Icon name="map-pin" type="Feather" size={48} color={Colors.primary} />
                <Text style={styles.searchHintTitle}>Recherchez votre adresse</Text>
                <Text style={styles.searchHintText}>
                  Commencez à taper pour voir les suggestions d'adresses
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  saveButtonTextDisabled: {
    color: Colors.textTertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '05',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
    paddingVertical: 0,
    minHeight: 24,
  },
  errorMessage: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Dropdown Styles
  dropdownButton: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
    fontWeight: '500',
  },
  dropdownMenu: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary + '08',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    marginLeft: 12,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // Address Button Styles
  addressButton: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  addressButtonPlaceholder: {
    color: Colors.textTertiary,
  },
  // Address Search Modal Styles
  addressSearchContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addressSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  addressSearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  addressSearchInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  addressSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addressSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
    paddingVertical: 0,
  },
  searchLoadingIndicator: {
    paddingHorizontal: 8,
  },
  searchLoadingText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  searchClearButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  addressSearchResults: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addressSearchResultsContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  addressSearchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  resultSecondaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Empty States
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  minCharsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  minCharsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  searchHintContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  searchHintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  searchHintText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AddAddressScreen;