import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, Input, Button, Icon } from './ui';
import { Colors } from './config/colors';
import { useBetterAuthSession } from './hooks/useBetterAuthSession';
import { useAuth } from './contexts/AuthContext';

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const { login, googleLogin, connectionStatus, checkConnection } = useAuth();
  const { signInWithGoogle } = useBetterAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Debug button rendering
  useEffect(() => {
    console.log('🔍 LoginScreen mounted');
    console.log('📧 Email state:', email);
    console.log('🔒 Password state:', password);
    console.log('🌐 Connection status:', connectionStatus);
    console.log('⏳ Loading state:', isLoading);
  }, [email, password, connectionStatus, isLoading]);

  const handleBackPress = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleLogin = async () => {
    console.log('🔑 Login button pressed');
    console.log('📧 Email:', email.trim());
    console.log('🔒 Password length:', password.trim().length);
    console.log('🌐 Connection status:', connectionStatus);
    console.log('⏳ Loading state:', isLoading);
    
    // Validate input
    if (!email.trim()) {
      console.log('❌ Email validation failed');
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      console.log('❌ Password validation failed');
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    // Check connection
    if (connectionStatus === 'disconnected') {
      console.log('❌ Connection check failed');
      const isConnected = await checkConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => handleLogin() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
    }

    console.log('✅ Validation passed, starting login process...');
    setIsLoading(true);
    
    try {
      // Call real API login
      console.log('🌐 Calling API login...');
      const authResponse = await login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      
      console.log('✅ Login successful:', authResponse.user.email, 'as', authResponse.user.userType);
      
      // Navigation will happen automatically via AuthContext state change
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('Invalid credentials') || error.message.includes('Authentication failed')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('Network') || error.message.includes('connection')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'No account found with this email. Would you like to sign up?';
        
        Alert.alert(
          'Account Not Found',
          errorMessage,
          [
            { text: 'Sign Up', onPress: () => navigation.navigate('SignUpFlow') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      console.log('🏁 Login process finished');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'facebook' | 'google' | 'apple') => {
    if (provider !== 'google') {
      Alert.alert('Coming Soon', `${provider} login will be available soon!`);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔑 Starting Google sign-in...');
      
      // Use the updated auth client for Google sign-in
      const result = await signInWithGoogle();
      
      if (result.success && result.user) {
        console.log('✅ Google sign-in successful, processing user data...');
        
        // Handle the successful authentication
        const authResponse = await googleLogin(result.user);
        
        if (authResponse.success) {
          Alert.alert('Success', 'Google sign-in successful!', [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Home') 
            }
          ]);
        } else {
          throw new Error(authResponse.message || 'Authentication failed');
        }
      } else {
        throw new Error('No user data received from Google');
      }
      
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.message.includes('cancelled')) {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('Invalid credentials')) {
        errorMessage = 'Google authentication failed. Please try again.';
      }
      
      Alert.alert('Sign-in Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.sheet}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text variant="h1" weight="bold" style={styles.title}>
              Welcome back
            </Text>

            {/* Connection Status */}
            {connectionStatus !== 'connected' && (
              <View style={styles.connectionStatus}>
                <Icon 
                  name={connectionStatus === 'checking' ? 'wifi' : 'wifi-off'} 
                  type="Feather" 
                  size={16} 
                  color={connectionStatus === 'checking' ? Colors.warning : Colors.error} 
                />
                <Text style={[
                  styles.connectionText, 
                  { color: connectionStatus === 'checking' ? Colors.warning : Colors.error }
                ]}>
                  {connectionStatus === 'checking' ? 'Checking connection...' : 'No internet connection'}
                </Text>
              </View>
            )}

            {/* Login Form */}
            <View style={styles.inputContainer}>
              <Input
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.emailInput}
                leftIcon={<Icon name="mail" type="Feather" size={20} color={Colors.textSecondary} />}
              />
              
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
                leftIcon={<Icon name="lock" type="Feather" size={20} color={Colors.textSecondary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                    <Icon 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      type="Feather" 
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
              />
              
              {/* Simple Login Button for Android */}
              <TouchableOpacity
                style={[
                  styles.simpleLoginButton,
                  (isLoading || !email.trim() || !password.trim() || connectionStatus === 'disconnected') && styles.simpleLoginButtonDisabled
                ]}
                onPress={() => {
                  console.log('🔑 LOGIN BUTTON PRESSED!');
                  console.log('📧 Email:', email);
                  console.log('🔒 Password length:', password.length);
                  console.log('🌐 Connection:', connectionStatus);
                  console.log('⏳ Loading:', isLoading);
                  handleLogin();
                }}
                disabled={isLoading || !email.trim() || !password.trim() || connectionStatus === 'disconnected'}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.simpleLoginButtonText,
                  (isLoading || !email.trim() || !password.trim() || connectionStatus === 'disconnected') && styles.simpleLoginButtonTextDisabled
                ]}>
                  {isLoading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>

              {/* Test Button - Always works */}
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => {
                  console.log('🧪 Test button pressed!');
                  Alert.alert('Test', 'Test button works!');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.testButtonText}>
                  🧪 Test Button (Always Works)
                </Text>
              </TouchableOpacity>

              {/* Debug Info */}
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>
                  Debug: Email={email ? '✓' : '✗'} Password={password ? '✓' : '✗'} Connection={connectionStatus}
                </Text>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialLogin('facebook')}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Icon name="facebook" type="FontAwesome" size={20} color="#fff" />
                <Text style={[styles.socialButtonText, styles.facebookText]}>
                  Continue with Facebook
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Icon name="google" type="FontAwesome" size={20} color={Colors.textPrimary} />
                <Text style={[styles.socialButtonText, styles.googleText]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={() => handleSocialLogin('apple')}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Icon name="apple" type="FontAwesome" size={20} color="#fff" />
                <Text style={[styles.socialButtonText, styles.appleText]}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Option */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUpFlow')} 
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Disclaimer */}
          <View style={styles.footer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.legalLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 40,
    lineHeight: 34,
  },
  inputContainer: {
    marginBottom: 32,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  emailInput: {
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  simpleLoginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  simpleLoginButtonDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  simpleLoginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  simpleLoginButtonTextDisabled: {
    color: '#999',
  },
  testButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    minHeight: 44,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  facebookText: {
    color: '#fff',
  },
  googleButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  googleText: {
    color: Colors.textPrimary,
  },
  appleButton: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  appleText: {
    color: '#fff',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signUpText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 0,
  },
  legalText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
  sheet: {
    height: '80%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
});

export default LoginScreen;