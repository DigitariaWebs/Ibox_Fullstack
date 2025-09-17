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
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import { Icon } from '../../ui/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface ExpressFlowProps {
  navigation: any;
  route: any;
}

const ExpressFlow: React.FC<ExpressFlowProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedUrgency, setSelectedUrgency] = useState<string>('');
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

  const urgencyOptions = [
    {
      id: 'express_1h',
      title: 'Lightning Fast',
      subtitle: 'Within 1 hour',
      price: '$25',
      icon: 'flash',
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E53'],
      popular: true,
    },
    {
      id: 'express_2h',
      title: 'Express',
      subtitle: 'Within 2 hours',
      price: '$18',
      icon: 'rocket-outline',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A3BC'],
    },
    {
      id: 'same_day',
      title: 'Same Day',
      subtitle: 'Today by 8 PM',
      price: '$12',
      icon: 'today-outline',
      color: '#95E1D3',
      gradient: ['#95E1D3', '#78C7BB'],
    },
  ];

  const instructionOptions = [
    { id: 'fragile', icon: 'cube-outline', label: 'Fragile Item', color: '#FF6B6B' },
    { id: 'signature', icon: 'create-outline', label: 'Signature Required', color: '#4ECDC4' },
    { id: 'photo', icon: 'camera-outline', label: 'Photo Confirmation', color: '#FECA57' },
    { id: 'insured', icon: 'shield-checkmark-outline', label: 'Insurance', color: '#A29BFE' },
    { id: 'doorstep', icon: 'home-outline', label: 'Leave at Door', color: '#45B7D1' },
    { id: 'call', icon: 'call-outline', label: 'Call on Arrival', color: '#96CEB4' },
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
      // Navigate to photo screen
      navigation.navigate('PackagePhoto', {
        ...route.params,
        urgency: selectedUrgency,
        specialInstructions: selectedInstructions,
        specialNotes,
      });
    }
  };

  const toggleInstruction = (id: string) => {
    setSelectedInstructions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
      <View style={styles.stepsRow}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
              currentStep === step && styles.stepCircleCurrent
            ]}>
              {currentStep > step ? (
                <Icon name="check" type="Feather" size={16} color="white" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= step && styles.stepNumberActive
                ]}>
                  {step}
                </Text>
              )}
            </View>
            {step < 3 && (
              <View style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>
          Speed
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

  const renderUrgencyStep = () => {
    console.log('🔍 Rendering urgency step with options:', urgencyOptions.length);
    return (
    <Animated.View style={[contentStyle, { flex: 1 }]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          How <Text style={styles.stepTitleHighlight}>fast</Text> do you need it?
        </Text>
        <Text style={styles.stepSubtitle}>
          Choose your delivery speed
        </Text>
      </View>

      <ScrollView 
        style={styles.optionsScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.urgencyContainer}
      >
        {urgencyOptions && urgencyOptions.length > 0 ? (
          urgencyOptions.map((option, index) => (
          <Animated.View
            key={option.id}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            <TouchableOpacity
              style={[
                styles.urgencyCard,
                selectedUrgency === option.id && styles.urgencyCardSelected
              ]}
              onPress={() => setSelectedUrgency(option.id)}
              activeOpacity={0.8}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
              
              <LinearGradient
                colors={option.gradient as [string, string, ...string[]]}
                style={styles.urgencyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={option.icon as any} size={28} color="white" />
              </LinearGradient>

              <View style={styles.urgencyContent}>
                <Text style={styles.urgencyTitle}>{option.title}</Text>
                <Text style={styles.urgencySubtitle}>{option.subtitle}</Text>
              </View>

              <View style={styles.urgencyPriceContainer}>
                <Text style={styles.urgencyPrice}>{option.price}</Text>
                <View style={[
                  styles.urgencyCheckbox,
                  selectedUrgency === option.id && styles.urgencyCheckboxSelected
                ]}>
                  {selectedUrgency === option.id && (
                    <Icon name="check" type="Feather" size={16} color="white" />
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
    console.log('🎯 Rendering instructions step with options:', instructionOptions.length);
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

      <ScrollView 
        style={styles.instructionsListContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.instructionsListContent}
      >
        {instructionOptions.map((option, index) => (
          <Animated.View
            key={option.id}
            entering={FadeInUp.delay(index * 50).springify()}
          >
            <TouchableOpacity
              style={[
                styles.instructionListItem,
                selectedInstructions.includes(option.id) && styles.instructionListItemSelected
              ]}
              onPress={() => toggleInstruction(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.instructionListLeft}>
                <View style={[
                  styles.instructionListIcon,
                  { backgroundColor: `${option.color}15` },
                  selectedInstructions.includes(option.id) && { backgroundColor: option.color }
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={22} 
                    color={selectedInstructions.includes(option.id) ? 'white' : option.color} 
                  />
                </View>
                
                <View style={styles.instructionListTextContainer}>
                  <Text style={[
                    styles.instructionListLabel,
                    selectedInstructions.includes(option.id) && styles.instructionListLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.instructionListDescription}>
                    {option.id === 'fragile' && 'Extra care for delicate items'}
                    {option.id === 'doorstep' && 'No direct contact delivery'}
                    {option.id === 'photo' && 'Get photo proof of delivery'}
                    {option.id === 'insurance' && 'Protection for valuable items'}
                    {option.id === 'signature' && 'Recipient must sign for package'}
                  </Text>
                </View>
              </View>
              
              <View style={[
                styles.instructionCheckbox,
                selectedInstructions.includes(option.id) && styles.instructionCheckboxSelected
              ]}>
                {selectedInstructions.includes(option.id) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
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
            placeholder="E.g., Ring doorbell twice, package contains birthday gift..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            textAlignVertical="top"
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
            {['Handle with care', 'Call before delivery', 'Leave with neighbor'].map((note, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickNote}
                onPress={() => setSpecialNotes(prev => prev + (prev ? ', ' : '') + note)}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header with Status Bar Background */}
      <LinearGradient
        colors={[Colors.primary, '#00A896']}
        style={styles.headerWrapper}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusBarSpace} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" type="Feather" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>
              Express{' '}
              <Text style={styles.headerTitleHighlight}>Delivery</Text>
            </Text>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Icon name="x" type="Feather" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
        {currentStep === 1 && renderUrgencyStep()}
        {currentStep === 2 && renderInstructionsStep()}
        {currentStep === 3 && renderNotesStep()}
      </View>

      {/* Price Summary */}
      {selectedUrgency && (
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Speed</Text>
            <Text style={styles.priceValue}>
              {urgencyOptions.find(o => o.id === selectedUrgency)?.price || '$0'}
            </Text>
          </View>
          {selectedInstructions.length > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Special Instructions</Text>
              <Text style={styles.priceValue}>+${selectedInstructions.length * 2}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${
                (parseInt(urgencyOptions.find(o => o.id === selectedUrgency)?.price.replace('$', '') || '0') +
                selectedInstructions.length * 2)
              }
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedUrgency && currentStep === 1) && styles.continueButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!selectedUrgency && currentStep === 1}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (!selectedUrgency && currentStep === 1) 
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
            <Icon name="arrow-right" type="Feather" size={20} color="white" />
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
  headerWrapper: {
    // Extends gradient behind status bar
  },
  statusBarSpace: {
    height: STATUS_BAR_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'white',
  },
  headerTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: 'white',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  stepCircleCurrent: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#999',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepLabel: {
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
  urgencyContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  urgencyCard: {
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
  urgencyCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
    letterSpacing: 0.5,
  },
  urgencyGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyTitle: {
    fontSize: 17,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  urgencySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#666',
  },
  urgencyPriceContainer: {
    alignItems: 'flex-end',
  },
  urgencyPrice: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.primary,
    marginBottom: 8,
  },
  urgencyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  // List view styles for instructions
  instructionsListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsListContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  instructionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  instructionListItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}05`,
  },
  instructionListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructionListIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  instructionListTextContainer: {
    flex: 1,
  },
  instructionListLabel: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  instructionListLabelSelected: {
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  instructionListDescription: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  instructionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  instructionCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  // Keeping old grid styles for backward compatibility (will remove later)
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'center',
  },
  instructionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  instructionItemWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  instructionCenterWrapper: {
    alignItems: 'center',
    marginTop: 0,
  },
  instructionItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'center',
  },
  instructionItemCenter: {
    width: 160,
  },
  instructionItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  instructionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  instructionLabel: {
    fontSize: 11,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#333',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 13,
  },
  instructionLabelSelected: {
    color: Colors.textPrimary,
  },
  notesContainer: {
    flex: 1,
  },
  notesContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notesInputContainer: {
    marginTop: 20,
  },
  notesInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    minHeight: 150,
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
  },
  notesCounter: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  quickNotesContainer: {
    marginTop: 24,
  },
  quickNotesTitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#666',
    marginBottom: 12,
  },
  quickNotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  quickNote: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  quickNoteText: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#666',
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
  },
  continueButtonDisabled: {
    opacity: 0.5,
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
});

export default ExpressFlow;