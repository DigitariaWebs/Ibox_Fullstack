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
} from 'react-native';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { accountTypeSchema } from '../../validation/signUpSchemas';
import { useFonts } from 'expo-font';
import { 
  deviceHeight, 
  deviceWidth, 
  isSmallDevice,
  getScreenLayout,
  theme,
  moderateScale,
  verticalScale,
  scale 
} from '../../utils/responsive';

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

  const screenLayout = getScreenLayout();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="chevron-left" type="Feather" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 1 of 4</Text>
      </View>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Title Section - Fixed Height */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            What describes you best?
          </Text>
          <Text style={styles.subtitle}>
            Choose your account type to get started
          </Text>
        </View>

        {/* Selection Cards - Modern Design */}
        <View style={styles.selectionContainer}>
          <TouchableOpacity
            style={[
              styles.modernCard,
              selectedType === 'customer' && styles.modernCardSelected
            ]}
            onPress={() => handleSelection('customer')}
            activeOpacity={0.9}
          >
            <View style={[
              styles.modernIconContainer,
              selectedType === 'customer' && styles.modernIconContainerSelected
            ]}>
              <Icon name="package" type="Feather" size={32} color={selectedType === 'customer' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[
              styles.modernTitle,
              selectedType === 'customer' && styles.modernTitleSelected
            ]}>
              Customer
            </Text>
            <Text style={[
              styles.modernSubtitle,
              selectedType === 'customer' && styles.modernSubtitleSelected
            ]}>
              Send packages & items
            </Text>
            {selectedType === 'customer' && (
              <View style={styles.modernCheckmark}>
                <Icon name="check" type="Feather" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernCard,
              selectedType === 'transporter' && styles.modernCardSelected
            ]}
            onPress={() => handleSelection('transporter')}
            activeOpacity={0.9}
          >
            <View style={[
              styles.modernIconContainer,
              selectedType === 'transporter' && styles.modernIconContainerSelected
            ]}>
              <Icon name="truck" type="Feather" size={32} color={selectedType === 'transporter' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[
              styles.modernTitle,
              selectedType === 'transporter' && styles.modernTitleSelected
            ]}>
              Transporter
            </Text>
            <Text style={[
              styles.modernSubtitle,
              selectedType === 'transporter' && styles.modernSubtitleSelected
            ]}>
              Deliver packages & earn
            </Text>
            {selectedType === 'transporter' && (
              <View style={styles.modernCheckmark}>
                <Icon name="check" type="Feather" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Next Button - Fixed at Bottom */}
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

const screenLayout = getScreenLayout();
const cardHeight = screenLayout.isCompact ? verticalScale(120) : verticalScale(140);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    height: screenLayout.headerHeight,
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(22),
    backgroundColor: theme.colors.surfaceDark,
  },
  stepIndicator: {
    fontSize: moderateScale(16),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    justifyContent: 'space-between',
  },
  titleContainer: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(isSmallDevice ? 20 : 32),
  },
  title: {
    fontSize: moderateScale(isSmallDevice ? 24 : 28),
    color: theme.colors.text,
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(isSmallDevice ? 30 : 34),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: theme.colors.textSecondary,
    lineHeight: moderateScale(20),
    fontWeight: '500',
  },
  selectionContainer: {
    flex: 1,
    gap: verticalScale(20),
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(8),
  },
  modernCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: scale(24),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.medium,
    minHeight: verticalScale(screenLayout.isCompact ? 140 : 160),
    position: 'relative',
    overflow: 'hidden',
  },
  modernCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    ...theme.shadows.large,
    shadowColor: Colors.primary,
    transform: [{ scale: 1.02 }],
  },
  modernIconContainer: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  modernIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  modernTitleSelected: {
    color: Colors.white,
  },
  modernSubtitle: {
    fontSize: moderateScale(14),
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  modernSubtitleSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modernCheckmark: {
    position: 'absolute',
    top: scale(16),
    right: scale(16),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 0,
    paddingBottom: verticalScale(20),
  },
  nextButton: {
    width: '100%',
    height: verticalScale(56),
    borderRadius: theme.borderRadius.xl,
  },
});

export default AccountTypeScreen;