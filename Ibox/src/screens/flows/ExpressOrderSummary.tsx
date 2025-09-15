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

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;

interface ExpressOrderSummaryProps {
  navigation: any;
  route: any;
}

const ExpressOrderSummary: React.FC<ExpressOrderSummaryProps> = ({
  navigation,
  route,
}) => {
  console.log('⚡ ExpressOrderSummary: Component mounted');
  console.log('⚡ ExpressOrderSummary: Route params received:', Object.keys(route.params || {}));
  
  const { 
    service, 
    startLocation, 
    startLocationCoords, 
    destination, 
    urgency, 
    packageSize, 
    specialInstructions = [], 
    specialNotes,
    packagePhoto,
    serviceType 
  } = route.params;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiMeasurements, setAiMeasurements] = useState(null);
  const [currentStep, setCurrentStep] = useState('Preparing analysis...');
  
  const buttonScale = useSharedValue(1);
  const analysisProgress = useSharedValue(0);

  // Simulate AI analysis of package photo
  useEffect(() => {
    console.log('⚡ ExpressOrderSummary: Starting AI analysis simulation');
    
    // Simulate progressive AI analysis with more detailed steps
    const analysisSteps = [
      { delay: 800, progress: 0.1, status: 'Initializing AI vision model...' },
      { delay: 1600, progress: 0.2, status: 'Detecting package edges and corners...' },
      { delay: 2400, progress: 0.35, status: 'Analyzing surface textures...' },
      { delay: 3200, progress: 0.5, status: 'Calculating precise dimensions...' },
      { delay: 4000, progress: 0.65, status: 'Estimating material density...' },
      { delay: 4800, progress: 0.8, status: 'Computing weight distribution...' },
      { delay: 5600, progress: 0.9, status: 'Validating measurements...' },
      { delay: 6400, progress: 1.0, status: 'Analysis complete!' },
    ];

          analysisSteps.forEach((step, index) => {
        setTimeout(() => {
          analysisProgress.value = withTiming(step.progress, { duration: 400 });
          setCurrentStep(step.status);
          
          if (index === analysisSteps.length - 1) {
            // Generate random but realistic measurements
            const measurements = generateAIMeasurements();
            setAiMeasurements(measurements);
            
            setTimeout(() => {
              setIsAnalyzing(false);
            }, 800);
          }
        }, step.delay);
      });
  }, []);

  const generateAIMeasurements = () => {
    // Generate realistic measurements based on selected package size
    const baseSizes = {
      'small': { w: [15, 25], h: [10, 20], d: [5, 15], weight: [0.5, 2.0] },
      'medium': { w: [25, 40], h: [20, 35], d: [15, 25], weight: [1.5, 5.0] },
      'large': { w: [40, 60], h: [30, 50], d: [25, 40], weight: [3.0, 10.0] },
    };
    
    const sizeKey = packageSize?.id || 'medium';
    const ranges = baseSizes[sizeKey] || baseSizes.medium;
    
    const randomInRange = (range) => Math.round((Math.random() * (range[1] - range[0]) + range[0]) * 10) / 10;
    
    return {
      width: randomInRange(ranges.w),
      height: randomInRange(ranges.h),
      depth: randomInRange(ranges.d),
      weight: randomInRange(ranges.weight),
      confidence: Math.round((Math.random() * 15 + 85) * 10) / 10, // 85-100% confidence
    };
  };

  // Calculate price based on measurements and urgency
  const calculatePrice = () => {
    if (!aiMeasurements) return { base: 0, urgency: 0, size: 0, total: 0 };
    
    // Base price
    let basePrice = 12;
    
    // Size calculation (volume-based)
    const volume = aiMeasurements.width * aiMeasurements.height * aiMeasurements.depth;
    const sizeMultiplier = Math.max(1, Math.ceil(volume / 5000)); // Every 5000 cm³
    const sizeAdjustment = (sizeMultiplier - 1) * 3;
    
    // Weight adjustment
    const weightAdjustment = Math.max(0, (aiMeasurements.weight - 1) * 2);
    
    // Urgency pricing
    const urgencyPricing = {
      '1h': 25,
      '2h': 15,
      'same-day': 0,
    };
    
    const urgencyFee = urgencyPricing[urgency?.id] || 0;
    
    // Special instructions fee
    const instructionsFee = specialInstructions.length * 2;
    
    return {
      base: basePrice,
      size: sizeAdjustment + weightAdjustment,
      urgency: urgencyFee,
      instructions: instructionsFee,
      total: basePrice + sizeAdjustment + weightAdjustment + urgencyFee + instructionsFee
    };
  };

  const price = calculatePrice();

  const handleStartRequest = () => {
    console.log('⚡ ExpressOrderSummary: Start request button pressed');
    
    setIsProcessing(true);
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { duration: 200 });
    });

    // Simulate processing
    setTimeout(() => {
      console.log('⚡ ExpressOrderSummary: Navigating to DriverSearch');
      navigation.navigate('DriverSearch', {
        ...route.params,
        measurements: aiMeasurements,
        price: price,
        bookingId: `EX${Date.now()}`,
      });
    }, 1000);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${analysisProgress.value * 100}%`,
    };
  });

  if (isAnalyzing) {
    return (
      <View style={styles.analysisContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        
        <View style={styles.analysisContent}>
          <Animated.View entering={FadeIn.delay(200)}>
            <View style={styles.aiIcon}>
              <Icon name="cpu" type="Feather" size={48} color={Colors.primary} />
            </View>
          </Animated.View>
          
          <Animated.Text
            style={styles.analysisTitle}
            entering={SlideInUp.delay(400)}
          >
            AI Package <Text style={styles.analysisTitleSpecial}>Analysis</Text>
          </Animated.Text>
          
          <Animated.Text 
            style={styles.analysisSubtitle}
            entering={SlideInUp.delay(600)}
          >
            Our AI is analyzing your package photo to determine optimal pricing
          </Animated.Text>
          
          {packagePhoto && (
            <Animated.View 
              style={styles.photoContainer}
              entering={SlideInUp.delay(800)}
            >
              <Image source={{ uri: packagePhoto }} style={styles.packagePhoto} />
              <View style={styles.scanOverlay}>
                <View style={styles.scanLine} />
              </View>
            </Animated.View>
          )}
          
          <Animated.View 
            style={styles.progressContainer}
            entering={SlideInUp.delay(1000)}
          >
            <Text style={styles.stepText}>{currentStep}</Text>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(analysisProgress.value * 100)}% Complete
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

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
            Express <Text style={styles.headerTitleSpecial}>Summary</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            Review and confirm your delivery
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
        {/* AI Analysis Results */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(100)}>
          <View style={styles.sectionHeader}>
            <Icon name="cpu" type="Feather" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>AI Analysis <Text style={styles.sectionTitleSpecial}>Results</Text></Text>
          </View>
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <View style={styles.aiIconSmall}>
                <Icon name="cpu" type="Feather" size={20} color={Colors.primary} />
              </View>
              <View style={styles.analysisInfo}>
                <Text style={styles.analysisResultTitle}>Package Detected</Text>
                <Text style={styles.confidenceText}>
                  {aiMeasurements?.confidence}% Confidence
                </Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Icon name="check-circle" type="Feather" size={18} color={Colors.success} />
              </View>
            </View>
            
            <View style={styles.measurementsGrid}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Width</Text>
                <Text style={styles.measurementValue}>{aiMeasurements?.width} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Height</Text>
                <Text style={styles.measurementValue}>{aiMeasurements?.height} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Depth</Text>
                <Text style={styles.measurementValue}>{aiMeasurements?.depth} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Est. Weight</Text>
                <Text style={styles.measurementValue}>{aiMeasurements?.weight} kg</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Service Details */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(200)}>
          <View style={styles.sectionHeader}>
            <Icon name="zap" type="Feather" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Express <Text style={styles.sectionTitleSpecial}>Details</Text></Text>
          </View>
          <View style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Icon name="zap" type="Feather" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Express Delivery</Text>
              <Text style={styles.serviceSubtitle}>{urgency?.title || 'Same Day'}</Text>
              <Text style={styles.serviceDescription}>{urgency?.subtitle || 'Standard express'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Route Information */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(300)}>
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

        {/* Special Instructions */}
        {specialInstructions.length > 0 && (
          <Animated.View style={styles.section} entering={SlideInUp.delay(400)}>
            <View style={styles.sectionHeader}>
              <Icon name="list" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Special <Text style={styles.sectionTitleSpecial}>Instructions</Text></Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsList}>
                {specialInstructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Icon name="check-circle" type="Feather" size={14} color={Colors.primary} />
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
              {specialNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Additional Notes:</Text>
                  <Text style={styles.notesText}>{specialNotes}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Price Breakdown */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(500)}>
          <View style={styles.sectionHeader}>
            <Icon name="credit-card" type="Feather" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Price <Text style={styles.sectionTitleSpecial}>Breakdown</Text></Text>
          </View>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base delivery</Text>
              <Text style={styles.priceValue}>${price.base.toFixed(2)}</Text>
            </View>
            {price.size > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Size & weight adjustment</Text>
                <Text style={styles.priceValue}>${price.size.toFixed(2)}</Text>
              </View>
            )}
            {price.urgency > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Urgency fee ({urgency?.title})</Text>
                <Text style={styles.priceValue}>${price.urgency.toFixed(2)}</Text>
              </View>
            )}
            {price.instructions > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Special handling</Text>
                <Text style={styles.priceValue}>${price.instructions.toFixed(2)}</Text>
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
        <Animated.View style={styles.section} entering={SlideInUp.delay(600)}>
          <View style={styles.timeCard}>
            <View style={styles.timeIconContainer}>
              <Icon name="clock" type="Feather" size={22} color={Colors.primary} />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Estimated Delivery Time</Text>
              <Text style={styles.timeValue}>
                {urgency?.id === '1h' && '30-60 minutes'}
                {urgency?.id === '2h' && '1-2 hours'}
                {urgency?.id === 'same-day' && '2-4 hours'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modern Bottom Actions */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomShadow} />
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${price.total.toFixed(2)}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              console.log('⚡ ExpressOrderSummary: Cancel button pressed');
              navigation.navigate('HomeScreen');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
                    <Text style={styles.payButtonText}>Pay & Find Courier</Text>
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
  // Analysis Screen Styles
  analysisContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  analysisContent: {
    alignItems: 'center',
    width: '100%',
  },
  aiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  analysisTitleSpecial: {
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontWeight: '400',
    fontStyle: 'italic',
    color: Colors.primary,
  },
  analysisSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  packagePhoto: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    minHeight: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },

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
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisInfo: {
    flex: 1,
    marginLeft: 12,
  },
  analysisResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confidenceText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  confidenceBadge: {
    marginLeft: 8,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  measurementItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  measurementLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '600',
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
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
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

export default ExpressOrderSummary; 