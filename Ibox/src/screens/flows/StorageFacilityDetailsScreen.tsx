import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Button } from '../../ui';
import { Colors } from '../../config/colors';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  StorageFacilityDetails: {
    facility: StorageFacility;
    selectedUnit: any;
    selectedOption: any;
    service: string;
  };
  StorageSubscriptionSuccess: {
    facility: StorageFacility;
    selectedUnit: any;
    subscription: any;
    totalPrice: number;
    service: string;
  };
};

interface StorageFacilityDetailsScreenProps {
  navigation: NavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'StorageFacilityDetails'>;
}

interface StorageFacility {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  securityRating: number;
  availability: 'available' | 'limited' | 'full';
  amenities: string[];
  imageUrl?: string;
  priceMultiplier: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StorageFacilityDetailsScreen: React.FC<StorageFacilityDetailsScreenProps> = ({ navigation, route }) => {
  const { facility, selectedUnit, selectedOption } = route.params;
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Mock facility images
  const facilityImages = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&q=80',
    'https://images.unsplash.com/photo-1597062653740-3b9a5f47b108?w=800&q=80',
  ];

  const handleSimulatePayment = async () => {
    if (facility.availability === 'full') {
      Alert.alert('Unit Unavailable', 'This facility is currently full. Please select another facility.');
      return;
    }

    setIsProcessingPayment(true);
    
    console.log('💳 StorageFacilityDetails: Starting payment simulation');
    
    // Calculate total price
    const basePrice = parseInt(selectedUnit.price);
    const totalPrice = Math.round(basePrice * facility.priceMultiplier);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    console.log('✅ StorageFacilityDetails: Payment simulation complete');
    
    const subscriptionData = {
      id: `sub-${Date.now()}`,
      facilityId: facility.id,
      unitId: selectedUnit.id,
      startDate: new Date().toISOString(),
      monthlyPrice: totalPrice,
      duration: selectedOption.type,
    };
    
    setIsProcessingPayment(false);
    
    navigation.navigate('StorageSubscriptionSuccess', {
      facility,
      selectedUnit,
      subscription: subscriptionData,
      totalPrice,
      service: 'storage',
    });
  };

  const handleShowRoute = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}&travelmode=driving`;
    console.log('🗺️ StorageFacilityDetails: Opening Google Maps route:', url);
    
    Linking.openURL(url).catch((err) => {
      console.error('Error opening Google Maps:', err);
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const basePrice = parseInt(selectedUnit.price);
  const adjustedPrice = Math.round(basePrice * facility.priceMultiplier);
  const savings = basePrice - adjustedPrice;

  const securityFeatures = [
    'Keypad Access Control',
    '24/7 Video Surveillance',
    'Motion Detection Alarms',
    'Individual Unit Alarms',
    'On-site Security Personnel',
    'Perimeter Lighting',
  ];

  const facilityInfo = [
    { icon: 'location-outline', label: 'Address', value: facility.address },
    { icon: 'car-outline', label: 'Distance', value: `${facility.distance} km from you` },
    { icon: 'shield-checkmark-outline', label: 'Security Rating', value: `${facility.securityRating}/5.0 stars` },
    { icon: 'time-outline', label: 'Hours', value: '24/7 Access Available' },
    { icon: 'call-outline', label: 'Contact', value: '(418) 555-0123' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Facility Details</Text>
        
        <TouchableOpacity style={styles.routeButton} onPress={handleShowRoute}>
          <MaterialIcons name="directions" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Facility Images */}
        <Animated.View
          style={[
            styles.imageSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedImageIndex(index);
            }}
          >
            {facilityImages.map((imageUrl, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.facilityImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.imageGradient}
                />
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.imageIndicators}>
            {facilityImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Facility Info */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.facilityName}>{facility.name}</Text>
          
          <View style={styles.availabilityContainer}>
            <View style={[styles.availabilityDot, { backgroundColor: facility.availability === 'available' ? '#10B981' : facility.availability === 'limited' ? '#F59E0B' : '#EF4444' }]} />
            <Text style={styles.availabilityText}>
              {facility.availability === 'available' ? 'Units Available' : 
               facility.availability === 'limited' ? 'Limited Availability' : 'Currently Full'}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            {facilityInfo.map((info, index) => (
              <View key={index} style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name={info.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{info.label}</Text>
                  <Text style={styles.infoValue}>{info.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Selected Unit Details */}
        <Animated.View
          style={[
            styles.unitSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Your Selected Unit</Text>
          
          <View style={styles.unitCard}>
            <View style={styles.unitHeader}>
              <View>
                <Text style={styles.unitName}>{selectedUnit.name} Unit</Text>
                <Text style={styles.unitSize}>{selectedUnit.size} • {selectedUnit.dimensions}</Text>
              </View>
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${adjustedPrice}</Text>
                <Text style={styles.priceUnit}>/month</Text>
                {savings > 0 && (
                  <Text style={styles.originalPrice}>${basePrice}</Text>
                )}
              </View>
            </View>
            
            <Text style={styles.unitDescription}>{selectedUnit.description}</Text>
            
            {savings > 0 && (
              <View style={styles.savingsAlert}>
                <MaterialIcons name="local-offer" size={16} color="#10B981" />
                <Text style={styles.savingsText}>You save ${savings}/month at this location!</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Amenities */}
        <Animated.View
          style={[
            styles.amenitiesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Facility Amenities</Text>
          
          <View style={styles.amenitiesGrid}>
            {facility.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Security Features */}
        <Animated.View
          style={[
            styles.securitySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Security Features</Text>
          
          <View style={styles.securityGrid}>
            {securityFeatures.map((feature, index) => (
              <View key={index} style={styles.securityItem}>
                <MaterialIcons name="security" size={18} color={Colors.primary} />
                <Text style={styles.securityText}>{feature}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <Animated.View
        style={[
          styles.bottomActions,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.priceInfo}>
          <Text style={styles.totalLabel}>Monthly Subscription</Text>
          <Text style={styles.totalPrice}>${adjustedPrice}/month</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.routeActionButton} onPress={handleShowRoute}>
            <MaterialIcons name="directions" size={18} color={Colors.primary} />
            <Text style={styles.routeActionText}>Show Route</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.subscribeButton, facility.availability === 'full' && styles.subscribeButtonDisabled]}
            onPress={handleSimulatePayment}
            disabled={isProcessingPayment || facility.availability === 'full'}
          >
            {isProcessingPayment ? (
              <Text style={styles.subscribeButtonText}>Processing...</Text>
            ) : (
              <Text style={styles.subscribeButtonText}>
                {facility.availability === 'full' ? 'Not Available' : 'Simulate Payment'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  routeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    height: 220,
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 220,
  },
  facilityImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: Colors.white,
  },
  infoSection: {
    padding: 20,
  },
  facilityName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  unitSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  unitCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  unitName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  unitSize: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  unitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  savingsAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981' + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  amenitiesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amenityText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  securitySection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  securityGrid: {
    gap: 10,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  securityText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  routeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routeActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  subscribeButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default StorageFacilityDetailsScreen; 