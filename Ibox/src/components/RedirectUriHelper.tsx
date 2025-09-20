import React, { useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';

export default function RedirectUriHelper() {
  useEffect(() => {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
    
    Alert.alert(
      'Supabase Redirect URI',
      `Copy this URL to your Supabase dashboard:\n\n${redirectUri}`,
      [
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            // Note: Clipboard functionality would need expo-clipboard
            console.log('Redirect URI:', redirectUri);
          }
        },
        { text: 'OK' }
      ]
    );
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
        Redirect URI Helper
      </Text>
      <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
        Check the alert above for your redirect URI
      </Text>
    </View>
  );
}
