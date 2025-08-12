import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

const { width, height } = Dimensions.get('window');

interface DeliveryOrder {
  id: number;
  customerName: string;
  serviceType: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoords: { latitude: number; longitude: number };
  deliveryCoords: { latitude: number; longitude: number };
  distance: string;
  price: string;
  weight: string;
  description: string;
}

type DeliveryStatus = 'heading_to_pickup' | 'at_pickup' | 'picked_up' | 'in_transit' | 'delivered';

const DriverModeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const deliveryOrder = route.params?.order as DeliveryOrder;

  const [currentLocation, setCurrentLocation] = useState({
    latitude: 46.8139, // Quebec City default
    longitude: -71.2082,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [driverLocation, setDriverLocation] = useState({
    latitude: 46.8139,
    longitude: -71.2082,
  });
  
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('heading_to_pickup');
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  const GOOGLE_API_KEY = 'AIzaSyAzPxqQ9QhUq_cmXkkcE-6DcgJn-EDngzI';

  useEffect(() => {
    initializeDriverMode();
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (deliveryStatus === 'heading_to_pickup' && deliveryOrder) {
      getDirections(driverLocation, deliveryOrder.pickupCoords);
    } else if (deliveryStatus === 'in_transit' && deliveryOrder) {
      getDirections(driverLocation, deliveryOrder.deliveryCoords);
    }
  }, [deliveryStatus, driverLocation]);

  const initializeDriverMode = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for driver mode.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const driverPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setDriverLocation(driverPos);
      setCurrentLocation({
        ...driverPos,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Start real-time location tracking
      startLocationTracking();
    } catch (error) {
      console.error('❌ Error initializing driver mode:', error);
    }
  };

  const startLocationTracking = () => {
    const interval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newDriverPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setDriverLocation(newDriverPos);
        console.log('📍 Driver location updated:', newDriverPos);
      } catch (error) {
        console.error('❌ Error updating driver location:', error);
      }
    }, 5000); // Update every 5 seconds

    setLocationUpdateInterval(interval);
  };

  const getDirections = async (origin: {latitude: number; longitude: number}, destination: {latitude: number; longitude: number}) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_API_KEY}`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        
        // Calculate ETA
        const duration = route.legs[0].duration.value; // in seconds
        setEstimatedArrival(Math.round(duration / 60)); // convert to minutes
      }
    } catch (error) {
      console.error('❌ Error getting directions:', error);
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

  const handleStatusUpdate = () => {
    switch (deliveryStatus) {
      case 'heading_to_pickup':
        setDeliveryStatus('at_pickup');
        Alert.alert('Arrived at Pickup', 'You have arrived at the pickup location.');
        break;
      case 'at_pickup':
        setDeliveryStatus('picked_up');
        Alert.alert('Package Picked Up', 'Package has been picked up. Heading to delivery location.');
        break;
      case 'picked_up':
        setDeliveryStatus('in_transit');
        break;
      case 'in_transit':
        setDeliveryStatus('delivered');
        Alert.alert('Delivery Complete', 'Package has been successfully delivered!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        break;
    }
  };

  const getStatusText = () => {
    switch (deliveryStatus) {
      case 'heading_to_pickup': return 'Heading to Pickup';
      case 'at_pickup': return 'At Pickup Location';
      case 'picked_up': return 'Package Picked Up';
      case 'in_transit': return 'In Transit to Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (deliveryStatus) {
      case 'heading_to_pickup': return '#F59E0B';
      case 'at_pickup': return '#3B82F6';
      case 'picked_up': return '#8B5CF6';
      case 'in_transit': return '#10B981';
      case 'delivered': return '#22C55E';
      default: return Colors.textSecondary;
    }
  };

  const getNextActionText = () => {
    switch (deliveryStatus) {
      case 'heading_to_pickup': return 'Arrived at Pickup';
      case 'at_pickup': return 'Confirm Pickup';
      case 'picked_up': return 'Start Delivery';
      case 'in_transit': return 'Mark as Delivered';
      case 'delivered': return 'Complete';
      default: return 'Update Status';
    }
  };

  if (!deliveryOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No delivery order found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        region={currentLocation}
        showsUserLocation={false}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Driver Location */}
        <Marker
          coordinate={driverLocation}
          title="Your Location"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverMarker}>
            <Ionicons name="car" size={20} color="white" />
          </View>
        </Marker>

        {/* Pickup Location */}
        <Marker
          coordinate={deliveryOrder.pickupCoords}
          title="Pickup Location"
          description={deliveryOrder.pickupAddress}
          pinColor="#3B82F6"
        />

        {/* Delivery Location */}
        <Marker
          coordinate={deliveryOrder.deliveryCoords}
          title="Delivery Location"
          description={deliveryOrder.deliveryAddress}
          pinColor="#EF4444"
        />

        {/* Route */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Top Navigation */}
      <View style={styles.topNavigation}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Driver Mode</Text>
          <Text style={styles.headerSubtitle}>Order #{deliveryOrder.id}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Status Panel */}
      <View style={styles.statusPanel}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {estimatedArrival > 0 && (
            <Text style={styles.etaText}>{estimatedArrival} min</Text>
          )}
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.customerName}>{deliveryOrder.customerName}</Text>
          <Text style={styles.serviceType}>{deliveryOrder.serviceType}</Text>
          <Text style={styles.orderDescription}>{deliveryOrder.description}</Text>
        </View>

        {/* Current Destination */}
        <View style={styles.destinationCard}>
          <Ionicons 
            name={deliveryStatus === 'heading_to_pickup' || deliveryStatus === 'at_pickup' ? 'location' : 'flag'} 
            size={20} 
            color={getStatusColor()} 
          />
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationLabel}>
              {deliveryStatus === 'heading_to_pickup' || deliveryStatus === 'at_pickup' ? 'Pickup' : 'Delivery'}
            </Text>
            <Text style={styles.destinationAddress}>
              {deliveryStatus === 'heading_to_pickup' || deliveryStatus === 'at_pickup' 
                ? deliveryOrder.pickupAddress 
                : deliveryOrder.deliveryAddress}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: getStatusColor() }]}
          onPress={handleStatusUpdate}
          disabled={deliveryStatus === 'delivered'}
        >
          <Text style={styles.actionButtonText}>{getNextActionText()}</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topNavigation: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
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
  statusPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  orderInfo: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  orderDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  destinationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  destinationAddress: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DriverModeScreen; 