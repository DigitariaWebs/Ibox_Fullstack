#!/usr/bin/env node

/**
 * Supabase Auth Setup Script
 * 
 * This script helps configure the environment variables for Supabase Auth integration.
 * Run this script to get the correct redirect URI and environment setup instructions.
 */

console.log('🚀 Supabase Auth Setup Helper\n');

// Calculate the redirect URI based on Expo conventions
// Format: https://auth.expo.io/@<expo-username>/<app-slug>
// For development, we'll use a placeholder that needs to be replaced
console.log('📱 Expo Redirect URI (Development):');
console.log('https://auth.expo.io/@achref23illi/ibox');
console.log('');
console.log('✅ This is your actual redirect URI - copy this exactly!');
console.log('');

console.log('📋 Next Steps:');
console.log('1. ✅ Expo username found: achref23illi');
console.log('2. Copy the redirect URI above: https://auth.expo.io/@achref23illi/ibox');
console.log('3. Go to Supabase Dashboard → Authentication → URL Configuration');
console.log('4. Add the redirect URI to:');
console.log('   - Site URL');
console.log('   - Redirect URLs (Additional Redirect URLs)');
console.log('5. Go to Google Cloud Console → APIs & Services → Credentials');
console.log('6. Add the same redirect URI to Authorized redirect URIs');
console.log('');

console.log('🔧 Environment Variables Needed:');
console.log('');
console.log('Client (.env in Ibox/):');
console.log('EXPO_PUBLIC_SUPABASE_URL=https://frqouqqucqntfskzkian.supabase.co');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycW91cXF1Y3FudGZza3praWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDk0MDEsImV4cCI6MjA3MzkyNTQwMX0.FuuhVR7BQdE5AO4eJvTSFeIjS5utOSpHKvHf7f4aZwE');
console.log('EXPO_PUBLIC_API_URL=http://192.168.1.12:5000');
console.log('');
console.log('Server (.env in backend/):');
console.log('SUPABASE_JWKS_URL=https://frqouqqucqntfskzkian.supabase.co/auth/v1/keys');
console.log('APP_JWT_SECRET=your-super-long-random-secret-key-here');
console.log('APP_JWT_EXPIRES=15m');
console.log('APP_REFRESH_SECRET=your-another-long-random-refresh-secret');
console.log('APP_REFRESH_EXPIRES=30d');
console.log('');

console.log('🧪 Testing:');
console.log('1. Start your Expo app: npx expo start');
console.log('2. Navigate to SupabaseTest screen');
console.log('3. Tap "Continue with Google"');
console.log('4. Complete Google authentication');
console.log('5. Check for success message');
console.log('');

console.log('📚 Full documentation: See SUPABASE_AUTH_SETUP.md');
