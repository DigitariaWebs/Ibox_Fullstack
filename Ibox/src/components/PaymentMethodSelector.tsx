import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { PaymentInput } from './PaymentInput';
import { 
  VisaLogo, 
  MastercardLogo, 
  AmexLogo, 
  DiscoverLogo, 
  ApplePayLogo, 
  GooglePayLogo, 
  StripeLogo 
} from './CardLogos';

interface PaymentMethodSelectorProps {
  onPaymentChange: (data: any, isValid: boolean) => void;
  onSkip: () => void;
}

type PaymentMethodType = 'card' | 'applepay' | 'googlepay' | 'stripe';

interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  logo: React.ReactNode;
  description: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onPaymentChange,
  onSkip,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [isPaymentValid, setIsPaymentValid] = useState(false);

  // Define PAYMENT_METHODS inside component to avoid referencing styles before initialization
  const PAYMENT_METHODS: PaymentMethod[] = React.useMemo(() => ([
    {
      id: 'card',
      name: 'Credit/Debit Card',
      logo: <VisaLogo width={48} height={30} />,
      description: 'Visa, Mastercard, Amex, Discover',
    },
    {
      id: 'applepay',
      name: 'Apple Pay',
      logo: <ApplePayLogo width={40} height={24} />,
      description: 'Pay with Touch ID or Face ID',
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      logo: <GooglePayLogo width={60} height={36} />,
      description: 'Quick and secure payments',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      logo: <StripeLogo width={40} height={24} />,
      description: 'Secure payment processing',
    },
  ]), []);

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    
    // For digital payment methods, mark as valid immediately
    if (method !== 'card') {
      setIsPaymentValid(true);
      onPaymentChange({ method, provider: method }, true);
    } else {
      setIsPaymentValid(false);
      onPaymentChange(null, false);
    }
  };

  const handleCardDataChange = (data: any, valid: boolean) => {
    setIsPaymentValid(valid);
    onPaymentChange({ method: 'card', ...data }, valid);
  };

  return (
    <View style={styles.container}>
      {/* Payment Method Selection */}
      <View style={styles.methodSelection}>
        <Text style={styles.sectionTitle}>Choose payment method</Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
              ]}
              onPress={() => handleMethodSelect(method.id)}
              activeOpacity={0.8}
            >
              <View style={styles.methodLogo}>
                {method.logo}
              </View>
              <Text style={[
                styles.methodName,
                selectedMethod === method.id && styles.methodNameSelected,
              ]}>
                {method.name}
              </Text>
              <Text style={[
                styles.methodDescription,
                selectedMethod === method.id && styles.methodDescriptionSelected,
              ]}>
                {method.description}
              </Text>
              {selectedMethod === method.id && (
                <View style={styles.methodCheck}>
                  <Icon name="check" type="Feather" size={16} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Details */}
      <View style={styles.paymentDetails}>
        {selectedMethod === 'card' ? (
          <PaymentInput
            onDataChange={handleCardDataChange}
            style={styles.paymentInput}
          />
        ) : (
          <View style={styles.digitalPaymentInfo}>
            <View style={styles.digitalPaymentHeader}>
              <Icon name="shield" type="Feather" size={24} color={Colors.success} />
              <Text style={styles.digitalPaymentTitle}>
                {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name} Selected
              </Text>
            </View>
            <Text style={styles.digitalPaymentDescription}>
              {selectedMethod === 'applepay' && 
                'You can securely pay using Touch ID, Face ID, or your device passcode. Your card details are never shared with merchants.'
              }
              {selectedMethod === 'googlepay' && 
                'Pay quickly and securely with Google Pay. Your payment info stays safe with advanced security and fraud protection.'
              }
              {selectedMethod === 'stripe' && 
                'Stripe provides secure payment processing with bank-level security and instant transaction processing.'
              }
            </Text>
            <View style={styles.digitalPaymentFeatures}>
              <View style={styles.featureItem}>
                <Icon name="lock" type="Feather" size={16} color={Colors.success} />
                <Text style={styles.featureText}>Bank-level encryption</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="zap" type="Feather" size={16} color={Colors.success} />
                <Text style={styles.featureText}>Instant processing</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="eye-off" type="Feather" size={16} color={Colors.success} />
                <Text style={styles.featureText}>Privacy protected</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Skip Option */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  methodSelection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 19,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  methodCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 140,
    justifyContent: 'center',
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  methodLogo: {
    height: 40,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogos: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  methodNameSelected: {
    color: Colors.primary,
  },
  methodDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },
  methodDescriptionSelected: {
    color: Colors.primary,
  },
  methodCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentDetails: {
    minHeight: 100,
  },
  paymentInput: {
    marginBottom: 0,
  },
  digitalPaymentInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.success + '30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  digitalPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  digitalPaymentTitle: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  digitalPaymentDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  digitalPaymentFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success + '15',
  },
  featureText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  skipButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
});