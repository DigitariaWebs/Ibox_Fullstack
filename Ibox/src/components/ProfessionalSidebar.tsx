import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  SlideInLeft,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

interface ProfessionalSidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  activeScreen?: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  iconType: 'Ionicons' | 'MaterialIcons' | 'Feather';
  screen: string;
  section: 'main' | 'account' | 'support';
  badge?: number;
}

const getBaseMenuItems = (): MenuItem[] => [
  // Main Section
  { id: 'home', title: 'Home', icon: 'home', iconType: 'Feather', screen: 'HomeScreen', section: 'main' },
  { id: 'orders', title: 'My Orders', icon: 'package', iconType: 'Feather', screen: 'Orders', section: 'main' },
  { id: 'tracking', title: 'Track Package', icon: 'map-pin', iconType: 'Feather', screen: 'Tracking', section: 'main' },
  
  // Account Section
  { id: 'profile', title: 'Profile', icon: 'user', iconType: 'Feather', screen: 'Profile', section: 'account' },
  { id: 'addresses', title: 'Addresses', icon: 'map-pin', iconType: 'Feather', screen: 'Addresses', section: 'account' },
  
  // Support Section
  { id: 'help', title: 'Help & Support', icon: 'help-circle', iconType: 'Feather', screen: 'HelpSupport', section: 'support' },
  { id: 'settings', title: 'Settings', icon: 'settings', iconType: 'Feather', screen: 'Settings', section: 'support' },
];

const ProfessionalSidebar: React.FC<ProfessionalSidebarProps> = ({
  visible,
  onClose,
  onNavigate,
  activeScreen = 'HomeScreen',
}) => {
  const { logout, user, getCurrentUser, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState(user || null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const insets = useSafeAreaInsets();

  // Sync user data from context when it changes
  useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user]);

  // Fetch fresh user data when sidebar opens only if we don't have it
  useEffect(() => {
    if (visible && isAuthenticated && !userData) {
      fetchUserData();
    }
  }, [visible, isAuthenticated]);

  // Fetch active orders count when sidebar opens
  useEffect(() => {
    if (visible && isAuthenticated) {
      fetchActiveOrdersCount();
    }
  }, [visible, isAuthenticated]);

  const fetchUserData = async () => {
    // Prevent multiple fetches
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      // Only fetch if we don't have user data already
      if (!userData && !user) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUserData(currentUser);
        }
      } else if (user && !userData) {
        setUserData(user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to context user if getCurrentUser fails
      if (user) {
        setUserData(user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveOrdersCount = async () => {
    try {
      // Fetch orders without status filter to get all orders, then filter active ones
      const response = await api.getOrders({ limit: 100 }); // Get more orders to count accurately
      
      // Count orders that are NOT delivered or cancelled (i.e., active orders)
      const activeOrders = response.orders.filter((order: any) => 
        !['delivered', 'cancelled'].includes(order.status)
      );
      
      setActiveOrdersCount(activeOrders.length);
    } catch (error) {
      console.error('Error fetching active orders count:', error);
      // Don't show error for badge count, just keep it at 0
      setActiveOrdersCount(0);
    }
  };

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { 
        duration: 250,
      });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
        mass: 0.6,
      });
      translateX.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      });
    } else {
      scale.value = withTiming(0.95, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      translateX.value = withTiming(-SIDEBAR_WIDTH, { 
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { 
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [visible]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

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
              await logout();
              onClose();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const renderIcon = (item: MenuItem, isActive: boolean) => {
    const iconColor = isActive ? Colors.primary : Colors.textSecondary;
    const iconSize = 20;

    switch (item.iconType) {
      case 'Ionicons':
        return <Ionicons name={item.icon as any} size={iconSize} color={iconColor} />;
      case 'MaterialIcons':
        return <MaterialIcons name={item.icon as any} size={iconSize} color={iconColor} />;
      case 'Feather':
        return <Feather name={item.icon as any} size={iconSize} color={iconColor} />;
      default:
        return <Feather name={item.icon as any} size={iconSize} color={iconColor} />;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last;
  };

  const getMenuItemsWithBadge = (): MenuItem[] => {
    return getBaseMenuItems().map(item => {
      if (item.id === 'orders' && activeOrdersCount > 0) {
        return { ...item, badge: activeOrdersCount };
      }
      return item;
    });
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeScreen === item.screen;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.menuItem, isActive && styles.activeMenuItem]}
        onPress={() => {
          onNavigate(item.screen);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemLeft}>
            {renderIcon(item, isActive)}
            <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>
              {item.title}
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            {item.badge && item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isActive ? Colors.primary : Colors.textTertiary} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMenuSection = (sectionName: string, items: MenuItem[]) => {
    const sectionItems = items.filter(item => item.section === sectionName);
    if (sectionItems.length === 0) return null;

    const sectionTitles = {
      main: 'Quick Access',
      account: 'Account',
      support: 'Support'
    };

    return (
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{sectionTitles[sectionName as keyof typeof sectionTitles]}</Text>
        {sectionItems.map(renderMenuItem)}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="auto">
      <StatusBar barStyle="light-content" backgroundColor={Platform.OS === 'android' ? "rgba(0,0,0,0.5)" : undefined} />
      
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, sidebarStyle]} pointerEvents="auto">
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.profileSection}
              onPress={() => {
                onNavigate('Profile');
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(userData?.firstName, userData?.lastName)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userData?.firstName && userData?.lastName 
                    ? `${userData.firstName} ${userData.lastName}` 
                    : userData?.firstName || userData?.lastName || 'User'}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {userData?.email || 'Loading...'}
                </Text>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    {userData?.userType ? userData.userType.charAt(0).toUpperCase() + userData.userType.slice(1) : 'User'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            contentContainerStyle={styles.menuContentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {renderMenuSection('main', getMenuItemsWithBadge())}
            {renderMenuSection('account', getMenuItemsWithBadge())}
            {renderMenuSection('support', getMenuItemsWithBadge())}
            
            {/* Logout Section */}
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Feather name="log-out" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
            <Text style={styles.footerText}>iBox v1.0.0</Text>
            <Text style={styles.footerSubtext}>Professional Delivery Service</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    maxWidth: '100%',
  },
  profileBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 8,
    marginTop: -8,
  },
  menuContainer: {
    flex: 1,
  },
  menuContentContainer: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  menuItem: {
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeMenuItem: {
    backgroundColor: Colors.primaryLight + '15',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 14,
  },
  activeMenuItemText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 0,
    paddingHorizontal: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.error + '10',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.error,
    marginLeft: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

export default ProfessionalSidebar;