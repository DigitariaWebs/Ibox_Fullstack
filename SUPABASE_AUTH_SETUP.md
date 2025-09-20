# Supabase Auth Integration Guide

This guide covers the complete setup of Supabase Auth with Google OAuth for the iBox application.

## Project Information

- **Project Name**: iBox
- **Project ID**: frqouqqucqntfskzkian
- **Supabase URL**: https://frqouqqucqntfskzkian.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycW91cXF1Y3FudGZza3praWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDk0MDEsImV4cCI6MjA3MzkyNTQwMX0.FuuhVR7BQdE5AO4eJvTSFeIjS5utOSpHKvHf7f4aZwE

## Client Setup (Expo React Native)

### 1. Dependencies Installed

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill
```

### 2. Files Created

- `src/lib/supabase.ts` - Supabase client configuration
- `src/features/auth/GoogleLoginScreen.tsx` - Google login component

### 3. Environment Variables (Client)

Create `.env` file in the `Ibox` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://frqouqqucqntfskzkian.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycW91cXF1Y3FudGZza3praWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDk0MDEsImV4cCI6MjA3MzkyNTQwMX0.FuuhVR7BQdE5AO4eJvTSFeIjS5utOSpHKvHf7f4aZwE
EXPO_PUBLIC_API_URL=http://192.168.1.12:5000
```

### 4. App Configuration

- `App.tsx` - Added `WebBrowser.maybeCompleteAuthSession()` at top level
- `app.json` - Already has scheme configured (`"scheme": "ibox"`)

## Server Setup (Express.js + MongoDB)

### 1. Dependencies Installed

```bash
npm install jose
```

### 2. Files Created

- `src/auth/supabaseVerifier.js` - JWT verification using JWKS
- `src/routes/supabaseAuth.js` - Supabase auth routes

### 3. Environment Variables (Server)

Add to your `.env` file in the `backend` directory:

```env
# Supabase Configuration
SUPABASE_JWKS_URL=https://frqouqqucqntfskzkian.supabase.co/auth/v1/keys

# App JWT Configuration
APP_JWT_SECRET=your-super-long-random-secret-key-here-make-it-very-secure
APP_JWT_EXPIRES=15m
APP_REFRESH_SECRET=your-another-long-random-refresh-secret-key
APP_REFRESH_EXPIRES=30d
```

### 4. Routes Added

- `POST /api/v1/auth/supabase/login` - Handles Supabase token exchange

## Supabase Dashboard Configuration

### 1. Google OAuth Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (frqouqqucqntfskzkian)
3. Navigate to **Authentication** → **Providers**
4. Enable **Google** provider
5. Add your Google OAuth credentials:
   - Client ID
   - Client Secret

### 2. Redirect URL Configuration

**Critical Step**: You need to add the Expo redirect URL to Supabase.

#### Get the Redirect URL

Run this in your Expo app console or add to a temporary screen:

```typescript
import * as AuthSession from 'expo-auth-session';
console.log('Redirect URI:', AuthSession.makeRedirectUri({ useProxy: true }));
```

The URL will look like: `https://auth.expo.io/@your-expo-username/ibox`

#### Add to Supabase

1. Go to **Authentication** → **URL Configuration**
2. Add the redirect URL to:
   - **Site URL**
   - **Redirect URLs** (Additional Redirect URLs)

### 3. Google Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add the same redirect URL to **Authorized redirect URIs**

## Usage

### 1. Using the Google Login Screen

```typescript
import GoogleLoginScreen from '../features/auth/GoogleLoginScreen';

// In your component
<GoogleLoginScreen 
  onLoginSuccess={(tokens) => {
    // Handle successful login
    console.log('Access Token:', tokens.accessToken);
    console.log('Refresh Token:', tokens.refreshToken);
  }}
/>
```

### 2. API Integration

The login flow works as follows:

1. User taps "Continue with Google"
2. Opens Google OAuth in WebBrowser
3. User completes Google authentication
4. Supabase stores the session
5. App sends Supabase access token to your API
6. API verifies token with Supabase JWKS
7. API creates/updates user in MongoDB
8. API returns your app's JWT tokens

### 3. Protected Routes

Use the returned JWT tokens for API authentication:

```typescript
const response = await fetch('/api/v1/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Testing

### 1. Test the Flow

1. Start your Expo app: `npx expo start`
2. Navigate to the Google login screen
3. Tap "Continue with Google"
4. Complete Google authentication
5. Verify you get success message
6. Check server logs for successful token verification

### 2. Debug Redirect Issues

If you get "invalid_request" errors:

1. Verify the exact redirect URL in Supabase
2. Check Google Console redirect URIs
3. Ensure both match exactly (including trailing slashes)

### 3. Check Server Logs

Look for these log messages:
- `🔐 Verifying Supabase token...`
- `✅ Supabase token verified for user:`
- `👤 User upserted:`

## Next Steps

### 1. Add Apple/Facebook Login

1. Enable providers in Supabase Dashboard
2. Add OAuth credentials
3. Update the login screen to include additional buttons
4. Same flow works for all providers

### 2. Standalone Build Configuration

For production builds, update redirect URLs:

1. Change from Expo proxy URL to: `ibox://auth-callback`
2. Add this URL to Supabase redirect URLs
3. Update Google Console redirect URIs

### 3. Token Refresh

Implement refresh token endpoint:

```javascript
router.post('/auth/refresh', async (req, res) => {
  // Verify refresh token and issue new access token
});
```

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check Supabase and Google Console redirect URLs match exactly
   - Ensure no trailing slashes or extra characters

2. **"No Supabase session"**
   - Verify `WebBrowser.maybeCompleteAuthSession()` is called
   - Check that auth session completed successfully

3. **"Invalid Supabase token"**
   - Verify JWKS URL is correct
   - Check server environment variables
   - Ensure token hasn't expired

4. **CORS Issues**
   - Verify API URL in client environment variables
   - Check server CORS configuration

### Debug Commands

```bash
# Check redirect URI
npx expo start
# Look for redirect URI in console

# Test API endpoint
curl -X POST http://192.168.1.12:5000/api/v1/auth/supabase/login \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"your-test-token"}'
```

## Security Notes

1. **JWT Secrets**: Use strong, random secrets for production
2. **Token Expiry**: Configure appropriate expiry times
3. **HTTPS**: Use HTTPS in production for all communications
4. **Rate Limiting**: Already configured in your Express app
5. **CORS**: Properly configured for your domains

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the Supabase dashboard configuration
4. Ensure Google OAuth credentials are valid
5. Check network connectivity between client and server
