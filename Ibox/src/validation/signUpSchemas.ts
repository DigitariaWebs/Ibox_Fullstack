import * as Yup from 'yup';

// Step 1: Account Type
export const accountTypeSchema = Yup.object().shape({
  accountType: Yup.string()
    .oneOf(['customer', 'transporter'], 'Please select an account type')
    .required('Account type is required'),
});

// Step 2: Identity
export const identitySchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .required('Phone number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  legalAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms and privacy policy'),
});

// Step 2-b: OTP
export const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

// Step 3: Address & Locale
export const addressSchema = Yup.object().shape({
  defaultAddress: Yup.string()
    .min(10, 'Please enter a complete address')
    .required('Default address is required'),
  secondaryAddress: Yup.string().optional(),
  language: Yup.string()
    .oneOf(['en', 'fr'], 'Please select a valid language')
    .required('Language is required'),
});

// Step 4-a: Customer Extras
export const customerExtrasSchema = Yup.object().shape({
  paymentToken: Yup.string().optional(),
  isBusiness: Yup.boolean().required(),
  companyName: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(2, 'Company name must be at least 2 characters').required('Company name is required'),
    otherwise: (schema) => schema.optional(),
  }),
  taxId: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(5, 'Tax ID must be at least 5 characters').required('Tax ID is required'),
    otherwise: (schema) => schema.optional(),
  }),
  businessType: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(2, 'Business type must be at least 2 characters').required('Business type is required'),
    otherwise: (schema) => schema.optional(),
  }),
  industry: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(2, 'Industry must be at least 2 characters').required('Industry is required'),
    otherwise: (schema) => schema.optional(),
  }),
  registrationNumber: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(3, 'Registration number must be at least 3 characters').required('Registration number is required'),
    otherwise: (schema) => schema.optional(),
  }),
  incorporationDate: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').required('Incorporation date is required'),
    otherwise: (schema) => schema.optional(),
  }),
  employeeCount: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.required('Employee count is required'),
    otherwise: (schema) => schema.optional(),
  }),
  annualRevenue: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.required('Annual revenue range is required'),
    otherwise: (schema) => schema.optional(),
  }),
  businessWebsite: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.url('Please enter a valid website URL'),
    otherwise: (schema) => schema.optional(),
  }),
  businessPhone: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.matches(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number').min(10, 'Phone number must be at least 10 digits').required('Business phone is required'),
    otherwise: (schema) => schema.optional(),
  }),
  businessEmail: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.email('Please enter a valid email address').required('Business email is required'),
    otherwise: (schema) => schema.optional(),
  }),
  businessAddress: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(10, 'Please enter a complete business address').required('Business address is required'),
    otherwise: (schema) => schema.optional(),
  }),
  billingAddress: Yup.string().optional(),
  businessDescription: Yup.string().when('isBusiness', {
    is: true,
    then: (schema) => schema.min(20, 'Business description must be at least 20 characters').required('Business description is required'),
    otherwise: (schema) => schema.optional(),
  }),
});

// Step 4-b: Transporter Vehicle
export const transporterVehicleSchema = Yup.object().shape({
  vehicleType: Yup.string()
    .oneOf(['van', 'truck', 'car', 'motorcycle', 'bicycle'], 'Please select a valid vehicle type')
    .required('Vehicle type is required'),
  plate: Yup.string()
    .min(3, 'License plate must be at least 3 characters')
    .max(10, 'License plate must be less than 10 characters')
    .required('License plate is required'),
  payloadKg: Yup.number()
    .min(1, 'Payload must be at least 1 kg')
    .max(50000, 'Payload must be less than 50,000 kg')
    .required('Payload capacity is required'),
  vehiclePhotos: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one vehicle photo is recommended')
    .optional(),
});

// Step 5-b: Transporter Identity & Compliance
export const transporterComplianceSchema = Yup.object().shape({
  licenseImages: Yup.array()
    .of(Yup.string())
    .min(1, 'Driver\'s license image is required')
    .required('Driver\'s license is required'),
  licenseExpiry: Yup.date()
    .min(new Date(), 'License must not be expired')
    .required('License expiry date is required'),
  insuranceDoc: Yup.string()
    .required('Insurance document is required'),
  bgCheckConsent: Yup.boolean()
    .oneOf([true], 'You must consent to background check'),
});

// Step 6-b: Transporter Banking (Canadian banking - routing + account only)
export const transporterBankingSchema = Yup.object().shape({
  bankRouting: Yup.string()
    .matches(/^\d{9}$/, 'Routing number must be 9 digits')
    .required('Routing number is required'),
  bankAccount: Yup.string()
    .min(4, 'Account number must be at least 4 digits')
    .required('Account number is required'),
  bankHolder: Yup.string()
    .min(2, 'Account holder name must be at least 2 characters')
    .required('Account holder name is required'),
});

// Step 7: Confirmation
export const confirmationSchema = Yup.object().shape({
  confirmAll: Yup.boolean()
    .oneOf([true], 'Please confirm that all information is correct'),
});

// Password strength checker
export const getPasswordStrength = (password: string): { score: number; feedback: string } => {
  let score = 0;
  let feedback = '';

  if (password.length >= 8) score += 1;
  if (password.match(/[a-z]/)) score += 1;
  if (password.match(/[A-Z]/)) score += 1;
  if (password.match(/\d/)) score += 1;
  if (password.match(/[^a-zA-Z\d]/)) score += 1;

  switch (score) {
    case 0:
    case 1:
      feedback = 'Very weak';
      break;
    case 2:
      feedback = 'Weak';
      break;
    case 3:
      feedback = 'Fair';
      break;
    case 4:
      feedback = 'Good';
      break;
    case 5:
      feedback = 'Strong';
      break;
    default:
      feedback = 'Unknown';
  }

  return { score, feedback };
};