import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  SlideInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Text, Button } from '../../ui';

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;

interface StorageOrderSummaryProps {
  navigation: any;
  route: any;
}

const StorageOrderSummary: React.FC<StorageOrderSummaryProps> = ({
  navigation,
  route,
}) => {
  console.log('🏪 StorageOrderSummary: Component mounted');
  console.log('🏪 StorageOrderSummary: Route params received:', Object.keys(route.params || {}));
  
  const { 
    service, 
    startLocation, 
    startLocationCoords, 
    destination, 
    selectedUnit, 
    selectedDuration, 
    climateControl = false, 
    selectedAccess, 
    needsPickup = false, 
    specialRequirements,
    serviceType 
  } = route.params;
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const buttonScale = useSharedValue(1);

  // Calculate estimated price based on selections
  const calculatePrice = () => {
    let basePrice = 0;
    
    // Base price by storage unit size
    const unitPricing = {
      'small': 89,
      'medium': 129,
      'large': 179,
      'xlarge': 229,
    };
    
    basePrice = unitPricing[selectedUnit?.id] || 89;
    
    // Duration multiplier
    const durationMultipliers = {
      '1-month': 1,
      '3-months': 2.8, // 3% discount
      '6-months': 5.4, // 10% discount
      '12-months': 10.2, // 15% discount
    };
    
    const durationCost = basePrice * (durationMultipliers[selectedDuration?.id] || 1);
    
    // Add-ons
    let addOns = 0;
    if (climateControl) addOns += 25;
    if (needsPickup) addOns += 45;
    
    // Access frequency adjustment
    const accessPricing = {
      'daily': 15,
      'weekly': 0,
      'monthly': -10,
      'rarely': -20,
    };
    
    const accessAdjustment = accessPricing[selectedAccess?.id] || 0;
    
    return {
      base: basePrice,
      duration: durationCost - basePrice,
      addOns: addOns,
      access: accessAdjustment,
      total: durationCost + addOns + accessAdjustment
    };
  };

  const price = calculatePrice();

  const handleStartRequest = () => {
    console.log('🏪 StorageOrderSummary: Start request button pressed');
    
    setIsProcessing(true);
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { duration: 200 });
    });

    // Simulate processing
    setTimeout(() => {
      console.log('🏪 StorageOrderSummary: Navigating to DriverSearch');
      navigation.navigate('DriverSearch', {
        ...route.params,
        price: price,
        bookingId: `ST${Date.now()}`,
      });
    }, 1000);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const getDurationDisplayText = () => {
    switch(selectedDuration?.id) {
      case '1-month': return '1 Month';
      case '3-months': return '3 Months (3% discount)';
      case '6-months': return '6 Months (10% discount)';
      case '12-months': return '12 Months (15% discount)';
      default: return '1 Month';
    }
  };

  const getAccessDisplayText = () => {
    switch(selectedAccess?.id) {
      case 'daily': return 'Daily Access (+$15/month)';
      case 'weekly': return 'Weekly Access';
      case 'monthly': return 'Monthly Access (-$10/month)';
      case 'rarely': return 'Rarely (-$20/month)';
      default: return 'Weekly Access';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log('🏪 StorageOrderSummary: Back button pressed');
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storage Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Type */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(100)}>
          <Text style={styles.sectionTitle}>Storage Details</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <MaterialIcons name="storage" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Storage Service</Text>
              <Text style={styles.serviceSubtitle}>{selectedUnit?.title || 'Small Unit (5x5)'}</Text>
              <Text style={styles.serviceDescription}>{selectedUnit?.description || 'Perfect for small items'}</Text>
              <Text style={styles.serviceDimensions}>{selectedUnit?.dimensions || '5×5 feet (25 sq ft)'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Location Information */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(200)}>
          <Text style={styles.sectionTitle}>Storage Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationItem}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="business" size={20} color={Colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Storage Facility</Text>
                <Text style={styles.locationAddress}>SecureStore Downtown</Text>
                <Text style={styles.locationDetails}>123 Storage Ave, Climate Controlled</Text>
              </View>
            </View>
            
            {needsPickup && (
              <>
                <View style={styles.routeLine} />
                <View style={styles.locationItem}>
                  <View style={styles.locationIconContainer}>
                    <Ionicons name="location" size={16} color={Colors.error} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Pickup Location</Text>
                    <Text style={styles.locationAddress}>{startLocation || 'Current Location'}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Storage Plan */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(300)}>
          <Text style={styles.sectionTitle}>Storage Plan</Text>
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={styles.planIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>Duration</Text>
                <Text style={styles.planValue}>{getDurationDisplayText()}</Text>
              </View>
            </View>
            
            <View style={styles.planRow}>
              <View style={styles.planIcon}>
                <Ionicons name="key-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>Access Frequency</Text>
                <Text style={styles.planValue}>{getAccessDisplayText()}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Features & Add-ons */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(400)}>
          <Text style={styles.sectionTitle}>Features & Add-ons</Text>
          <View style={styles.featuresCard}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons 
                  name={climateControl ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={climateControl ? Colors.success : Colors.textSecondary} 
                />
              </View>
              <Text style={[
                styles.featureText,
                climateControl && styles.featureActive
              ]}>
                Climate Control {climateControl ? '(+$25/month)' : '(Not selected)'}
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons 
                  name={needsPickup ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={needsPickup ? Colors.success : Colors.textSecondary} 
                />
              </View>
              <Text style={[
                styles.featureText,
                needsPickup && styles.featureActive
              ]}>
                Pickup Service {needsPickup ? '(+$45 one-time)' : '(Not selected)'}
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              </View>
              <Text style={[styles.featureText, styles.featureActive]}>
                24/7 Security Monitoring (Included)
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="car" size={20} color={Colors.success} />
              </View>
              <Text style={[styles.featureText, styles.featureActive]}>
                Drive-up Access (Included)
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Special Requirements */}
        {specialRequirements && (
          <Animated.View style={styles.section} entering={SlideInUp.delay(500)}>
            <Text style={styles.sectionTitle}>Special Requirements</Text>
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsText}>{specialRequirements}</Text>
            </View>
          </Animated.View>
        )}

        {/* Price Breakdown */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(600)}>
          <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{selectedUnit?.title || 'Small Unit'} (monthly)</Text>
              <Text style={styles.priceValue}>${price.base.toFixed(2)}</Text>
            </View>
            {price.duration > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Duration discount</Text>
                <Text style={styles.priceValue}>${price.duration.toFixed(2)}</Text>
              </View>
            )}
            {price.addOns > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Add-ons</Text>
                <Text style={styles.priceValue}>${price.addOns.toFixed(2)}</Text>
              </View>
            )}
            {price.access !== 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Access adjustment</Text>
                <Text style={[
                  styles.priceValue,
                  price.access > 0 ? {} : { color: Colors.success }
                ]}>
                  {price.access > 0 ? '+' : ''}${price.access.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Monthly Total</Text>
              <Text style={styles.priceTotalValue}>${price.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Storage Benefits */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(700)}>
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>What's Included</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
                <Text style={styles.benefitText}>Free move-in truck rental</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
                <Text style={styles.benefitText}>Online account management</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
                <Text style={styles.benefitText}>Month-to-month flexibility</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
                <Text style={styles.benefitText}>Insurance options available</Text>
              </View>
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
                <Text style={styles.startButtonText}>Reserving Unit...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.startButtonText}>Reserve Storage Unit</Text>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  serviceDimensions: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 19,
    marginVertical: 8,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  planValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  featuresCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  featureActive: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  requirementsCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requirementsText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  priceCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  benefitsCard: {
    backgroundColor: `${Colors.primary}10`,
    padding: 20,
    borderRadius: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
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
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 12,
  },
});

export default StorageOrderSummary; 