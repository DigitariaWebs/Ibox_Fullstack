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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { Icon } from '../ui/Icon';
import api from '../services/api';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface EarningsData {
  totalEarnings: number;
  deliveryCount: number;
  avgEarningsPerDelivery: number;
  period: string;
  breakdown: {
    baseEarnings: number;
    tips: number;
    bonuses: number;
    surgeEarnings: number;
  };
  dailyEarnings: Array<{
    date: string;
    amount: number;
    deliveries: number;
  }>;
  weeklyStats: {
    thisWeek: number;
    lastWeek: number;
    percentChange: number;
  };
}

interface EarningsBreakdown {
  period: string;
  totalAmount: number;
  deliveries: number;
  hours: number;
  avgPerHour: number;
  avgPerDelivery: number;
  breakdown: {
    base: number;
    tips: number;
    bonuses: number;
    surge: number;
  };
}

const EarningsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      loadEarningsData();
    }, [selectedPeriod])
  );

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      console.log('💰 Loading earnings data...');
      
      const [earningsResponse, breakdownResponse] = await Promise.all([
        api.get(`/driver/earnings?period=${selectedPeriod}`),
        api.get(`/driver/earnings/breakdown?period=${selectedPeriod}`)
      ]);

      if (earningsResponse?.success && earningsResponse?.data) {
        setEarningsData(earningsResponse.data);
        console.log('✅ Earnings data loaded:', earningsResponse.data);
      }

      if (breakdownResponse?.success && breakdownResponse?.data) {
        setBreakdown(breakdownResponse.data);
        console.log('✅ Earnings breakdown loaded:', breakdownResponse.data);
      }
    } catch (error) {
      console.error('❌ Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  }, [selectedPeriod]);

  const handlePeriodChange = async (period: 'week' | 'month' | 'year') => {
    if (period !== selectedPeriod) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedPeriod(period);
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return `$${Number(amount).toFixed(2)}`;
  };

  const formatPercentChange = (change?: number | null) => {
    if (change === null || change === undefined || isNaN(change)) {
      return '+0.0%';
    }
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Number(change).toFixed(1)}%`;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'year'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => handlePeriodChange(period as 'week' | 'month' | 'year')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEarningsCard = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={styles.earningsCard}
    >
      <View style={styles.earningsHeader}>
        <View>
          <Text style={styles.earningsTitle}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>
            {earningsData ? formatCurrency(earningsData.totalEarnings || 0) : '$0.00'}
          </Text>
          <Text style={styles.earningsPeriod}>
            This {selectedPeriod} • {earningsData?.deliveryCount || 0} deliveries
          </Text>
        </View>
        <View style={styles.earningsIcon}>
          <Feather name="dollar-sign" size={32} color={Colors.primary} />
        </View>
      </View>
      
      {earningsData?.weeklyStats && earningsData.weeklyStats.percentChange !== undefined && (
        <View style={styles.earningsChange}>
          <Feather 
            name={(earningsData.weeklyStats.percentChange || 0) >= 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={(earningsData.weeklyStats.percentChange || 0) >= 0 ? "#10B981" : "#EF4444"} 
          />
          <Text style={[
            styles.earningsChangeText,
            { color: (earningsData.weeklyStats.percentChange || 0) >= 0 ? "#10B981" : "#EF4444" }
          ]}>
            {formatPercentChange(earningsData.weeklyStats.percentChange)} from last {selectedPeriod}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderStatsGrid = () => (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={styles.statsContainer}
    >
      <Text style={styles.sectionTitle}>
        Performance <Text style={styles.sectionTitleHighlight}>Metrics</Text>
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
            <Feather name="truck" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>
            {earningsData ? formatCurrency(earningsData.avgEarningsPerDelivery || 0) : '$0.00'}
          </Text>
          <Text style={styles.statLabel}>Per Delivery</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
            <Feather name="clock" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>
            {breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown) ? formatCurrency(breakdown.avgPerHour) : '$0.00'}
          </Text>
          <Text style={styles.statLabel}>Per Hour</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
            <Feather name="gift" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>
            {earningsData && earningsData.breakdown ? formatCurrency(earningsData.breakdown.tips) : '$0.00'}
          </Text>
          <Text style={styles.statLabel}>Tips</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderBreakdownCard = () => (
    <Animated.View
      entering={FadeInDown.delay(300)}
      style={styles.breakdownCard}
    >
      <Text style={styles.cardTitle}>Earnings Breakdown</Text>
      
      {breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown) && breakdown.breakdown ? (
        <View style={styles.breakdownItems}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.breakdownLabel}>Base Earnings</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(breakdown.breakdown.base)}
            </Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.breakdownLabel}>Tips</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(breakdown.breakdown.tips)}
            </Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.breakdownLabel}>Bonuses</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(breakdown.breakdown.bonuses)}
            </Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.breakdownLabel}>Surge Premium</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(breakdown.breakdown.surge)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.breakdownItems}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.breakdownLabel}>Base Earnings</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(0)}
            </Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.breakdownLabel}>Tips</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(0)}
            </Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.breakdownLabel}>Bonuses</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(0)}
            </Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.breakdownLabel}>Surge Premium</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(0)}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

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
            <Text style={styles.headerTitle}>Your</Text>
            <Text style={styles.headerTitleHighlight}>Earnings</Text>
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={containerStyle}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading earnings...</Text>
            </View>
          )}
          
          {renderPeriodSelector()}
          {renderEarningsCard()}
          {renderStatsGrid()}
          {renderBreakdownCard()}
        </Animated.View>
      </ScrollView>
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
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: 'white',
  },
  earningsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  earningsTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 36,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  earningsPeriod: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textTertiary,
  },
  earningsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  earningsChangeText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    marginLeft: 8,
  },
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  breakdownItems: {
    gap: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  breakdownLabel: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
  },
  breakdownAmount: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
  },
});

export default EarningsScreen;
