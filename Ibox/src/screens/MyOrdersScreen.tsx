import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Order {
  _id: string;
  orderNumber: string;
  serviceType: 'express' | 'standard' | 'moving' | 'storage';
  status: string;
  priority?: string;
  pickupLocation: {
    address: string;
    coordinates?: { lat: number; lng: number };
    contactPerson?: string;
    contactPhone?: string;
    notes?: string;
  };
  dropoffLocation: {
    address: string;
    coordinates?: { lat: number; lng: number };
    contactPerson?: string;
    contactPhone?: string;
    notes?: string;
  };
  packageDetails: {
    description: string;
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    photos?: string[];
    specialInstructions?: string;
  };
  pricing: {
    baseFee: number;
    totalAmount: number;
    currency: string;
    distanceFee?: number;
    priorityFee?: number;
    serviceFee?: number;
  };
  payment?: {
    status: string;
    method?: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
  customer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  transporter?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    transporterDetails?: any;
  };
  tracking?: {
    currentLocation?: { lat: number; lng: number; timestamp: string };
    route?: Array<{ lat: number; lng: number; timestamp: string }>;
  };
}

const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setError(null);
      
      // Map frontend tab to backend status filters
      let statusFilter = undefined;
      if (activeTab === 'completed') {
        statusFilter = 'delivered';
      } else if (activeTab === 'cancelled') {
        statusFilter = 'cancelled';
      }
      // For 'active', we don't filter by status to get all non-completed orders

      const response = await api.getOrders({
        status: statusFilter,
        limit: 50, // Get more orders per page
      });

      let fetchedOrders = response.orders;

      // For 'active' tab, filter out completed and cancelled orders on frontend
      if (activeTab === 'active') {
        fetchedOrders = fetchedOrders.filter((order: Order) => 
          !['delivered', 'cancelled'].includes(order.status)
        );
      }

      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          setError('Please log in again to view your orders.');
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          setError('Unable to connect to server. Please check your connection.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'accepted':
      case 'en_route_pickup':
      case 'en_route_delivery':
        return Colors.primary;
      case 'delivered':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'en_route_pickup':
      case 'en_route_delivery':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-done-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'express':
        return 'flash';
      case 'standard':
        return 'cube';
      case 'moving':
        return 'truck';
      case 'storage':
        return 'archive';
      default:
        return 'package';
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => {
        // TODO: Navigate to OrderDetails screen when implemented
        console.log('Navigate to order details:', order._id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Feather 
            name={getServiceIcon(order.serviceType)} 
            size={20} 
            color={Colors.primary} 
          />
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(order.status)} 
            size={14} 
            color={getStatusColor(order.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {formatStatus(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} style={{ backgroundColor: Colors.primary }} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {order.pickupLocation.address}
            </Text>
          </View>
        </View>

        <View style={styles.locationConnector} />

        <View style={styles.locationRow}>
          <View style={styles.locationDot} style={{ backgroundColor: Colors.success }} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {order.dropoffLocation.address}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.packageInfo}>
          <Feather name="package" size={14} color={Colors.textSecondary} />
          <Text style={styles.packageText}>{order.packageDetails.description}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceAmount}>
            ${order.pricing.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {order.transporter && (
        <View style={styles.transporterInfo}>
          <Feather name="user" size={14} color={Colors.textSecondary} />
          <Text style={styles.transporterText}>
            Driver: {order.transporter.firstName} {order.transporter.lastName}
          </Text>
        </View>
      )}

      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={80} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'active' ? 'No Active Orders' 
         : activeTab === 'completed' ? 'No Completed Orders' 
         : 'No Cancelled Orders'}
      </Text>
      <Text style={styles.emptyMessage}>
        {activeTab === 'active' 
          ? "You don't have any orders in progress. Create your first order to get started!"
          : activeTab === 'completed'
          ? "You haven't completed any deliveries yet. Your completed orders will appear here."
          : "You don't have any cancelled orders. Cancelled orders will be shown here for your records."}
      </Text>
      {activeTab === 'active' && (
        <TouchableOpacity 
          style={styles.newOrderButton}
          onPress={() => navigation.navigate('HomeScreen' as never)}
        >
          <Text style={styles.newOrderButtonText}>Create Your First Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="filter" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {orders.length > 0 ? (
            <View style={styles.ordersList}>
              {orders.map(renderOrderCard)}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  filterButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  locationConnector: {
    width: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
    marginLeft: 4.5,
    marginVertical: 2,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  transporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  transporterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  newOrderButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  newOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default MyOrdersScreen;