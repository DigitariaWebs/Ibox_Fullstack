import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text, Icon, Button } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface AddressesScreenProps {
  navigation: any;
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


const AddressesScreen: React.FC<AddressesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchAddresses();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const addressTypes = [
    { key: 'primary', label: 'Principal', icon: 'home', color: '#0AA5A8' },
    { key: 'secondary', label: 'Secondaire', icon: 'map-pin', color: '#8B5CF6' },
    { key: 'work', label: 'Bureau', icon: 'briefcase', color: '#3B82F6' },
    { key: 'other', label: 'Autre', icon: 'map-pin', color: '#8B5CF6' },
  ];

  const fetchAddresses = async () => {
    try {
      setError(null);
      const addressesData = await api.getUserAddresses();
      setAddresses(addressesData);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      if (err instanceof Error) {
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          setError('Please log in again to view your addresses.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load addresses. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const getAddressTypeInfo = (type: string) => {
    return addressTypes.find(t => t.key === type) || addressTypes[3];
  };

  const handleAddAddress = () => {
    navigation.navigate('AddAddressScreen', {
      onAddressUpdated: (newAddress: Address) => {
        setAddresses(prev => [...prev, newAddress]);
      }
    });
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddAddressScreen', {
      editingAddress: address,
      onAddressUpdated: (updatedAddress: Address) => {
        setAddresses(prev => prev.map(addr => 
          addr._id === address._id ? updatedAddress : addr
        ));
      }
    });
  };


  const handleDeleteAddress = (address: Address) => {
    const typeInfo = getAddressTypeInfo(address.type);
    Alert.alert(
      'Supprimer l\'adresse',
      `Êtes-vous sûr de vouloir supprimer cette adresse ${typeInfo.label.toLowerCase()}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUserAddress(address._id);
              setAddresses(prev => prev.filter(addr => addr._id !== address._id));
              Alert.alert('Succès', 'Adresse supprimée avec succès');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Impossible de supprimer l\'adresse'
              );
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await api.updateUserAddress(addressId, { isDefault: true });
      // Update local state
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId,
      })));
      Alert.alert('Succès', 'Adresse principale mise à jour');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de définir l\'adresse par défaut'
      );
    }
  };


  const AddressCard = ({ address }: { address: Address }) => {
    const typeInfo = getAddressTypeInfo(address.type);
    
    return (
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTypeInfo}>
            <View style={[styles.addressTypeIcon, { backgroundColor: typeInfo.color + '15' }]}>
              <Icon name={typeInfo.icon as any} type="Feather" size={18} color={typeInfo.color} />
            </View>
            <View style={styles.addressLabelContainer}>
              <Text style={styles.addressLabel}>{typeInfo.label}</Text>
              {address.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Principal</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.addressActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleEditAddress(address)}
            >
              <Icon name="edit-2" type="Feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleDeleteAddress(address)}
            >
              <Icon name="trash-2" type="Feather" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.addressContent}>
          <Text style={styles.addressStreet}>{address.address}</Text>
          {address.contactPerson && (
            <Text style={styles.addressDetails}>
              Contact: {address.contactPerson}
            </Text>
          )}
          {address.contactPhone && (
            <Text style={styles.addressDetails}>
              Téléphone: {address.contactPhone}
            </Text>
          )}
        </View>
        
        {!address.isDefault && (
          <TouchableOpacity 
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(address._id)}
          >
            <Icon name="star" type="Feather" size={14} color={Colors.primary} />
            <Text style={styles.setDefaultText}>Définir comme principal</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <Icon name="map-pin" type="Feather" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des adresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" type="Feather" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Réessayer"
            onPress={fetchAddresses}
            variant="primary"
            icon={<Icon name="refresh-cw" type="Feather" size={20} color={Colors.white} />}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes adresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
          <Icon name="plus" type="Feather" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Address Count */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statsCard}>
            <Icon name="map-pin" type="Feather" size={24} color={Colors.primary} />
            <Text style={styles.statsNumber}>{addresses.length}</Text>
            <Text style={styles.statsLabel}>
              {addresses.length === 1 ? 'adresse enregistrée' : 'adresses enregistrées'}
            </Text>
          </View>
        </Animated.View>

        {/* Addresses List */}
        <Animated.View
          style={[
            styles.addressesList,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="map-pin" type="Feather" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Aucune adresse</Text>
              <Text style={styles.emptyStateText}>
                Ajoutez votre première adresse pour faciliter vos livraisons
              </Text>
              <Button
                title="Ajouter une adresse"
                onPress={handleAddAddress}
                variant="primary"
                icon={<Icon name="plus" type="Feather" size={20} color={Colors.white} />}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            addresses.map((address) => (
              <AddressCard key={address._id} address={address} />
            ))
          )}
        </Animated.View>

        {/* Add Address Button */}
        {addresses.length > 0 && (
          <Animated.View
            style={[
              styles.addSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Button
              title="Ajouter une nouvelle adresse"
              onPress={handleAddAddress}
              variant="outline"
              icon={<Icon name="plus" type="Feather" size={20} color={Colors.primary} />}
              style={styles.addAddressButton}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addressesList: {
    paddingHorizontal: 20,
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressLabelContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  addressContent: {
    marginBottom: 12,
  },
  addressStreet: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  addressCountry: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
  },
  addSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addAddressButton: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});

export default AddressesScreen; 