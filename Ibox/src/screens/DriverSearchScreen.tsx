import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  ZoomIn,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DriverSearchScreenProps {
  navigation: any;
  route: any;
}

interface Driver {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  vehicleType?: string;
  vehiclePlate?: string;
  vehicleIcon?: string;
  rotation?: number;
}

const DriverSearchScreen: React.FC<DriverSearchScreenProps> = ({
  navigation,
  route,
}) => {
  const [driversFound, setDriversFound] = useState<Driver[]>([]);
  const [searchComplete, setSearchComplete] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchStep, setSearchStep] = useState(0);
  const mapRef = useRef<MapView>(null);

  // Get service type and pickup location from route params
  const getServiceType = () => {
    const { service, serviceType } = route.params || {};
    return serviceType || service || 'express';
  };

  const [pickupLocation, setPickupLocation] = useState<{latitude:number; longitude:number; latitudeDelta:number; longitudeDelta:number} | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const scannerRotation = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Search steps for better UX
  const searchSteps = [
    'Initializing search...',
    'Scanning nearby area...',
    'Finding available drivers...',
    'Matching best drivers...',
    'Almost there...',
  ];

  // Determine pickup location on mount
  useEffect(() => {
    (async () => {
      const params = route.params || {};
      console.log('🔍 DriverSearch: All route params received:', JSON.stringify(params, null, 2));
      
      if (
        params.startLocationCoords &&
        typeof params.startLocationCoords.latitude === 'number' &&
        typeof params.startLocationCoords.longitude === 'number'
      ) {
        const { latitude, longitude } = params.startLocationCoords;
        console.log('✅ DriverSearch: Using provided coordinates:', { latitude, longitude });
        setPickupLocation({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        return;
      }

      console.log('⚠️ DriverSearch: No valid startLocationCoords, requesting device location');
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setPickupLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
          return;
        }
      } catch (err) {
        console.warn('❌ DriverSearch: Location fetch failed:', err);
      }

      // Fallback to Quebec City
      setPickupLocation({ latitude: 46.8139, longitude: -71.2082, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    })();
  }, []);

  // Start search once pickupLocation known
  useEffect(() => {
    if (pickupLocation) {
      setSearchText(searchSteps[0]);
      startDriverSearch();
      startAnimations();
    }
  }, [pickupLocation]);

  const currentServiceType = getServiceType();

  // Vehicle configurations by service type
  const getVehiclesByService = (serviceType: string) => {
    switch (serviceType) {
      case 'moving':
        return {
          searchText: 'Finding professional movers...',
          completeText: 'Perfect mover found!',
          vehicles: [
            { type: 'Professional Moving Truck', plate: 'MOV-', icon: 'cube-outline' },
            { type: 'Mercedes Sprinter XL', plate: 'SPR-', icon: 'bus-outline' },
            { type: 'Heavy Duty Van', plate: 'HDV-', icon: 'cube-outline' },
          ]
        };
      case 'storage':
        return {
          searchText: 'Locating storage specialists...',
          completeText: 'Storage expert found!',
          vehicles: [
            { type: 'Storage Transport Van', plate: 'STO-', icon: 'bus-outline' },
            { type: 'Secure Cargo Vehicle', plate: 'SEC-', icon: 'bus-outline' },
          ]
        };
      case 'standard':
        return {
          searchText: 'Searching for reliable drivers...',
          completeText: 'Great driver found!',
          vehicles: [
            { type: 'Toyota Camry', plate: 'STD-', icon: 'car-outline' },
            { type: 'Honda Accord', plate: 'HND-', icon: 'car-outline' },
            { type: 'Tesla Model 3', plate: 'TSL-', icon: 'car-outline' },
          ]
        };
      default: // express
        return {
          searchText: 'Finding fastest couriers...',
          completeText: 'Lightning-fast courier found!',
          vehicles: [
            { type: 'Express Bike', plate: 'EXP-', icon: 'speedometer-outline' },
            { type: 'Smart EV', plate: 'SMT-', icon: 'car-sport-outline' },
            { type: 'Quick Delivery', plate: 'QCK-', icon: 'car-outline' },
          ]
        };
    }
  };

  const vehicleConfig = getVehiclesByService(currentServiceType);

  const startAnimations = () => {
    // Pulse animation for center marker
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(4, { duration: 2000, easing: Easing.out(Easing.cubic) })
      ),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) })
      ),
      -1,
      false
    );

    // Scanner rotation
    scannerRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Progress bar
    progressWidth.value = withTiming(100, { duration: 8000, easing: Easing.inOut(Easing.ease) });

    // Glow effect
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  };

  const startDriverSearch = () => {
    // Update search steps
    const stepTimings = [0, 1500, 3000, 4500, 6000];
    stepTimings.forEach((timing, index) => {
      setTimeout(() => {
        runOnJS(setSearchStep)(index);
        runOnJS(setSearchText)(searchSteps[index]);
      }, timing);
    });

    // Simulate finding drivers with staggered animations
    setTimeout(() => runOnJS(addDriver)(generateDriver(1)), 2000);
    setTimeout(() => runOnJS(addDriver)(generateDriver(2)), 3500);
    setTimeout(() => runOnJS(addDriver)(generateDriver(3)), 5000);
    setTimeout(() => runOnJS(addDriver)(generateDriver(4)), 6500);
    
    setTimeout(() => {
      runOnJS(setSearchText)('Found the perfect match!');
      runOnJS(setSearchComplete)(true);
    }, 7500);
    
    setTimeout(() => runOnJS(completeSearch)(), 8500);
  };

  const generateDriver = (id: number): Driver => {
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = Math.random() * 0.015 + 0.005;
    
    const randomVehicle = vehicleConfig.vehicles[Math.floor(Math.random() * vehicleConfig.vehicles.length)];
    const plateNumber = Math.floor(Math.random() * 900) + 100;
    
    return {
      id: `driver_${id}`,
      name: `Driver ${id}`,
      latitude: pickupLocation!.latitude + Math.cos(angle) * distance,
      longitude: pickupLocation!.longitude + Math.sin(angle) * distance,
      distance: Math.round((distance * 111) * 10) / 10,
      vehicleType: randomVehicle.type,
      vehiclePlate: `${randomVehicle.plate}${plateNumber}`,
      vehicleIcon: randomVehicle.icon,
      rotation: Math.random() * 360,
    };
  };

  const addDriver = (driver: Driver) => {
    setDriversFound(prev => [...prev, driver]);
    
    // Animate map to show new driver
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pickupLocation!.latitude,
        longitude: pickupLocation!.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  };

  const completeSearch = () => {
    const randomVehicle = vehicleConfig.vehicles[Math.floor(Math.random() * vehicleConfig.vehicles.length)];
    const plateNumber = Math.floor(Math.random() * 900) + 100;
    
    const getDriverName = () => {
      const names: { [key: string]: string[] } = {
        moving: ['Pierre Dufour', 'Jacques Martin', 'Michel Tremblay', 'André Côté'],
        storage: ['Marie Gagnon', 'Luc Bouchard', 'Sylvie Roy', 'Denis Lavoie'],
        standard: ['Alex Johnson', 'Sarah Wilson', 'Mike Chen', 'Emma Davis'],
        express: ['Carlos Swift', 'Nina Dash', 'Jake Rush', 'Lisa Quick']
      };
      const serviceNames = names[currentServiceType] || names.express;
      return serviceNames[Math.floor(Math.random() * serviceNames.length)];
    };

    const selectedDriver = {
      id: 'driver_selected',
      name: getDriverName(),
      rating: 4.7 + Math.random() * 0.3,
      reviews: Math.floor(Math.random() * 300) + 100,
      vehicleType: randomVehicle.type,
      vehiclePlate: `${randomVehicle.plate}${plateNumber}`,
      vehicleIcon: randomVehicle.icon,
      estimatedArrival: `${Math.floor(Math.random() * 8) + 3}-${Math.floor(Math.random() * 5) + 10} min`,
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      phone: '+1 (555) 123-4567',
    };

    navigation.replace('DriverFound', {
      ...route.params,
      selectedDriver,
    });
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const scannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scannerRotation.value}deg` }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        region={pickupLocation || { latitude: 0, longitude: 0, latitudeDelta: 10, longitudeDelta: 10 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
      >
        {pickupLocation && (
          <>
            {/* Search radius circle */}
            <Circle
              center={{
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude,
              }}
              radius={1500}
              fillColor="rgba(29, 185, 185, 0.1)"
              strokeColor="rgba(29, 185, 185, 0.3)"
              strokeWidth={1}
            />

            {/* Pickup Location Marker with pulse */}
            <Marker
              coordinate={{
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.centerMarkerContainer}>
                <Animated.View style={[styles.pulseCircle, pulseAnimatedStyle]} />
                <View style={styles.centerMarker}>
                  <View style={styles.centerDot} />
                </View>
              </View>
            </Marker>

            {/* Driver Markers with cars */}
            {driversFound.map((driver, index) => (
              <Marker
                key={driver.id}
                coordinate={{
                  latitude: driver.latitude,
                  longitude: driver.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <Animated.View 
                  entering={ZoomIn.delay(index * 200).springify()}
                  style={[styles.carMarker, { transform: [{ rotate: `${driver.rotation}deg` }] }]}
                >
                  <Image 
                    source={require('../../assets/images/car.png')}
                    style={styles.carImage}
                  />
                </Animated.View>
              </Marker>
            ))}
          </>
        )}
      </MapView>

      {/* Scanner Overlay */}
      {!searchComplete && pickupLocation && (
        <View style={styles.scannerContainer} pointerEvents="none">
          <Animated.View style={[styles.scanner, scannerAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', Colors.primary + '20', 'transparent']}
              style={styles.scannerGradient}
            />
          </Animated.View>
        </View>
      )}

      {/* Header Card */}
      <Animated.View 
        style={styles.headerCard}
        entering={SlideInDown.delay(300).springify()}
      >
        <LinearGradient
          colors={['white', '#F8F9FA']}
          style={styles.headerGradient}
        >
          <View style={styles.searchHeader}>
            <Animated.View style={[styles.searchIconContainer, glowAnimatedStyle]}>
              <View style={styles.searchIcon}>
                <MaterialIcons 
                  name={searchComplete ? "check-circle" : "radar"} 
                  size={28} 
                  color={searchComplete ? Colors.success : Colors.primary} 
                />
              </View>
            </Animated.View>
            
            <View style={styles.searchInfo}>
              <Text style={styles.searchTitle}>{searchText}</Text>
              <Text style={styles.searchSubtitle}>
                {searchComplete ? 
                  `${driversFound.length} excellent drivers nearby` : 
                  `Scanning within 2km radius...`
                }
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {!searchComplete && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressAnimatedStyle]}>
                  <LinearGradient
                    colors={[Colors.primary, '#00A896']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.stepsContainer}>
                {searchSteps.map((step, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.stepDot,
                      index <= searchStep && styles.stepDotActive
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Driver Counter */}
          {driversFound.length > 0 && (
            <Animated.View 
              style={styles.driverCounter}
              entering={FadeIn.delay(500)}
            >
              <View style={styles.driverCountBadge}>
                <Text style={styles.driverCountNumber}>{driversFound.length}</Text>
              </View>
              <Text style={styles.driverCountText}>
                Active drivers found
              </Text>
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Loading overlay */}
      {!pickupLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <MaterialIcons name="my-location" size={48} color={Colors.primary} />
            <Text style={styles.loadingText}>Detecting your location...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Custom map style for a cleaner look
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9e4f5" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scannerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanner: {
    width: SCREEN_WIDTH * 1.5,
    height: 4,
  },
  scannerGradient: {
    flex: 1,
  },
  centerMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  centerMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  carMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  headerCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIconContainer: {
    marginRight: 16,
  },
  searchIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInfo: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  searchSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  driverCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 12,
  },
  driverCountBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverCountNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  driverCountText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
});

export default DriverSearchScreen;