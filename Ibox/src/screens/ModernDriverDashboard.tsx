import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { Icon } from '../ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RootState, 
  AppDispatch,
  fetchDriverVerificationStatus,
  fetchDriverStats,
  fetchNotifications,
  toggleDriverOnlineStatus,
} from '../store/store';
import api from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface ProfileItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialIcons' | 'Feather';
  color: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

interface StatItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: string;
}

interface DriverPerformance {
  totalDeliveries: number;
  averageRating: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  totalEarnings?: number;
}

interface DriverEarnings {
  totalEarnings: number;
  deliveryCount: number;
  avgEarningsPerDelivery: number;
  period: string;
}

const ModernDriverDashboard: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { logout, user: authUser } = useAuth();
  
  // Redux state
  const {
    isOnline,
    verificationStatus,
    todayStats,
    notificationCount,
    loading,
  } = useSelector((state: RootState) => state.driver);

  // Local state for additional backend data
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  useEffect(() => {
    // Initial animations
    fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
    slideAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDriverData();
    }, [])
  );

  const loadDriverData = useCallback(async () => {
    try {
      console.log('📊 Loading driver profile data...');
      
      // Dispatch Redux actions
      await Promise.all([
        dispatch(fetchDriverVerificationStatus()),
        dispatch(fetchDriverStats()),
        dispatch(fetchNotifications()),
      ]);

      // Load additional profile data from backend
      await Promise.all([
        loadPerformanceData(),
        loadEarningsData(),
      ]);

      console.log('✅ Driver profile data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading driver profile data:', error);
    }
  }, [dispatch]);

  const loadPerformanceData = async () => {
    try {
      const response = await api.get('/driver/performance');
      if (response?.success && response?.data) {
        setPerformance(response.data);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const loadEarningsData = async () => {
    try {
      const response = await api.get('/driver/earnings?period=month');
      if (response?.success && response?.data) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDriverData();
    setRefreshing(false);
  }, [loadDriverData]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          },
        },
      ]
    );
  };

  const toggleOnlineStatus = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await dispatch(toggleDriverOnlineStatus(!isOnline));
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const profileItems: ProfileItem[] = [
    {
      id: 'earnings',
      title: 'Earnings',
      subtitle: 'View your income and payouts',
      icon: 'wallet-outline',
      iconFamily: 'Ionicons',
      color: '#10B981',
      value: earnings ? `$${(earnings.totalEarnings || 0).toFixed(2)}` : 'Loading...',
      showArrow: true,
      onPress: () => navigation.navigate('Earnings' as never),
    },
    {
      id: 'history',
      title: 'Delivery History',
      subtitle: 'View completed deliveries',
      icon: 'time-outline',
      iconFamily: 'Ionicons',
      color: '#3B82F6',
      value: performance ? `${performance.totalDeliveries} trips` : 'Loading...',
      showArrow: true,
      onPress: () => navigation.navigate('DeliveryHistory' as never),
    },
    {
      id: 'vehicle',
      title: 'Vehicle Information',
      subtitle: 'Update your vehicle details',
      icon: 'car-outline',
      iconFamily: 'Ionicons',
      color: '#8B5CF6',
      showArrow: true,
      onPress: () => navigation.navigate('VehicleInfo' as never),
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Manage your verification documents',
      icon: 'document-text-outline',
      iconFamily: 'Ionicons',
      color: '#F59E0B',
      value: verificationStatus?.isVerified ? 'Verified' : 'Pending',
      showArrow: true,
      onPress: () => navigation.navigate('DriverVerification' as never),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and notifications',
      icon: 'settings-outline',
      iconFamily: 'Ionicons',
      color: '#6B7280',
      showArrow: true,
      onPress: () => navigation.navigate('Settings' as never),
    },
    {
      id: 'support',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      icon: 'help-circle-outline',
      iconFamily: 'Ionicons',
      color: '#EF4444',
      showArrow: true,
      onPress: () => navigation.navigate('Support' as never),
    },
  ];

  const statsItems: StatItem[] = [
    {
      id: 'rating',
      title: 'Rating',
      value: performance ? (performance.averageRating || 0).toFixed(1) : '0.0',
      subtitle: 'Average rating',
      icon: 'star',
      color: '#FBBF24',
      trend: performance && performance.averageRating > 4.5 ? '+0.1' : undefined,
    },
    {
      id: 'deliveries',
      title: 'Today',
      value: todayStats ? todayStats.deliveries.toString() : '0',
      subtitle: 'Deliveries completed',
      icon: 'package',
      color: '#10B981',
      trend: todayStats && todayStats.deliveries > 0 ? `+${todayStats.deliveries}` : undefined,
    },
    {
      id: 'earnings',
      title: 'Today',
      value: todayStats ? `$${(todayStats.earnings || 0).toFixed(0)}` : '$0',
      subtitle: 'Earnings today',
      icon: 'dollar-sign',
      color: '#3B82F6',
      trend: todayStats && (todayStats.earnings || 0) > 0 ? `+$${(todayStats.earnings || 0).toFixed(0)}` : undefined,
    },
  ];

  const renderIcon = (item: ProfileItem | StatItem) => {
    const IconComponent = 
      item.iconFamily === 'Ionicons' ? Ionicons :
      item.iconFamily === 'MaterialIcons' ? MaterialIcons : Feather;
    
    return (
      <IconComponent
        name={item.icon as any}
        size={22}
        color="white"
      />
    );
  };

  const renderStatIcon = (iconName: string, color: string) => {
    return (
      <Feather
        name={iconName as any}
        size={16}
        color={color}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#00A896']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" type="Feather" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>
              Your{' '}
              <Text style={styles.headerTitleHighlight}>Profile</Text>
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('DriverNotifications' as never)}
            activeOpacity={0.7}
          >
            <Icon name="bell" type="Feather" size={24} color="white" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={containerStyle}>
          {/* Loading Indicator */}
          {(loading.verification || loading.stats || loading.notifications) && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading profile data...</Text>
            </View>
          )}

          {/* Profile Card */}
          <Animated.View
            entering={FadeIn.delay(100)}
            style={styles.profileCard}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {authUser?.profilePicture ? (
                  <Image
                    source={{ uri: authUser.profilePicture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {authUser?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.onlineIndicator,
                  isOnline && styles.onlineIndicatorActive
                ]} />
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {authUser?.firstName} {authUser?.lastName}
                </Text>
                <Text style={styles.profileSubtitle}>
                  {verificationStatus?.isVerified ? 'Verified Driver' : 'Pending Verification'}
                </Text>
                <View style={styles.onlineToggleContainer}>
                  <Text style={styles.onlineToggleLabel}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.onlineToggle,
                      isOnline && styles.onlineToggleActive
                    ]}
                    onPress={toggleOnlineStatus}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.onlineToggleThumb,
                      isOnline && styles.onlineToggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Stats Cards */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.statsContainer}
          >
            <Text style={styles.sectionTitle}>
              Your{' '}
              <Text style={styles.sectionTitleHighlight}>Performance</Text>
            </Text>
            
            <View style={styles.statsGrid}>
              {statsItems.map((stat, index) => (
                <Animated.View
                  key={stat.id}
                  entering={FadeInDown.delay(250 + index * 50)}
                  style={styles.statCard}
                >
                  <View style={styles.statCardInner}>
                    <View style={[
                      styles.statIcon,
                      { backgroundColor: `${stat.color}15` }
                    ]}>
                      {renderStatIcon(stat.icon, stat.color)}
                    </View>
                    
                    <View style={styles.statContent}>
                      <View style={styles.statHeader}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        {stat.trend && (
                          <Text style={styles.statTrend}>+{stat.trend}</Text>
                        )}
                      </View>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                      <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Profile Options */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.optionsContainer}
          >
            <Text style={styles.sectionTitle}>
              Account{' '}
              <Text style={styles.sectionTitleHighlight}>Settings</Text>
            </Text>
            
            {profileItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(450 + index * 30)}
              >
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View style={[
                      styles.optionIcon,
                      { backgroundColor: item.color }
                    ]}>
                      {renderIcon(item)}
                    </View>
                    
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.optionRight}>
                    {item.value && (
                      <Text style={styles.optionValue}>{item.value}</Text>
                    )}
                    {item.showArrow && (
                      <Icon name="chevron-right" type="Feather" size={20} color="#C0C0C0" />
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Sign Out Button */}
          <Animated.View
            entering={FadeInDown.delay(800)}
            style={styles.signOutContainer}
          >
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Icon name="log-out" type="Feather" size={20} color="#EF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center' as const,
  },
  headerTitleText: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
  },
  headerTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic' as const,
    color: 'white',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineIndicatorActive: {
    backgroundColor: '#10B981',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  onlineToggleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  onlineToggleLabel: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginRight: 12,
  },
  onlineToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center' as const,
    paddingHorizontal: 2,
  },
  onlineToggleActive: {
    backgroundColor: Colors.primary,
  },
  onlineToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    alignSelf: 'flex-start' as const,
  },
  onlineToggleThumbActive: {
    alignSelf: 'flex-end' as const,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic' as const,
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: -4,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 4,
    maxWidth: '33%',
  },
  statCardInner: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center' as const,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center' as const,
  },
  statHeader: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginBottom: 2,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginRight: 4,
    textAlign: 'center' as const,
  },
  statTrend: {
    fontSize: 11,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#10B981',
  },
  statTitle: {
    fontSize: 11,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 1,
    textAlign: 'center' as const,
  },
  statSubtitle: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 12,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
  },
  optionRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  optionValue: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.primary,
    marginRight: 8,
  },
  signOutContainer: {
    marginTop: 20,
  },
  signOutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#EF4444',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 10,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: 'white',
  },
};

export default ModernDriverDashboard;