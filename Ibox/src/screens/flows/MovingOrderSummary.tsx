import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  SlideInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Text, Button } from '../../ui';

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

  const handleStartRequest = () => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log('🚚 MovingOrderSummary: Back button pressed');
            navigation.goBack();
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Moving Summary</Text>
          <Text style={styles.headerSubtitle}>Review your moving details</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Details */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(100)}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-shipping" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Moving Details</Text>
          </View>
          <View style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <MaterialIcons name="local-shipping" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Moving Service</Text>
              <Text style={styles.serviceSubtitle}>{apartmentSize?.title || '2-3 Chambres'}</Text>
              <Text style={styles.serviceDescription}>{apartmentSize?.subtitle || 'Appartement familial'}</Text>
            </View>
          </View>
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
                <Text style={styles.startButtonText}>Finding Movers...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.startButtonText}>Find Movers</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
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
  },
  routeCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsText: {
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

export default MovingOrderSummary; 