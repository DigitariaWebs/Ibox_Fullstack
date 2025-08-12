import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Text, Button } from '../../ui';

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;

interface StandardFlowProps {
  navigation: any;
  route: any;
}

const StandardFlow: React.FC<StandardFlowProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>('');
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStepTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const steps = [
    { number: 1, title: 'Créneau', active: currentStep === 1 },
    { number: 2, title: 'Instructions', active: currentStep === 2 },
  ];

  const timeWindowOptions = [
    {
      id: 'morning',
      title: 'Matin',
      subtitle: 'Livraison le matin',
      timeRange: '8h00 - 12h00',
      icon: 'wb-sunny',
      duration: '4h',
    },
    {
      id: 'afternoon',
      title: 'Après-midi',
      subtitle: 'Livraison l\'après-midi',
      timeRange: '12h00 - 18h00',
      icon: 'wb-cloudy',
      duration: '6h',
      popular: true,
    },
    {
      id: 'evening',
      title: 'Soir',
      subtitle: 'Livraison en soirée',
      timeRange: '18h00 - 21h00',
      icon: 'brightness-2',
      duration: '3h',
    },
  ];

  const instructionOptions = [
    { id: 'doorbell', title: 'Sonner à la porte', icon: 'notifications' },
    { id: 'concierge', title: 'Laisser au concierge', icon: 'person' },
    { id: 'safe_place', title: 'Lieu sûr', icon: 'security' },
    { id: 'call_first', title: 'Appeler avant', icon: 'phone' },
    { id: 'fragile', title: 'Fragile', icon: 'warning' },
    { id: 'signature', title: 'Signature requise', icon: 'edit' },
  ];

  const handleTimeWindowSelect = (windowId: string) => {
    setSelectedTimeWindow(windowId);
    setTimeout(() => {
      setCurrentStep(2);
      animateStepTransition();
    }, 300);
  };

  const toggleInstruction = (instructionId: string) => {
    setSelectedInstructions(prev => 
      prev.includes(instructionId)
        ? prev.filter(id => id !== instructionId)
        : [...prev, instructionId]
    );
  };

  const handleTakePhoto = () => {
    if (!selectedTimeWindow) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner un créneau de livraison.');
      return;
    }

    const selectedWindowData = timeWindowOptions.find(opt => opt.id === selectedTimeWindow);
    
    navigation.navigate('PackagePhoto', {
      ...route.params,
      deliveryWindow: selectedWindowData,
      specialInstructions: selectedInstructions,
      specialNotes,
      serviceType: 'standard',
      nextScreen: 'Measuring',
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      animateStepTransition();
    } else {
      navigation.goBack();
    }
  };

  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={step.number} style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            step.active && styles.progressDotActive,
            currentStep > step.number && styles.progressDotCompleted,
          ]}>
            {currentStep > step.number ? (
              <MaterialIcons name="check" size={12} color={Colors.white} />
            ) : (
              <Text style={[
                styles.progressNumber,
                step.active && styles.progressNumberActive,
              ]}>{step.number}</Text>
            )}
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.progressLine,
              currentStep > step.number && styles.progressLineCompleted,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const TimeWindowStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Quel créneau préférez-vous ?</Text>
        <Text style={styles.stepSubtitle}>Sélectionnez votre créneau de livraison</Text>
      </View>
      
      <View style={styles.stepContent}>
        <View style={styles.optionsGrid}>
          {timeWindowOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedTimeWindow === option.id && styles.optionCardSelected,
                option.popular && styles.optionCardPopular,
              ]}
              onPress={() => handleTimeWindowSelect(option.id)}
              activeOpacity={0.7}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAIRE</Text>
                </View>
              )}
              
              <View style={styles.optionIcon}>
                <MaterialIcons name={option.icon} size={28} color={Colors.primary} />
              </View>
              
              <Text style={styles.optionName}>{option.title}</Text>
              <Text style={styles.optionDuration}>{option.duration}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              
              <View style={styles.optionPriceContainer}>
                <Text style={styles.optionPrice}>{option.timeRange}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const InstructionsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Instructions de livraison</Text>
        <Text style={styles.stepSubtitle}>Sélectionnez les options qui vous conviennent</Text>
      </View>
      
      <View style={styles.stepContent}>
        <View style={styles.chipsContainer}>
          {instructionOptions.map((chip) => (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chip,
                selectedInstructions.includes(chip.id) && styles.chipSelected,
              ]}
              onPress={() => toggleInstruction(chip.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={chip.icon} 
                size={16} 
                color={selectedInstructions.includes(chip.id) ? Colors.white : Colors.primary} 
              />
              <Text style={[
                styles.chipText,
                selectedInstructions.includes(chip.id) && styles.chipTextSelected,
              ]}>{chip.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TextInput
          style={styles.textInput}
          placeholder="Ajoutez des instructions particulières..."
          placeholderTextColor={Colors.textTertiary}
          value={specialNotes}
          onChangeText={setSpecialNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={200}
        />
      </View>
      
      <View style={styles.stepFooter}>
        <Button
          title="Prendre une photo du colis"
          onPress={handleTakePhoto}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Standard Delivery</Text>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepCounter}>{currentStep}/2</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Step Content - Full Screen */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {currentStep === 1 && <TimeWindowStep />}
        {currentStep === 2 && <InstructionsStep />}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50, // Account for status bar on iOS
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  stepIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressNumberActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  progressLineCompleted: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepFooter: {
    paddingTop: 20,
  },
  optionsGrid: {
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionCardPopular: {
    borderColor: Colors.primary,
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
    fontWeight: '700',
    color: Colors.white,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    textAlign: 'center',
  },
  optionDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  optionPriceContainer: {
    alignItems: 'center',
  },
  optionPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.white,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    marginTop: 16,
    textAlignVertical: 'top',
  },
  continueButton: {
    marginBottom: 20,
  },
});

export default StandardFlow;