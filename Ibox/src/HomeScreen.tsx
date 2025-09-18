import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, NavigationProp, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from './config/colors';
import { Fonts } from './config/fonts';
import { FloatingLocationPicker } from './components/FloatingLocationPicker';
import TopNavigation from './components/TopNavigation';
import ProfessionalSidebar from './components/ProfessionalSidebar';
import ServiceSelectionModal from './components/ServiceSelectionModal';
import NotificationModal from './components/NotificationModal';
import { useAuth } from './contexts/AuthContext';

interface Place {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
  type?: 'destination';
}

type RootStackParamList = {
  PackagePhoto: {
    service: string;
    startLocation: string;
    destination: any;
  };
  [key: string]: any;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<MapRegion>({
    latitude: 46.8139, // Quebec City default
    longitude: -71.2082,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<MapMarker | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [startLocation, setStartLocation] = useState<string>('');
  const [startLocationCoords, setStartLocationCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);
  const [basePricing, setBasePricing] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  
  // Driver tracking states
  const [trackingDriver, setTrackingDriver] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0); // in minutes
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [trackingDestination, setTrackingDestination] = useState<{latitude: number; longitude: number} | null>(null);

  const GOOGLE_API_KEY = 'AIzaSyAzPxqQ9QhUq_cmXkkcE-6DcgJn-EDngzI';

  const mustVerifyPhone = user?.userType === 'customer' && user?.isPhoneVerified === false;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Handle tracking driver parameter from navigation
  useEffect(() => {
    const params = route.params as any;
    if (params?.trackingDriver && !trackingActive) {
      console.log('🚗 Starting driver tracking:', params.trackingDriver);
      console.log('📍 Pickup location:', params.pickupLocation);
      console.log('📍 Pickup coordinates:', params.pickupLocationCoords);
      console.log('📍 Destination location:', params.destinationLocation);
      
      // Update local state with passed coordinates if available
      if (params.pickupLocationCoords) {
        setStartLocationCoords(params.pickupLocationCoords);
      }
      if (params.pickupLocation) {
        setStartLocation(params.pickupLocation);
      }
      
      initializeDriverTracking(
        params.trackingDriver, 
        params.pickupLocation, 
        params.destinationLocation
      );
    }
  }, [route.params]);

  // Cleanup tracking interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  const getCurrentLocation = async () => {
    try {
      console.log('🗺️ Requesting location permissions...');
      
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.log('❌ Location services disabled');
        setLocationPermissionGranted(false);
        setMapError('Location services are disabled. Using default location.');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        setLocationPermissionGranted(false);
        setMapError('Location permission denied. Using default location.');
        return;
      }

      console.log('✅ Location permission granted');
      setLocationPermissionGranted(true);

      console.log('📍 Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        maximumAge: 60000, // 1 minute cache
      });

      console.log('✅ Location obtained:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      // If user hasn't manually selected a pickup location yet, store GPS as default start coords
      setStartLocationCoords(prev => prev || {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setCurrentLocation(newLocation);
      setMapError(null);
      
      console.log('🗺️ Location updated successfully');
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setLocationPermissionGranted(false);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          setMapError('Location request timed out. Using default location.');
        } else if (error.message.includes('unavailable')) {
          setMapError('Location unavailable. Using default location.');
        } else {
          setMapError('Unable to get location. Using default location.');
        }
      } else {
        setMapError('Unknown location error. Using default location.');
      }
      
      console.log('🗺️ Using default location (Quebec City)');
    }
  };

  const getDirections = async (origin: {latitude: number; longitude: number}, destination: {latitude: number; longitude: number}) => {
    try {
      console.log('🗺️ Getting directions from', origin, 'to', destination);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🗺️ Directions response status:', data.status);

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        console.log('✅ Route calculated with', points.length, 'points');
        setRouteCoordinates(points);
      } else {
        console.log('⚠️ Directions API returned status:', data.status);
        // Fallback: create a simple straight line
        setRouteCoordinates([origin, destination]);
      }
    } catch (error) {
      console.error('❌ Error getting directions:', error);
      // Fallback: create a simple straight line
      setRouteCoordinates([origin, destination]);
    }
  };

  const decodePolyline = (encoded: string) => {
    const points: {latitude: number; longitude: number}[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Calculate base pricing from distance
  const calculateBasePricing = (distanceKm: number): number => {
    const baseFee = 5; // Base service fee
    const distanceFee = Math.max(3, distanceKm * 1.5); // Minimum $3, then $1.5/km
    return baseFee + distanceFee;
  };

  const searchPlaces = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      console.log('🔍 Searching for places:', query);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Search response status:', data.status);
      
      if (data.status === 'OK') {
        console.log('✅ Found', data.predictions?.length || 0, 'suggestions');
        setSuggestions(data.predictions || []);
      } else {
        console.log('⚠️ Search API returned status:', data.status, data.error_message);
        setSuggestions([]);
        
        // More detailed error handling
        switch (data.status) {
          case 'REQUEST_DENIED':
            console.error('❌ API request denied - check API key');
            break;
          case 'OVER_QUERY_LIMIT':
            console.error('❌ API quota exceeded');
            break;
          case 'ZERO_RESULTS':
            console.log('ℹ️ No results found for query:', query);
            break;
          case 'INVALID_REQUEST':
            console.error('❌ Invalid request parameters');
            break;
          default:
            console.error('❌ Unknown API error:', data.status);
        }
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      Alert.alert('Search Error', 'Unable to search for places. Please try again.');
    }
  };

  const getPlaceDetails = async (placeId: string, isStartLocation?: boolean) => {
    try {
      console.log('📍 Getting place details for:', placeId);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address,address_components,place_id,types&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📍 Place details response status:', data.status);
      
      if (data.status === 'OK' && data.result.geometry) {
        const location = data.result.geometry.location;
        const placeName = data.result.name || data.result.formatted_address;
        
        console.log('✅ Place location obtained:', {
          latitude: location.lat,
          longitude: location.lng,
          name: placeName,
          isStartLocation,
        });
        
        if (isStartLocation) {
          // Handle start location selection - store both name and coordinates
          setStartLocation(placeName);
          setStartLocationCoords({
            latitude: location.lat,
            longitude: location.lng,
          });
          setSuggestions([]);
          setSearchQuery('');
          console.log('✅ Start location coordinates stored:', {
            latitude: location.lat,
            longitude: location.lng,
            name: placeName,
          });
          console.log('🔍 DEBUG: startLocationCoords state updated');
        } else {
          // Handle destination selection
          const newLocation = {
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          
          setCurrentLocation(newLocation);
          
          const destinationMarker: MapMarker = {
            id: placeId,
            coordinate: {
              latitude: location.lat,
              longitude: location.lng,
            },
            title: placeName,
            description: data.result.formatted_address,
            type: 'destination',
          };
          
          setSelectedDestination(destinationMarker);
          setMarkers([destinationMarker]);
          
          // Get directions from start location to destination
          const startCoords = startLocationCoords || {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          };
          getDirections(
            startCoords,
            { latitude: location.lat, longitude: location.lng }
          );
          
          // Show service selection and back button
          setShowServiceSelection(true);
          setShowBackButton(true);
          setSuggestions([]);
          setSearchQuery('');
        }
      } else {
        console.log('⚠️ Place details API returned status:', data.status, data.error_message);
        Alert.alert('Place Error', 'Unable to get location details for this place.');
      }
    } catch (error) {
      console.error('❌ Place details error:', error);
      Alert.alert('Place Error', 'Unable to get place details. Please try again.');
    }
  };

  const renderMap = () => {
    try {
      console.log('🗺️ Rendering react-native-maps for platform:', Platform.OS);
      console.log('🗺️ Current location:', currentLocation);
      console.log('🗺️ Markers:', markers);
      console.log('🗺️ Location permission granted:', locationPermissionGranted);

      return (
        <MapView
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          region={currentLocation}
          showsUserLocation={locationPermissionGranted}
          showsMyLocationButton={true}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          onMapReady={() => {
            console.log('✅ react-native-maps ready');
            setMapError(null);
          }}
          onError={(error) => {
            console.error('❌ Map error:', error);
            setMapError(`Map error: ${error.message || 'Unknown error'}`);
          }}
          onRegionChangeComplete={(region) => {
            console.log('🗺️ Region changed:', region);
          }}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => console.log('📍 Marker pressed:', marker.title)}
              pinColor={getMarkerColor(marker.type)}
            />
          ))}
          
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.primary}
              strokeWidth={4}
              strokePattern={[1]}
            />
          )}

          {/* Driver marker for tracking */}
          {trackingActive && driverLocation && (
            <Marker
              coordinate={driverLocation}
              title={trackingDriver?.name || 'Driver'}
              description={`ETA: ${estimatedArrival} minutes`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={20} color="white" />
              </View>
            </Marker>
          )}

          {/* Route line from driver to destination when tracking */}
          {trackingActive && driverLocation && trackingDestination && (
            <Polyline
              coordinates={[
                driverLocation,
                trackingDestination
              ]}
              strokeColor={Colors.success}
              strokeWidth={3}
              strokePattern={[10, 5]}
            />
          )}
        </MapView>
      );
    } catch (error) {
      console.error('❌ Error rendering map:', error);
      return (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Text style={styles.errorText}>
            Error loading map: {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
          <Text style={[styles.errorText, { marginTop: 10, fontSize: 14 }]}>
            Current location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        </View>
      );
    }
  };

  const getMarkerColor = (type?: MapMarker['type']): string => {
    return type === 'destination' ? '#FF6B6B' : '#1E90FF';
  };

  const handleMenuPress = () => {
    if (mustVerifyPhone) {
      navigation.navigate('PhoneVerification' as never);
      return;
    }
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    if (mustVerifyPhone) {
      navigation.navigate('PhoneVerification' as never);
      return;
    }
    console.log('🚀 Notifications pressed');
    setNotificationModalVisible(true);
  };

  const handleSidebarNavigate = (screen: string) => {
    console.log('🚀 Navigate to:', screen);
    
    // Navigate to the selected screen
    switch(screen) {
      case 'HomeScreen':
        // Already on home screen, do nothing
        break;
      case 'Orders':
        navigation.navigate('Orders' as never);
        break;
      case 'Tracking':
        navigation.navigate('Tracking' as never);
        break;
      case 'Profile':
        navigation.navigate('Profile' as never);
        break;
      case 'Services':
        navigation.navigate('Services');
        break;
      case 'PaymentMethods':
        navigation.navigate('PaymentMethods');
        break;
      case 'Addresses':
        navigation.navigate('Addresses');
        break;
      case 'HelpSupport':
        navigation.navigate('HelpSupport');
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      default:
        console.log('🚀 Unknown screen:', screen);
        break;
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    console.log('🚀 Service selected:', serviceId);
    setSelectedService(serviceId);
  };

  const handleServiceContinue = () => {
    console.log('🚀 Service confirmed:', selectedService);
    console.log('🔍 DEBUG: Navigating with startLocationCoords:', startLocationCoords);
    console.log('🔍 DEBUG: Navigating with destination:', selectedDestination);
    setShowBackButton(false);
    
    // Ensure we always have a valid set of pickup coordinates.
    // If the user has not explicitly chosen a start location yet, fall back to the
    // current GPS/location that the map is centered on. This guarantees downstream
    // screens (e.g. DriverSearch) always receive a pickup point to work with.
    const fallbackPickupCoords = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    };

    const pickupCoordsToSend =
      startLocationCoords && startLocationCoords.latitude != null && startLocationCoords.longitude != null
        ? startLocationCoords
        : fallbackPickupCoords;
    
    // Ensure startLocation is always set
    const finalStartLocation = (startLocation && startLocation.trim() && startLocation.trim() !== '') 
      ? startLocation.trim() 
      : 'Current Location';
    
    const baseParams = {
      service: selectedService,
      startLocation: finalStartLocation,
      startLocationCoords: pickupCoordsToSend,
      destination: selectedDestination,
      basePricing: basePricing,
      distanceKm: distanceKm,
    };

    console.log('🚀 HomeScreen: Sending params to service flow:', {
      service: selectedService,
      startLocation: finalStartLocation,
      startLocationCoords: pickupCoordsToSend,
      hasDestination: !!selectedDestination,
    });

    // Route to service-specific flows
    switch(selectedService) {
      case 'express':
        navigation.navigate('ExpressFlow', baseParams);
        break;
      case 'standard': 
        navigation.navigate('StandardFlow', baseParams);
        break;
      case 'moving':
        navigation.navigate('MovingFlow', baseParams);
        break;
      default:
        // Fallback to original flow for any undefined services
        navigation.navigate('PackagePhoto', baseParams);
        break;
    }
  };

  const handleBackPress = () => {
    if (showServiceSelection) {
      setShowServiceSelection(false);
      setShowBackButton(false);
      // Open search modal to let user change locations
      setModalVisible(true);
    }
  };

  // Driver tracking functions
  const initializeDriverTracking = (driver: any, pickupLocation?: string, destinationLocation?: any) => {
    setTrackingDriver(driver);
    setTrackingActive(true);
    
    // Get coordinates - prioritize the passed coordinates from tracking params
    const params = route.params as any;
    const pickupCoords = params?.pickupLocationCoords || getPickupCoordinates(pickupLocation);
    const destinationCoords = getDestinationCoordinates(destinationLocation);
    
    console.log('📍 Using pickup coords:', pickupCoords);
    console.log('📍 Using destination coords:', destinationCoords);
    
    // Validate coordinates before proceeding
    if (!pickupCoords.latitude || !pickupCoords.longitude) {
      console.error('❌ Invalid pickup coordinates:', pickupCoords);
      Alert.alert('Error', 'Invalid pickup location coordinates. Cannot start tracking.');
      return;
    }
    
    if (!destinationCoords.latitude || !destinationCoords.longitude) {
      console.error('❌ Invalid destination coordinates:', destinationCoords);
      Alert.alert('Error', 'Invalid destination coordinates. Cannot start tracking.');
      return;
    }
    
    // Set initial driver location (randomly positioned 2-5km away from pickup)
    const distance = 0.02 + Math.random() * 0.03; // 2-5km in degrees
    const angle = Math.random() * 2 * Math.PI;
    const initialDriverLocation = {
      latitude: pickupCoords.latitude + Math.cos(angle) * distance,
      longitude: pickupCoords.longitude + Math.sin(angle) * distance,
    };
    setDriverLocation(initialDriverLocation);
    
    // Calculate realistic ETA based on distance from driver to pickup location
    const driverToPickupDistance = calculateDistance(initialDriverLocation, pickupCoords);
    const initialETA = Math.max(5, Math.min(25, driverToPickupDistance * 2 + Math.random() * 5)); // 2 min per km + randomness
    setEstimatedArrival(Math.round(initialETA));
    
    console.log(`🚗 Driver initialized: ${driverToPickupDistance.toFixed(1)}km away from pickup, ${Math.round(initialETA)}min ETA`);
    
    // Store pickup location as target for driver movement
    setTrackingDestination(pickupCoords);
    
    // Update map region to center on pickup location if it's not Quebec default
    if (pickupCoords.latitude !== 46.8139 || pickupCoords.longitude !== -71.2082) {
      console.log('📍 Updating map region to pickup location:', pickupCoords);
      setCurrentLocation({
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    
    // Start simulation - driver moves toward pickup location
    startDriverMovementSimulation(initialDriverLocation, initialETA, pickupCoords);
  };

  const getPickupCoordinates = (pickupLocation?: string) => {
    console.log('🔍 DEBUG: getPickupCoordinates called with:', pickupLocation);
    console.log('🔍 DEBUG: startLocationCoords state:', startLocationCoords);
    console.log('🔍 DEBUG: currentLocation state:', currentLocation);
    
    // PRIORITY 1: Use stored start location coordinates if available (this is the real GPS location)
    if (startLocationCoords && startLocationCoords.latitude && startLocationCoords.longitude) {
      console.log('📍 Using stored start location coordinates:', startLocationCoords);
      return startLocationCoords;
    }
    
    // PRIORITY 2: Use current GPS location if it's not the Quebec default
    if (currentLocation.latitude !== 46.8139 || currentLocation.longitude !== -71.2082) {
      console.log('📍 Using current GPS location:', currentLocation);
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };
    }
    
    // FALLBACK: Quebec coordinates (only if GPS failed completely)
    console.log('📍 WARNING: Using Quebec fallback coordinates - location permission may be denied');
    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    };
  };

  const getDestinationCoordinates = (destinationLocation?: any) => {
    // Use the real destination coordinates from the booking
    if (destinationLocation?.coordinate) {
      return destinationLocation.coordinate;
    }
    // Fallback to current location if no destination available
    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    };
  };

  // Calculate distance using Google Distance Matrix API
  const calculateDistanceWithGoogle = async (origin: {latitude: number; longitude: number}, destination: {latitude: number; longitude: number}): Promise<number> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&units=metric&key=${GOOGLE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;
        console.log('🗺️ Google Distance Matrix:', distanceInKm.toFixed(2), 'km');
        return distanceInKm;
      } else {
        console.log('⚠️ Distance Matrix API error, falling back to Haversine');
        // Fallback to Haversine formula
        return calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
      }
    } catch (error) {
      console.error('❌ Error calculating distance with Google API:', error);
      // Fallback to Haversine formula
      return calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    }
  };

  const startDriverMovementSimulation = (initialLocation: {latitude: number; longitude: number}, initialETA: number, targetCoords: {latitude: number; longitude: number}) => {
    let currentDriverPos = { ...initialLocation };
    let currentETA = initialETA;
    
    const interval = setInterval(() => {
      // Calculate movement towards target location (pickup)
      const targetLat = targetCoords.latitude;
      const targetLng = targetCoords.longitude;
      
      // Move driver closer to target (simulate 30-50 km/h speed)
      const stepSize = 0.0008 + Math.random() * 0.0004; // Varies speed slightly
      const deltaLat = targetLat - currentDriverPos.latitude;
      const deltaLng = targetLng - currentDriverPos.longitude;
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
      
      if (distance > 0.001) { // Still moving towards target
        // Move towards target with some randomness for realistic movement
        const progress = stepSize / distance;
        currentDriverPos = {
          latitude: currentDriverPos.latitude + deltaLat * progress + (Math.random() - 0.5) * 0.0001,
          longitude: currentDriverPos.longitude + deltaLng * progress + (Math.random() - 0.5) * 0.0001,
        };
        
        // Update ETA (decrease by 0.5-1.5 minutes every update)
        currentETA = Math.max(0, currentETA - (0.5 + Math.random()));
        
        setDriverLocation(currentDriverPos);
        setEstimatedArrival(Math.round(currentETA));
        
        console.log(`🚗 Driver moving: ETA ${Math.round(currentETA)}min, Distance: ${distance.toFixed(4)}`);
      } else {
        // Driver arrived at pickup location
        console.log('🎉 Driver arrived at pickup location!');
        setEstimatedArrival(0);
        clearInterval(interval);
        setTrackingInterval(null);
        
        // Show arrival notification
        Alert.alert(
          '🎉 Driver Arrived!',
          `${trackingDriver?.name} has reached the pickup location.`,
          [
            { text: 'OK', onPress: () => stopDriverTracking() }
          ]
        );
      }
    }, 3000); // Update every 3 seconds
    
    setTrackingInterval(interval);
  };

  const stopDriverTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setTrackingActive(false);
    setTrackingDriver(null);
    setDriverLocation(null);
    setTrackingDestination(null);
    setEstimatedArrival(0);
    console.log('🛑 Driver tracking stopped');
  };

  const handleChangeStartLocation = () => {
    console.log('🚀 Changing start location');
  };

  const handleResetLocations = () => {
    console.log('🔄 Resetting locations');
    // Clear all location data
    setStartLocation('');
    setStartLocationCoords(null);
    setSelectedDestination(null);
    setMarkers([]);
    setRouteCoordinates([]);
    setShowServiceSelection(false);
    setShowBackButton(false);
    // Open search modal to select new locations
    setModalVisible(true);
  };

  // Service helper functions
  const services = [
    {
      id: 'express',
      title: 'Express Delivery',
      icon: 'flash',
      iconFamily: 'Ionicons',
      color: '#FF6B6B',
    },
    {
      id: 'standard',
      title: 'Standard Delivery',
      icon: 'cube-outline',
      iconFamily: 'Ionicons',
      color: '#4ECDC4',
    },
    {
      id: 'moving',
      title: 'Moving Service',
      icon: 'local-shipping',
      iconFamily: 'MaterialIcons',
      color: '#45B7D1',
    },
  ];

  const getServiceColor = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.color || Colors.primary;
  };

  const getServiceTitle = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.title || 'Selected Service';
  };

  const renderServiceIcon = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return null;
    
    const IconComponent = service.iconFamily === 'Ionicons' ? Ionicons : MaterialIcons;
    return (
      <IconComponent
        name={service.icon as any}
        size={20}
        color="white"
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}
      
      {/* Top Navigation */}
      <TopNavigation 
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
        showBackButton={showBackButton}
        onBackPress={handleBackPress}
        notificationCount={notificationCount}
      />

      {/* Floating Verify Phone Button for customers (unverified) */}
      {user?.userType === 'customer' && user?.isPhoneVerified === false && !trackingActive && (
        <View style={styles.verifyPhoneContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PhoneVerification' as never)}
            style={styles.verifyPhoneButton}
          >
            <LinearGradient
              colors={[Colors.primary, '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyPhoneGradient}
            >
              <Ionicons name="shield-checkmark" size={18} color="white" />
              <Text style={styles.verifyPhoneText}>Verify your phone</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      {mapError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{mapError}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={getCurrentLocation}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Blocking overlay when customer phone not verified (intercepts all touches) */}
      {mustVerifyPhone && (
        <View style={styles.blockedOverlay} pointerEvents="auto" />
      )}
      
      {/* Bottom Action Buttons */}
      {selectedService && (
        // Service Selected - Show two buttons
        <View style={styles.serviceButtonsContainer}>
          <TouchableOpacity
            style={[styles.selectedServiceButton, { backgroundColor: getServiceColor(selectedService) }]}
            onPress={() => setSelectedService(null)}
            activeOpacity={0.8}
          >
            <View style={styles.serviceButtonIcon}>
              {renderServiceIcon(selectedService)}
            </View>
            <Text style={styles.selectedServiceText}>{getServiceTitle(selectedService)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleServiceContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Location Picker (Hidden when tracking driver) */}
      <FloatingLocationPicker
        visible={!selectedService && !trackingActive && !mustVerifyPhone} // Hidden when service selected, tracking, or not verified
        onClose={() => {
          // This would typically close the modal, but since it's always visible when no service is selected,
          // we don't need to do anything here
        }}
        onLocationSelect={async (location) => {
          // Handle location selection
          console.log('Location selected:', location);
          
          let destinationCoords = {
            latitude: location.latitude || currentLocation.latitude,
            longitude: location.longitude || currentLocation.longitude,
          };
          
          // If we have a place_id, fetch real coordinates from Google Place Details
          if (location.place_id) {
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.place_id}&fields=geometry,name,formatted_address&key=${GOOGLE_API_KEY}`
              );
              const data = await response.json();
              
              if (data.status === 'OK' && data.result.geometry) {
                destinationCoords = {
                  latitude: data.result.geometry.location.lat,
                  longitude: data.result.geometry.location.lng,
                };
                console.log('✅ Real coordinates fetched:', destinationCoords);
              }
            } catch (error) {
              console.error('❌ Error fetching place details:', error);
            }
          }
          
          // Store the selected destination
          const destinationMarker = {
            id: location.place_id || 'selected-location',
            coordinate: destinationCoords,
            title: location.name || location.description || 'Selected Location',
            description: location.address || location.description || '',
            type: 'destination' as const,
          };
          
          setSelectedDestination(destinationMarker);
          setMarkers([destinationMarker]);
          
          // Calculate base distance pricing
          const pickupCoords = startLocationCoords || {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          };
          
          // Calculate distance using Google API
          calculateDistanceWithGoogle(pickupCoords, destinationMarker.coordinate)
            .then((calculatedDistance) => {
              const calculatedBasePricing = calculateBasePricing(calculatedDistance);
              console.log(`🎯 Base pricing calculated: ${calculatedDistance.toFixed(2)}km = $${calculatedBasePricing.toFixed(2)}`);
              
              // Store pricing data
              setDistanceKm(calculatedDistance);
              setBasePricing(calculatedBasePricing);
            })
            .catch((error) => {
              console.error('❌ Error calculating distance:', error);
              // Fallback to simple calculation
              const fallbackDistance = 5; // Default 5km
              const fallbackPricing = calculateBasePricing(fallbackDistance);
              setDistanceKm(fallbackDistance);
              setBasePricing(fallbackPricing);
            });
          
          // Get directions and show polyline
          getDirections(pickupCoords, destinationMarker.coordinate);
          
          // Show service selection modal with base pricing
          setShowServiceSelection(true);
        }}
      />

      <ProfessionalSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
        activeScreen="HomeScreen"
      />

      <ServiceSelectionModal
        visible={showServiceSelection}
        onClose={() => {
          setShowServiceSelection(false);
          setShowBackButton(false);
        }}
        onSelectService={handleServiceSelect}
        onReset={handleResetLocations}
        destination={selectedDestination?.title}
      />

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        onNotificationCountChange={setNotificationCount}
      />

      {/* Driver Tracking Panel */}
      {trackingActive && trackingDriver && (
        <Animated.View 
          style={styles.driverTrackingPanel}
          entering={SlideInDown.springify()}
        >
          {/* Handle bar */}
          <View style={styles.trackingHandleBar} />
          
          {/* Status Header */}
          <View style={styles.trackingStatusHeader}>
            <View style={styles.trackingStatusBadge}>
              <View style={styles.trackingLiveDot} />
              <Text style={styles.trackingStatusText}>
                {estimatedArrival > 0 ? 'Driver En Route' : 'Driver Arrived'}
              </Text>
            </View>
            <View style={styles.trackingETABadge}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.trackingETA}>
                {estimatedArrival > 0 ? `${estimatedArrival} min` : 'Here'}
              </Text>
            </View>
          </View>
          
          {/* Driver Info Card */}
          <View style={styles.driverInfoCard}>
            <View style={styles.driverMainInfo}>
              <View style={styles.driverAvatarContainer}>
                <LinearGradient
                  colors={[Colors.primary, '#00A896']}
                  style={styles.driverAvatarGradient}
                >
                  <Text style={styles.driverInitials}>
                    {trackingDriver.name?.charAt(0) || 'D'}
                  </Text>
                </LinearGradient>
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.driverDetailsSection}>
                <Text style={styles.driverName}>{trackingDriver.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.ratingText}>4.8 • 342 trips</Text>
                </View>
              </View>
              
              <View style={styles.driverActionsContainer}>
                <TouchableOpacity style={styles.driverActionBtn}>
                  <LinearGradient
                    colors={[Colors.primary, '#00A896']}
                    style={styles.actionBtnGradient}
                  >
                    <Ionicons name="call" size={18} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.driverActionBtn}>
                  <View style={styles.actionBtnOutline}>
                    <Ionicons name="chatbubble" size={18} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Vehicle Info */}
            <View style={styles.vehicleInfoRow}>
              <View style={styles.vehicleIcon}>
                <Image 
                  source={require('../assets/images/car.png')}
                  style={styles.vehicleImage}
                />
              </View>
              <View style={styles.vehicleDetailsText}>
                <Text style={styles.vehicleType}>{trackingDriver.vehicleType}</Text>
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{trackingDriver.vehiclePlate}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.cancelTripButton}
                onPress={stopDriverTracking}
              >
                <Text style={styles.cancelTripText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Progress Bar */}
          {estimatedArrival > 0 && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.max(10, 100 - (estimatedArrival / 15) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Driver is on the way to your location
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  blockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 998,
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 120 : 110,
    alignItems: 'center',
  },
  verifyPhoneContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 100,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  verifyPhoneButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  verifyPhoneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  verifyPhoneText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 110,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Floating location picker trigger button
  floatingTrigger: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  triggerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  triggerMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  triggerPlayfairText: {
    fontSize: 20,
    fontFamily: Fonts.PlayfairDisplay.Variable,
    color: Colors.textPrimary,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  triggerSubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  triggerArrowContainer: {
    marginLeft: 12,
  },
  serviceButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  selectedServiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  serviceButtonIcon: {
    marginRight: 8,
  },
  selectedServiceText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    gap: 6,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  // Driver tracking styles
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  driverTrackingPanel: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  trackingHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  trackingStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  trackingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackingLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  trackingStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
    fontFamily: Fonts.SFProDisplay?.SemiBold || 'System',
  },
  trackingETABadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackingETA: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  driverInfoCard: {
    paddingHorizontal: 20,
  },
  driverMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  driverAvatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: 'white',
  },
  driverDetailsSection: {
    flex: 1,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  driverActionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  driverActionBtn: {
    width: 40,
    height: 40,
  },
  actionBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '08',
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  vehicleDetailsText: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Fonts.SFProDisplay?.SemiBold || 'System',
  },
  plateBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  plateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.SFProDisplay?.SemiBold || 'System',
  },
  cancelTripButton: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cancelTripText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF4444',
    fontFamily: Fonts.SFProDisplay?.SemiBold || 'System',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
});

export default HomeScreen;
