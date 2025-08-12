import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { accountTypeSchema } from '../../validation/signUpSchemas';
import { useFonts } from 'expo-font';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AccountTypeScreenProps {
  navigation: any;
}

const AccountTypeScreen: React.FC<AccountTypeScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  const [selectedType, setSelectedType] = useState<'customer' | 'transporter' | null>(
    signUpData.accountType || null
  );
  const [isValid, setIsValid] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load custom fonts if needed
  const [fontsLoaded] = useFonts({
    // Add any custom fonts here if needed
  });

  useEffect(() => {
    // Fade in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (selectedType) {
      // Animate layout when selection changes
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      accountTypeSchema
        .isValid({ accountType: selectedType })
        .then(setIsValid);
    } else {
      setIsValid(false);
    }
  }, [selectedType]);

  const handleSelection = (type: 'customer' | 'transporter') => {
    setSelectedType(type);
  };

  const handleNext = () => {
    if (selectedType && isValid) {
      updateSignUpData({ accountType: selectedType });
      setCurrentStep(2);
      navigation.navigate('Identity');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 1 of 7</Text>
      </View>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              What describes you best?
            </Text>
            <Text style={styles.subtitle}>
              Choose the option that best fits your needs and goals
            </Text>
          </View>

          {/* Selection Cards */}
          <View style={styles.selectionContainer}>
            <OptionCard
              type="customer"
              iconName="package"
              title="I'm a Customer"
              tagline="I need to ship items"
              longDescription="I need to send packages or items from one location to another. I'm looking for reliable transporters to handle my delivery needs."
              benefits={[
                'Find verified transporters near you',
                'Track your packages in real-time',
                'Get competitive pricing options',
              ]}
              selectedType={selectedType}
              onSelect={handleSelection}
            />

            <OptionCard
              type="transporter"
              iconName="truck"
              title="I'm a Transporter"
              tagline="I deliver packages"
              longDescription="I provide delivery services and want to connect with customers who need items transported. I'm looking to grow my business and find new opportunities."
              benefits={[
                'Find delivery jobs in your area',
                'Set your own schedule and pricing',
                'Get paid securely and reliably',
              ]}
              selectedType={selectedType}
              onSelect={handleSelection}
            />
          </View>
        </ScrollView>
        
        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            disabled={!isValid}
            style={styles.nextButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color={Colors.white} />}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// Helper component for benefit items
const BenefitItem = ({ icon, text, isSelected }: { icon: string, text: string, isSelected: boolean }) => (
  <View style={styles.benefitRow}>
    <Icon 
      name={icon} 
      type="Feather" 
      size={14} 
      color={isSelected ? Colors.white : Colors.primary} 
      style={styles.benefitIcon} 
    />
    <Text style={[
      styles.benefitText,
      isSelected && styles.selectedBenefitText
    ]}>
      {text}
    </Text>
  </View>
);

// Enhanced OptionCard component with better UI
const OptionCard = ({
  type,
  iconName,
  title,
  tagline,
  longDescription,
  benefits,
  selectedType,
  onSelect,
}: {
  type: 'customer' | 'transporter';
  iconName: string;
  title: string;
  tagline: string;
  longDescription: string;
  benefits: string[];
  selectedType: 'customer' | 'transporter' | null;
  onSelect: (t: 'customer' | 'transporter') => void;
}) => {
  const isSelected = selectedType === type;
  const isOtherSelected = selectedType !== null && selectedType !== type;
  
  return (
    <TouchableOpacity
      style={[
        styles.selectionCard, 
        isSelected && styles.selectedCard,
        isOtherSelected && styles.inactiveCard
      ]}
      activeOpacity={0.7}
      onPress={() => onSelect(type)}
    >
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, isSelected && styles.selectedCardIcon]}>
          <Icon
            name={iconName}
            type="Feather"
            size={28}
            color={isSelected ? Colors.white : Colors.primary}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, isSelected && styles.selectedCardTitle]}>
            {title}
          </Text>
          <Text style={[styles.cardTagline, isSelected && styles.selectedCardTagline]}>
            {tagline}
          </Text>
        </View>
        
        {/* Selection indicator */}
        <View style={[styles.selectionIndicator, isSelected && styles.selectedIndicator]}>
          {isSelected && <Icon name="check" type="Feather" size={16} color={Colors.white} />}
        </View>
      </View>

      {/* Description - Always visible but shortened for non-selected */}
      <Text style={[
        styles.cardDescription, 
        isSelected && styles.selectedCardDescription,
        isOtherSelected && styles.inactiveDescription
      ]}>
        {isSelected ? longDescription : longDescription.substring(0, 100) + '...'}
      </Text>

      {/* Benefits - Always show at least 2, all when selected */}
      <View style={styles.cardBenefits}>
        {benefits.slice(0, isSelected ? benefits.length : 2).map((benefit, idx) => (
          <BenefitItem 
            key={idx} 
            icon="check-circle" 
            text={benefit} 
            isSelected={isSelected} 
          />
        ))}
        {!isSelected && benefits.length > 2 && (
          <Text style={styles.moreBenefits}>
            +{benefits.length - 2} more benefits
          </Text>
        )}
      </View>

      {/* Selected overlay */}
      {isSelected && <View style={styles.selectedOverlay} />}
    </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: Colors.surfaceDark,
  },
  stepIndicator: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 38,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  selectionContainer: {
    gap: 24,
  },
  selectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    transform: [{ scale: 1 }],
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  inactiveCard: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(10, 165, 168, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedCardIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
    fontWeight: '700',
  },
  selectedCardTitle: {
    color: Colors.white,
  },
  cardTagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedCardTagline: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  selectedIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '400',
  },
  selectedCardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inactiveDescription: {
    opacity: 0.7,
  },
  cardBenefits: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  selectedBenefitText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  moreBenefits: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonContainer: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
  },
});

export default AccountTypeScreen;