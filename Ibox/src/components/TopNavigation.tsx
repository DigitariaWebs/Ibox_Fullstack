import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import apiService from '../services/api';

interface TopNavigationProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  notificationCount?: number;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onMenuPress,
  onNotificationPress,
  showBackButton = false,
  onBackPress,
  notificationCount: propNotificationCount,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Use prop count if provided, otherwise use internal state
  useEffect(() => {
    if (propNotificationCount !== undefined) {
      setUnreadCount(propNotificationCount);
    }
  }, [propNotificationCount]);

  const loadUnreadCount = async () => {
    try {
      const count = await apiService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread notification count:', error);
      // Silently fail - don't update count if API call fails
    }
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <View style={styles.container}>
        <View style={styles.navigationBar}>
          {/* Left - Back Button or Hamburger Menu */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={showBackButton ? onBackPress : onMenuPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconBackground}>
              <Ionicons 
                name={showBackButton ? "arrow-back" : "menu"} 
                size={24} 
                color={Colors.textPrimary} 
              />
            </View>
          </TouchableOpacity>

          {/* Center - Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Right - Notifications with Badge */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconBackground}>
              <Ionicons 
                name="notifications-outline" 
                size={22} 
                color={Colors.primary} 
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  logoImage: {
    height: 40,
    width: 120,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
});

export default TopNavigation;