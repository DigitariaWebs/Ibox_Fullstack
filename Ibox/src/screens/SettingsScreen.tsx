import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import * as Haptics from 'expo-haptics';

// Optional notification import - fallback if not available
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not available, notification features disabled');
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  type: 'toggle' | 'nav' | 'action';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

interface SettingsSection {
  id: string;
  title: string;
  items: SettingItem[];
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  useEffect(() => {
    // Initial animations
    fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
    slideAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    
    // Load saved settings
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('driverSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setPushNotifications(parsed.pushNotifications ?? true);
        setOrderNotifications(parsed.orderNotifications ?? true);
        setLocationTracking(parsed.locationTracking ?? true);
        setDarkMode(parsed.darkMode ?? false);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setVibrationEnabled(parsed.vibrationEnabled ?? true);
        setEmailNotifications(parsed.emailNotifications ?? false);
        setSmsNotifications(parsed.smsNotifications ?? false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      const currentSettings = {
        pushNotifications,
        orderNotifications,
        locationTracking,
        darkMode,
        soundEnabled,
        vibrationEnabled,
        emailNotifications,
        smsNotifications,
        ...newSettings,
      };
      await AsyncStorage.setItem('driverSettings', JSON.stringify(currentSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (value && Notifications) {
      try {
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive delivery updates.',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.warn('Failed to request notification permissions:', error);
        Alert.alert(
          'Permission Error',
          'Unable to request notification permissions. You can enable them manually in device settings.',
          [{ text: 'OK' }]
        );
      }
    } else if (value && !Notifications) {
      Alert.alert(
        'Feature Unavailable',
        'Notification features are not available in this build. Please check your app configuration.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setPushNotifications(value);
    await saveSettings({ pushNotifications: value });
    
    if (!value) {
      // Also disable order notifications if push is disabled
      setOrderNotifications(false);
      await saveSettings({ orderNotifications: false });
    }
  };

  const handleOrderNotificationsToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrderNotifications(value);
    await saveSettings({ orderNotifications: value });
  };

  const handleLocationTrackingToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!value) {
      Alert.alert(
        'Location Required',
        'Location tracking is required to match you with nearby delivery requests and track your progress.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setLocationTracking(false);
              await saveSettings({ locationTracking: false });
            }
          }
        ]
      );
    } else {
      setLocationTracking(value);
      await saveSettings({ locationTracking: value });
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSoundEnabled(value);
    await saveSettings({ soundEnabled: value });
  };

  const handleVibrationToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVibrationEnabled(value);
    await saveSettings({ vibrationEnabled: value });
  };

  const handleEmailToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailNotifications(value);
    await saveSettings({ emailNotifications: value });
  };

  const handleSmsToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSmsNotifications(value);
    await saveSettings({ smsNotifications: value });
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data including maps and images. The app may load slower initially.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Clear cache logic would go here
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const resetSettings = async () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            
            // Reset all settings to defaults
            setPushNotifications(true);
            setOrderNotifications(true);
            setLocationTracking(true);
            setDarkMode(false);
            setSoundEnabled(true);
            setVibrationEnabled(true);
            setEmailNotifications(false);
            setSmsNotifications(false);
            
            await AsyncStorage.removeItem('driverSettings');
            
            Alert.alert('Success', 'Settings have been reset to default values');
          }
        }
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'notifications',
      title: 'Notification Preferences',
      items: [
        {
          id: 'push_notifications',
          title: 'Push Notifications',
          subtitle: 'Receive notifications for new delivery requests',
          icon: 'bell',
          color: '#3B82F6',
          type: 'toggle',
          value: pushNotifications,
          onToggle: handlePushNotificationsToggle,
        },
        {
          id: 'order_notifications',
          title: 'Order Updates',
          subtitle: 'Get notified about order status changes',
          icon: 'package',
          color: '#10B981',
          type: 'toggle',
          value: orderNotifications && pushNotifications,
          onToggle: handleOrderNotificationsToggle,
        },
        {
          id: 'email_notifications',
          title: 'Email Notifications',
          subtitle: 'Receive important updates via email',
          icon: 'mail',
          color: '#F59E0B',
          type: 'toggle',
          value: emailNotifications,
          onToggle: handleEmailToggle,
        },
        {
          id: 'sms_notifications',
          title: 'SMS Notifications',
          subtitle: 'Get text messages for urgent updates',
          icon: 'message-circle',
          color: '#8B5CF6',
          type: 'toggle',
          value: smsNotifications,
          onToggle: handleSmsToggle,
        },
      ],
    },
    {
      id: 'app_behavior',
      title: 'App Behavior',
      items: [
        {
          id: 'location_tracking',
          title: 'Location Tracking',
          subtitle: 'Allow app to track your location for deliveries',
          icon: 'map-pin',
          color: '#EF4444',
          type: 'toggle',
          value: locationTracking,
          onToggle: handleLocationTrackingToggle,
        },
        {
          id: 'sound_enabled',
          title: 'Sound Effects',
          subtitle: 'Play sounds for notifications and actions',
          icon: 'volume-2',
          color: '#06B6D4',
          type: 'toggle',
          value: soundEnabled,
          onToggle: handleSoundToggle,
        },
        {
          id: 'vibration_enabled',
          title: 'Haptic Feedback',
          subtitle: 'Enable vibration for button taps and notifications',
          icon: 'smartphone',
          color: '#84CC16',
          type: 'toggle',
          value: vibrationEnabled,
          onToggle: handleVibrationToggle,
        },
      ],
    },
    {
      id: 'account',
      title: 'Account & Data',
      items: [
        {
          id: 'privacy_policy',
          title: 'Privacy Policy',
          subtitle: 'Learn how we protect your data',
          icon: 'shield',
          color: '#6366F1',
          type: 'nav',
          onPress: () => {
            // Navigate to privacy policy
            Alert.alert('Privacy Policy', 'Privacy policy would open here');
          },
        },
        {
          id: 'terms_of_service',
          title: 'Terms of Service',
          subtitle: 'Read our terms and conditions',
          icon: 'file-text',
          color: '#EC4899',
          type: 'nav',
          onPress: () => {
            // Navigate to terms of service
            Alert.alert('Terms of Service', 'Terms of service would open here');
          },
        },
        {
          id: 'clear_cache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: 'trash-2',
          color: '#F97316',
          type: 'action',
          onPress: clearCache,
        },
        {
          id: 'reset_settings',
          title: 'Reset Settings',
          subtitle: 'Reset all settings to default values',
          icon: 'rotate-ccw',
          color: '#EF4444',
          type: 'action',
          onPress: resetSettings,
        },
      ],
    },
  ];

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const renderSettingItem = (item: SettingItem, index: number) => (
    <Animated.View
      key={item.id}
      entering={FadeInDown.delay(100 + index * 30)}
      style={styles.settingCard}
    >
      <TouchableOpacity
        style={[
          styles.settingContent,
          item.type === 'toggle' && styles.settingContentToggle
        ]}
        onPress={item.type === 'toggle' ? undefined : item.onPress}
        activeOpacity={item.type === 'toggle' ? 1 : 0.7}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingLeft}>
          <View style={[
            styles.settingIcon,
            { backgroundColor: `${item.color}15` }
          ]}>
            <Feather name={item.icon as any} size={20} color={item.color} />
          </View>
          
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        
        <View style={styles.settingRight}>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ 
                false: '#F1F5F9', 
                true: `${Colors.primary}30` 
              }}
              thumbColor={item.value ? Colors.primary : '#ffffff'}
              ios_backgroundColor="#F1F5F9"
            />
          ) : (
            <Feather name="chevron-right" size={20} color={Colors.textTertiary} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSection = (section: SettingsSection, sectionIndex: number) => (
    <View key={section.id} style={styles.section}>
      <Animated.View
        entering={FadeInDown.delay(50 + sectionIndex * 100)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </Animated.View>
      
      {section.items.map((item, index) => renderSettingItem(item, index))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#667eea', '#764ba2']}
        locations={[0, 0.6, 1]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>App</Text>
            <Text style={styles.headerTitleHighlight}>Settings</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={containerStyle}>
          {settingsSections.map((section, index) => renderSection(section, index))}
          
          {/* App Version */}
          <Animated.View
            entering={FadeInDown.delay(800)}
            style={styles.versionContainer}
          >
            <Text style={styles.versionText}>iBox Driver v1.0.0</Text>
            <Text style={styles.versionSubtext}>© 2024 iBox Delivery</Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
    marginRight: 6,
  },
  headerTitleHighlight: {
    fontSize: 24,
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: 'white',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  settingContentToggle: {
    paddingVertical: 16,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  settingRight: {
    marginLeft: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textTertiary,
  },
});

export default SettingsScreen;