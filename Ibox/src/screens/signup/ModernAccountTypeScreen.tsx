import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../ui';
import { Icon } from '../../ui/Icon';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';
import IOSButton from '../../components/iOSButton';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ModernAccountTypeScreenProps {
  navigation: any;
}

type AccountType = 'customer' | 'transporter';

const ModernAccountTypeScreen: React.FC<ModernAccountTypeScreenProps> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  // Animation values
  const customerScale = useSharedValue(1);
  const transporterScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animation
    contentOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleAccountTypeSelect = (type: AccountType) => {
    setSelectedType(type);

    // Animate selection
    if (type === 'customer') {
      customerScale.value = withSpring(1.02, { damping: 20, stiffness: 300 });
      transporterScale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
    } else {
      transporterScale.value = withSpring(1.02, { damping: 20, stiffness: 300 });
      customerScale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
    }

    // Reset scales after animation
    setTimeout(() => {
      customerScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      transporterScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }, 200);
  };

  const handleContinue = () => {
    if (selectedType) {
      navigation.navigate('ModernBasicInfoStep', { accountType: selectedType });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const customerCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: customerScale.value }],
  }));

  const transporterCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: transporterScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0AA5A8', '#4DC5C8', '#7B68EE', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="chevron-left" type="Feather" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 3</Text>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Choose your </Text>
          <Text style={styles.titleSpecial}>account type</Text>
          <Text style={styles.subtitle}>
            Select how you plan to use iBox
          </Text>
        </View>

        {/* Account Type Cards */}
        <View style={styles.cardsContainer}>
          {/* Customer Card */}
          <Animated.View style={customerCardStyle}>
            <TouchableOpacity
              style={[
                styles.accountCard,
                selectedType === 'customer' && styles.accountCardSelected
              ]}
              onPress={() => handleAccountTypeSelect('customer')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, styles.customerIcon]}>
                  <Icon name="package" type="Feather" size={28} color={Colors.white} />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Customer</Text>
                  <Text style={styles.cardSubtitle}>Ship packages & goods</Text>
                </View>
              </View>

              <View style={styles.cardFeatures}>
                <View style={styles.feature}>
                  <Icon name="send" type="Feather" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Send packages</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="map-pin" type="Feather" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Track deliveries</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="star" type="Feather" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Rate transporters</Text>
                </View>
              </View>

              {selectedType === 'customer' && (
                <View style={styles.selectedIndicator}>
                  <Icon name="check-circle" type="Feather" size={20} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Transporter Card */}
          <Animated.View style={transporterCardStyle}>
            <TouchableOpacity
              style={[
                styles.accountCard,
                selectedType === 'transporter' && styles.accountCardSelected
              ]}
              onPress={() => handleAccountTypeSelect('transporter')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, styles.transporterIcon]}>
                  <Icon name="truck" type="Feather" size={28} color={Colors.white} />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Transporter</Text>
                  <Text style={styles.cardSubtitle}>Earn by delivering</Text>
                </View>
              </View>

              <View style={styles.cardFeatures}>
                <View style={styles.feature}>
                  <Icon name="dollar-sign" type="Feather" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Earn money</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="clock" type="Feather" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Flexible schedule</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="users" type="Feather" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Join network</Text>
                </View>
              </View>

              {selectedType === 'transporter' && (
                <View style={styles.selectedIndicator}>
                  <Icon name="check-circle" type="Feather" size={20} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <IOSButton
            title="Continue"
            onPress={handleContinue}
            isVisible={true}
            disabled={!selectedType}
            textColor="#1F2937"
            style={[
              styles.continueButton,
              !selectedType && styles.continueButtonDisabled
            ]}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleSpecial: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.white,
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    flex: 1,
    gap: 20,
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  accountCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  transporterIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardFeatures: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  buttonContainer: {
    paddingVertical: 20,
  },
  continueButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ModernAccountTypeScreen;