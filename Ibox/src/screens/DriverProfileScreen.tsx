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
  Switch,
  ImageBackground,
  Dimensions,
  Platform,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface DriverProfileScreenProps {
  navigation: any;
}

const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ navigation }) => {
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  const [instantBooking, setInstantBooking] = useState(true);
  const [weekendAvailability, setWeekendAvailability] = useState(false);
  const [nightDeliveries, setNightDeliveries] = useState(false);
  
  // Get auth functions
  const { logout } = useAuth();

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

  const todayStats = [
    { label: 'Today\'s Deliveries', value: '12', icon: 'truck', color: '#0AA5A8', change: '+3' },
    { label: 'Earnings Today', value: '$156', icon: 'dollar-sign', color: '#10B981', change: '+$45' },
    { label: 'Hours Online', value: '7.5h', icon: 'clock', color: '#F59E0B', change: '+2h' },
  ];

  const weeklyOverview = [
    { day: 'Mon', earnings: 120, deliveries: 8 },
    { day: 'Tue', earnings: 156, deliveries: 12 },
    { day: 'Wed', earnings: 98, deliveries: 6 },
    { day: 'Thu', earnings: 142, deliveries: 9 },
    { day: 'Fri', earnings: 189, deliveries: 14 },
    { day: 'Sat', earnings: 210, deliveries: 16 },
    { day: 'Sun', earnings: 85, deliveries: 5 },
  ];

  const quickActions = [
    {
      id: 'earnings',
      title: 'View Earnings',
      icon: 'trending-up',
      color: '#10B981',
      action: () => navigation.navigate('EarningsHistory'),
    },
    {
      id: 'delivery-history',
      title: 'Delivery History',
      icon: 'clock',
      color: '#F97316',
      action: () => navigation.navigate('DeliveryHistory'),
    },
    {
      id: 'vehicle',
      title: 'Vehicle Info',
      icon: 'truck',
      color: '#3B82F6',
      action: () => navigation.navigate('VehicleInfo'),
    },
    {
      id: 'routes',
      title: 'My Routes',
      icon: 'navigation',
      color: '#F59E0B',
      action: () => navigation.navigate('PreferredRoutes'),
    },
    {
      id: 'support',
      title: 'Get Help',
      icon: 'headphones',
      color: '#8B5CF6',
      action: () => navigation.navigate('DriverSupport'),
    },
  ];

  const driverInfo = {
    name: 'Marcus Williams',
    email: 'marcus.driver@ibox.com',
    phone: '+1 (514) 555-9876',
    rating: 4.9,
    totalDeliveries: 1287,
    yearsActive: 3,
    vehicle: 'Mercedes Sprinter 2021',
    plateNumber: 'MTL-4582',
  };

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
              console.log('🔄 Starting driver logout process...');
              await logout();
              console.log('✅ Driver logged out successfully from profile dashboard');
              // Navigation will be handled automatically by App.tsx based on auth state change
            } catch (error) {
              console.error('❌ Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const WeeklyChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>This Week's Performance</Text>
      <View style={styles.chartBars}>
        {weeklyOverview.map((data, index) => {
          const maxEarnings = Math.max(...weeklyOverview.map(d => d.earnings));
          const height = (data.earnings / maxEarnings) * 60;
          return (
            <View key={`chart-${index}`} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height, backgroundColor: '#0AA5A8' }]} />
              </View>
              <Text style={styles.barLabel}>{data.day}</Text>
              <Text style={styles.barValue}>${data.earnings}</Text>
              <Text style={styles.barDeliveries}>{data.deliveries} trips</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" translucent={false} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Driver Profile Header with embedded header */}
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header inside hero section */}
          <View style={styles.embeddedHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="chevron-left" type="Feather" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.driverCard}>
            <View style={styles.driverLeft}>
              <View style={styles.driverImageContainer}>
                <ImageBackground
                  source={{ uri: 'https://i.pravatar.cc/150?img=8' }}
                  style={styles.driverImage}
                  imageStyle={styles.driverImageStyle}
                />
                {availabilityEnabled && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverInfo.name}</Text>
                <Text style={styles.driverEmail}>{driverInfo.email}</Text>
                <View style={styles.ratingContainer}>
                  <Icon name="star" type="Feather" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>{driverInfo.rating}</Text>
                  <Text style={styles.deliveriesText}>• {driverInfo.totalDeliveries} deliveries</Text>
                </View>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, availabilityEnabled ? styles.onlineBadge : styles.offlineBadge]}>
                <Text style={[styles.statusText, availabilityEnabled ? styles.onlineText : styles.offlineText]}>
                  {availabilityEnabled ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Availability Toggle */}
          <View style={styles.availabilityToggle}>
            <Text style={styles.toggleLabel}>Available for deliveries</Text>
            <Switch
              value={availabilityEnabled}
              onValueChange={setAvailabilityEnabled}
              trackColor={{ false: '#64748B', true: '#10B981' }}
              thumbColor={Colors.white}
              style={styles.switch}
            />
          </View>
        </Animated.View>

        {/* Today's Stats */}
        <Animated.View
          style={[
            styles.todayStats,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.statsGrid}>
            {todayStats.map((stat, index) => (
              <View key={`stat-${index}`} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                    <Icon name={stat.icon as any} type="Feather" size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statChange}>{stat.change}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Weekly Chart */}
        <Animated.View
          style={[
            styles.chartSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <WeeklyChart />
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View
          style={[
            styles.quickActionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={`action-${index}`}
                style={styles.actionCard}
                onPress={action.action}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Icon name={action.icon as any} type="Feather" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Vehicle Info Card */}
        <Animated.View
          style={[
            styles.vehicleSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Icon name="truck" type="Feather" size={24} color="#0AA5A8" />
              <Text style={styles.vehicleTitle}>Vehicle Information</Text>
            </View>
            <View style={styles.vehicleDetails}>
              <View style={styles.vehicleRow}>
                <Text style={styles.vehicleLabel}>Model:</Text>
                <Text style={styles.vehicleValue}>{driverInfo.vehicle}</Text>
              </View>
              <View style={styles.vehicleRow}>
                <Text style={styles.vehicleLabel}>Plate:</Text>
                <Text style={styles.vehicleValue}>{driverInfo.plateNumber}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.vehicleButton} onPress={() => navigation.navigate('VehicleInfo')}>
              <Text style={styles.vehicleButtonText}>Manage Vehicle</Text>
              <Icon name="chevron-right" type="Feather" size={16} color="#0AA5A8" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Settings Shortcuts */}
        <Animated.View
          style={[
            styles.settingsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="zap" type="Feather" size={20} color="#F59E0B" />
                <Text style={styles.settingTitle}>Instant Booking</Text>
              </View>
              <Switch
                value={instantBooking}
                onValueChange={setInstantBooking}
                trackColor={{ false: '#E2E8F0', true: '#0AA5A8' }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="calendar" type="Feather" size={20} color="#3B82F6" />
                <Text style={styles.settingTitle}>Weekend Availability</Text>
              </View>
              <Switch
                value={weekendAvailability}
                onValueChange={setWeekendAvailability}
                trackColor={{ false: '#E2E8F0', true: '#0AA5A8' }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="moon" type="Feather" size={20} color="#8B5CF6" />
                <Text style={styles.settingTitle}>Night Deliveries</Text>
              </View>
              <Switch
                value={nightDeliveries}
                onValueChange={setNightDeliveries}
                trackColor={{ false: '#E2E8F0', true: '#0AA5A8' }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </Animated.View>

        {/* Settings Button */}
        <Animated.View
          style={[
            styles.settingsButtonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity style={styles.settingsMainButton} onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings" type="Feather" size={20} color={Colors.textSecondary} />
            <Text style={styles.settingsButtonText}>Settings</Text>
            <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          style={[
            styles.logoutSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Icon name="log-out" type="Feather" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  embeddedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  profileHeader: {
    backgroundColor: '#1E293B',
    paddingBottom: 30,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  driverLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  driverImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  driverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverImageStyle: {
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  deliveriesText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  onlineBadge: {
    backgroundColor: '#10B981',
  },
  offlineBadge: {
    backgroundColor: '#64748B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  onlineText: {
    color: '#FFFFFF',
  },
  offlineText: {
    color: '#FFFFFF',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  switch: {
    transform: [{ scale: 1.1 }],
  },
  todayStats: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 60,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  barDeliveries: {
    fontSize: 10,
    color: '#94A3B8',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
  vehicleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  vehicleDetails: {
    marginBottom: 16,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  vehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0AA5A8' + '10',
    borderRadius: 8,
    padding: 12,
  },
  vehicleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0AA5A8',
    marginRight: 4,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 12,
  },
  settingsButtonSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  settingsMainButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
});

export default DriverProfileScreen;