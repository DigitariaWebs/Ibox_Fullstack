import React from 'react';
import { View, Alert } from 'react-native';
import GoogleLoginScreen from '../features/auth/GoogleLoginScreen';
import { Text } from '../ui';

export default function SupabaseTestScreen() {
  const handleLoginSuccess = (tokens: { accessToken: string; refreshToken: string }) => {
    Alert.alert(
      'Login Successful!', 
      `Access Token: ${tokens.accessToken.substring(0, 20)}...\nRefresh Token: ${tokens.refreshToken.substring(0, 20)}...`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 20, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Text variant="h2" weight="semibold" style={{ textAlign: 'center', color: '#1e293b' }}>
          Supabase Auth Test
        </Text>
        <Text variant="body" style={{ textAlign: 'center', marginTop: 8, color: '#64748b' }}>
          Test Google OAuth integration with Supabase
        </Text>
      </View>
      
      <GoogleLoginScreen onLoginSuccess={handleLoginSuccess} />
      
      <View style={{ padding: 20, backgroundColor: '#f1f5f9' }}>
        <Text variant="body" weight="medium" style={{ marginBottom: 8, color: '#475569' }}>
          Instructions:
        </Text>
        <Text variant="caption" style={{ color: '#64748b', lineHeight: 18 }}>
          1. Make sure Supabase dashboard is configured{'\n'}
          2. Add Google OAuth credentials{'\n'}
          3. Configure redirect URLs{'\n'}
          4. Tap "Continue with Google" to test
        </Text>
      </View>
    </View>
  );
}
