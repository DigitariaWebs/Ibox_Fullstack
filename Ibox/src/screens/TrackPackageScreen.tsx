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
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface TrackingInfo {
  orderId: string;
  orderNumber: string;
  status: string;
  serviceType: string;
  estimatedDeliveryTime?: string;
  pickupLocation: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  dropoffLocation: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  tracking: {
    currentLocation?: { lat: number; lng: number; timestamp: string } | null;
    lastLocationUpdate?: string | null;
    route?: Array<{ lat: number; lng: number; timestamp: string }>;
    estimatedArrival?: string | null;
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    note?: string;
    location?: { lat: number; lng: number };
  }>;
  transporter?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    vehicle?: string;
    licensePlate?: string;
  } | null;
  packageDetails: {
    description: string;
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
  };
  createdAt: string;
  updatedAt: string;
}

const TrackPackageScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // Get orderId from route params if passed
  const routeOrderId = (route.params as any)?.orderId;
  
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderIdInput, setOrderIdInput] = useState(routeOrderId || '');
  const [searchMode, setSearchMode] = useState(!routeOrderId);

  useEffect(() => {
    if (routeOrderId) {
      fetchTrackingInfo(routeOrderId);
    }
  }, [routeOrderId]);

  const fetchTrackingInfo = async (orderId: string) => {
    if (!orderId.trim()) {
      setError('Please enter an Order ID or Order Number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First try to get order by ID
      let tracking: TrackingInfo;
      try {
        tracking = await api.getOrderTracking(orderId);
      } catch (err) {
        // If failed, try to find order by order number from user's orders
        const ordersResponse = await api.getOrders({ limit: 100 });
        const foundOrder = ordersResponse.orders.find((order: any) => 
          order.orderNumber === orderId.toUpperCase() || 
          order._id === orderId
        );
        
        if (!foundOrder) {
          throw new Error('Order not found. Please check your Order ID or Order Number.');
        }
        
        tracking = await api.getOrderTracking(foundOrder._id);
      }

      setTrackingInfo(tracking);
      setSearchMode(false);
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      if (err instanceof Error) {
        if (err.message.includes('Access denied')) {
          setError('You can only track your own orders.');
        } else if (err.message.includes('Order not found')) {
          setError('Order not found. Please check your Order ID or Order Number.');
        } else if (err.message.includes('Authentication') || err.message.includes('401')) {
          setError('Please log in to track your orders.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to fetch tracking information. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (trackingInfo) {
      setRefreshing(true);
      fetchTrackingInfo(trackingInfo.orderId);
    }
  };

  const handleSearch = () => {
    fetchTrackingInfo(orderIdInput);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'accepted':
      case 'en_route_pickup':
      case 'picked_up':
      case 'en_route_delivery':
        return Colors.primary;
      case 'delivered':
        return Colors.success;
      case 'cancelled':
      case 'failed':
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
        return 'car-outline';
      case 'picked_up':
        return 'cube-outline';
      case 'en_route_delivery':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-done-outline';
      case 'cancelled':
      case 'failed':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Order Placed',
      'accepted': 'Driver Assigned',
      'en_route_pickup': 'Driver En Route',
      'picked_up': 'Package Picked Up',
      'en_route_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'failed': 'Delivery Failed'
    };
    return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateString: string) => {
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

  const renderStatusTimeline = () => {
    if (!trackingInfo || !trackingInfo.statusHistory.length) return null;

    const sortedHistory = [...trackingInfo.statusHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Order Timeline</Text>
        {sortedHistory.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineDot, 
                { backgroundColor: getStatusColor(item.status) }
              ]} />
              {index < sortedHistory.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>
                {formatStatus(item.status)}
              </Text>
              <Text style={styles.timelineTime}>
                {formatDateTime(item.timestamp)}
              </Text>
              {item.note && (
                <Text style={styles.timelineNote}>{item.note}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <Text style={styles.searchTitle}>Track Your Package</Text>
      <Text style={styles.searchSubtitle}>
        Enter your Order ID or Order Number to track your package
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Order ID (e.g., ORD-2024-001)"
          value={orderIdInput}
          onChangeText={setOrderIdInput}
          autoCapitalize="characters"
          placeholderTextColor={Colors.textSecondary}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading || !orderIdInput.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Feather name="search" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  const renderTrackingInfo = () => {
    if (!trackingInfo) return null;

    return (
      <ScrollView
        style={styles.trackingContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.orderHeader}>
            <View style={styles.serviceIconContainer}>
              <Feather 
                name={getServiceIcon(trackingInfo.serviceType)} 
                size={24} 
                color={Colors.primary} 
              />
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{trackingInfo.orderNumber}</Text>
              <Text style={styles.serviceType}>
                {trackingInfo.serviceType.charAt(0).toUpperCase() + trackingInfo.serviceType.slice(1)} Delivery
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trackingInfo.status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(trackingInfo.status)} 
              size={16} 
              color={getStatusColor(trackingInfo.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(trackingInfo.status) }]}>
              {formatStatus(trackingInfo.status)}
            </Text>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.locationsCard}>
          <Text style={styles.sectionTitle}>Route</Text>
          
          <View style={styles.locationItem}>
            <View style={[styles.locationDot, { backgroundColor: Colors.primary }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress}>{trackingInfo.pickupLocation.address}</Text>
            </View>
          </View>

          <View style={styles.locationConnector} />

          <View style={styles.locationItem}>
            <View style={[styles.locationDot, { backgroundColor: Colors.success }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Delivery</Text>
              <Text style={styles.locationAddress}>{trackingInfo.dropoffLocation.address}</Text>
            </View>
          </View>
        </View>

        {/* Transporter Info */}
        {trackingInfo.transporter && (
          <View style={styles.transporterCard}>
            <Text style={styles.sectionTitle}>Your Driver</Text>
            <View style={styles.transporterInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitials}>
                  {trackingInfo.transporter.firstName[0]}{trackingInfo.transporter.lastName[0]}
                </Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>
                  {trackingInfo.transporter.firstName} {trackingInfo.transporter.lastName}
                </Text>
                {trackingInfo.transporter.vehicle && (
                  <Text style={styles.vehicleInfo}>
                    {trackingInfo.transporter.vehicle}
                    {trackingInfo.transporter.licensePlate && ` • ${trackingInfo.transporter.licensePlate}`}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => {
                  // TODO: Implement call functionality
                  Alert.alert('Call Driver', `Call ${trackingInfo.transporter?.firstName}?`);
                }}
              >
                <Feather name="phone" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Package Details */}
        <View style={styles.packageCard}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.packageInfo}>
            <Feather name="package" size={16} color={Colors.textSecondary} />
            <Text style={styles.packageDescription}>{trackingInfo.packageDetails.description}</Text>
          </View>
          {trackingInfo.packageDetails.weight && (
            <Text style={styles.packageWeight}>
              Weight: {trackingInfo.packageDetails.weight} kg
            </Text>
          )}
        </View>

        {/* Timeline */}
        {renderStatusTimeline()}
      </ScrollView>
    );
  };

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
        <Text style={styles.headerTitle}>Track Package</Text>
        {trackingInfo && (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              setSearchMode(true);
              setTrackingInfo(null);
              setError(null);
            }}
          >
            <Feather name="search" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {searchMode ? renderSearchInput() : renderTrackingInfo()}
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
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.white,
    marginRight: 12,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  trackingContent: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  serviceType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  locationConnector: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
    marginLeft: 5.5,
    marginVertical: 8,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  transporterCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  transporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  vehicleInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  packageWeight: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timelineContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timelineNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default TrackPackageScreen;