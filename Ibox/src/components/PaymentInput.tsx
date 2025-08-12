import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Icon, Input } from '../ui';
import { Colors } from '../config/colors';
import {
  detectCardType,
  formatCardNumber,
  formatExpiryDate,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  CardType,
} from '../utils/cardUtils';
import { CardTypeLogo } from './CardLogos';

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface PaymentInputProps {
  onDataChange: (data: PaymentData, isValid: boolean) => void;
  initialData?: Partial<PaymentData>;
  style?: any;
}

export const PaymentInput: React.FC<PaymentInputProps> = ({
  onDataChange,
  initialData = {},
  style,
}) => {
  const [formData, setFormData] = useState<PaymentData>({
    cardNumber: initialData.cardNumber || '',
    expiryDate: initialData.expiryDate || '',
    cvv: initialData.cvv || '',
    cardholderName: initialData.cardholderName || '',
  });

  const [errors, setErrors] = useState<Partial<PaymentData>>({});
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const cardFlipAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    validateAndUpdate();
  }, [formData]);

  const validateAndUpdate = () => {
    const newErrors: Partial<PaymentData> = {};
    const detectedCardType = detectCardType(formData.cardNumber);
    setCardType(detectedCardType);

    // Validate card number
    if (formData.cardNumber) {
      const cleanNumber = formData.cardNumber.replace(/\D/g, '');
      if (cleanNumber.length < 12) {
        newErrors.cardNumber = 'Card number is too short';
      } else if (!validateCardNumber(formData.cardNumber)) {
        newErrors.cardNumber = 'Invalid card number';
      }
    }

    // Validate expiry date
    if (formData.expiryDate) {
      if (formData.expiryDate.length < 5) {
        newErrors.expiryDate = 'Invalid format (MM/YY)';
      } else if (!validateExpiryDate(formData.expiryDate)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // Validate CVV
    if (formData.cvv) {
      if (!validateCVV(formData.cvv, detectedCardType)) {
        const expectedLength = detectedCardType?.code.size || 3;
        newErrors.cvv = `${detectedCardType?.code.name || 'CVV'} must be ${expectedLength} digits`;
      }
    }

    // Validate cardholder name
    if (formData.cardholderName && formData.cardholderName.length < 2) {
      newErrors.cardholderName = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);

    const isValid = 
      Object.keys(newErrors).length === 0 &&
      formData.cardNumber &&
      formData.expiryDate &&
      formData.cvv &&
      formData.cardholderName;

    onDataChange(formData, isValid);
  };

  const updateField = (field: keyof PaymentData, value: string) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      // Allow any card number up to 19 digits
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length > 19) {
        return;
      }
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.length > 5) return;
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      const maxLength = cardType?.code.size || 4;
      if (formattedValue.length > maxLength) return;
    } else if (field === 'cardholderName') {
      formattedValue = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
    if (field === 'cvv') {
      Animated.timing(cardFlipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBlur = () => {
    setFocusedField(null);
    Animated.timing(cardFlipAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getCardMask = () => {
    if (!formData.cardNumber) return '•••• •••• •••• ••••';
    const cleanNumber = formData.cardNumber.replace(/\D/g, '');
    const formatted = formatCardNumber(formData.cardNumber);
    
    // Default to 16 digits if no card type detected
    const targetLength = cardType?.lengths[0] || 16;
    const remaining = Math.max(0, targetLength - cleanNumber.length);
    
    if (remaining === 0) return formatted;
    
    const mask = '•'.repeat(remaining);
    const gaps = cardType ? cardType.gaps : [4, 8, 12, 16];
    
    // Add spacing for the mask part
    let maskedPart = '';
    for (let i = 0; i < remaining; i++) {
      const position = cleanNumber.length + i;
      if (gaps.includes(position) && position > 0 && maskedPart.length > 0) {
        maskedPart += ' ';
      }
      maskedPart += '•';
    }
    
    return formatted + (cleanNumber.length > 0 ? ' ' : '') + maskedPart;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Card Preview */}
      <Animated.View style={[
        styles.cardPreview,
        {
          transform: [{
            rotateY: cardFlipAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            }),
          }],
        },
      ]}>
        <LinearGradient
          colors={[Colors.white, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardFront}>
          {/* Card Type Logo */}
          <View style={styles.cardLogo}>
            <CardTypeLogo cardType={cardType?.name.toLowerCase() || null} width={50} height={30} />
          </View>

          {/* Card Number */}
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumber}>
              {formData.cardNumber || getCardMask()}
            </Text>
          </View>

          {/* Card Details */}
          <View style={styles.cardDetails}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardLabel}>CARDHOLDER NAME</Text>
              <Text style={styles.cardValue}>
                {formData.cardholderName || 'YOUR NAME'}
              </Text>
            </View>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>
                {formData.expiryDate || 'MM/YY'}
              </Text>
            </View>
          </View>
          </View>
        </LinearGradient>

        {/* Card Back */}
        <Animated.View style={[
          styles.cardBack,
          {
            opacity: cardFlipAnim,
            transform: [{
              rotateY: cardFlipAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['180deg', '0deg'],
              }),
            }],
          },
        ]}>
          <LinearGradient
            colors={[Colors.white, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.magneticStripe} />
            <View style={styles.signaturePanel}>
              <Text style={styles.cvvLabel}>{cardType?.code.name || 'CVV'}</Text>
              <View style={styles.cvvBox}>
                <Text style={styles.cvvText}>
                  {formData.cvv || '•'.repeat(cardType?.code.size || 3)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <Input
          placeholder="Card number"
          value={formData.cardNumber}
          onChangeText={(value) => updateField('cardNumber', value)}
          onFocus={() => handleFocus('cardNumber')}
          onBlur={handleBlur}
          error={errors.cardNumber}
          keyboardType="numeric"
          leftIcon={<Icon name="credit-card" type="Feather" size={20} color={Colors.textSecondary} />}
          rightElement={
            cardType ? (
              <View style={styles.cardTypeIndicator}>
                <CardTypeLogo cardType={cardType.name.toLowerCase()} width={32} height={20} />
              </View>
            ) : null
          }
          style={styles.inputField}
        />

        <View style={styles.inputRow}>
          <Input
            placeholder="MM/YY"
            value={formData.expiryDate}
            onChangeText={(value) => updateField('expiryDate', value)}
            onFocus={() => handleFocus('expiryDate')}
            onBlur={handleBlur}
            error={errors.expiryDate}
            keyboardType="numeric"
            leftIcon={<Icon name="calendar" type="Feather" size={20} color={Colors.textSecondary} />}
            style={[styles.inputField, styles.halfInput]}
          />

          <Input
            placeholder={cardType?.code.name || 'CVV'}
            value={formData.cvv}
            onChangeText={(value) => updateField('cvv', value)}
            onFocus={() => handleFocus('cvv')}
            onBlur={handleBlur}
            error={errors.cvv}
            keyboardType="numeric"
            leftIcon={<Icon name="lock" type="Feather" size={20} color={Colors.textSecondary} />}
            style={[styles.inputField, styles.halfInput]}
            secureTextEntry={focusedField !== 'cvv'}
          />
        </View>

        <Input
          placeholder="Cardholder name"
          value={formData.cardholderName}
          onChangeText={(value) => updateField('cardholderName', value)}
          onFocus={() => handleFocus('cardholderName')}
          onBlur={handleBlur}
          error={errors.cardholderName}
          leftIcon={<Icon name="user" type="Feather" size={20} color={Colors.textSecondary} />}
          style={styles.inputField}
          autoCapitalize="characters"
        />
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Icon name="shield" type="Feather" size={16} color={Colors.success} />
        <Text style={styles.securityText}>
          Your payment information is encrypted and secure
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  cardPreview: {
    height: 200,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  cardFront: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  cardLogo: {
    alignSelf: 'flex-end',
  },
  cardNumberContainer: {
    marginVertical: 20,
  },
  cardNumber: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontWeight: '500',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDetailItem: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(31, 41, 55, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  magneticStripe: {
    height: 40,
    backgroundColor: '#000',
    marginTop: 20,
    marginHorizontal: -20,
  },
  signaturePanel: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    transform: [{ scaleX: -1 }],
  },
  cvvLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  cvvBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  cvvText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  inputContainer: {
    gap: 16,
  },
  inputField: {
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  cardTypeIndicator: {
    marginRight: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});