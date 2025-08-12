import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  Linking,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';

interface DriverFoundScreenProps {
  navigation: any;
  route: any;
}

const DriverFoundScreen: React.FC<DriverFoundScreenProps> = ({
  navigation,
  route,
}) => {
  const { selectedDriver, service, startLocation, startLocationCoords, destination } = route.params;
  console.log('🔍 DEBUG: DriverFoundScreen received startLocationCoords:', startLocationCoords);
  console.log('🔍 DEBUG: DriverFoundScreen received full params:', route.params);
  
  const [etaMinutes, setEtaMinutes] = useState(10);
  const [etaSeconds, setEtaSeconds] = useState(0);

  const pulseScale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    // Start pulse animation for driver photo
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Animate check mark
    setTimeout(() => {
      checkScale.value = withSpring(1, { duration: 600 });
    }, 500);

    // Start countdown timer
    startCountdown();
  }, []);

  const startCountdown = () => {
    const interval = setInterval(() => {
      setEtaSeconds(prev => {
        if (prev > 0) {
          return prev - 1;
        } else if (etaMinutes > 0) {
          setEtaMinutes(m => m - 1);
          return 59;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);

    // Cleanup interval after component unmounts
    return () => clearInterval(interval);
  };

  const handleCallDriver = () => {
    Alert.alert(
      'Call Driver',
      `Would you like to call ${selectedDriver.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${selectedDriver.phone}`)
        },
      ]
    );
  };

  const handleMessageDriver = () => {
    Alert.alert(
      'Message Driver',
      `Send a message to ${selectedDriver.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Message', 
          onPress: () => Linking.openURL(`sms:${selectedDriver.phone}`)
        },
      ]
    );
  };

  const handleTrackDriver = () => {
    // Navigate back to map with tracking enabled
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'HomeScreen', 
        params: { 
          trackingDriver: selectedDriver,
          pickupLocation: startLocation,
          pickupLocationCoords: startLocationCoords,
          destinationLocation: destination
        } 
      }],
    });
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={16} color="#FFD700" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color="#FFD700" />
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Success Header */}
      <Animated.View style={styles.successHeader} entering={FadeIn.delay(200)}>
        <Animated.View style={[styles.checkContainer, checkAnimatedStyle]}>
          <Ionicons name="checkmark" size={40} color="white" />
        </Animated.View>
        <Text style={styles.successTitle}>Driver Found!</Text>
        <Text style={styles.successSubtitle}>
          Your driver is on the way to pick up your package
        </Text>
      </Animated.View>

      {/* Driver Card */}
      <Animated.View style={styles.driverCard} entering={SlideInUp.delay(400)}>
        <View style={styles.driverHeader}>
          <Animated.View style={[styles.driverPhotoContainer, pulseAnimatedStyle]}>
            <Image 
              source={{ uri: selectedDriver.photo }} 
              style={styles.driverPhoto}
            />
            <View style={styles.onlineIndicator} />
          </Animated.View>
          
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{selectedDriver.name}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(selectedDriver.rating)}
              </View>
              <Text style={styles.ratingText}>
                {selectedDriver.rating} ({selectedDriver.reviews} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCallDriver}
            >
              <Ionicons name="call" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleMessageDriver}
            >
              <Ionicons name="chatbubble" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleSection}>
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleIconContainer}>
              <Ionicons 
                name={selectedDriver.vehicleIcon || "car"} 
                size={24} 
                color={Colors.primary} 
              />
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleType}>{selectedDriver.vehicleType}</Text>
              <Text style={styles.vehiclePlate}>{selectedDriver.vehiclePlate}</Text>
            </View>
          </View>
        </View>

        {/* ETA Section */}
        <View style={styles.etaSection}>
          <View style={styles.etaContainer}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <View style={styles.etaInfo}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaTime}>
                {etaMinutes}:{etaSeconds.toString().padStart(2, '0')} min
              </Text>
            </View>
          </View>
          
          <View style={styles.etaPulse}>
            <Animated.View style={[styles.pulseCircle, pulseAnimatedStyle]} />
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceLabel}>Service Type</Text>
          <View style={styles.serviceInfo}>
            <Ionicons 
              name={
                service === 'express' ? 'flash' :
                service === 'standard' ? 'cube-outline' :
                service === 'moving' ? 'car' : 'archive'
              } 
              size={20} 
              color={Colors.primary} 
            />
            <Text style={styles.serviceText}>
              {service === 'express' && 'Express Delivery'}
              {service === 'standard' && 'Standard Delivery'}
              {service === 'moving' && 'Moving Service'}
              {service === 'storage' && 'Storage Service'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Track Driver Button */}
      <Animated.View style={styles.bottomSection} entering={SlideInUp.delay(600)}>
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={handleTrackDriver}
        >
          <Ionicons name="navigate" size={20} color="white" />
          <Text style={styles.trackButtonText}>Track Driver</Text>
        </TouchableOpacity>
        
        <Text style={styles.bottomNote}>
          You'll receive updates as your driver approaches
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  checkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  driverCard: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  driverPhotoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: 'white',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleSection: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 24,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  etaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 24,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  etaInfo: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  etaTime: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  etaPulse: {
    position: 'relative',
  },
  pulseCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  serviceSection: {
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  trackButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DriverFoundScreen;