import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

interface EarningsHistoryScreenProps {
  navigation: any;
}

const EarningsHistoryScreen: React.FC<EarningsHistoryScreenProps> = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  const weeklyEarnings = [
    { date: 'Today', amount: '$156', trips: 12, hours: '7.5h', status: 'completed' },
    { date: 'Yesterday', amount: '$142', trips: 9, hours: '6.2h', status: 'completed' },
    { date: 'Dec 1', amount: '$189', trips: 14, hours: '8.1h', status: 'completed' },
    { date: 'Nov 30', amount: '$98', trips: 6, hours: '4.5h', status: 'completed' },
    { date: 'Nov 29', amount: '$175', trips: 13, hours: '7.8h', status: 'completed' },
    { date: 'Nov 28', amount: '$210', trips: 16, hours: '9.2h', status: 'completed' },
    { date: 'Nov 27', amount: '$85', trips: 5, hours: '3.8h', status: 'completed' },
  ];

  const summary = {
    totalEarnings: '$1,055',
    totalTrips: 75,
    totalHours: '47.1h',
    avgPerTrip: '$14.07',
    avgPerHour: '$22.40',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Icon name="dollar-sign" type="Feather" size={20} color="#10B981" />
              <Text style={styles.summaryValue}>{summary.totalEarnings}</Text>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="truck" type="Feather" size={20} color="#3B82F6" />
              <Text style={styles.summaryValue}>{summary.totalTrips}</Text>
              <Text style={styles.summaryLabel}>Total Trips</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Icon name="clock" type="Feather" size={20} color="#F59E0B" />
              <Text style={styles.summaryValue}>{summary.totalHours}</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="trending-up" type="Feather" size={20} color="#8B5CF6" />
              <Text style={styles.summaryValue}>{summary.avgPerHour}</Text>
              <Text style={styles.summaryLabel}>Avg per Hour</Text>
            </View>
          </View>
        </View>

        {/* Earnings List */}
        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          <View style={styles.earningsList}>
            {weeklyEarnings.map((earning, index) => (
              <View key={index} style={styles.earningItem}>
                <View style={styles.earningLeft}>
                  <Text style={styles.earningDate}>{earning.date}</Text>
                  <View style={styles.earningStats}>
                    <Text style={styles.earningTrips}>{earning.trips} trips</Text>
                    <Text style={styles.earningHours}>• {earning.hours}</Text>
                  </View>
                </View>
                <View style={styles.earningRight}>
                  <Text style={styles.earningAmount}>{earning.amount}</Text>
                  <View style={styles.earningStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Paid</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Icon name="credit-card" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.paymentTitle}>Payment Method</Text>
            </View>
            <Text style={styles.paymentDetails}>Bank Transfer • •••• 4582</Text>
            <Text style={styles.paymentSchedule}>Next payout: Friday, Dec 8</Text>
            <TouchableOpacity style={styles.paymentButton}>
              <Text style={styles.paymentButtonText}>Update Payment Info</Text>
              <Icon name="chevron-right" type="Feather" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  headerSpacer: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.white,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  earningsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  earningsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  earningLeft: {
    flex: 1,
  },
  earningDate: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  earningStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningTrips: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  earningHours: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  earningRight: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  earningStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  paymentSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  paymentSchedule: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});

export default EarningsHistoryScreen;