import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
  SafeAreaView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SlideInRight,
  SlideInLeft,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui';
import { Colors } from '../config/colors';
import apiService from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'delivery' | 'promotion' | 'system';
  read: boolean;
  icon?: string;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationCountChange?: (count: number) => void;
}

interface NotificationDetailProps {
  notification: NotificationItem;
  onBack: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex: number;
  totalCount: number;
}

// Mock notification data with extended content for full preview
const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Order Delivered Successfully',
    message: 'Your express delivery to 123 Main Street has been completed successfully! The package was delivered to your front door at 2:45 PM today. Our driver confirmed the delivery with a photo and your signature. We hope you enjoyed our fast and reliable service. Thanks for choosing iBox for your delivery needs!',
    time: '2 min ago',
    type: 'delivery',
    read: false,
  },
  {
    id: '2',
    title: 'Driver En Route to Pickup',
    message: 'Great news! John Smith is currently heading to your location for package pickup. He\'s driving a white Ford Transit van (License: ABC-123) and should arrive within 15 minutes. You can track his real-time location in the app. Please have your package ready and ensure someone is available to hand it over.',
    time: '1 hour ago',
    type: 'order',
    read: false,
  },
  {
    id: '3',
    title: 'Weekend Special Offer 🎉',
    message: 'This weekend only - Save 25% on all storage services! Whether you need climate-controlled storage, vehicle storage, or temporary storage solutions, we\'ve got you covered. Use code WEEKEND25 at checkout. Offer valid until Sunday 11:59 PM. Don\'t miss out on this amazing deal!',
    time: '3 hours ago',
    type: 'promotion',
    read: true,
  },
  {
    id: '4',
    title: 'Moving Service Confirmed',
    message: 'Your professional moving service has been confirmed for tomorrow, March 15th at 9:00 AM sharp. Our team of 3 experienced movers will arrive with all necessary equipment including dollies, blankets, and straps. The estimated completion time is 4-6 hours. Please ensure all items are packed and clearly labeled. Contact us if you have any questions!',
    time: '1 day ago',
    type: 'order',
    read: true,
  },
  {
    id: '5',
    title: 'App Update Available',
    message: 'iBox version 2.1.0 is now available for download! This update includes exciting new features like real-time driver chat, enhanced package tracking with photos, improved storage management tools, and better performance optimizations. We\'ve also fixed several bugs reported by our community. Update now to get the best experience!',
    time: '2 days ago',
    type: 'system',
    read: true,
  },
  {
    id: '6',
    title: 'Payment Processed Successfully',
    message: 'Your payment of $45.00 for Standard Delivery service has been processed successfully using your Visa ending in 4532. The transaction was completed on March 12, 2024 at 3:22 PM. You will receive a detailed receipt via email shortly. Thank you for your business!',
    time: '3 days ago',
    type: 'order',
    read: true,
  },
  {
    id: '7',
    title: 'Storage Unit Access Code Updated',
    message: 'For security purposes, your storage unit access code has been updated. Your new access code is 8472. This code is valid starting tomorrow and will remain active for the duration of your storage agreement. Please make note of this code and keep it secure.',
    time: '4 days ago',
    type: 'system',
    read: true,
  },
  {
    id: '8',
    title: 'Delivery Attempt Failed',
    message: 'We attempted to deliver your package today at 2:15 PM but no one was available to receive it. The package is now at our local facility and available for pickup, or we can schedule another delivery attempt. Please contact us within 5 business days to arrange redelivery.',
    time: '5 days ago',
    type: 'delivery',
    read: true,
  },
];

// Detailed Notification View Component
const NotificationDetailView: React.FC<NotificationDetailProps> = ({ 
  notification, 
  onBack, 
  onNext, 
  onPrevious, 
  currentIndex, 
  totalCount 
}) => {
  const iconData = getNotificationIcon(notification.type);
  
  const getActionButtons = (type: NotificationItem['type']) => {
    switch (type) {
      case 'delivery':
        return [
          { title: 'View Photos', icon: 'camera', color: '#059669' },
          { title: 'Rate Service', icon: 'star', color: '#D97706' },
          { title: 'Reorder', icon: 'refresh', color: Colors.primary },
        ];
      case 'order':
        return [
          { title: 'Track Order', icon: 'location', color: Colors.primary },
          { title: 'Contact Driver', icon: 'call', color: '#059669' },
          { title: 'Modify Order', icon: 'edit', color: '#D97706' },
        ];
      case 'promotion':
        return [
          { title: 'Use Offer', icon: 'local-offer', color: '#D97706' },
          { title: 'Share Deal', icon: 'share', color: Colors.primary },
          { title: 'Save for Later', icon: 'bookmark', color: '#6B7280' },
        ];
      case 'system':
        return [
          { title: 'Update Now', icon: 'download', color: Colors.primary },
          { title: 'Learn More', icon: 'info', color: '#6B7280' },
          { title: 'Settings', icon: 'settings', color: '#6B7280' },
        ];
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.detailContainer}>
      <StatusBar barStyle="light-content" backgroundColor={iconData.gradient[0]} />
      
      {/* Header */}
      <LinearGradient
        colors={iconData.gradient}
        style={styles.detailHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.detailHeaderTop}>
          <TouchableOpacity style={styles.detailBackButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.detailCounter}>
            {currentIndex + 1} of {totalCount}
          </Text>
          
          <View style={styles.detailNavigation}>
            <TouchableOpacity 
              style={[styles.navButton, !onPrevious && styles.navButtonDisabled]} 
              onPress={onPrevious}
              disabled={!onPrevious}
            >
              <Ionicons name="chevron-up" size={20} color={!onPrevious ? 'rgba(255,255,255,0.5)' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navButton, !onNext && styles.navButtonDisabled]} 
              onPress={onNext}
              disabled={!onNext}
            >
              <Ionicons name="chevron-down" size={20} color={!onNext ? 'rgba(255,255,255,0.5)' : 'white'} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Animated.View style={styles.detailIcon} entering={ZoomIn.delay(200)}>
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={styles.detailIconGradient}
          >
            <MaterialIcons name={iconData.name as any} size={32} color="white" />
          </LinearGradient>
        </Animated.View>
        
        <Animated.Text style={styles.detailTitle} entering={FadeInUp.delay(300)}>
          {notification.title}
        </Animated.Text>
        
        <Animated.Text style={styles.detailTime} entering={FadeInUp.delay(400)}>
          {notification.time}
        </Animated.Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={styles.detailMessageContainer} entering={FadeInUp.delay(500)}>
          <Text style={styles.detailMessage}>{notification.message}</Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={styles.detailActions} entering={FadeInUp.delay(600)}>
          <Text style={styles.detailActionsTitle}>Quick Actions</Text>
          {getActionButtons(notification.type).map((action, index) => (
            <Animated.View 
              key={action.title}
              entering={SlideInRight.delay(700 + index * 100)}
            >
              <TouchableOpacity style={styles.detailActionButton}>
                <View style={[styles.detailActionIcon, { backgroundColor: action.color + '15' }]}>
                  <MaterialIcons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.detailActionText}>{action.title}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Related Info */}
        {notification.type === 'delivery' && (
          <Animated.View style={styles.detailInfo} entering={FadeInUp.delay(900)}>
            <Text style={styles.detailInfoTitle}>Delivery Details</Text>
            <View style={styles.detailInfoItem}>
              <Text style={styles.detailInfoLabel}>Delivered to:</Text>
              <Text style={styles.detailInfoValue}>Front Door</Text>
            </View>
            <View style={styles.detailInfoItem}>
              <Text style={styles.detailInfoLabel}>Signature:</Text>
              <Text style={styles.detailInfoValue}>Received</Text>
            </View>
            <View style={styles.detailInfoItem}>
              <Text style={styles.detailInfoLabel}>Tracking ID:</Text>
              <Text style={styles.detailInfoValue}>IB240315789</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function moved outside component
const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'order':
      return { name: 'receipt', family: 'MaterialIcons', color: '#4F46E5', gradient: ['#4F46E5', '#7C3AED'] };
    case 'delivery':
      return { name: 'local-shipping', family: 'MaterialIcons', color: '#059669', gradient: ['#059669', '#0D9488'] };
    case 'promotion':
      return { name: 'local-offer', family: 'MaterialIcons', color: '#D97706', gradient: ['#D97706', '#F59E0B'] };
    case 'system':
      return { name: 'settings', family: 'MaterialIcons', color: '#6B7280', gradient: ['#6B7280', '#9CA3AF'] };
    default:
      return { name: 'notifications', family: 'MaterialIcons', color: Colors.primary, gradient: [Colors.primary, '#4F46E5'] };
  }
};

const NotificationModal: React.FC<NotificationModalProps> = ({ 
  visible, 
  onClose, 
  onNotificationCountChange 
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications({ limit: 50 });
      
      // Transform backend notifications to match our interface
      const transformedNotifications = response.notifications.map((notification: any) => ({
        id: notification._id || notification.id,
        title: notification.title || 'Notification',
        message: notification.message || notification.body || '',
        time: formatTimeAgo(notification.createdAt || notification.timestamp),
        type: notification.type || 'system',
        read: notification.read || false,
        icon: notification.icon,
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(response.unreadCount);
      
      // Notify parent component of unread count change
      if (onNotificationCountChange) {
        onNotificationCountChange(response.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationSelect = async (notification: NotificationItem, index: number) => {
    setSelectedNotification(notification);
    setSelectedIndex(index);
    
    // Mark as read if not already read
    if (!notification.read) {
      try {
        const success = await apiService.markNotificationAsRead(notification.id);
        if (success) {
          // Update local state
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id ? { ...n, read: true } : n
            )
          );
          
          // Update unread count
          const newUnreadCount = Math.max(0, unreadCount - 1);
          setUnreadCount(newUnreadCount);
          
          if (onNotificationCountChange) {
            onNotificationCountChange(newUnreadCount);
          }
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await apiService.markAllNotificationsAsRead();
      if (success) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        
        if (onNotificationCountChange) {
          onNotificationCountChange(0);
        }
        
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleNotificationBack = () => {
    setSelectedNotification(null);
  };

  const handleNextNotification = () => {
    if (selectedIndex < filteredNotifications.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setSelectedNotification(filteredNotifications[nextIndex]);
    }
  };

  const handlePreviousNotification = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setSelectedNotification(filteredNotifications[prevIndex]);
    }
  };

  const filteredNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const renderIcon = (type: NotificationItem['type']) => {
    const iconData = getNotificationIcon(type);
    const IconComponent = iconData.family === 'MaterialIcons' ? MaterialIcons : Ionicons;
    
    return (
      <LinearGradient
        colors={iconData.gradient}
        style={styles.iconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <IconComponent
          name={iconData.name as any}
          size={22}
          color="white"
        />
      </LinearGradient>
    );
  };

  const NotificationItem = ({ notification, index }: { notification: NotificationItem; index: number }) => (
    <TouchableOpacity 
      onPress={() => handleNotificationSelect(notification, index)}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
        entering={FadeInUp.delay(index * 50)}
      >
        <View style={styles.notificationLeft}>
          <View style={styles.notificationIconContainer}>
            {renderIcon(notification.type)}
            {!notification.read && <View style={styles.unreadIndicator} />}
          </View>
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          
          {notification.type === 'promotion' && (
            <View style={styles.promotionBadge}>
              <Text style={styles.promotionBadgeText}>Special Offer</Text>
            </View>
          )}
        </View>
        
        <View style={styles.notificationAction}>
          <Ionicons name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  // Show detailed view if notification is selected
  if (selectedNotification) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleNotificationBack}
      >
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <NotificationDetailView
            notification={selectedNotification}
            onBack={handleNotificationBack}
            onNext={selectedIndex < filteredNotifications.length - 1 ? handleNextNotification : undefined}
            onPrevious={selectedIndex > 0 ? handlePreviousNotification : undefined}
            currentIndex={selectedIndex}
            totalCount={filteredNotifications.length}
          />
      </Modal>
    );
  }

  // Show main notifications list
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.fullContainer}>
        
        {/* Enhanced Header */}
        <LinearGradient
          colors={[Colors.primary, '#6366F1']}
          style={styles.fullHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={styles.fullHeader} entering={SlideInLeft.delay(100)}>
            <TouchableOpacity style={styles.fullBackButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.fullHeaderCenter}>
              <Text style={styles.fullHeaderTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Animated.View style={styles.fullUnreadBadge} entering={ZoomIn.delay(200)}>
                  <Text style={styles.fullUnreadBadgeText}>{unreadCount}</Text>
                </Animated.View>
              )}
            </View>
            
            <View style={styles.fullHeaderActions}>
              <TouchableOpacity 
                style={styles.fullHeaderButton}
                onPress={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <MaterialIcons 
                  name="done-all" 
                  size={22} 
                  color={unreadCount === 0 ? 'rgba(255,255,255,0.5)' : 'white'} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.fullHeaderButton}
                onPress={handleRefresh}
              >
                <MaterialIcons name="refresh" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Tab Selector */}
          <Animated.View style={styles.fullTabContainer} entering={SlideInRight.delay(200)}>
            <TouchableOpacity 
              style={[styles.fullTab, selectedTab === 'all' && styles.fullActiveTab]}
              onPress={() => setSelectedTab('all')}
            >
              <Text style={[styles.fullTabText, selectedTab === 'all' && styles.fullActiveTabText]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.fullTab, selectedTab === 'unread' && styles.fullActiveTab]}
              onPress={() => setSelectedTab('unread')}
            >
              <Text style={[styles.fullTabText, selectedTab === 'unread' && styles.fullActiveTabText]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* Notifications List */}
        <ScrollView 
          style={styles.fullNotificationsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.fullNotificationsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                index={index}
              />
            ))
          ) : (
            <Animated.View style={styles.fullEmptyState} entering={FadeIn.delay(300)}>
              <LinearGradient
                colors={['#F3F4F6', '#E5E7EB']}
                style={styles.fullEmptyIcon}
              >
                <MaterialIcons name="notifications-off" size={48} color={Colors.textTertiary} />
              </LinearGradient>
              <Text style={styles.fullEmptyStateTitle}>
                {selectedTab === 'unread' ? 'All caught up!' : 'No Notifications'}
              </Text>
              <Text style={styles.fullEmptyStateMessage}>
                {selectedTab === 'unread' 
                  ? 'You have no unread notifications' 
                  : 'You\'ll see updates about your orders and deliveries here'}
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Full Screen List Styles
  fullContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fullHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fullBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fullHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  fullUnreadBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  fullUnreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  fullHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fullHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  fullTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullActiveTab: {
    backgroundColor: 'white',
  },
  fullTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  fullActiveTabText: {
    color: Colors.primary,
  },
  fullNotificationsList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fullNotificationsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  fullEmptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  fullEmptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  fullEmptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  fullEmptyStateMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Notification Item Styles
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '25',
    shadowColor: Colors.primary,
    shadowOpacity: 0.12,
  },
  notificationLeft: {
    marginRight: 14,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  iconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  promotionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 4,
  },
  promotionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  notificationAction: {
    marginLeft: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },

  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  detailHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
    paddingBottom: 32,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  detailNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  detailTime: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  detailMessageContainer: {
    backgroundColor: Colors.white,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  detailMessage: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  detailActions: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  detailInfo: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  detailInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailInfoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Status bar background to extend above the notch/Dynamic Island
  statusBarBackground: {
    flex: 1,
  },

  // Full screen styles for true edge-to-edge display
  absoluteFullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
  },

  fullScreenGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default NotificationModal;