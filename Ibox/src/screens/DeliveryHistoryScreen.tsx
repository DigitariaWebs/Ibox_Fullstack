import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

interface DeliveryHistoryScreenProps {
  navigation: any;
}

const DeliveryHistoryScreen: React.FC<DeliveryHistoryScreenProps> = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filters = [
    { id: 'all', label: 'All Deliveries' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'express', label: 'Express' },
    { id: 'standard', label: 'Standard' },
  ];

  const deliveries = [
    {
      id: '#D2024001',
      date: 'Today, 2:30 PM',
      type: 'Express',
      from: '1234 Rue Sainte-Catherine',
      to: '5678 Boulevard René-Lévesque',
      distance: '12.3 km',
      duration: '45 min',
      earnings: '$24.50',
      status: 'completed',
      rating: 5,
      customer: 'Sarah Johnson',
    },
    {
      id: '#D2024002',
      date: 'Today, 11:15 AM',
      type: 'Standard',
      from: '789 Avenue du Parc',
      to: '321 Rue Sherbrooke',
      distance: '8.7 km',
      duration: '32 min',
      earnings: '$18.75',
      status: 'completed',
      rating: 4,
      customer: 'Mike Chen',
    },
    {
      id: '#D2024003',
      date: 'Yesterday, 4:45 PM',
      type: 'Express',
      from: '456 Rue Saint-Denis',
      to: '987 Avenue Mont-Royal',
      distance: '15.2 km',
      duration: '52 min',
      earnings: '$28.90',
      status: 'completed',
      rating: 5,
      customer: 'Emma Wilson',
    },
    {
      id: '#D2024004',
      date: 'Yesterday, 1:20 PM',
      type: 'Moving',
      from: '654 Rue de la Montagne',
      to: '123 Boulevard Saint-Laurent',
      distance: '6.8 km',
      duration: '1h 15min',
      earnings: '$45.00',
      status: 'completed',
      rating: 5,
      customer: 'David Brown',
    },
    {
      id: '#D2024005',
      date: 'Dec 1, 3:10 PM',
      type: 'Standard',
      from: '789 Rue Crescent',
      to: '456 Avenue McGill College',
      distance: '4.2 km',
      duration: '28 min',
      earnings: '$15.25',
      status: 'cancelled',
      rating: null,
      customer: 'Lisa Garcia',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'in_progress':
        return '#F59E0B';
      default:
        return Colors.textSecondary;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Express':
        return '#EF4444';
      case 'Standard':
        return '#3B82F6';
      case 'Moving':
        return '#8B5CF6';
      default:
        return Colors.primary;
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <Text style={styles.noRating}>N/A</Text>;
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            type="Feather"
            size={12}
            color={star <= rating ? '#F59E0B' : '#E5E7EB'}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery History</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Icon name="filter" type="Feather" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>127</Text>
              <Text style={styles.statLabel}>Total Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* Deliveries List */}
        <View style={styles.deliveriesSection}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          <View style={styles.deliveriesList}>
            {deliveries.map((delivery) => (
              <TouchableOpacity key={delivery.id} style={styles.deliveryItem}>
                <View style={styles.deliveryHeader}>
                  <View style={styles.deliveryId}>
                    <Text style={styles.deliveryIdText}>{delivery.id}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(delivery.type) + '20' }]}>
                      <Text style={[styles.typeBadgeText, { color: getTypeColor(delivery.type) }]}>
                        {delivery.type}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.deliveryMeta}>
                    <Text style={styles.deliveryDate}>{delivery.date}</Text>
                    <View style={styles.deliveryStatus}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(delivery.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(delivery.status) }]}>
                        {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.deliveryRoute}>
                  <View style={styles.routePoint}>
                    <View style={styles.fromDot} />
                    <Text style={styles.routeAddress} numberOfLines={1}>{delivery.from}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}>
                    <View style={styles.toDot} />
                    <Text style={styles.routeAddress} numberOfLines={1}>{delivery.to}</Text>
                  </View>
                </View>

                <View style={styles.deliveryDetails}>
                  <View style={styles.deliveryStats}>
                    <View style={styles.statItem}>
                      <Icon name="navigation" type="Feather" size={14} color={Colors.textSecondary} />
                      <Text style={styles.statText}>{delivery.distance}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Icon name="clock" type="Feather" size={14} color={Colors.textSecondary} />
                      <Text style={styles.statText}>{delivery.duration}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Icon name="user" type="Feather" size={14} color={Colors.textSecondary} />
                      <Text style={styles.statText}>{delivery.customer}</Text>
                    </View>
                  </View>
                  <View style={styles.deliveryEarnings}>
                    <Text style={styles.earningsAmount}>{delivery.earnings}</Text>
                    {renderStars(delivery.rating)}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Filter Deliveries</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.id && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter === filter.id && styles.filterOptionTextActive
                  ]}>
                    {filter.label}
                  </Text>
                  {selectedFilter === filter.id && (
                    <Icon name="check" type="Feather" size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
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
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  deliveriesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  deliveriesList: {
    gap: 12,
  },
  deliveryItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deliveryMeta: {
    alignItems: 'flex-end',
  },
  deliveryDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deliveryRoute: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fromDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  toDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  deliveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  deliveryStats: {
    flex: 1,
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deliveryEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  noRating: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalCancelText: {
    fontSize: 17,
    color: Colors.textSecondary,
  },
  modalDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
  filterOptions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary + '05',
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default DeliveryHistoryScreen;