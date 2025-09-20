// Better Auth Configuration
export const AUTH_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  SECRET: '4M2X9of6Tdbzbe10NbLPPJ3utav45poy',
  GOOGLE_CLIENT_ID: '885961923533-pfm389d09ek9dulik306iu2s7gr9gcuq.apps.googleusercontent.com',
};

// For development, you can also use your local IP address
// Replace localhost with your actual IP if needed
export const getAuthBaseURL = () => {
  // You can add logic here to switch between development and production URLs
  return AUTH_CONFIG.BASE_URL;
};
