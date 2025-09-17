import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { Text } from '../ui';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RootState, 
  AppDispatch,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
} from '../store/store';
import api from '../services/api';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'delivery' | 'earning' | 'alert' | 'promotion' | 'system';
  read: boolean;
  createdAt: Date;
  data?: any;
}

const DriverNotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { notifications, loading } = useSelector((state: RootState) => state.driver);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  // Load notifications on focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications());
    }, [dispatch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setTimeout(() => setRefreshing(false), 1000);
  }, [dispatch]);

  const markAsRead = useCallback(async (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId));
  }, [dispatch]);

  const markAllAsRead = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(removeNotification(notificationId));
  }, [dispatch]);


  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return { name: 'package', color: Colors.primary };
      case 'earning':
        return { name: 'dollar-sign', color: '#10B981' };
      case 'alert':
        return { name: 'alert-circle', color: '#F59E0B' };
      case 'promotion':
        return { name: 'gift', color: '#8B5CF6' };
      case 'system':
        return { name: 'settings', color: '#6B7280' };
      default:
        return { name: 'bell', color: Colors.textSecondary };
    }
  };

  const renderNotification = (notification: Notification, index: number) => {
    const icon = getNotificationIcon(notification.type);

    return (
      <Animated.View
        key={notification.id}
        entering={SlideInRight.delay(index * 50).springify()}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !notification.read && styles.notificationUnread,
          ]}
          onPress={() => {
            if (!notification.read) {
              markAsRead(notification.id);
            }
            // Handle notification tap based on type
            if (notification.type === 'delivery' && notification.data) {
              // Navigate to delivery details
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.notificationContent}>
            <View style={[
              styles.notificationIcon,
              { backgroundColor: `${icon.color}15` }
            ]}>
              <Icon name={icon.name} type="Feather" size={20} color={icon.color} />
            </View>
            
            <View style={styles.notificationTextContainer}>
              <View style={styles.notificationHeader}>
                <Text style={[
                  styles.notificationTitle,
                  !notification.read && styles.notificationTitleUnread,
                ]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationTime}>
                  {getTimeAgo(notification.createdAt)}
                </Text>
              </View>
              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteNotification(notification.id)}
            >
              <Icon name="x" type="Feather" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {!notification.read && (
            <View style={styles.unreadIndicator} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" type="Feather" size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Your</Text>
            <Text style={styles.headerTitleEmphasis}>notifications</Text>
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Icon name="check-circle" type="Feather" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('all');
            }}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}>
              All
            </Text>
            {notifications.length > 0 && (
              <View style={[
                styles.filterBadge,
                filter === 'all' && styles.filterBadgeActive,
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  filter === 'all' && styles.filterBadgeTextActive,
                ]}>
                  {notifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'unread' && styles.filterTabActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('unread');
            }}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'unread' && styles.filterTabTextActive,
            ]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={[
                styles.filterBadge,
                filter === 'unread' && styles.filterBadgeActive,
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  filter === 'unread' && styles.filterBadgeTextActive,
                ]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length > 0 ? (
          <Animated.View style={animatedStyle}>
            {filteredNotifications.map((notification, index) =>
              renderNotification(notification, index)
            )}
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.emptyContainer}
          >
            <View style={styles.emptyCard}>
              <Icon name="bell-off" type="Feather" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No</Text>
              <Text style={styles.emptyTitleEmphasis}>notifications</Text>
              <Text style={styles.emptyDescription}>
                {filter === 'unread' 
                  ? 'All notifications have been read'
                  : 'You have no notifications at the moment'}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.text,
    marginRight: 6,
  },
  headerTitleEmphasis: {
    fontSize: 22,
    fontFamily: Fonts.PlayfairDisplay?.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  filterBadge: {
    marginLeft: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  filterBadgeTextActive: {
    color: Colors.white,
  },
  
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Notification Card
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  notificationTitleUnread: {
    fontFamily: Fonts.SFProDisplay?.Bold,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  deleteButton: {
    padding: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.text,
    marginTop: 16,
  },
  emptyTitleEmphasis: {
    fontSize: 22,
    fontFamily: Fonts.PlayfairDisplay?.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
    marginTop: 2,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
});

export default DriverNotificationsScreen;
