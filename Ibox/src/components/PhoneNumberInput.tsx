import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../config/colors';
import { Icon } from '../ui';
import PhoneNumberModal from './PhoneNumberModal';

interface PhoneNumberInputProps {
  value?: string;
  onChangeText?: (phone: string) => void;
  placeholder?: string;
  error?: string;
  style?: any;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value = '',
  onChangeText,
  placeholder = 'Enter phone number',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Parse phone number to show in a user-friendly way
  useEffect(() => {
    if (value) {
      // Extract country code and format display
      if (value.startsWith('+213')) {
        const number = value.substring(4);
        setDisplayValue(`🇩🇿 +213 ${number}`);
      } else if (value.startsWith('+1')) {
        const number = value.substring(2);
        setDisplayValue(`🇺🇸 +1 ${number}`);
      } else if (value.startsWith('+33')) {
        const number = value.substring(3);
        setDisplayValue(`🇫🇷 +33 ${number}`);
      } else if (value.startsWith('+212')) {
        const number = value.substring(4);
        setDisplayValue(`🇲🇦 +212 ${number}`);
      } else if (value.startsWith('+216')) {
        const number = value.substring(4);
        setDisplayValue(`🇹🇳 +216 ${number}`);
      } else if (value.startsWith('+44')) {
        const number = value.substring(3);
        setDisplayValue(`🇬🇧 +44 ${number}`);
      } else {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handlePhoneNumberSave = (phoneNumber: string) => {
    onChangeText?.(phoneNumber);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[styles.inputContainer, error && styles.errorContainer]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Phone Icon */}
        <Icon name="phone" type="Feather" size={20} color={Colors.textSecondary} style={styles.phoneIcon} />
        
        {/* Display Value or Placeholder */}
        <Text style={[
          styles.inputText, 
          !displayValue && styles.placeholderText
        ]}>
          {displayValue || placeholder}
        </Text>
        
        {/* Chevron Icon */}
        <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      
      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {/* Phone Number Modal */}
      <PhoneNumberModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handlePhoneNumberSave}
        initialValue={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    minHeight: 56,
  },
  errorContainer: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  phoneIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default PhoneNumberInput;