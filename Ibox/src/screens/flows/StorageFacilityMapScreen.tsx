import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Button } from '../../ui';
import { Colors } from '../../config/colors';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  StorageFacilityMap: {
    selectedUnit: any;
    selectedOption: any;
    service: string;
  };
  StorageFacilityDetails: {
    facility: StorageFacility;
    selectedUnit: any;
    selectedOption: any;
    service: string;
  };
};

interface StorageFacilityMapScreenProps {
  navigation: NavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'StorageFacilityMap'>;
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

const StorageFacilityMapScreen: React.FC<StorageFacilityMapScreenProps> = ({ navigation, route }) => {
  const { selectedUnit, selectedOption } = route.params;
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<StorageFacility | null>(null);
  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [showNearMe, setShowNearMe] = useState(false);
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      generateFacilities();
    }
  }, [userLocation]);

  useEffect(() => {
    // Fit map to show all facilities when they're loaded
    if (facilities.length > 0 && mapRef.current && userLocation) {
      setTimeout(() => {
        const coords = facilities.map(f => ({
          latitude: f.latitude,
          longitude: f.longitude,
        }));
        
        // Include user location
        coords.push({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
        
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });
      }, 1000); // Delay to ensure map is fully loaded
    }
  }, [facilities, userLocation]);

  useEffect(() => {
    if (selectedFacility) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [selectedFacility]);

  const getCurrentLocation = async () => {
    try {
      console.log('📍 StorageFacilityMap: Requesting location permission');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to show nearby storage facilities');
        // Use default Quebec City location
        setUserLocation({
          coords: {
            latitude: 46.8139,
            longitude: -71.2082,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
        return;
      }

      console.log('📍 StorageFacilityMap: Getting current location');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('📍 StorageFacilityMap: Location obtained:', location.coords);
      setUserLocation(location);
    } catch (error) {
      console.error('📍 StorageFacilityMap: Location error:', error);
      // Fallback to Quebec City
      setUserLocation({
        coords: {
          latitude: 46.8139,
          longitude: -71.2082,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    }
  };

  const generateFacilities = async () => {
    if (!userLocation) return;

    // Dynamic generation around user's current position
    const baseNames = [
      'SecureSpace',
      'StockBox',
      'Guardian Storage',
      'Urban Storage Hub',
      'MaxiStock',
      'VaultKeep',
      'SafeHaven',
      'MetroStorage',
    ];

    const amenitiesList = [
      ['24/7 Access', 'Climate Control', 'Security Cameras'],
      ['Drive-up Access', 'Moving Supplies', 'Insurance'],
      ['Elevator Access', 'Loading Dock', 'Package Acceptance'],
      ['Indoor Units', 'Outdoor Units', 'Vehicle Storage'],
      ['Temperature Control', 'Humidity Control', 'Fire Protection'],
      ['Ground Floor Access', 'Moving Equipment', 'Mail Service'],
      ['Covered Loading', 'Digital Access', 'Video Monitoring'],
      ['Business Hours', 'Online Payment', 'Month-to-Month'],
    ];

    const generatedFacilities: StorageFacility[] = [];

    // Generate 7–8 facilities within ~5 km radius
    const FACILITY_COUNT = 8;
    const radiusKm = 5; // ~5 km radius
    const radiusDeg = radiusKm / 111; // Rough conversion for degrees

    for (let i = 0; i < FACILITY_COUNT; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusDeg;

      const lat = userLocation.coords.latitude + distance * Math.cos(angle);
      const lng = userLocation.coords.longitude + distance * Math.sin(angle);

      // Calculate straight-line distance in km
      const distanceKm = Math.sqrt(
        Math.pow((lat - userLocation.coords.latitude) * 111, 2) +
        Math.pow((lng - userLocation.coords.longitude) * 111 * Math.cos(userLocation.coords.latitude * Math.PI / 180), 2)
      );

      // Reverse-geocode for a friendly address (best-effort)
      let addressLabel = 'Nearby Location';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          const g = geocode[0];
          addressLabel = `${g.street || g.name || g.streetNumber || ''} ${g.city || g.region || ''}`.trim();
        }
      } catch (err) {
        console.warn('Reverse geocode failed:', err);
      }

      const availability: 'available' | 'limited' | 'full' =
        Math.random() > 0.8 ? 'full' : Math.random() > 0.6 ? 'limited' : 'available';

      generatedFacilities.push({
        id: `facility-${i}`,
        name: `${baseNames[i % baseNames.length]} ${i + 1}`,
        address: addressLabel,
        latitude: lat,
        longitude: lng,
        distance: Math.round(distanceKm * 10) / 10,
        securityRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 – 5.0
        availability,
        amenities: amenitiesList[i % amenitiesList.length],
        priceMultiplier: Math.round((Math.random() * 0.4 + 0.8) * 100) / 100, // 0.8 – 1.2
      });
    }

    generatedFacilities.sort((a, b) => a.distance - b.distance);
    console.log('🏢 StorageFacilityMap: Generated facilities near user:', generatedFacilities.slice(0, 3));
    setFacilities(generatedFacilities);
  };

  const handleMarkerPress = (facility: StorageFacility) => {
    console.log('🏢 StorageFacilityMap: Facility selected:', facility.name);
    setSelectedFacility(facility);
  };

  const handleFacilitySelect = () => {
    if (selectedFacility) {
      console.log('🏢 StorageFacilityMap: Navigating to facility details');
      navigation.navigate('StorageFacilityDetails', {
        facility: selectedFacility,
        selectedUnit,
        selectedOption,
        service: 'storage',
      });
    }
  };

  const handleNearMeFilter = () => {
    setShowNearMe(!showNearMe);
    
    if (!showNearMe && facilities.length > 0) {
      // Show only facilities within 5km
      const nearbyFacilities = facilities.filter(f => f.distance <= 5);
      if (nearbyFacilities.length > 0 && mapRef.current) {
        // Zoom to show nearby facilities
        const coords = nearbyFacilities.map(f => ({
          latitude: f.latitude,
          longitude: f.longitude,
        }));
        
        if (userLocation) {
          coords.push({
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          });
        }
        
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    }
  };

  const getMarkerColor = (availability: string) => {
    switch (availability) {
      case 'available': return '#10B981';
      case 'limited': return '#F59E0B';
      case 'full': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Available';
      case 'limited': return 'Limited';
      case 'full': return 'Full';
      default: return 'Unknown';
    }
  };

  const filteredFacilities = showNearMe 
    ? facilities.filter(f => f.distance <= 5)
    : facilities;

  const initialRegion: Region | undefined = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.2, // Wider view to show more facilities
    longitudeDelta: 0.2,
  } : undefined;

  if (!userLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Storage Facilities</Text>
          <Text style={styles.headerSubtitle}>{filteredFacilities.length} locations found</Text>
        </View>

        <TouchableOpacity 
          style={[styles.filterButton, showNearMe && styles.filterButtonActive]} 
          onPress={handleNearMeFilter}
        >
          <MaterialIcons 
            name="near-me" 
            size={20} 
            color={showNearMe ? Colors.white : Colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.id}
            coordinate={{
              latitude: facility.latitude,
              longitude: facility.longitude,
            }}
            onPress={() => handleMarkerPress(facility)}
          >
            <View style={styles.customMarker}>
              <View style={[styles.markerPin, { backgroundColor: getMarkerColor(facility.availability) }]}>
                <MaterialIcons name="storage" size={16} color={Colors.white} />
              </View>
              <View style={[styles.markerShadow, { borderTopColor: getMarkerColor(facility.availability) }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Selected Facility Details */}
      {selectedFacility && (
        <Animated.View 
          style={[
            styles.facilityDetails,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.facilityHeader}>
            <View style={styles.facilityInfo}>
              <Text style={styles.facilityName}>{selectedFacility.name}</Text>
              <Text style={styles.facilityAddress}>{selectedFacility.address}</Text>
              
              <View style={styles.facilityMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{selectedFacility.distance} km away</Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{selectedFacility.securityRating}/5.0 security</Text>
                </View>
                
                <View style={[styles.metaItem, styles.availabilityItem]}>
                  <View style={[styles.availabilityDot, { backgroundColor: getMarkerColor(selectedFacility.availability) }]} />
                  <Text style={styles.metaText}>{getAvailabilityText(selectedFacility.availability)}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedFacility(null)}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amenitiesScroll}>
            {selectedFacility.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.facilityActions}>
            <TouchableOpacity style={styles.detailsButton} onPress={handleFacilitySelect}>
              <Text style={styles.detailsButtonText}>View Details & Book</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  markerShadow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  facilityDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '45%',
  },
  facilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  facilityAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  facilityMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  availabilityItem: {
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  amenitiesScroll: {
    marginBottom: 16,
  },
  amenityChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  amenityText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  facilityActions: {
    gap: 12,
  },
  detailsButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default StorageFacilityMapScreen; 