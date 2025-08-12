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
  ImageBackground,
  Platform,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import profileService, { UserProfile, UserStatistics, NotificationPreferences } from '../services/profileService';
import imageUploadService from '../services/imageUploadService';

interface ClientProfileScreenProps {
  navigation: any;
}

const ClientProfileScreen: React.FC<ClientProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  
  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    pushNotifications: true,
    smsNotifications: false,
    emailNotifications: true,
    locationServices: true,
    orderUpdates: true,
    promotionalOffers: false,
    driverMessages: true,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadProfileData();
    startAnimations();
  }, []);

  const startAnimations = () => {
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
  };

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data in parallel
      const [profileData, statsData, prefsData] = await Promise.allSettled([
        profileService.getUserProfile(),
        profileService.getUserStatistics(),
        profileService.getNotificationPreferences(),
      ]);

      // Handle profile data
      if (profileData.status === 'fulfilled') {
        setProfile(profileData.value);
        await profileService.cacheProfileData(profileData.value);
      } else {
        console.error('Failed to load profile:', profileData.reason);
        // Try to use cached data or fallback to auth user
        const cached = await profileService.getCachedProfileData();
        if (cached) {
          setProfile(cached);
        } else if (user) {
          // Create profile from auth user data
          const fallbackProfile: UserProfile = {
            id: user.id || 'temp-id',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            userType: user.userType || 'customer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
        }
      }

      // Handle statistics data
      if (statsData.status === 'fulfilled') {
        setUserStats(statsData.value);
      } else {
        console.error('Failed to load user statistics:', statsData.reason);
      }

      // Handle notification preferences
      if (prefsData.status === 'fulfilled') {
        setNotificationPrefs(prefsData.value);
      } else {
        console.error('Failed to load notification preferences:', prefsData.reason);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Unable to load profile data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic client stats based on real data
  const getClientStats = () => {
    if (!userStats) {
      return [
        { label: 'Shipments', value: '0', icon: 'package', color: '#0AA5A8' },
        { label: 'Saved', value: '$0', icon: 'dollar-sign', color: '#10B981' },
        { label: 'Points', value: '0', icon: 'star', color: '#F59E0B' },
      ];
    }

    return [
      {
        label: 'Shipments',
        value: userStats.completedOrders.toString(),
        icon: 'package',
        color: '#0AA5A8',
      },
      {
        label: 'Saved',
        value: `$${userStats.totalSaved.toFixed(0)}`,
        icon: 'dollar-sign',
        color: '#10B981',
      },
      {
        label: 'Points',
        value: userStats.loyaltyPoints.toLocaleString(),
        icon: 'star',
        color: '#F59E0B',
      },
    ];
  };

  const clientStats = getClientStats();

  const accountOptions = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      subtitle: profile ? 'Name, email, phone' : 'Loading...',
      icon: 'user',
      color: '#0AA5A8',
      action: () => navigation.navigate('PersonalInfo'),
    },
    {
      id: 'addresses',
      title: 'My Addresses',
      subtitle: 'Manage saved addresses',
      icon: 'map-pin',
      color: '#3B82F6',
      action: () => navigation.navigate('Addresses'),
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      subtitle: 'Cards & payment info',
      icon: 'credit-card',
      color: '#8B5CF6',
      action: () => navigation.navigate('PaymentMethods'),
    },
    {
      id: 'order-history',
      title: 'Order History',
      subtitle: userStats ? `${userStats.totalOrders} total orders` : 'View all your orders',
      icon: 'clock',
      color: '#F97316',
      action: () => navigation.navigate('OrderHistory'),
    },
  ];

  const preferenceOptions = [
    {
      id: 'favorites',
      title: 'Favorite Drivers',
      subtitle: 'Manage preferred drivers',
      icon: 'heart',
      color: '#EF4444',
      action: () => navigation.navigate('FavoriteDrivers'),
    },
    {
      id: 'recurring',
      title: 'Recurring Deliveries',
      subtitle: 'Set up regular shipments',
      icon: 'repeat',
      color: '#10B981',
      action: () => navigation.navigate('RecurringDeliveries'),
    },
  ];

  const appOptions = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'FAQ, contact support',
      icon: 'help-circle',
      color: '#10B981',
      action: () => navigation.navigate('Help'),
    },
    {
      id: 'rate',
      title: 'Rate Our Service',
      subtitle: 'Share your feedback',
      icon: 'star',
      color: '#F59E0B',
      action: () => navigation.navigate('RateService'),
    },
    {
      id: 'refer',
      title: 'Refer & Earn',
      subtitle: 'Get €10 for each referral',
      icon: 'gift',
      color: '#8B5CF6',
      action: () => navigation.navigate('ReferEarn'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await profileService.clearCachedProfileData();
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleNotificationToggle = async (
    setting: keyof NotificationPreferences,
    value: boolean
  ) => {
    try {
      const updatedPrefs = { ...notificationPrefs, [setting]: value };
      setNotificationPrefs(updatedPrefs);
      
      await profileService.updateNotificationPreferences({ [setting]: value });
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      // Revert the change on error
      setNotificationPrefs(notificationPrefs);
      Alert.alert('Error', 'Failed to update notification preference. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadProfileData();
  };

  const handleProfilePictureUpdate = async () => {
    try {
      setIsLoading(true);
      const result = await imageUploadService.updateProfilePicture();
      
      if (result.success && result.profilePictureUrl) {
        // Update local profile data
        if (profile) {
          const updatedProfile = { ...profile, profilePicture: result.profilePictureUrl };
          setProfile(updatedProfile);
          await profileService.cacheProfileData(updatedProfile);
        }
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        if (result.error && result.error !== 'Image selection cancelled') {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error: any) {
      console.error('Profile picture update error:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ProfileOption = ({ option }: { option: any }) => (
    <TouchableOpacity style={styles.optionCard} onPress={option.action} activeOpacity={0.8}>
      <View style={[styles.optionIcon, { backgroundColor: option.color + '10' }]}>
        <Icon name={option.icon} type="Feather" size={20} color={option.color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  const ToggleOption = ({ 
    title, 
    subtitle, 
    icon, 
    color, 
    value, 
    onValueChange 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.optionCard}>
      <View style={[styles.optionIcon, { backgroundColor: color + '10' }]}>
        <Icon name={icon} type="Feather" size={20} color={color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
        thumbColor={value ? Colors.primary : Colors.textSecondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Icon name="refresh-cw" type="Feather" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <Animated.View 
          style={[
            styles.profileCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.profileImageContainer}>
            <ImageBackground
              source={{ 
                uri: profile?.profilePicture || `https://i.pravatar.cc/150?u=${profile?.email || 'default'}` 
              }}
              style={styles.profileImage}
              imageStyle={styles.profileImageStyle}
            >
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleProfilePictureUpdate}
                disabled={isLoading}
              >
                <Icon name="camera" type="Feather" size={14} color={Colors.white} />
              </TouchableOpacity>
            </ImageBackground>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile ? profileService.formatDisplayName(profile) : 'Loading...'}
            </Text>
            <Text style={styles.profileEmail}>
              {profile?.email || user?.email || 'Loading...'}
            </Text>
            <Text style={styles.profilePhone}>
              {profile?.phone || user?.phone || 'No phone number'}
            </Text>
          </View>

          {profile && (
            <View style={styles.membershipBadge}>
              <Icon 
                name={profileService.getMembershipInfo(profile).icon as any} 
                type="Feather" 
                size={16} 
                color={profileService.getMembershipInfo(profile).color} 
              />
              <Text style={[
                styles.membershipText,
                { color: profileService.getMembershipInfo(profile).color }
              ]}>
                {profileService.getMembershipInfo(profile).displayName}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View 
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.statsContainer}>
            {clientStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '10' }]}>
                  <Icon name={stat.icon as any} type="Feather" size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Account Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.optionsContainer}>
            {accountOptions.map((option) => (
              <ProfileOption key={option.id} option={option} />
            ))}
          </View>
        </Animated.View>

        {/* Client Preferences Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Shipping Preferences</Text>
          <View style={styles.optionsContainer}>
            {preferenceOptions.map((option) => (
              <ProfileOption key={option.id} option={option} />
            ))}
          </View>
        </Animated.View>

        {/* Notifications Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.optionsContainer}>
            <ToggleOption
              title="Push Notifications"
              subtitle="Order updates & offers"
              icon="bell"
              color="#F59E0B"
              value={notificationPrefs.pushNotifications}
              onValueChange={(value) => handleNotificationToggle('pushNotifications', value)}
            />
            <ToggleOption
              title="SMS Notifications"
              subtitle="Delivery updates via SMS"
              icon="message-square"
              color="#3B82F6"
              value={notificationPrefs.smsNotifications}
              onValueChange={(value) => handleNotificationToggle('smsNotifications', value)}
            />
            <ToggleOption
              title="Email Updates"
              subtitle="Order confirmations & receipts"
              icon="mail"
              color="#10B981"
              value={notificationPrefs.emailNotifications}
              onValueChange={(value) => handleNotificationToggle('emailNotifications', value)}
            />
            <ToggleOption
              title="Location Services"
              subtitle="Track deliveries in real-time"
              icon="map-pin"
              color="#8B5CF6"
              value={notificationPrefs.locationServices}
              onValueChange={(value) => handleNotificationToggle('locationServices', value)}
            />
          </View>
        </Animated.View>

        {/* More Options */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.optionsContainer}>
            {appOptions.map((option) => (
              <ProfileOption key={option.id} option={option} />
            ))}
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out" type="Feather" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  profileCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.textSecondary,
  },
  profileImageStyle: {
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 1,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
});

export default ClientProfileScreen;