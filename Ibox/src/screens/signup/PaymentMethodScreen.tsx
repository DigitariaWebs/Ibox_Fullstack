import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Text, Icon } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { PaymentMethodSelector } from '../../components/PaymentMethodSelector';

interface PaymentMethodScreenProps {
  navigation: any;
}

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [skipPayment, setSkipPayment] = useState(false);

  const handlePaymentDataChange = (data: PaymentData, valid: boolean) => {
    setIsPaymentValid(valid);
    setPaymentData(data);
  };

  const handleNext = () => {
    updateSignUpData({
      paymentData: skipPayment ? null : paymentData,
    });
    setCurrentStep(6);
    navigation.navigate('CustomerAccountType');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSkipPayment = () => {
    setSkipPayment(true);
    setPaymentData(null);
    setIsPaymentValid(false);
  };

  const canContinue = skipPayment || isPaymentValid;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 4 of 7</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Add payment method
              </Text>
              <Text style={styles.subtitle}>
                Securely add your payment information for seamless transactions
              </Text>
            </View>
            
            {/* Payment Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="credit-card" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                {!skipPayment ? (
                  <PaymentMethodSelector
                    onPaymentChange={handlePaymentDataChange}
                    onSkip={handleSkipPayment}
                  />
                ) : (
                  <View style={styles.skippedCard}>
                    <Icon name="info" type="Feather" size={20} color={Colors.info} />
                    <Text style={styles.skippedText}>
                      Payment method skipped. You can add this later in your profile settings.
                    </Text>
                    <TouchableOpacity onPress={() => setSkipPayment(false)}>
                      <Text style={styles.undoLink}>Add payment method</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            {/* Explore More Info */}
            <TouchableOpacity style={styles.exploreLink}>
              <Icon name="info" type="Feather" size={16} color={Colors.primary} />
              <Text style={styles.exploreLinkText}>Explore more info about payment</Text>
              <Icon name="external-link" type="Feather" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue to account type"
            onPress={handleNext}
            variant="primary"
            disabled={!canContinue}
            style={styles.nextButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 34,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  optionalBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionContent: {
    gap: 16,
  },
  paymentInput: {
    marginBottom: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  skippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  skippedText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  undoLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    gap: 8,
  },
  exploreLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  nextButton: {
    width: '100%',
  },
});

export default PaymentMethodScreen;