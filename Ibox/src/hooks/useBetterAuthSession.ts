import { useEffect, useState } from 'react';
import { authClient } from '../lib/auth-client';
import { useAuth } from '../contexts/AuthContext';

export const useBetterAuthSession = () => {
  const [loading, setLoading] = useState(false);
  const { user: existingUser, isAuthenticated } = useAuth();

  const signInWithGoogle = async () => {
    try {
      console.log('🔑 Starting Google sign-in with Better Auth...');
      setLoading(true);
      
      const result = await authClient.signIn.social({
        provider: "google",
      });
      
      if (result) {
        console.log('✅ Google sign-in successful');
        return { success: true, user: result };
      } else {
        throw new Error('Failed to initiate Google sign-in');
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    session: null,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: isAuthenticated,
    user: existingUser
  };
};