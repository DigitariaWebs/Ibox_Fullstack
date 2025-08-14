/**
 * Google OAuth Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google Sign-In API
 * 4. Go to Credentials section
 * 5. Create OAuth 2.0 Client IDs for:
 *    - Web application (for Expo Go development)
 *    - iOS application (for iOS standalone)
 *    - Android application (for Android standalone)
 * 
 * 6. For Android, you'll need the SHA-1 fingerprint:
 *    - Development: Run `expo credentials:manager` and select Android
 *    - Production: Get from Google Play Console
 * 
 * 7. Add authorized redirect URIs:
 *    - For Expo Go: https://auth.expo.io/@your-username/your-app-slug
 *    - For standalone: your-app-scheme://redirect
 * 
 * 8. Replace the placeholder values below with your actual client IDs
 */

export const GOOGLE_CLIENT_IDS = {
  // Using the Firebase Web Client ID from your .env file
  // This is: 79631645506-9jg545mflqfvl8v50lc1gsthj4cotsld.apps.googleusercontent.com
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '79631645506-9jg545mflqfvl8v50lc1gsthj4cotsld.apps.googleusercontent.com',
  
  // For all platforms, we can use the same Web Client ID from Firebase
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '79631645506-9jg545mflqfvl8v50lc1gsthj4cotsld.apps.googleusercontent.com',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '79631645506-9jg545mflqfvl8v50lc1gsthj4cotsld.apps.googleusercontent.com',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '79631645506-9jg545mflqfvl8v50lc1gsthj4cotsld.apps.googleusercontent.com',
};

/**
 * Firebase Configuration
 * 
 * If using Firebase for authentication, add your config here
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};