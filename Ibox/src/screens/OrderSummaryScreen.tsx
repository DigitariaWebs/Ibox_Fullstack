import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../config/colors';

interface OrderSummaryScreenProps {
  navigation: any;
  route: any;
}

const OrderSummaryScreen: React.FC<OrderSummaryScreenProps> = ({
  navigation,
  route,
}) => {
  console.log('📋 OrderSummary: Component mounted');
  console.log('📋 OrderSummary: Route params received:', Object.keys(route.params || {}));
  
  const { service, startLocation, startLocationCoords, destination, packagePhoto, measurements: passedMeasurements, price: passedPrice, apartmentSize, inventoryItems, additionalServices, urgency, packageSize, specialInstructions: specialInstr, specialNotes } = route.params;
  
  // Ensure measurements object exists
  const measurements = passedMeasurements || { width: '-', height: '-', depth: '-', weight: '-' };
  // Ensure price object exists
  const price = passedPrice || { base: 0, size: 0, weight: 0, total: 0 };
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Move Dimensions.get inside component to avoid undefined issues during navigation
  const screenDimensions = Dimensions.get('window');
  const SCREEN_WIDTH = screenDimensions?.width || 375; // fallback width
  
  console.log('📋 OrderSummary: Screen dimensions:', screenDimensions);
  console.log('📋 OrderSummary: Using SCREEN_WIDTH:', SCREEN_WIDTH);
  
  const buttonScale = useSharedValue(1);

  const services = {
    express: { title: 'Express Delivery', icon: 'flash', color: '#FF6B6B', family: 'Ionicons' },
    standard: { title: 'Standard Delivery', icon: 'cube-outline', color: '#4ECDC4', family: 'Ionicons' },
    moving: { title: 'Moving Service', icon: 'local-shipping', color: '#45B7D1', family: 'MaterialIcons' },
    storage: { title: 'Storage Service', icon: 'archive', color: '#96CEB4', family: 'Ionicons' },
  };

  const selectedService = services[service as keyof typeof services];

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleStartRequest = () => {
    setIsProcessing(true);
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { duration: 200 });
    });

    setTimeout(() => {
      console.log('🔍 DEBUG: OrderSummary navigating to DriverSearch with startLocationCoords:', startLocationCoords);
      console.log('🔍 DEBUG: Full route.params being passed:', route.params);
      navigation.navigate('DriverSearch', {
        ...route.params,
        bookingId: `BK${Date.now()}`,
      });
    }, 1000);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderServiceIcon = () => {
    if (!selectedService) return null;
    
    const IconComponent = selectedService.family === 'Ionicons' ? Ionicons : MaterialIcons;
    return (
      <IconComponent
        name={selectedService.icon as any}
        size={24}
        color="white"
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Photo Section */}
        <Animated.View style={styles.photoSection} entering={FadeIn.delay(100)}>
          <Text style={styles.sectionTitle}>Package Photo</Text>
          <View style={styles.photoContainer}>
            <Image source={{ uri: packagePhoto }} style={styles.packageImage} />
            <TouchableOpacity style={styles.editPhotoButton}>
              <Ionicons name="camera" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Service Section */}
        <Animated.View style={styles.serviceSection} entering={SlideInUp.delay(200)}>
          <Text style={styles.sectionTitle}>Selected Service</Text>
          <View style={styles.serviceCard}>
            <View style={[styles.serviceIcon, { backgroundColor: selectedService?.color }]}>
              {renderServiceIcon()}
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{selectedService?.title}</Text>
              <Text style={styles.serviceDescription}>
                {service === 'express' && 'Fast delivery for urgent packages'}
                {service === 'standard' && 'Regular delivery for everyday items'}
                {service === 'moving' && 'Professional moving assistance'}
                {service === 'storage' && 'Secure storage solutions'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Package Details Section */}
        <Animated.View style={styles.detailsSection} entering={SlideInUp.delay(300)}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Dimensions</Text>
                <Text style={styles.measurementValue}>
                  {measurements.width} × {measurements.height} × {measurements.depth} cm
                </Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Weight</Text>
                <Text style={styles.measurementValue}>{measurements.weight} kg</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Route Section */}
        <Animated.View style={styles.routeSection} entering={SlideInUp.delay(400)}>
          <Text style={styles.sectionTitle}>Delivery Route</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <Ionicons name="location" size={16} color={Colors.success} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddress}>{startLocation || 'Current Location'}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <Ionicons name="flag" size={16} color={Colors.error} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Destination</Text>
                <Text style={styles.routeAddress}>{destination?.title}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Price Section */}
        <Animated.View style={styles.priceSection} entering={SlideInUp.delay(500)}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base delivery</Text>
              <Text style={styles.priceValue}>${price.base.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Size adjustment</Text>
              <Text style={styles.priceValue}>${price.size.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Weight adjustment</Text>
              <Text style={styles.priceValue}>${price.weight.toFixed(2)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>${price.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Estimated Time */}
        <Animated.View style={styles.timeSection} entering={SlideInUp.delay(600)}>
          <View style={styles.timeCard}>
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Estimated Delivery Time</Text>
              <Text style={styles.timeValue}>
                {service === 'express' && '30-60 minutes'}
                {service === 'standard' && '1-3 hours'}
                {service === 'moving' && '2-4 hours'}
                {service === 'storage' && 'Flexible'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            style={[styles.startButton, isProcessing && styles.startButtonProcessing]}
            onPress={handleStartRequest}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Animated.View 
                  style={styles.processingDot}
                  entering={FadeIn}
                />
                <Text style={styles.startButtonText}>Processing...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.startButtonText}>Start Request</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  packageImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  serviceSection: {
    marginBottom: 24,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementItem: {
    flex: 1,
  },
  measurementLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  routeSection: {
    marginBottom: 24,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 15,
    marginVertical: 8,
  },
  priceSection: {
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  timeSection: {
    marginBottom: 32,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  bottomSection: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonProcessing: {
    backgroundColor: Colors.textSecondary,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
});

export default OrderSummaryScreen;