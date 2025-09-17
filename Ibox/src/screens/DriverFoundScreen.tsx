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
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInUp,
  SlideInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DriverFoundScreenProps {
  navigation: any;
  route: any;
}

const DriverFoundScreen: React.FC<DriverFoundScreenProps> = ({
  navigation,
  route,
}) => {
  const { selectedDriver, service, startLocation, startLocationCoords, destination } = route.params;
  
  const [etaMinutes, setEtaMinutes] = useState(10);
  const [etaSeconds, setEtaSeconds] = useState(0);

  // Animation values
  const successScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const etaPulse = useSharedValue(1);

  useEffect(() => {
    // Initial animations - simpler and cleaner
    successScale.value = withTiming(1, { 
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    cardTranslateY.value = withDelay(200, withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }));

    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    // Subtle glow effect instead of aggressive pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Remove aggressive ETA pulse
    etaPulse.value = 1;

    // Start countdown timer
    const interval = setInterval(() => {
      setEtaSeconds(prev => {
        if (prev > 0) {
          return prev - 1;
        } else {
          setEtaMinutes(m => {
            if (m > 0) {
              return m - 1;
            }
            clearInterval(interval);
            return 0;
          });
          return 59;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );
    return {
      transform: [{ translateX }],
    };
  });

  // Removed ETA pulse style for cleaner design

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <MaterialIcons key={i} name="star" size={18} color="#FFB800" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <MaterialIcons key={i} name="star-half" size={18} color="#FFB800" />
        );
      } else {
        stars.push(
          <MaterialIcons key={i} name="star-border" size={18} color="#E0E0E0" />
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#00C9B9', Colors.primary, '#007A70']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Pattern Overlay */}
      <View style={styles.patternOverlay} />

      {/* Success Animation */}
      <Animated.View 
        style={[styles.successContainer, successAnimatedStyle]}
        entering={ZoomIn.delay(100).springify()}
      >
        <View style={styles.successCircle}>
          <LinearGradient
            colors={['white', '#F0FFF0']}
            style={styles.successGradient}
          >
            <MaterialIcons name="check-circle" size={64} color={Colors.success} />
          </LinearGradient>
        </View>
        
        <Animated.Text 
          style={styles.successTitle}
          entering={FadeIn.delay(500)}
        >
          Perfect Match Found!
        </Animated.Text>
        
        <Animated.Text 
          style={styles.successSubtitle}
          entering={FadeIn.delay(700)}
        >
          Your driver is heading to the pickup location
        </Animated.Text>
      </Animated.View>

      {/* Main Card */}
      <Animated.View style={[styles.mainCard, cardAnimatedStyle]}>
        <View style={styles.shimmerContainer}>
          <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]} />
        </View>

        {/* Driver Section */}
        <View style={styles.driverSection}>
          <View style={styles.driverHeader}>
            <View style={styles.driverImageContainer}>
              <Animated.View style={[styles.pulseBorder, pulseAnimatedStyle]} />
              <Image 
                source={{ uri: selectedDriver.photo }} 
                style={styles.driverPhoto}
              />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={20} color={Colors.primary} />
              </View>
            </View>
            
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{selectedDriver.name}</Text>
              <View style={styles.ratingRow}>
                {renderStars(selectedDriver.rating)}
                <Text style={styles.ratingText}>
                  {selectedDriver.rating} • {selectedDriver.reviews} trips
                </Text>
              </View>
              <View style={styles.badges}>
                <View style={styles.badge}>
                  <Feather name="award" size={12} color={Colors.primary} />
                  <Text style={styles.badgeText}>Top Rated</Text>
                </View>
                <View style={styles.badge}>
                  <Feather name="shield" size={12} color={Colors.primary} />
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Communication Buttons */}
          <View style={styles.communicationRow}>
            <TouchableOpacity 
              style={styles.commButton}
              onPress={handleCallDriver}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, '#00A896']}
                style={styles.commButtonGradient}
              >
                <Feather name="phone" size={20} color="white" />
                <Text style={styles.commButtonText}>Call</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.commButton}
              onPress={handleMessageDriver}
              activeOpacity={0.8}
            >
              <View style={styles.commButtonOutline}>
                <Feather name="message-circle" size={20} color={Colors.primary} />
                <Text style={[styles.commButtonText, { color: Colors.primary }]}>Message</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Card */}
        <View style={styles.vehicleCard}>
          <LinearGradient
            colors={['#F8F9FA', 'white']}
            style={styles.vehicleGradient}
          >
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleLabel}>Vehicle Details</Text>
              <View style={styles.vehicleBadge}>
                <Text style={styles.vehicleBadgeText}>
                  {service === 'express' ? 'EXPRESS' : 
                   service === 'standard' ? 'STANDARD' :
                   service === 'moving' ? 'MOVING' : 'STORAGE'}
                </Text>
              </View>
            </View>
            
            <View style={styles.vehicleContent}>
              <View style={styles.carImageContainer}>
                <Image 
                  source={require('../../assets/images/car.png')}
                  style={styles.carDisplayImage}
                />
              </View>
              
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleType}>{selectedDriver.vehicleType}</Text>
                <View style={styles.plateContainer}>
                  <View style={styles.plateBadge}>
                    <Text style={styles.plateText}>{selectedDriver.vehiclePlate}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ETA Card */}
        <View style={styles.etaCard}>
          <LinearGradient
            colors={[Colors.primary + '15', Colors.primary + '08']}
            style={styles.etaGradient}
          >
            <View style={styles.etaContent}>
              <View style={styles.etaIcon}>
                <MaterialIcons name="access-time" size={28} color={Colors.primary} />
              </View>
              <View style={styles.etaInfo}>
                <Text style={styles.etaLabel}>Arrives in</Text>
                <Text style={styles.etaTime}>
                  {etaMinutes}:{etaSeconds.toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.etaLive}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Bottom Action */}
      <Animated.View 
        style={styles.bottomSection}
        entering={SlideInUp.delay(800).springify()}
      >
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={handleTrackDriver}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['white', '#F8F9FA']}
            style={styles.trackButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialIcons name="map" size={24} color={Colors.primary} />
            <Text style={styles.trackButtonText}>Track on Map</Text>
            <Feather name="arrow-right" size={20} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'black',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  successGradient: {
    flex: 1,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
    lineHeight: 20,
  },
  mainCard: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 110,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
    opacity: 0.03,
  },
  shimmer: {
    width: SCREEN_WIDTH,
    height: 100,
    backgroundColor: Colors.primary,
  },
  driverSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  driverHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  driverImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  pulseBorder: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary + '30',
    top: -10,
    left: -10,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  communicationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  commButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  commButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  commButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
  },
  commButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  vehicleCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleGradient: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  vehicleBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carImageContainer: {
    width: 80,
    height: 60,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carDisplayImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  plateContainer: {
    flexDirection: 'row',
  },
  plateBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  plateText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  etaCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  etaGradient: {
    padding: 16,
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  etaInfo: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  etaTime: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  etaLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    letterSpacing: 0.5,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  trackButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  trackButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  trackButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
});

export default DriverFoundScreen;