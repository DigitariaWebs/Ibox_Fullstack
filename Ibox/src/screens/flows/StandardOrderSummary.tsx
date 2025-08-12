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

interface StandardOrderSummaryProps {
  navigation: any;
  route: any;
}

const StandardOrderSummary: React.FC<StandardOrderSummaryProps> = ({
  navigation,
  route,
}) => {
  console.log('📦 StandardOrderSummary: Component mounted');
  console.log('📦 StandardOrderSummary: Route params received:', Object.keys(route.params || {}));
  
  const { 
    service, 
    startLocation, 
    startLocationCoords, 
    destination, 
    packagePhoto,
    measurements: passedMeasurements,
    deliveryWindow,
    specialInstructions = [],
    specialNotes,
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
    console.log('📦 StandardOrderSummary: Starting AI analysis simulation');
    
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
    // Generate realistic measurements based on standard package size
    const baseSizes = {
      'small': { w: [15, 25], h: [10, 20], d: [5, 15], weight: [0.5, 2.0] },
      'medium': { w: [25, 40], h: [20, 35], d: [15, 25], weight: [1.5, 5.0] },
      'large': { w: [40, 60], h: [30, 50], d: [25, 40], weight: [3.0, 10.0] },
    };
    
    const sizeKey = 'medium'; // Standard delivery typically medium size
    const ranges = baseSizes[sizeKey];
    
    const randomInRange = (range) => Math.round((Math.random() * (range[1] - range[0]) + range[0]) * 10) / 10;
    
    return {
      width: randomInRange(ranges.w),
      height: randomInRange(ranges.h),
      depth: randomInRange(ranges.d),
      weight: randomInRange(ranges.weight),
      confidence: Math.round((Math.random() * 15 + 85) * 10) / 10, // 85-100% confidence
    };
  };

  // Calculate price based on measurements and delivery window
  const calculatePrice = () => {
    if (!aiMeasurements) return { base: 0, size: 0, window: 0, instructions: 0, total: 0 };
    
    // Base price for standard delivery
    let basePrice = 12;
    
    // Size calculation (volume-based)
    const volume = aiMeasurements.width * aiMeasurements.height * aiMeasurements.depth;
    const sizeMultiplier = Math.max(1, Math.ceil(volume / 6000)); // Every 6000 cm³
    const sizeAdjustment = (sizeMultiplier - 1) * 3;
    
    // Weight adjustment
    const weightAdjustment = Math.max(0, (aiMeasurements.weight - 1.5) * 2);
    
    // Delivery window adjustment (no extra charge for standard)
    const windowAdjustment = 0;
    
    // Special instructions fee
    const instructionsFee = specialInstructions.length * 1.5;
    
    return {
      base: basePrice,
      size: sizeAdjustment + weightAdjustment,
      window: windowAdjustment,
      instructions: instructionsFee,
      total: basePrice + sizeAdjustment + weightAdjustment + windowAdjustment + instructionsFee
    };
  };

  const price = calculatePrice();

  const handleStartRequest = () => {
    console.log('📦 StandardOrderSummary: Start request button pressed');
    
    setIsProcessing(true);
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { duration: 200 });
    });

    // Simulate processing
    setTimeout(() => {
      console.log('📦 StandardOrderSummary: Navigating to DriverSearch');
      navigation.navigate('DriverSearch', {
        ...route.params,
        measurements: aiMeasurements,
        price: price,
        bookingId: `SD${Date.now()}`,
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
              <MaterialIcons name="auto-awesome" size={48} color={Colors.primary} />
            </View>
          </Animated.View>
          
          <Animated.Text 
            style={styles.analysisTitle}
            entering={SlideInUp.delay(400)}
          >
            AI Package Analysis
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log('📦 StandardOrderSummary: Back button pressed');
            navigation.goBack();
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Standard Summary</Text>
          <Text style={styles.headerSubtitle}>Review your delivery details</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Analysis Results */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(100)}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="analytics" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>AI Analysis Results</Text>
          </View>
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <View style={styles.aiIcon}>
                <MaterialIcons name="auto-awesome" size={24} color={Colors.primary} />
              </View>
              <View style={styles.analysisInfo}>
                <Text style={styles.analysisResultTitle}>Package Detected</Text>
                <Text style={styles.confidenceText}>
                  {aiMeasurements?.confidence}% Confidence
                </Text>
              </View>
              <View style={styles.confidenceBadge}>
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
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
            <MaterialIcons name="local-shipping" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Standard Details</Text>
          </View>
          <View style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <MaterialIcons name="local-shipping" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>Standard Delivery</Text>
              <Text style={styles.serviceSubtitle}>{deliveryWindow?.title || 'Same Day'}</Text>
              <Text style={styles.serviceDescription}>{deliveryWindow?.subtitle || 'Reliable delivery'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Route Information */}
        <Animated.View style={styles.section} entering={SlideInUp.delay(300)}>
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

        {/* Special Instructions */}
        {specialInstructions.length > 0 && (
          <Animated.View style={styles.section} entering={SlideInUp.delay(400)}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="assignment" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Special Instructions</Text>
            </View>
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsList}>
                {specialInstructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={Colors.primary} />
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
            <MaterialIcons name="receipt" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
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
              <MaterialIcons name="schedule" size={24} color={Colors.primary} />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Estimated Delivery Time</Text>
              <Text style={styles.timeValue}>
                {deliveryWindow?.timeRange || '1-3 hours'}
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
                <Text style={styles.startButtonText}>Finding Driver...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.startButtonText}>Find Driver</Text>
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
  // Analysis Screen Styles
  analysisContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  },
  analysisCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
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

export default StandardOrderSummary;