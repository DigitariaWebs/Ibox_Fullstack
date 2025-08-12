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
  Modal,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Text, Icon, Button } from '../ui';
import { Colors } from '../config/colors';
import { RootState } from '../store/store';

interface OrderHistoryScreenProps {
  navigation: any;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'delivered' | 'in_transit' | 'processing' | 'cancelled' | 'pending';
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  serviceType: 'colis' | 'palette' | 'camion' | 'stockage';
}

type OrderStatus = 'all' | 'delivered' | 'in_transit' | 'processing' | 'cancelled' | 'pending';

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const accountType = useSelector((state: RootState) => state.user.accountType);
  
  // Mock orders data
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'IB-2024-001',
      date: '2024-01-15',
      status: 'delivered',
      items: [
        { id: '1', name: 'Colis Express', quantity: 1, price: 25.99 },
        { id: '2', name: 'Assurance Premium', quantity: 1, price: 5.99 },
      ],
      totalAmount: 31.98,
      deliveryAddress: '1234 Rue Sainte-Catherine, Montréal, QC',
      paymentMethod: 'Visa **** 1234',
      serviceType: 'colis',
      trackingNumber: 'IB123456789',
    },
    {
      id: '2',
      orderNumber: 'IB-2024-002',
      date: '2024-01-18',
      status: 'in_transit',
      items: [
        { id: '3', name: 'Transport Palette', quantity: 2, price: 89.99 },
      ],
      totalAmount: 179.98,
      deliveryAddress: '5678 Boulevard Saint-Laurent, Montréal, QC',
      paymentMethod: 'Mastercard **** 5678',
      estimatedDelivery: '2024-01-20',
      serviceType: 'palette',
      trackingNumber: 'IB987654321',
    },
    {
      id: '3',
      orderNumber: 'IB-2024-003',
      date: '2024-01-20',
      status: 'processing',
      items: [
        { id: '4', name: 'Camion 6h avec aide', quantity: 1, price: 120.00 },
      ],
      totalAmount: 120.00,
      deliveryAddress: '9876 Avenue du Parc, Laval, QC',
      paymentMethod: 'Amex **** 9876',
      estimatedDelivery: '2024-01-22',
      serviceType: 'camion',
    },
    {
      id: '4',
      orderNumber: 'IB-2024-004',
      date: '2024-01-12',
      status: 'delivered',
      items: [
        { id: '5', name: 'Stockage 1 mois', quantity: 1, price: 45.00 },
      ],
      totalAmount: 45.00,
      deliveryAddress: '2468 Rue Sherbrooke, Montréal, QC',
      paymentMethod: 'Visa **** 1234',
      serviceType: 'stockage',
      trackingNumber: 'IB456789123',
    },
    {
      id: '5',
      orderNumber: 'IB-2024-005',
      date: '2024-01-10',
      status: 'cancelled',
      items: [
        { id: '6', name: 'Colis Standard', quantity: 1, price: 15.99 },
      ],
      totalAmount: 15.99,
      deliveryAddress: '1357 Rue de la Montagne, Montréal, QC',
      paymentMethod: 'Visa **** 1234',
      serviceType: 'colis',
    },
  ]);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  const statusFilters = [
    { key: 'all', label: 'Tous', count: orders.length },
    { key: 'delivered', label: 'Livrés', count: orders.filter(o => o.status === 'delivered').length },
    { key: 'in_transit', label: 'En transit', count: orders.filter(o => o.status === 'in_transit').length },
    { key: 'processing', label: 'En cours', count: orders.filter(o => o.status === 'processing').length },
    { key: 'cancelled', label: 'Annulés', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const serviceTypeInfo = {
    colis: { label: 'Colis', icon: 'package', color: '#0AA5A8' },
    palette: { label: 'Palette', icon: 'grid', color: '#3B82F6' },
    camion: { label: 'Camion', icon: 'truck', color: '#F97316' },
    stockage: { label: 'Stockage', icon: 'archive', color: '#8B5CF6' },
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Livré', color: '#10B981', icon: 'check-circle' };
      case 'in_transit':
        return { label: 'En transit', color: '#F59E0B', icon: 'truck' };
      case 'processing':
        return { label: 'En cours', color: '#3B82F6', icon: 'clock' };
      case 'cancelled':
        return { label: 'Annulé', color: '#EF4444', icon: 'x-circle' };
      case 'pending':
        return { label: 'En attente', color: '#6B7280', icon: 'pause-circle' };
      default:
        return { label: 'Inconnu', color: '#6B7280', icon: 'help-circle' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} $`;
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const totalSpent = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleTrackOrder = (order: Order) => {
    if (order.trackingNumber) {
      Alert.alert(
        'Suivi de commande',
        `Numéro de suivi: ${order.trackingNumber}`,
        [
          { text: 'Copier', onPress: () => {} },
          { text: 'Fermer', style: 'cancel' },
        ]
      );
    }
  };

  const handleReorder = (order: Order) => {
    Alert.alert(
      'Nouvelle commande',
      'Souhaitez-vous créer une nouvelle commande avec les mêmes articles?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => {
          // Navigate to service selection or order flow
          navigation.navigate('HomeScreen');
        }},
      ]
    );
  };

  const handleCancelOrder = (order: Order) => {
    if (order.status === 'processing' || order.status === 'pending') {
      Alert.alert(
        'Annuler la commande',
        'Êtes-vous sûr de vouloir annuler cette commande?',
        [
          { text: 'Non', style: 'cancel' },
          { text: 'Oui, annuler', style: 'destructive', onPress: () => {
            setOrders(prev => prev.map(o => 
              o.id === order.id ? { ...o, status: 'cancelled' as const } : o
            ));
            setShowOrderDetails(false);
          }},
        ]
      );
    }
  };

  const StatusFilter = ({ filter }: { filter: any }) => (
    <TouchableOpacity
      style={[
        styles.statusFilter,
        selectedStatus === filter.key && styles.statusFilterActive,
      ]}
      onPress={() => setSelectedStatus(filter.key)}
    >
      <Text style={[
        styles.statusFilterText,
        selectedStatus === filter.key && styles.statusFilterTextActive,
      ]}>
        {filter.label}
      </Text>
      <View style={[
        styles.statusFilterBadge,
        selectedStatus === filter.key && styles.statusFilterBadgeActive,
      ]}>
        <Text style={[
          styles.statusFilterBadgeText,
          selectedStatus === filter.key && styles.statusFilterBadgeTextActive,
        ]}>
          {filter.count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const OrderCard = ({ order }: { order: Order }) => {
    const statusInfo = getStatusInfo(order.status);
    const serviceInfo = serviceTypeInfo[order.serviceType];

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.serviceIcon, { backgroundColor: serviceInfo.color + '15' }]}>
              <Icon name={serviceInfo.icon as any} type="Feather" size={20} color={serviceInfo.color} />
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <Icon name={statusInfo.icon as any} type="Feather" size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <Text style={styles.orderItems} numberOfLines={2}>
            {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
          </Text>
          <Text style={styles.orderAddress} numberOfLines={1}>
            {order.deliveryAddress}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatPrice(order.totalAmount)}</Text>
          <View style={styles.orderActions}>
            {order.trackingNumber && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleTrackOrder(order)}
              >
                <Icon name="map-pin" type="Feather" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOrderPress(order)}
            >
              <Icon name="eye" type="Feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {accountType === 'business' ? 'Historique des expéditions' : 'Historique des commandes'}
        </Text>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" type="Feather" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statsCards}>
            <View style={styles.statsCard}>
              <Icon name="package" type="Feather" size={24} color={Colors.primary} />
              <Text style={styles.statsNumber}>{orders.length}</Text>
              <Text style={styles.statsLabel}>
                {accountType === 'business' ? 'Expéditions' : 'Commandes'}
              </Text>
            </View>
            <View style={styles.statsCard}>
              <Icon name="dollar-sign" type="Feather" size={24} color="#10B981" />
              <Text style={styles.statsNumber}>{formatPrice(totalSpent)}</Text>
              <Text style={styles.statsLabel}>Total dépensé</Text>
            </View>
          </View>
        </Animated.View>

        {/* Status Filters */}
        <Animated.View
          style={[
            styles.filtersSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {statusFilters.map((filter) => (
              <StatusFilter key={filter.key} filter={filter} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Orders List */}
        <Animated.View
          style={[
            styles.ordersSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="inbox" type="Feather" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>
                {selectedStatus === 'all' 
                  ? 'Aucune commande' 
                  : `Aucune commande ${statusFilters.find(f => f.key === selectedStatus)?.label.toLowerCase()}`
                }
              </Text>
              <Text style={styles.emptyStateText}>
                {selectedStatus === 'all' 
                  ? 'Vous n\'avez pas encore passé de commande'
                  : 'Aucune commande ne correspond à ce filtre'
                }
              </Text>
              {selectedStatus === 'all' && (
                <Button
                  title="Passer une commande"
                  onPress={() => navigation.navigate('HomeScreen')}
                  variant="primary"
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedOrder && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.modalBackButton} 
                  onPress={() => setShowOrderDetails(false)}
                >
                  <Icon name="x" type="Feather" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Détails de la commande</Text>
                <View style={styles.modalHeaderRight} />
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Order Summary */}
                <View style={styles.modalSection}>
                  <View style={styles.orderSummary}>
                    <View style={styles.orderSummaryHeader}>
                      <Text style={styles.orderSummaryNumber}>{selectedOrder.orderNumber}</Text>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusInfo(selectedOrder.status).color + '15' }
                      ]}>
                        <Icon 
                          name={getStatusInfo(selectedOrder.status).icon as any} 
                          type="Feather" 
                          size={14} 
                          color={getStatusInfo(selectedOrder.status).color} 
                        />
                        <Text style={[
                          styles.statusText, 
                          { color: getStatusInfo(selectedOrder.status).color }
                        ]}>
                          {getStatusInfo(selectedOrder.status).label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderSummaryDate}>
                      Commandé le {formatDate(selectedOrder.date)}
                    </Text>
                    {selectedOrder.estimatedDelivery && (
                      <Text style={styles.estimatedDelivery}>
                        Livraison estimée: {formatDate(selectedOrder.estimatedDelivery)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Articles</Text>
                  {selectedOrder.items.map((item) => (
                    <View key={item.id} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>{item.name}</Text>
                        <Text style={styles.orderItemQuantity}>Qté: {item.quantity}</Text>
                      </View>
                      <Text style={styles.orderItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                    </View>
                  ))}
                  <View style={styles.orderTotalRow}>
                    <Text style={styles.orderTotalLabel}>Total</Text>
                    <Text style={styles.orderTotalAmount}>{formatPrice(selectedOrder.totalAmount)}</Text>
                  </View>
                </View>

                {/* Delivery Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informations de livraison</Text>
                  <View style={styles.infoRow}>
                    <Icon name="map-pin" type="Feather" size={16} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Icon name="credit-card" type="Feather" size={16} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{selectedOrder.paymentMethod}</Text>
                  </View>
                  {selectedOrder.trackingNumber && (
                    <View style={styles.infoRow}>
                      <Icon name="truck" type="Feather" size={16} color={Colors.textSecondary} />
                      <Text style={styles.infoText}>Suivi: {selectedOrder.trackingNumber}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {selectedOrder.trackingNumber && (
                    <Button
                      title="Suivre la commande"
                      onPress={() => handleTrackOrder(selectedOrder)}
                      variant="outline"
                      icon={<Icon name="map-pin" type="Feather" size={20} color={Colors.primary} />}
                      style={styles.actionModalButton}
                    />
                  )}
                  
                  <Button
                    title="Recommander"
                    onPress={() => handleReorder(selectedOrder)}
                    variant="outline"
                    icon={<Icon name="repeat" type="Feather" size={20} color={Colors.primary} />}
                    style={styles.actionModalButton}
                  />

                  {(selectedOrder.status === 'processing' || selectedOrder.status === 'pending') && (
                    <Button
                      title="Annuler la commande"
                      onPress={() => handleCancelOrder(selectedOrder)}
                      variant="outline"
                      icon={<Icon name="x" type="Feather" size={20} color="#EF4444" />}
                      style={[styles.actionModalButton, { borderColor: '#EF4444' }]}
                    />
                  )}
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  filtersSection: {
    paddingVertical: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  statusFilterActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  statusFilterTextActive: {
    color: Colors.white,
  },
  statusFilterBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusFilterBadgeActive: {
    backgroundColor: Colors.white + '20',
  },
  statusFilterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusFilterBadgeTextActive: {
    color: Colors.white,
  },
  ordersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderContent: {
    marginBottom: 16,
  },
  orderItems: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  modalHeaderRight: {
    width: 40,
  },
  modalScrollView: {
    flex: 1,
  },
  modalSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  orderSummary: {
    alignItems: 'center',
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  orderSummaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderSummaryDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  estimatedDelivery: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionModalButton: {
    marginBottom: 0,
  },
});

export default OrderHistoryScreen; 