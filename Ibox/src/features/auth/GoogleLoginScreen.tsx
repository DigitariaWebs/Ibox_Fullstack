import React, { useCallback } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../../lib/supabase';
import { Button, Text } from '../../ui';

WebBrowser.maybeCompleteAuthSession();

interface GoogleLoginScreenProps {
  onLoginSuccess?: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export default function GoogleLoginScreen({ onLoginSuccess }: GoogleLoginScreenProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const onGooglePress = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Critical: proxy redirect for Expo Go
      const redirectTo = AuthSession.makeRedirectUri({ useProxy: true });
      console.log('🔗 Redirect URI:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo, 
          scopes: 'openid email profile' 
        },
      });
      
      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
      if (result.type !== 'success') {
        setIsLoading(false);
        return;
      }

      // Ensure Supabase client has the session stored:
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr || !sessionData.session) {
        throw sessErr ?? new Error('No Supabase session');
      }

      // Send Supabase access token to API to get our app tokens
      const accessToken = sessionData.session.access_token;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:5000';
      
      const res = await fetch(`${apiUrl}/api/v1/auth/supabase/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API login failed');
      }
      
      const tokens = await res.json();
      
      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(tokens);
      }

      Alert.alert('Login', 'Google login successful!');
    } catch (e: any) {
      console.error('Google login error:', e);
      Alert.alert('Login error', e.message ?? String(e));
    } finally {
      setIsLoading(false);
    }
  }, [onLoginSuccess]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text variant="h2" weight="semibold" style={{ textAlign: 'center', marginBottom: 32 }}>
        Welcome to iBox
      </Text>
      
      <Button
        title={isLoading ? "Signing in..." : "Continue with Google"}
        onPress={onGooglePress}
        disabled={isLoading}
        style={{ marginBottom: 16 }}
      />
      
      {isLoading && (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      )}
      
      <Text variant="body" style={{ textAlign: 'center', marginTop: 16, color: '#6B7280' }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}
