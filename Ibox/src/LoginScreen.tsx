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
import { useAuth } from './contexts/AuthContext';

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const { login, connectionStatus, checkConnection } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const handleBackPress = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleLogin = async () => {
    // Validate input
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    // Check connection
    if (connectionStatus === 'disconnected') {
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

    setIsLoading(true);
    
    try {
      // Call real API login
      const authResponse = await login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      
      // Navigation will happen automatically via AuthContext state change
      console.log('✅ Login successful for:', authResponse.user.email, 'as', authResponse.user.userType);
      
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
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'facebook' | 'google' | 'apple') => {
    setIsLoading(true);
    
    try {
      // Simulate social login - in real app this would integrate with social providers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data from social provider
      const userData = {
        id: `${provider}_user_123`,
        email: `user@${provider}.com`,
        firstName: 'Social',
        lastName: 'User',
      };

      // Determine user type based on provider
      const userType = provider === 'facebook' ? 'transporter' : 'customer';
      
      await login(userData, userType);
      console.log('✅ Social login successful with:', provider, 'as', userType);
      
      // Navigation will now be handled automatically by AuthContext based on userType
      
    } catch (error) {
      console.error('❌ Social login error:', error);
      Alert.alert('Login Failed', `Failed to login with ${provider}. Please try again.`);
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
              
              {email.trim() && password.trim() && (
                <Button
                  title="Login"
                  onPress={handleLogin}
                  variant="primary"
                  style={styles.loginButton}
                  loading={isLoading}
                  disabled={connectionStatus === 'disconnected'}
                />
              )}

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