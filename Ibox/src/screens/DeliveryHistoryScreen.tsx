import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  FlatList,
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
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import api from '../services/api';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface DeliveryHistoryItem {
  id: string;
  orderId: string;
  customerName: string;
  serviceType: 'express' | 'standard' | 'moving';
  pickupAddress: string;
  deliveryAddress: string;
  completedAt: string;
  earnings: number;
  distance: string;
  duration: string;
  rating?: number;
  tip?: number;
  status: 'completed' | 'cancelled';
}

const DeliveryHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  useEffect(() => {
    // Initial animations
    fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
    slideAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDeliveryHistory(1, true);
    }, [])
  );

  const loadDeliveryHistory = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      console.log('📦 Loading delivery history, page:', pageNum);
      
      const response = await api.get(`/driver/deliveries/history?page=${pageNum}&limit=10`);
      
      if (response?.success && response?.data?.deliveries) {
        const newDeliveries = response.data.deliveries;
        
        setDeliveries(prev => 
          reset ? newDeliveries : [...prev, ...newDeliveries]
        );
        
        setHasMore(response.data.hasMore || false);
        setPage(pageNum);
        
        console.log('✅ Delivery history loaded:', newDeliveries.length, 'items');
      }
    } catch (error) {
      console.error('❌ Error loading delivery history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveryHistory(1, true);
    setRefreshing(false);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadDeliveryHistory(page + 1, false);
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'express': return 'zap';
      case 'standard': return 'package';
      case 'moving': return 'truck';
      default: return 'package';
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'express': return '#F59E0B';
      case 'standard': return '#3B82F6';
      case 'moving': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getServiceTypeName = (type: string) => {
    switch (type) {
      case 'express': return 'Express';
      case 'standard': return 'Standard';
      case 'moving': return 'Moving';
      default: return type;
    }
  };

  const renderDeliveryItem = ({ item, index }: { item: DeliveryHistoryItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50)}
      style={styles.deliveryCard}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryServiceType}>
          <View style={[
            styles.serviceTypeIcon,
            { backgroundColor: `${getServiceTypeColor(item.serviceType)}15` }
          ]}>
            <Feather 
              name={getServiceTypeIcon(item.serviceType) as any} 
              size={16} 
              color={getServiceTypeColor(item.serviceType)} 
            />
          </View>
          <Text style={styles.serviceTypeText}>
            {getServiceTypeName(item.serviceType)}
          </Text>
        </View>
        
        <View style={styles.deliveryEarnings}>
          <Text style={styles.earningsAmount}>
            ${(item.earnings || 0).toFixed(2)}
          </Text>
          {item.tip && item.tip > 0 && (
            <Text style={styles.tipAmount}>
              +${(item.tip || 0).toFixed(2)} tip
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.deliveryDetails}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.deliveryDate}>
          {formatDate(item.completedAt)} at {formatTime(item.completedAt)}
        </Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressItem}>
          <View style={styles.addressIcon}>
            <Feather name="circle" size={8} color="#10B981" />
          </View>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>

        <View style={styles.routeLine} />
        
        <View style={styles.addressItem}>
          <View style={styles.addressIcon}>
            <Feather name="map-pin" size={12} color="#EF4444" />
          </View>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.deliveryAddress}
                      </Text>
                    </View>
                  </View>
      
      <View style={styles.deliveryFooter}>
        <View style={styles.deliveryStats}>
          <Text style={styles.statText}>
            {item.distance} • {item.duration}
                      </Text>
                </View>

        {item.rating && (
          <View style={styles.ratingContainer}>
            <Feather name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{(item.rating || 0).toFixed(1)}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="package" size={48} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your completed deliveries will appear here
      </Text>
        </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>Delivery</Text>
            <Text style={styles.headerTitleHighlight}>History</Text>
            </View>
            
                <TouchableOpacity
            style={styles.headerButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={22} color="white" />
                </TouchableOpacity>
            </View>
      </LinearGradient>

      <Animated.View style={[styles.content, containerStyle]}>
        {loading && deliveries.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading delivery history...</Text>
          </View>
        ) : (
          <FlatList
            data={deliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={deliveries.length === 0 ? styles.emptyContainer : undefined}
          />
        )}
      </Animated.View>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  deliveryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryServiceType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceTypeText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
  },
  deliveryEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
  },
  tipAmount: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#10B981',
  },
  deliveryDetails: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  deliveryDate: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressIcon: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.textTertiary,
    marginLeft: 9,
    marginBottom: 8,
    opacity: 0.3,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deliveryStats: {
    flex: 1,
  },
  statText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textTertiary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default DeliveryHistoryScreen;