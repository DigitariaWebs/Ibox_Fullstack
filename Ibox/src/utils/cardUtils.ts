export interface CardType {
  name: string;
  pattern: RegExp;
  gaps: number[];
  lengths: number[];
  code: {
    name: string;
    size: number;
  };
}

export const CARD_TYPES: { [key: string]: CardType } = {
  visa: {
    name: 'Visa',
    pattern: /^4/,
    gaps: [4, 8, 12],
    lengths: [16, 18, 19],
    code: {
      name: 'CVV',
      size: 3,
    },
  },
  mastercard: {
    name: 'Mastercard',
    pattern: /^(5[1-5]|2[2-7])/,
    gaps: [4, 8, 12],
    lengths: [16],
    code: {
      name: 'CVC',
      size: 3,
    },
  },
  amex: {
    name: 'American Express',
    pattern: /^3[47]/,
    gaps: [4, 10],
    lengths: [15],
    code: {
      name: 'CID',
      size: 4,
    },
  },
  discover: {
    name: 'Discover',
    pattern: /^6(?:011|5)/,
    gaps: [4, 8, 12],
    lengths: [16, 19],
    code: {
      name: 'CID',
      size: 3,
    },
  },
  diners: {
    name: 'Diners Club',
    pattern: /^3[0689]/,
    gaps: [4, 10],
    lengths: [14],
    code: {
      name: 'CVV',
      size: 3,
    },
  },
  jcb: {
    name: 'JCB',
    pattern: /^35/,
    gaps: [4, 8, 12],
    lengths: [16],
    code: {
      name: 'CVV',
      size: 3,
    },
  },
  applepay: {
    name: 'Apple Pay',
    pattern: /^9999/, // Special pattern for Apple Pay (can be customized)
    gaps: [4, 8, 12],
    lengths: [16],
    code: {
      name: 'CVV',
      size: 3,
    },
  },
  googlepay: {
    name: 'Google Pay',
    pattern: /^8888/, // Special pattern for Google Pay (can be customized)
    gaps: [4, 8, 12],
    lengths: [16],
    code: {
      name: 'CVV',
      size: 3,
    },
  },
  stripe: {
    name: 'Stripe',
    pattern: /^7777/, // Special pattern for Stripe (can be customized)
    gaps: [4, 8, 12],
    lengths: [16],
    code: {
      name: 'CVV',
      size: 3,
    },
  },
};

export const detectCardType = (number: string): CardType | null => {
  const cleanNumber = number.replace(/\D/g, '');
  
  // Only check the first 4 digits for card type detection
  const firstFour = cleanNumber.substring(0, 4);
  
  for (const cardType of Object.values(CARD_TYPES)) {
    if (cardType.pattern.test(firstFour)) {
      return cardType;
    }
  }
  
  return null;
};

export const formatCardNumber = (number: string): string => {
  const cleanNumber = number.replace(/\D/g, '');
  const cardType = detectCardType(cleanNumber);
  
  // Use card type formatting if detected, otherwise default to groups of 4
  const gaps = cardType ? cardType.gaps : [4, 8, 12, 16];
  
  let formatted = '';
  
  for (let i = 0; i < cleanNumber.length; i++) {
    if (gaps.includes(i) && i > 0) {
      formatted += ' ';
    }
    formatted += cleanNumber[i];
  }
  
  return formatted;
};

export const formatExpiryDate = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length >= 2) {
    return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
  }
  
  return cleanValue;
};

export const validateCardNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/\D/g, '');
  
  // Allow any card number with reasonable length (12-19 digits)
  if (cleanNumber.length < 12 || cleanNumber.length > 19) {
    return false;
  }
  
  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const validateExpiryDate = (expiry: string): boolean => {
  const [month, year] = expiry.split('/');
  
  if (!month || !year) {
    return false;
  }
  
  const monthNum = parseInt(month);
  const yearNum = parseInt(`20${year}`);
  
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
    return false;
  }
  
  return true;
};

export const validateCVV = (cvv: string, cardType: CardType | null): boolean => {
  if (!cardType) {
    return false;
  }
  
  const cleanCVV = cvv.replace(/\D/g, '');
  return cleanCVV.length === cardType.code.size;
};