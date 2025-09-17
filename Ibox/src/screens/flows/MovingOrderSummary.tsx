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
} from 'react-native';
import Animated, {
  SlideInUp,
  FadeIn,
  FadeInDown,
  SlideInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import { Text, Button } from '../../ui';

// Status bar height
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

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
  
  const { 
    service, 
    startLocation, 
    startLocationCoords, 
    destination, 
    apartmentSize,
    inventoryItems = [],
    additionalServices = [], 
    specialNotes,
    packagePhoto,
    serviceType 
  } = route.params;
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const buttonScale = useSharedValue(1);
  const shimmerAnimation = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const headerOpacity = useSharedValue(0);
  const floatingCardY = useSharedValue(20);
  const priceCounterAnimation = useSharedValue(0);


  // Calculate estimated price based on selections
  const calculatePrice = () => {
    
    let basePrice = 0;
    
    // Base price by apartment size
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
      total: basePrice + inventoryComplexity + servicesTotal
    };
  };

  const price = calculatePrice();

  // Advanced animations on mount
  useEffect(() => {
    // Header entrance animation
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    
    // Card scale animation
    cardScale.value = withDelay(400, withSpring(1, { 
      damping: 15, 
      stiffness: 150,
      mass: 0.8
    }));
    
    // Floating cards animation
    floatingCardY.value = withDelay(600, withSpring(0, {
      damping: 12,
      stiffness: 100
    }));
    
    // Shimmer effect
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    
    // Price counter animation
    priceCounterAnimation.value = withDelay(800, withSpring(1, { duration: 1200 }));
  }, []);

  const handleStartRequest = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('🚚 MovingOrderSummary: Start request button pressed');
    
    setIsProcessing(true);
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { duration: 200 });
    });

    // Simulate processing
    setTimeout(() => {
      console.log('🚚 MovingOrderSummary: Navigating to DriverSearch');
      navigation.navigate('DriverSearch', {
        ...route.params,
        price: price,
        bookingId: `MV${Date.now()}`,
      });
    }, 1000);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });

  const floatingCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatingCardY.value }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-100, 100],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }],
    };
  });

  const priceCounterStyle = useAnimatedStyle(() => {
    const animatedPrice = interpolate(
      priceCounterAnimation.value,
      [0, 1],
      [0, price.total],
      Extrapolation.CLAMP
    );
    return {
      // This would be used for number animation if needed
      opacity: priceCounterAnimation.value,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Premium Header with Advanced Gradient */}
      <Animated.View style={[headerAnimatedStyle]}>
        <LinearGradient
          colors={[Colors.primary, '#00A896', '#667eea']}
          style={styles.headerWrapper}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.6, 1]}
        >
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
          
          <View style={styles.statusBarSpace} />
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('🚚 MovingOrderSummary: Close button pressed');
                navigation.goBack();
              }}
            >
              <BlurView intensity={20} style={styles.headerButtonBlur}>
                <Ionicons name="close" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Moving <Text style={styles.headerTitleItalic}>Summary</Text></Text>
              <Text style={styles.headerSubtitle}>Review your moving details</Text>
              
              {/* Premium accent line */}
              <View style={styles.headerAccentLine} />
            </View>
            
            <View style={styles.headerPlaceholder} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Service Details */}
        <Animated.View style={[styles.section, floatingCardStyle]} entering={ZoomIn.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="local-shipping" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Moving Details</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>✓</Text>
            </View>
          </View>
          
          <Animated.View style={[styles.premiumServiceCard, cardAnimatedStyle]}>
            {/* Glass morphism overlay */}
            <BlurView intensity={10} style={styles.cardBlurOverlay} />
            
            <View style={styles.serviceIcon}>
              <LinearGradient
                colors={[Colors.primary + '20', Colors.primary + '40']}
                style={styles.serviceIconGradient}
              >
                <MaterialIcons name="local-shipping" size={28} color={Colors.primary} />
              </LinearGradient>
            </View>
            
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Moving Service</Text>
              <Text style={styles.serviceSubtitle}>{apartmentSize?.title || '2-3 Chambres'}</Text>
              <Text style={styles.serviceDescription}>{apartmentSize?.subtitle || 'Appartement familial'}</Text>
              
              {/* Premium feature indicator */}
              <View style={styles.premiumIndicator}>
                <Text style={styles.premiumText}>Premium Service</Text>
              </View>
            </View>
            
            {/* Floating accent dot */}
            <View style={styles.floatingDot} />
          </Animated.View>
        </Animated.View>

        {/* Route Information */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(200)}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="route" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Route</Text>
          </View>
          <View style={styles.routeCard}>
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <MaterialIcons name="my-location" size={16} color={Colors.primary} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Pickup Location</Text>
                <Text style={styles.routeAddress}>{startLocation || 'Current Location'}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <MaterialIcons name="location-on" size={16} color={Colors.error} />
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
              <MaterialIcons name="inventory-2" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Items to Move ({inventoryItems.length})</Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.inventoryGrid}>
                {inventoryItems.map((item, index) => (
                  <View key={item.id} style={styles.inventoryItem}>
                    <View style={styles.inventoryIcon}>
                      <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.inventoryName}>{item.title}</Text>
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
              <MaterialIcons name="build" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Additional Services</Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsList}>
                {additionalServices.map((serviceId, index) => {
                  const serviceNames = {
                    'packing': 'Service d\'emballage',
                    'unpacking': 'Service de déballage', 
                    'assembly': 'Montage de meubles',
                    'storage': 'Stockage temporaire',
                    'cleaning': 'Nettoyage',
                    'protection': 'Protection des biens'
                  };
                  return (
                    <View key={index} style={styles.instructionItem}>
                      <MaterialIcons name="check-circle" size={16} color={Colors.primary} />
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
              <MaterialIcons name="assignment" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Special Instructions</Text>
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
            <MaterialIcons name="receipt" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
          </View>
          <View style={styles.priceCard}>
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
              <MaterialIcons name="schedule" size={24} color={Colors.primary} />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Estimated Duration</Text>
              <Text style={styles.timeValue}>{apartmentSize?.duration || '4-6h'}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Premium Bottom Actions */}
      <View style={styles.bottomSection}>
        <BlurView intensity={20} style={styles.bottomBlurOverlay} />
        
        <Animated.View style={[styles.totalAmountDisplay, priceCounterStyle]} entering={FadeInDown.delay(1000).springify()}>
          <View style={styles.totalAmountLeft}>
            <Text style={styles.totalAmountLabel}>Total Amount</Text>
            <View style={styles.totalAmountSubtext}>
              <MaterialIcons name="verified" size={14} color={Colors.primary} />
              <Text style={styles.totalAmountSubLabel}>All inclusive pricing</Text>
            </View>
          </View>
          
          <View style={styles.totalAmountRight}>
            <Text style={styles.totalAmountValue}>${price.total.toFixed(2)}</Text>
            <View style={styles.savingsIndicator}>
              <Text style={styles.savingsText}>Save $25</Text>
            </View>
          </View>
        </Animated.View>
        
        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Animated.View style={[buttonAnimatedStyle, styles.payButtonContainer]}>
            <TouchableOpacity
              style={[styles.premiumPayButton, isProcessing && styles.payButtonProcessing]}
              onPress={handleStartRequest}
              disabled={isProcessing}
            >
              {/* Premium glow effect */}
              <View style={styles.payButtonGlow} />
              
              <LinearGradient
                colors={isProcessing ? ['#E0E0E0', '#D0D0D0'] : [Colors.primary, '#00A896', '#667eea']}
                style={styles.payButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0, 0.6, 1]}
              >
                {/* Shimmer effect on button */}
                <Animated.View style={[styles.buttonShimmer, shimmerStyle]} />
                
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <Animated.View 
                      style={styles.premiumProcessingDot}
                      entering={ZoomIn.springify()}
                    />
                    <Text style={styles.payButtonText}>Finding Premium Movers...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.payButtonContent}>
                      <Text style={styles.payButtonText}>Pay & Find Movers</Text>
                      <Text style={styles.payButtonSubtext}>Guaranteed quality service</Text>
                    </View>
                    <View style={styles.payButtonIcon}>
                      <Ionicons name="arrow-forward" size={22} color="white" />
                    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.6,
  },
  statusBarSpace: {
    height: STATUS_BAR_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
    textAlign: 'center',
  },
  headerTitleItalic: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerAccentLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.SemiBold,
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    color: 'white',
    fontFamily: Fonts.SFProDisplay.Bold,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  premiumServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
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
  serviceIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIndicator: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: 11,
    fontFamily: Fonts.SFProDisplay.SemiBold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatingDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
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
  inventoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inventoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inventoryName: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inventoryQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  servicesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serviceItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceItemInfo: {
    flex: 1,
  },
  serviceItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  serviceItemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  serviceItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
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
    backgroundColor: `${Colors.primary}10`,
    padding: 16,
    borderRadius: 12,
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
  timeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsList: {
    // Container for instructions list (no specific styles needed)
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  notesSection: {
    paddingVertical: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
    lineHeight: 22,
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    flex: 1,
    minWidth: '45%',
  },
  inventoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
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
  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  totalAmountDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  totalAmountLeft: {
    flex: 1,
  },
  totalAmountLabel: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalAmountSubtext: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  totalAmountSubLabel: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.primary,
    marginLeft: 4,
  },
  totalAmountRight: {
    alignItems: 'flex-end',
  },
  totalAmountValue: {
    fontSize: 28,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.primary,
    marginBottom: 2,
  },
  savingsIndicator: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay.SemiBold,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    flex: 0.35,
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
  },
  payButtonContainer: {
    flex: 0.65,
  },
  payButton: {
    borderRadius: 25,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumPayButton: {
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  payButtonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: Colors.primary + '20',
    borderRadius: 35,
    opacity: 0.5,
  },
  payButtonProcessing: {
    shadowOpacity: 0.1,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    opacity: 0.7,
  },
  payButtonContent: {
    flex: 1,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    marginBottom: 2,
  },
  payButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: Fonts.SFProDisplay.Regular,
  },
  payButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  premiumProcessingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default MovingOrderSummary; 