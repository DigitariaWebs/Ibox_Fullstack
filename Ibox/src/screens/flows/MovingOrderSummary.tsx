import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  SlideInUp,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import { Text, Button } from '../../ui';
import { Icon } from '../../ui/Icon';
import servicesService, { ServicePricingRequest, ServiceBookingRequest, PricingResponse, Order } from '../../services/servicesService';

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;

interface MovingOrderSummaryProps {
  navigation: any;
  route: any;
}

const MovingOrderSummary: React.FC<MovingOrderSummaryProps> = ({
  navigation,
  route,
}) => {
  console.log('🚚 MovingOrderSummary: Component mounted');
  console.log('🚚 MovingOrderSummary: Route params received:', Object.keys(route.params || {}));
  
  // Destructure route params FIRST
  const {
    service,
    startLocation: rawStartLocation,
    startLocationCoords,
    destination,
    basePricing = 0,
    distanceKm = 0,
    apartmentSize,
    inventoryItems = [],
    floorInfo,
    additionalServices = [],
    specialNotes = '',
    serviceType,
    pricingBreakdown
  } = route.params || {};

  // Ensure startLocation is never empty
  const startLocation = (rawStartLocation && rawStartLocation.trim() && rawStartLocation.trim() !== '') 
    ? rawStartLocation.trim() 
    : 'Current Location';

  console.log('🔍 DEBUG: startLocation on mount:', startLocation);
  console.log('🔍 DEBUG: destination on mount:', destination);
  console.log('🔍 DEBUG: startLocationCoords on mount:', startLocationCoords);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendPricing, setBackendPricing] = useState<PricingResponse | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  
  const buttonScale = useSharedValue(1);

  // Load backend pricing
  useEffect(() => {
    const loadBackendPricing = async () => {
      if (startLocation && destination && startLocationCoords && !backendPricing && !isLoadingPricing) {
        setIsLoadingPricing(true);
        
        try {
          const pricingRequest: ServicePricingRequest = {
            pickupLocation: servicesService.mapToServiceLocation(
              startLocation,
              startLocationCoords
            ),
            dropoffLocation: servicesService.mapToServiceLocation(
              destination.address || destination.name || 'Destination',
              { latitude: destination.coordinate?.latitude, longitude: destination.coordinate?.longitude }
            ),
            packageDetails: servicesService.mapToPackageDetails({
              description: 'Moving service - Professional relocation',
              packageSize: apartmentSize?.id || 'house',
              specialInstructions: additionalServices,
              fragile: additionalServices.includes('fragile'),
              weight: inventoryItems.reduce((sum, item) => sum + (item.weight || 0), 0) || 100,
              dimensions: {
                length: 200,
                width: 150,
                height: 100
              }
            }),
            additionalServices: additionalServices
          };

          console.log('💰 Loading backend pricing for Moving service...', pricingRequest);
          
          const pricing = await servicesService.calculatePricing('moving-service', pricingRequest);
          setBackendPricing(pricing);
          console.log('✅ Backend pricing loaded:', pricing.pricing.totalAmount, pricing.pricing.currency);
          
        } catch (error) {
          console.error('❌ Failed to load backend pricing:', error);
          // Continue with frontend pricing as fallback
        } finally {
          setIsLoadingPricing(false);
        }
      }
    };

    // Load pricing after a short delay
    const timer = setTimeout(loadBackendPricing, 2000);
    return () => clearTimeout(timer);
  }, [startLocation, destination, startLocationCoords, additionalServices, apartmentSize]);

  // Calculate price following the user scenario
  const calculatePrice = () => {
    // Use backend pricing if available (prioritize backend over frontend)
    if (backendPricing) {
      const pricing = backendPricing.pricing;
      return {
        base: pricing.baseFee,
        complexity: pricing.surcharges.reduce((sum, s) => sum + s.amount, 0),
        services: 0, // Already included in surcharges
        total: pricing.totalAmount,
        currency: pricing.currency,
        distanceKm: distanceKm,
        breakdown: pricing,
        isBackendPricing: true
      };
    }

    // Use detailed pricing breakdown from MovingFlow if available
    if (pricingBreakdown) {
      return {
        base: pricingBreakdown.baseDistance,
        complexity: pricingBreakdown.items + pricingBreakdown.access,
        services: pricingBreakdown.services,
        total: pricingBreakdown.total,
        currency: 'USD',
        distanceKm: distanceKm,
        isBackendPricing: false,
        breakdown: pricingBreakdown
      };
    }

    // Frontend calculation fallback
    let basePrice = basePricing || 0;
    
    // Base price by apartment size (fallback)
    if (!basePrice) {
      switch(apartmentSize?.id) {
        case 'studio':
          basePrice = 129;
          break;
        case '2br':
          basePrice = 199;
          break;
        case '4br':
          basePrice = 299;
          break;
        default:
          basePrice = 199;
      }
    }
    
    // Add complexity based on inventory count
    const inventoryComplexity = Math.min(inventoryItems.length * 5, 50);
    
    // Add price for additional services
    const servicesPricing = {
      'packing': 80,
      'unpacking': 60,
      'assembly': 40,
      'storage': 100,
      'cleaning': 120,
      'protection': 50,
    };
    
    const servicesTotal = additionalServices.reduce((total, serviceId) => {
      return total + (servicesPricing[serviceId] || 0);
    }, 0);
    
    return {
      base: basePrice,
      complexity: inventoryComplexity,
      services: servicesTotal,
      total: basePrice + inventoryComplexity + servicesTotal,
      currency: 'USD',
      distanceKm: distanceKm,
      isBackendPricing: false
    };
  };

  const price = calculatePrice();

  const handleStartRequest = async () => {
    console.log('🚚 MovingOrderSummary: Start request button pressed');
    console.log('🔍 DEBUG: startLocation:', startLocation);
    console.log('🔍 DEBUG: destination:', destination);
    console.log('🔍 DEBUG: startLocationCoords:', startLocationCoords);
    console.log('🔍 DEBUG: All route params:', Object.keys(route.params || {}));
    
    if (!startLocation || !destination || !startLocationCoords) {
      console.log('❌ Missing location data - startLocation:', !!startLocation, 'destination:', !!destination, 'startLocationCoords:', !!startLocationCoords);
      Alert.alert('Error', 'Missing location information. Please try again.');
      return;
    }

    setIsProcessing(true);
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { duration: 200 });
    });

    try {
      // Create order in backend
      const bookingRequest: ServiceBookingRequest = {
        pickupLocation: servicesService.mapToServiceLocation(
          startLocation,
          startLocationCoords
        ),
        dropoffLocation: servicesService.mapToServiceLocation(
          destination.address || destination.name || 'Destination',
          { latitude: destination.coordinate?.latitude, longitude: destination.coordinate?.longitude }
        ),
        packageDetails: servicesService.mapToPackageDetails({
          description: 'Moving service - Professional relocation',
          packageSize: apartmentSize?.id || 'house',
          specialInstructions: additionalServices,
          fragile: additionalServices.includes('fragile'),
          weight: inventoryItems.reduce((sum, item) => sum + (item.weight || 0), 0) || 100,
          dimensions: {
            length: 200,
            width: 150,
            height: 100
          }
        }),
        scheduledPickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
        additionalServices: additionalServices,
        specialInstructions: specialNotes || additionalServices.join(', '),
        paymentMethod: 'card', // Default payment method
        pricingDetails: backendPricing || price
      };

      console.log('📦 Creating Moving order in backend...', bookingRequest);
      
      const result = await servicesService.bookService('moving-service', bookingRequest);
      setCreatedOrder(result.order);
      
      console.log('✅ Moving order created successfully:', result.order._id);
      
      // Navigate to DriverSearch with order details
      navigation.navigate('DriverSearch', {
        ...route.params,
        price: price,
        orderId: result.order._id,
        order: result.order,
        bookingId: `MV${Date.now()}`,
      });
      
    } catch (error: any) {
      console.error('❌ Failed to create Moving order:', error);
      Alert.alert(
        'Order Failed', 
        error.message || 'Failed to create your order. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!createdOrder) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('❌ Cancelling Moving order:', createdOrder._id);
              
              await servicesService.cancelOrder(createdOrder._id, 'Customer cancellation from order summary');
              
              console.log('✅ Moving order cancelled successfully');
              
              Alert.alert(
                'Order Cancelled',
                'Your order has been cancelled successfully.',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
              );
              
            } catch (error: any) {
              console.error('❌ Failed to cancel order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please contact support.');
            }
          }
        }
      ]
    );
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header without back button */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.headerGradient}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Moving <Text style={styles.headerTitleSpecial}>Summary</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            Review and confirm your moving service
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="x" type="Feather" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Details */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(100)}>
          <View style={styles.sectionHeader}>
            <Icon name="truck" type="Feather" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Moving <Text style={styles.sectionTitleSpecial}>Details</Text></Text>
          </View>
          <View style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Icon name="truck" type="Feather" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Moving Service</Text>
              <Text style={styles.serviceSubtitle}>{apartmentSize?.title || '2-3 Bedrooms'}</Text>
              <Text style={styles.serviceDescription}>Professional moving service</Text>
            </View>
          </View>
        </Animated.View>

        {/* Route Information */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(200)}>
          <View style={styles.sectionHeader}>
            <Icon name="map-pin" type="Feather" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Route</Text>
          </View>
          <View style={styles.routeCard}>
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <Icon name="map-pin" type="Feather" size={14} color={Colors.primary} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Pickup Location</Text>
                <Text style={styles.routeAddress}>{startLocation || 'Current Location'}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <Icon name="map-pin" type="Feather" size={14} color={Colors.error} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Delivery Address</Text>
                <Text style={styles.routeAddress}>{destination?.title || 'Destination'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Inventory Items */}
        {inventoryItems.length > 0 && (
          <Animated.View style={styles.section} entering={SlideInUp.delay(300)}>
            <View style={styles.sectionHeader}>
              <Icon name="package" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Items to Move ({inventoryItems.length})</Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.inventoryGrid}>
                {inventoryItems.map((item, index) => (
                  <View key={item.id} style={styles.inventoryItem}>
                    <View style={styles.inventoryIcon}>
                      <Icon name={item.icon} type="MaterialIcons" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.inventoryName}>{item.name}</Text>
                    <Text style={styles.inventoryQuantity}>×{item.quantity}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Additional Services */}
        {additionalServices.length > 0 && (
          <Animated.View style={styles.section} entering={SlideInUp.delay(400)}>
            <View style={styles.sectionHeader}>
              <Icon name="list" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Additional <Text style={styles.sectionTitleSpecial}>Services</Text></Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsList}>
                {additionalServices.map((serviceId, index) => {
                  const serviceNames = {
                    'packing': 'Packing Service',
                    'unpacking': 'Unpacking Service', 
                    'assembly': 'Furniture Assembly',
                    'storage': 'Temporary Storage',
                    'cleaning': 'Cleaning Service',
                    'protection': 'Item Protection'
                  };
                  return (
                    <View key={index} style={styles.instructionItem}>
                      <Icon name="check-circle" type="Feather" size={14} color={Colors.primary} />
                      <Text style={styles.instructionText}>{serviceNames[serviceId] || serviceId}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Special Instructions */}
        {specialNotes && (
          <Animated.View style={styles.section} entering={SlideInUp.delay(500)}>
            <View style={styles.sectionHeader}>
              <Icon name="edit" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Special <Text style={styles.sectionTitleSpecial}>Instructions</Text></Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Additional Notes:</Text>
                <Text style={styles.notesText}>{specialNotes}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Price Breakdown */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(600)}>
          <View style={styles.sectionHeader}>
            <Icon name="credit-card" type="Feather" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Price <Text style={styles.sectionTitleSpecial}>Breakdown</Text></Text>
          </View>
          <View style={styles.priceCard}>
            {/* Show detailed breakdown if available */}
            {price.breakdown ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Distance ({price.distanceKm.toFixed(1)}km)</Text>
                  <Text style={styles.priceValue}>${price.breakdown.baseDistance.toFixed(2)}</Text>
                </View>
                
                {price.breakdown.size > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Space Size</Text>
                    <Text style={styles.priceValue}>+${price.breakdown.size.toFixed(2)}</Text>
                  </View>
                )}
                
                {price.breakdown.items > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Items ({inventoryItems.reduce((sum, item) => sum + item.quantity, 0)})</Text>
                    <Text style={styles.priceValue}>+${price.breakdown.items.toFixed(2)}</Text>
                  </View>
                )}
                
                {price.breakdown.access > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Access Charges</Text>
                    <Text style={styles.priceValue}>+${price.breakdown.access.toFixed(2)}</Text>
                  </View>
                )}
                
                {price.breakdown.services > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Additional Services</Text>
                    <Text style={styles.priceValue}>+${price.breakdown.services.toFixed(2)}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base moving service</Text>
                  <Text style={styles.priceValue}>${price.base.toFixed(2)}</Text>
                </View>
                {price.complexity > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Inventory complexity</Text>
                    <Text style={styles.priceValue}>${price.complexity.toFixed(2)}</Text>
                  </View>
                )}
                {price.services > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Additional services</Text>
                    <Text style={styles.priceValue}>${price.services.toFixed(2)}</Text>
                  </View>
                )}
              </>
            )}
            
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>${price.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Estimated Time */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(700)}>
          <View style={styles.timeCard}>
            <View style={styles.timeIconContainer}>
              <Icon name="clock" type="Feather" size={22} color={Colors.primary} />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Estimated Duration</Text>
              <Text style={styles.timeValue}>{apartmentSize?.duration || '4-6 hours'}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modern Bottom Actions */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomShadow} />
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.totalAmount}>
              ${price.total.toFixed(2)} {price.currency || 'USD'}
            </Text>
            {isLoadingPricing && (
              <Text style={styles.pricingStatus}>Updating...</Text>
            )}
            {backendPricing && (
              <Text style={styles.pricingStatus}>✓ Live pricing</Text>
            )}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
          >
            <Text style={styles.cancelButtonText}>
              {createdOrder ? 'Cancel Order' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          <Animated.View style={[styles.payButtonWrapper, buttonAnimatedStyle]}>
            <TouchableOpacity
              style={[styles.payButton, isProcessing && styles.payButtonProcessing]}
              onPress={handleStartRequest}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isProcessing ? ['#999', '#777'] : [Colors.primary, '#00A896']}
                style={styles.payButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <Animated.View 
                      style={styles.processingDot}
                      entering={FadeIn}
                    />
                    <Text style={styles.payButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.payButtonText}>Pay & Find Movers</Text>
                    <Icon name="arrow-right" type="Feather" size={18} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Screen Styles
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerTitleSpecial: {
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontWeight: '400',
    fontStyle: 'italic',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 60 : 40,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionTitleSpecial: {
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontWeight: '400',
    fontStyle: 'italic',
    color: Colors.primary,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
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
  },
  routeCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '08',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
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
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  instructionsList: {
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  inventoryItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inventoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inventoryName: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  inventoryQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  priceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
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
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '08',
    padding: 20,
    borderRadius: 20,
  },
  timeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: {
    flex: 1,
    marginLeft: 16,
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
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomShadow: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  totalAmountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  pricingStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 0.35,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  payButtonWrapper: {
    flex: 0.65,
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  payButtonProcessing: {
    shadowOpacity: 0,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
    letterSpacing: -0.3,
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

export default MovingOrderSummary;