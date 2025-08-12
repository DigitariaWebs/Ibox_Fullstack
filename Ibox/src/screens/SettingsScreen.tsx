import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Switch,
  Platform,
  Linking,
  RefreshControl,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface SettingsScreenProps {
  navigation: any;
}

interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  privacy: {
    locationServices: boolean;
    dataSharing: boolean;
    analytics: boolean;
    contactsAccess: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
    autoBackup: boolean;
    biometricAuth: boolean;
    soundEffects: boolean;
    vibration: boolean;
  };
  accessibility: {
    largeText: boolean;
    highContrast: boolean;
    voiceOver: boolean;
    reducedMotion: boolean;
  };
}

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  action?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout, user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      push: true,
      email: true,
      sms: false,
      orderUpdates: true,
      promotions: false,
    },
    privacy: {
      locationServices: true,
      dataSharing: false,
      analytics: true,
      contactsAccess: false,
    },
    preferences: {
      language: 'English',
      currency: 'CAD',
      theme: 'light',
      autoBackup: true,
      biometricAuth: false,
      soundEffects: true,
      vibration: true,
    },
    accessibility: {
      largeText: false,
      highContrast: false,
      voiceOver: false,
      reducedMotion: false,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Load user settings from backend
      console.log('Loading user settings from backend...');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSettings();
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateSetting = async (category: keyof UserSettings, key: string, value: any) => {
    try {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value,
        },
      }));
      
      // TODO: Sync with backend
      console.log(`Updated ${category}.${key} to:`, value);
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleLanguageSelection = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => updateSetting('preferences', 'language', 'English') },
        { text: 'Français', onPress: () => updateSetting('preferences', 'language', 'Français') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };


  const handleThemeSelection = () => {
    Alert.alert(
      'Select Theme',
      'Choose your preferred app theme',
      [
        { text: 'Light', onPress: () => updateSetting('preferences', 'theme', 'light') },
        { text: 'Dark', onPress: () => updateSetting('preferences', 'theme', 'dark') },
        { text: 'System Default', onPress: () => updateSetting('preferences', 'theme', 'system') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may improve app performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to default values. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Reset',
              'Are you sure you want to reset all settings?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Reset to default settings
                    Alert.alert('Success', 'Settings have been reset to defaults');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await logout();
              console.log('✅ User logged out successfully');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Please confirm that you want to permanently delete your account. This will remove all your orders, addresses, and personal data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // TODO: Implement account deletion API
                      Alert.alert('Account Deletion', 'Your account deletion request has been submitted. You will receive a confirmation email within 24 hours.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Notification Settings
  const notificationSettings: SettingItem[] = [
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      subtitle: 'Receive app notifications',
      icon: 'bell',
      color: '#0AA5A8',
      type: 'toggle',
      value: settings.notifications.push,
      onValueChange: (value) => updateSetting('notifications', 'push', value),
    },
    {
      id: 'email-notifications',
      title: 'Email Notifications',
      subtitle: 'Receive emails for important updates',
      icon: 'mail',
      color: '#F59E0B',
      type: 'toggle',
      value: settings.notifications.email,
      onValueChange: (value) => updateSetting('notifications', 'email', value),
    },
    {
      id: 'sms-notifications',
      title: 'SMS Notifications',
      subtitle: 'Receive text message updates',
      icon: 'message-square',
      color: '#3B82F6',
      type: 'toggle',
      value: settings.notifications.sms,
      onValueChange: (value) => updateSetting('notifications', 'sms', value),
    },
    {
      id: 'order-updates',
      title: 'Order Updates',
      subtitle: 'Notifications for order status changes',
      icon: 'package',
      color: '#8B5CF6',
      type: 'toggle',
      value: settings.notifications.orderUpdates,
      onValueChange: (value) => updateSetting('notifications', 'orderUpdates', value),
    },
    {
      id: 'promotions',
      title: 'Promotional Offers',
      subtitle: 'Receive special offers and discounts',
      icon: 'tag',
      color: '#F97316',
      type: 'toggle',
      value: settings.notifications.promotions,
      onValueChange: (value) => updateSetting('notifications', 'promotions', value),
    },
  ];

  // Privacy Settings
  const privacySettings: SettingItem[] = [
    {
      id: 'location-services',
      title: 'Location Services',
      subtitle: 'Allow location access for better service',
      icon: 'map-pin',
      color: '#8B5CF6',
      type: 'toggle',
      value: settings.privacy.locationServices,
      onValueChange: (value) => updateSetting('privacy', 'locationServices', value),
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      subtitle: 'Share anonymous usage data',
      icon: 'share-2',
      color: '#10B981',
      type: 'toggle',
      value: settings.privacy.dataSharing,
      onValueChange: (value) => updateSetting('privacy', 'dataSharing', value),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Help improve the app experience',
      icon: 'bar-chart-2',
      color: '#F97316',
      type: 'toggle',
      value: settings.privacy.analytics,
      onValueChange: (value) => updateSetting('privacy', 'analytics', value),
    },
    {
      id: 'contacts-access',
      title: 'Contacts Access',
      subtitle: 'Access contacts for easier sharing',
      icon: 'users',
      color: '#0AA5A8',
      type: 'toggle',
      value: settings.privacy.contactsAccess,
      onValueChange: (value) => updateSetting('privacy', 'contactsAccess', value),
    },
  ];

  // App Preferences
  const appPreferences: SettingItem[] = [
    {
      id: 'language',
      title: 'Language',
      subtitle: settings.preferences.language,
      icon: 'globe',
      color: '#0AA5A8',
      type: 'action',
      action: handleLanguageSelection,
    },
    {
      id: 'theme',
      title: 'App Theme',
      subtitle: settings.preferences.theme === 'light' ? 'Light Mode' : settings.preferences.theme === 'dark' ? 'Dark Mode' : 'System Default',
      icon: settings.preferences.theme === 'dark' ? 'moon' : 'sun',
      color: '#F59E0B',
      type: 'action',
      action: handleThemeSelection,
    },
    {
      id: 'biometric-auth',
      title: 'Biometric Authentication',
      subtitle: 'Use Face ID or Touch ID',
      icon: 'shield',
      color: '#8B5CF6',
      type: 'toggle',
      value: settings.preferences.biometricAuth,
      onValueChange: (value) => updateSetting('preferences', 'biometricAuth', value),
    },
    {
      id: 'auto-backup',
      title: 'Auto Backup',
      subtitle: 'Automatically backup app data',
      icon: 'hard-drive',
      color: '#10B981',
      type: 'toggle',
      value: settings.preferences.autoBackup,
      onValueChange: (value) => updateSetting('preferences', 'autoBackup', value),
    },
    {
      id: 'sound-effects',
      title: 'Sound Effects',
      subtitle: 'Play sounds for app interactions',
      icon: 'volume-2',
      color: '#3B82F6',
      type: 'toggle',
      value: settings.preferences.soundEffects,
      onValueChange: (value) => updateSetting('preferences', 'soundEffects', value),
    },
    {
      id: 'vibration',
      title: 'Vibration',
      subtitle: 'Vibrate for notifications and feedback',
      icon: 'smartphone',
      color: '#6B7280',
      type: 'toggle',
      value: settings.preferences.vibration,
      onValueChange: (value) => updateSetting('preferences', 'vibration', value),
    },
  ];

  // Accessibility Settings
  const accessibilitySettings: SettingItem[] = [
    {
      id: 'large-text',
      title: 'Large Text',
      subtitle: 'Increase text size for better readability',
      icon: 'type',
      color: '#0AA5A8',
      type: 'toggle',
      value: settings.accessibility.largeText,
      onValueChange: (value) => updateSetting('accessibility', 'largeText', value),
    },
    {
      id: 'high-contrast',
      title: 'High Contrast',
      subtitle: 'Increase color contrast',
      icon: 'eye',
      color: '#8B5CF6',
      type: 'toggle',
      value: settings.accessibility.highContrast,
      onValueChange: (value) => updateSetting('accessibility', 'highContrast', value),
    },
    {
      id: 'reduced-motion',
      title: 'Reduced Motion',
      subtitle: 'Minimize animations and transitions',
      icon: 'minimize-2',
      color: '#F97316',
      type: 'toggle',
      value: settings.accessibility.reducedMotion,
      onValueChange: (value) => updateSetting('accessibility', 'reducedMotion', value),
    },
  ];

  // Advanced Settings
  const advancedSettings: SettingItem[] = [
    {
      id: 'clear-cache',
      title: 'Clear Cache',
      subtitle: 'Free up storage space',
      icon: 'trash-2',
      color: '#6B7280',
      type: 'action',
      action: handleClearCache,
    },
    {
      id: 'reset-settings',
      title: 'Reset Settings',
      subtitle: 'Restore all settings to defaults',
      icon: 'rotate-ccw',
      color: '#F59E0B',
      type: 'action',
      action: handleResetSettings,
    },
  ];

  const SettingItemComponent = ({ item }: { item: SettingItem }) => {
    if (item.type === 'toggle') {
      return (
        <View style={styles.settingItem}>
          <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}>
            <Icon name={item.icon as any} type="Feather" size={20} color={item.color} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: Colors.border, true: item.color + '40' }}
            thumbColor={item.value ? item.color : Colors.textSecondary}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.settingItem} 
        onPress={item.action}
        activeOpacity={0.7}
      >
        <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}>
          <Icon name={item.icon as any} type="Feather" size={20} color={item.color} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const SettingSection = ({ title, items, delay = 0 }: { title: string; items: SettingItem[]; delay?: number }) => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ 
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + delay],
            }) 
          }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <View key={item.id}>
            <SettingItemComponent item={item} />
            {index < items.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const DangerZone = () => (
    <Animated.View
      style={[
        styles.section,
        styles.dangerSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Account Actions</Text>
      <View style={styles.sectionContent}>
        <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
          <View style={styles.dangerIcon}>
            <Icon name="log-out" type="Feather" size={20} color="#EF4444" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.dangerTitle}>Sign Out</Text>
            <Text style={styles.dangerSubtitle}>Sign out from the app</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.separator} />
        
        <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
          <View style={styles.dangerIcon}>
            <Icon name="trash-2" type="Feather" size={20} color="#EF4444" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerSubtitle}>Permanently delete your account and data</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <SettingSection title="Notifications" items={notificationSettings} />
        <SettingSection title="Privacy & Security" items={privacySettings} delay={10} />
        <SettingSection title="App Preferences" items={appPreferences} delay={20} />
        <SettingSection title="Accessibility" items={accessibilitySettings} delay={30} />
        <SettingSection title="Advanced" items={advancedSettings} delay={40} />
        
        <DangerZone />
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>iBox App Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 68,
  },
  dangerSection: {
    paddingBottom: 32,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#EF444415',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  dangerSubtitle: {
    fontSize: 14,
    color: '#EF4444',
    opacity: 0.8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default SettingsScreen;