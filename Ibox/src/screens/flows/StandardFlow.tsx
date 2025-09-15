import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface StandardFlowProps {
  navigation: any;
  route: any;
}

const StandardFlow: React.FC<StandardFlowProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>('');
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animation values
  const progressValue = useSharedValue(0);
  const stepTransition = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  
  const totalSteps = 3;

  useEffect(() => {
    // Initial animations
    progressValue.value = withSpring((currentStep / totalSteps) * 100, {
      damping: 15,
      stiffness: 100,
    });
    stepTransition.value = withTiming(1, { duration: 400 });
  }, [currentStep]);

  const timeWindowOptions = [
    {
      id: 'morning',
      title: 'Morning',
      subtitle: 'Same day morning',
      timeRange: '8:00 - 12:00',
      price: '$12',
      icon: 'sunny',
      color: '#FF8A65',
      gradient: ['#FF8A65', '#FF7043'],
    },
    {
      id: 'afternoon',
      title: 'Afternoon',
      subtitle: 'Same day afternoon',
      timeRange: '12:00 - 18:00',
      price: '$15',
      icon: 'partly-sunny',
      color: '#42A5F5',
      gradient: ['#42A5F5', '#2196F3'],
      popular: true,
    },
    {
      id: 'evening',
      title: 'Evening',
      subtitle: 'Same day evening',
      timeRange: '18:00 - 21:00',
      price: '$18',
      icon: 'moon',
      color: '#AB47BC',
      gradient: ['#AB47BC', '#8E24AA'],
    },
  ];

  const instructionOptions = [
    { id: 'doorbell', icon: 'notifications-outline', label: 'Ring Doorbell', color: '#4ECDC4' },
    { id: 'call_first', icon: 'call-outline', label: 'Call First', color: '#FECA57' },
    { id: 'concierge', icon: 'person-outline', label: 'Leave with Concierge', color: '#45B7D1' },
    { id: 'safe_place', icon: 'shield-checkmark-outline', label: 'Safe Place', color: '#96CEB4' },
    { id: 'fragile', icon: 'warning-outline', label: 'Handle with Care', color: '#FF6B6B' },
  ];

  const handleBack = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      stepTransition.value = withTiming(0, { duration: 200 }, () => {
        'worklet';
        stepTransition.value = withTiming(1, { duration: 200 });
      });
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 200);
    } else {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true);
      stepTransition.value = withTiming(0, { duration: 200 }, () => {
        'worklet';
        stepTransition.value = withTiming(1, { duration: 200 });
      });
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 200);
    } else {
      handleTakePhoto();
    }
  };

  const handleTimeWindowSelect = (windowId: string) => {
    setSelectedTimeWindow(windowId);
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  const toggleInstruction = (id: string) => {
    setSelectedInstructions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTakePhoto = () => {
    if (!selectedTimeWindow) {
      return;
    }

    const selectedWindowData = timeWindowOptions.find(opt => opt.id === selectedTimeWindow);
    
    navigation.navigate('PackagePhoto', {
      ...route.params,
      deliveryWindow: selectedWindowData,
      specialInstructions: selectedInstructions,
      specialNotes,
      serviceType: 'standard',
      nextScreen: 'StandardOrderSummary',
    });
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: stepTransition.value,
    transform: [{
      translateY: interpolate(
        stepTransition.value,
        [0, 1],
        [20, 0],
        Extrapolation.CLAMP
      )
    }]
  }));

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepCircle,
          currentStep >= 1 && styles.stepCircleActive
        ]}>
          <Text style={[
            styles.stepNumber,
            currentStep >= 1 && styles.stepNumberActive
          ]}>1</Text>
        </View>
        
        <View style={[
          styles.stepConnector,
          currentStep >= 2 && styles.stepConnectorActive
        ]} />
        
        <View style={[
          styles.stepCircle,
          currentStep >= 2 && styles.stepCircleActive
        ]}>
          <Text style={[
            styles.stepNumber,
            currentStep >= 2 && styles.stepNumberActive
          ]}>2</Text>
        </View>

        <View style={[
          styles.stepConnector,
          currentStep >= 3 && styles.stepConnectorActive
        ]} />
        
        <View style={[
          styles.stepCircle,
          currentStep >= 3 && styles.stepCircleActive
        ]}>
          <Text style={[
            styles.stepNumber,
            currentStep >= 3 && styles.stepNumberActive
          ]}>3</Text>
        </View>
      </View>

      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>
          Time Window
        </Text>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>
          Instructions
        </Text>
        <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>
          Notes
        </Text>
      </View>
    </View>
  );

  const renderTimeWindowStep = () => {
    console.log('📅 Rendering time window step with options:', timeWindowOptions.length);
    return (
      <Animated.View style={[contentStyle, { flex: 1 }]}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            When do you need <Text style={styles.stepTitleHighlight}>delivery</Text>?
          </Text>
          <Text style={styles.stepSubtitle}>
            Choose your preferred time window
          </Text>
        </View>

        <ScrollView 
          style={styles.optionsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeWindowContainer}
        >
          {timeWindowOptions && timeWindowOptions.length > 0 ? (
            timeWindowOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.timeWindowCard,
                  selectedTimeWindow === option.id && styles.timeWindowCardSelected
                ]}
                onPress={() => handleTimeWindowSelect(option.id)}
                activeOpacity={0.8}
              >
                {option.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                
                <LinearGradient
                  colors={option.gradient as [string, string, ...string[]]}
                  style={styles.timeWindowGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={option.icon as any} size={28} color="white" />
                </LinearGradient>

                <View style={styles.timeWindowContent}>
                  <Text style={styles.timeWindowTitle}>{option.title}</Text>
                  <Text style={styles.timeWindowSubtitle}>{option.subtitle}</Text>
                  <Text style={styles.timeWindowRange}>{option.timeRange}</Text>
                </View>

                <View style={styles.timeWindowPriceContainer}>
                  <Text style={styles.timeWindowPrice}>{option.price}</Text>
                  <View style={[
                    styles.timeWindowCheckbox,
                    selectedTimeWindow === option.id && styles.timeWindowCheckboxSelected
                  ]}>
                    {selectedTimeWindow === option.id && (
                      <Feather name="check" size={16} color="white" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontFamily: Fonts.SFProDisplay.Regular }}>
                Loading options...
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderInstructionsStep = () => {
    console.log('📋 Rendering instructions step with options:', instructionOptions.length);
    return (
      <Animated.View style={[contentStyle, { flex: 1 }]}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            Special <Text style={styles.stepTitleHighlight}>instructions</Text>?
          </Text>
          <Text style={styles.stepSubtitle}>
            Select all that apply
          </Text>
        </View>

        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsGrid}>
            {instructionOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInUp.delay(index * 50).springify()}
                style={[
                  styles.instructionItemWrapper,
                  index === 4 && { marginLeft: '26%' } // Center the last item
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.instructionItem,
                    selectedInstructions.includes(option.id) && styles.instructionItemSelected
                  ]}
                  onPress={() => toggleInstruction(option.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.instructionIcon,
                    { backgroundColor: `${option.color}20` },
                    selectedInstructions.includes(option.id) && { backgroundColor: option.color }
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={22} 
                      color={selectedInstructions.includes(option.id) ? 'white' : option.color} 
                    />
                  </View>
                  <Text style={[
                    styles.instructionLabel,
                    selectedInstructions.includes(option.id) && styles.instructionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderNotesStep = () => (
    <Animated.View style={[contentStyle, { flex: 1 }]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          Additional <Text style={styles.stepTitleHighlight}>notes</Text>
        </Text>
        <Text style={styles.stepSubtitle}>
          Any special requests for the driver?
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.notesContent}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <Animated.View
          entering={FadeIn.delay(200).springify()}
          style={styles.notesInputContainer}
        >
          <TextInput
            style={styles.notesInput}
            placeholder="E.g., Ring doorbell twice, package contains fragile items..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            textAlignVertical="top"
            maxLength={200}
            returnKeyType="send"
            returnKeyLabel="Send"
            blurOnSubmit={true}
            onSubmitEditing={() => {
              Keyboard.dismiss();
            }}
          />
          <Text style={styles.notesCounter}>
            {specialNotes.length}/200
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(300).springify()}
          style={styles.quickNotesContainer}
        >
          <Text style={styles.quickNotesTitle}>Quick notes:</Text>
          <View style={styles.quickNotesGrid}>
            {['Ring twice', 'Call first', 'Handle with care', 'Leave at door'].map((note, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickNoteChip}
                onPress={() => {
                  if (specialNotes.length + note.length <= 200) {
                    setSpecialNotes(prev => prev ? `${prev}. ${note}` : note);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.quickNoteText}>{note}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  const getSelectedPrice = () => {
    const selectedWindow = timeWindowOptions.find(o => o.id === selectedTimeWindow);
    return selectedWindow ? parseInt(selectedWindow.price.replace('$', '')) : 0;
  };

  const getInstructionsCost = () => selectedInstructions.length * 1;
  const getTotalPrice = () => getSelectedPrice() + getInstructionsCost();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Feather name="arrow-left" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>
            Standard{' '}
            <Text style={styles.headerTitleHighlight}>Delivery</Text>
          </Text>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <View style={styles.content}>
        {currentStep === 1 && renderTimeWindowStep()}
        {currentStep === 2 && renderInstructionsStep()}
        {currentStep === 3 && renderNotesStep()}
      </View>

      {/* Price Summary */}
      {selectedTimeWindow && (
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Time Window</Text>
            <Text style={styles.priceValue}>
              {timeWindowOptions.find(o => o.id === selectedTimeWindow)?.price || '$0'}
            </Text>
          </View>
          {selectedInstructions.length > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Special Instructions</Text>
              <Text style={styles.priceValue}>+${getInstructionsCost()}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${getTotalPrice()}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedTimeWindow && currentStep === 1) && styles.continueButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!selectedTimeWindow && currentStep === 1}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (!selectedTimeWindow && currentStep === 1) 
                ? ['#E0E0E0', '#D0D0D0']
                : [Colors.primary, '#1BA8A8']
            }
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueText}>
              {currentStep === totalSteps ? 'Continue to Photo' : 'Continue'}
            </Text>
            <Feather name="arrow-right" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
  },
  headerTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
    fontSize: 21,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepIndicatorContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#999',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepConnector: {
    width: 60,
    height: 2,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  stepConnectorActive: {
    backgroundColor: Colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  stepLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#999',
  },
  stepLabelActive: {
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay.Medium,
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  stepHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  stepTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
    fontSize: 26,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#666',
  },
  optionsScroll: {
    flex: 1,
  },
  timeWindowContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  timeWindowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeWindowCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 9,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
    letterSpacing: 0.5,
  },
  timeWindowGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timeWindowContent: {
    flex: 1,
  },
  timeWindowTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timeWindowSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#666',
    marginBottom: 2,
  },
  timeWindowRange: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.primary,
  },
  timeWindowPriceContainer: {
    alignItems: 'center',
  },
  timeWindowPrice: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.primary,
    marginBottom: 6,
  },
  timeWindowCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeWindowCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    justifyContent: 'flex-start',
  },
  instructionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    justifyContent: 'space-between',
  },
  instructionItemWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  instructionItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    minHeight: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
  },
  instructionItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  instructionLabel: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
  instructionLabelSelected: {
    color: Colors.textPrimary,
  },
  notesInputContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 4,
  },
  notesInput: {
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesCounter: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#999',
    textAlign: 'right',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  priceSummary: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.primary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
  },
  notesContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickNotesContainer: {
    marginTop: 24,
  },
  quickNotesTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  quickNotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickNoteChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  quickNoteText: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.primary,
  },
});

export default StandardFlow;