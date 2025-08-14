# Google Sign-In Setup Guide for iBox App

## Overview
This guide explains how to set up Google Sign-In for the iBox app, which uses Firebase authentication on the backend and Expo Auth Session on the frontend.

## Current Implementation Status ✅

### Backend (Complete)
- ✅ Firebase Admin SDK configured
- ✅ Google authentication routes (`/api/v1/auth/google`)
- ✅ User model updated with OAuth fields
- ✅ Firebase token verification middleware
- ✅ MongoDB integration for user storage

### Frontend (Complete)
- ✅ Expo Auth Session packages installed
- ✅ Google Sign-In button in AuthSelectionScreen
- ✅ Google authentication service
- ✅ Backend integration with JWT tokens

## Setup Instructions

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Sign-In API
   - Firebase Authentication API (if using Firebase)

### Step 2: Create OAuth 2.0 Client IDs

You need to create 4 different OAuth client IDs:

#### 1. Web Application Client ID
- **Name**: iBox Web Client
- **Authorized JavaScript origins**: 
  - `https://auth.expo.io`
  - `http://localhost:19006` (for web development)
- **Authorized redirect URIs**:
  - `https://auth.expo.io/@your-expo-username/ibox`
  - `http://localhost:19006`

#### 2. iOS Client ID
- **Name**: iBox iOS
- **Bundle ID**: `com.yourcompany.ibox` (from app.json)

#### 3. Android Client ID
- **Name**: iBox Android
- **Package name**: `com.yourcompany.ibox` (from app.json)
- **SHA-1 certificate fingerprint**:
  - For development: Run `expo credentials:manager` and select Android
  - For production: Get from Google Play Console

#### 4. Expo Go Client ID (for development)
- **Name**: iBox Expo Development
- Use the same configuration as Web Application

### Step 3: Firebase Setup (Backend)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or link existing Google Cloud project)
3. Enable Authentication and select Google as sign-in provider
4. Download service account key:
   - Project Settings → Service Accounts → Generate New Private Key
5. Add Firebase credentials to backend `.env`:

```env
FIREBASE_PROJECT_ID=ibox-c36af
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ibox-c36af.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://ibox-c36af.firebaseio.com
```

### Step 4: Frontend Configuration

1. Update `/Ibox/src/config/googleAuth.ts` with your client IDs:

```typescript
export const GOOGLE_CLIENT_IDS = {
  expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};
```

2. Or use environment variables in `.env`:

```env
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Step 5: Platform-Specific Configuration

#### iOS (for standalone app)
1. Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.ibox",
      "config": {
        "googleSignIn": {
          "reservedClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
        }
      }
    }
  }
}
```

2. Download `GoogleService-Info.plist` from Firebase Console
3. Place in `/Ibox/ios/` directory

#### Android (for standalone app)
1. Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.ibox",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

2. Download `google-services.json` from Firebase Console
3. Place in `/Ibox/` root directory

### Step 6: Test the Implementation

#### Development (Expo Go)
```bash
cd Ibox
npm start
# Scan QR code with Expo Go app
```

#### Standalone Build
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Authentication Flow

1. User taps "Continue with Google" button
2. Google OAuth consent screen opens
3. User signs in with Google account
4. App receives ID token from Google
5. ID token sent to backend `/api/v1/auth/google`
6. Backend verifies token with Firebase Admin SDK
7. Backend creates/updates user in MongoDB
8. Backend returns JWT tokens for app authentication
9. User is logged in and redirected to appropriate screen

## Troubleshooting

### Common Issues

#### 1. "Invalid Client" Error
- Ensure all client IDs are correctly configured
- Check that bundle ID/package name matches exactly
- Verify SHA-1 fingerprint for Android

#### 2. "Firebase token verification failed"
- Check Firebase service account credentials in backend `.env`
- Ensure Firebase project is properly configured
- Verify network connectivity from backend to Firebase

#### 3. "Redirect URI mismatch"
- Check authorized redirect URIs in Google Cloud Console
- For Expo Go: Use `https://auth.expo.io/@your-username/your-app-slug`
- For standalone: Use your custom scheme (e.g., `ibox://redirect`)

#### 4. Development vs Production
- Expo Go requires different client ID than standalone apps
- SHA-1 fingerprints differ between development and production
- Always test with production builds before release

## Security Considerations

1. **Never commit credentials**: Keep all client IDs and private keys in `.env` files
2. **Validate tokens**: Always verify Google ID tokens on the backend
3. **Use HTTPS**: Ensure all API calls use HTTPS in production
4. **Rate limiting**: Implement rate limiting on authentication endpoints
5. **User data**: Store minimal user data and follow privacy regulations

## Next Steps

- [ ] Add Google client IDs to configuration files
- [ ] Download Firebase service account key
- [ ] Test with Expo Go in development
- [ ] Create standalone builds for testing
- [ ] Configure production SHA-1 for Android
- [ ] Submit app store configurations

## Support

For issues or questions:
- Google OAuth: [Google Identity Documentation](https://developers.google.com/identity)
- Firebase: [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- Expo: [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)