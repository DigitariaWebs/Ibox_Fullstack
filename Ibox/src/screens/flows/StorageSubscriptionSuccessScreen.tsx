import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Text, Button } from '../../ui';
import { Colors } from '../../config/colors';
import { LinearGradient } from 'expo-linear-gradient';

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;

type RootStackParamList = {
  StorageSubscriptionSuccess: {
    facility: StorageFacility;
    selectedUnit: any;
    subscription: any;
    totalPrice: number;
    service: string;
  };
  DriverSearch: {
    service: string;
    startLocationCoords?: {
      latitude: number;
      longitude: number;
    };
    facilityCoords?: {
      latitude: number;
      longitude: number;
    };
    subscriptionDetails?: any;
  };
  HomeScreen: {};
};

interface StorageSubscriptionSuccessScreenProps {
  navigation: NavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'StorageSubscriptionSuccess'>;
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

const StorageSubscriptionSuccessScreen: React.FC<StorageSubscriptionSuccessScreenProps> = ({ navigation, route }) => {
  const { facility, selectedUnit, subscription, totalPrice } = route.params;
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const cardAnim1 = useRef(new Animated.Value(50)).current;
  const cardAnim2 = useRef(new Animated.Value(50)).current;
  const cardAnim3 = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    getCurrentLocation();
    
    // Staggered success animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim1, {
          toValue: 0,
          tension: 50,
          friction: 8,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim2, {
          toValue: 0,
          tension: 50,
          friction: 8,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim3, {
          toValue: 0,
          tension: 50,
          friction: 8,
          delay: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getCurrentLocation = async () => {
    try {
      console.log('📍 StorageSubscriptionSuccess: Getting current location for driver request');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('📍 StorageSubscriptionSuccess: Location permission denied, using fallback');
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('📍 StorageSubscriptionSuccess: Location obtained:', location.coords);
      setUserLocation(location);
    } catch (error) {
      console.error('📍 StorageSubscriptionSuccess: Location error:', error);
      // Fallback location
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

  const handleRequestPickupDriver = () => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to request a pickup driver.');
      return;
    }

    console.log('🚚 StorageSubscriptionSuccess: Requesting pickup driver');
    console.log('📍 From location:', userLocation.coords);
    console.log('🏢 To facility:', facility.name, facility.latitude, facility.longitude);
    
    navigation.navigate('DriverSearch', {
      service: 'storage',
      startLocationCoords: {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      facilityCoords: {
        latitude: facility.latitude,
        longitude: facility.longitude,
      },
      subscriptionDetails: {
        facility: facility.name,
        unit: selectedUnit.name,
        subscription: subscription.id,
      },
    });
  };

  const handleShowRoute = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}&travelmode=driving`;
    console.log('🗺️ StorageSubscriptionSuccess: Opening Google Maps route:', url);
    
    Linking.openURL(url).catch((err) => {
      console.error('Error opening Google Maps:', err);
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const handleBackToHome = () => {
    console.log('🏠 StorageSubscriptionSuccess: Navigating back to home');
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeScreen' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Success Header */}
      <Animated.View
        style={[
          styles.successHeader,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.successIconContainer}>
          <LinearGradient
            colors={[Colors.success, '#10B981']}
            style={styles.successIcon}
          >
            <MaterialIcons name="check" size={40} color={Colors.white} />
          </LinearGradient>
        </View>
        <Text style={styles.successTitle}>Storage Subscription Active!</Text>
        <Text style={styles.successSubtitle}>
          Your monthly storage plan is now ready
        </Text>
      </Animated.View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Subscription Summary Card */}
        <Animated.View
          style={[
            styles.summaryCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: cardAnim1 }],
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="storage" size={24} color={Colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>{selectedUnit.name}</Text>
              <Text style={styles.summarySubtitle}>{facility.name}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>${totalPrice}</Text>
              <Text style={styles.priceLabel}>/ month</Text>
            </View>
          </View>
          
          <View style={styles.summaryDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="dimensions" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{selectedUnit.size}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>24/7 Access</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="security" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>Secure Storage</Text>
            </View>
          </View>
        </Animated.View>

        {/* Facility Info Card */}
        <Animated.View
          style={[
            styles.facilityCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: cardAnim2 }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <MaterialIcons name="location-on" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Facility Location</Text>
          </View>
          
          <View style={styles.facilityInfo}>
            <Text style={styles.facilityName}>{facility.name}</Text>
            <Text style={styles.facilityAddress}>{facility.address}</Text>
            <View style={styles.facilityMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="directions-car" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{facility.distance} km away</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="star" size={14} color={Colors.warning} />
                <Text style={styles.metaText}>{facility.securityRating}/5.0 security</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions Card */}
        <Animated.View
          style={[
            styles.actionsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: cardAnim3 }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <MaterialIcons name="flash-on" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionItem} onPress={handleRequestPickupDriver}>
              <View style={styles.actionIcon}>
                <MaterialIcons name="local-shipping" size={20} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Request Pickup</Text>
                <Text style={styles.actionDescription}>Get a driver to transport your items</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleShowRoute}>
              <View style={styles.actionIcon}>
                <MaterialIcons name="directions" size={20} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Get Directions</Text>
                <Text style={styles.actionDescription}>Navigate to storage facility</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Subscription Details */}
        <Animated.View
          style={[
            styles.detailsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.detailsTitle}>Subscription Details</Text>
          
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subscription ID</Text>
              <Text style={styles.detailValue}>{subscription.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>
                {new Date(subscription.startDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Billing Cycle</Text>
              <Text style={styles.detailValue}>Monthly</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Auto-Renewal</Text>
              <Text style={styles.detailValue}>Enabled</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action */}
      <Animated.View
        style={[
          styles.bottomAction,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <MaterialIcons name="home" size={20} color={Colors.textSecondary} />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 28,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  facilityCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  facilityInfo: {
    gap: 8,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  facilityAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  facilityMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actionsList: {
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default StorageSubscriptionSuccessScreen;