import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '../ui';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RootState, 
  AppDispatch,
  fetchDriverVerificationStatus,
  fetchDriverStats,
  fetchDeliveryRequests,
  fetchNotifications,
  toggleDriverOnlineStatus,
  acceptDeliveryRequest,
} from '../store/store';
import api from '../services/api';
import socketService from '../services/socketService';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface DriverVerificationStatus {
  isVerified: boolean;
  verificationStep: number;
  completedSteps: {
    profilePhoto: boolean;
    driverLicense: boolean;
    vehiclePhotos: boolean;
    vehiclePlate: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
  };
  pendingReview: boolean;
  submissionStatus: {
    profilePhoto: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    phoneVerified: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    driverLicense: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    vehiclePhotos: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    vehiclePlate: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    insurance: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    backgroundCheck: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
  };
}

interface DeliveryRequest {
  id: string;
  customerName: string;
  serviceType: 'Express' | 'Standard' | 'Moving' | 'Food';
  pickupAddress: string;
  deliveryAddress: string;
  distance: string;
  estimatedTime: string;
  price: number;
  weight?: string;
  description: string;
  urgency: 'high' | 'normal' | 'low';
  createdAt: Date;
  expiresIn: number; // seconds
}

const ModernDriverHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, getCurrentUser } = useAuth();
  
  // Redux state
  const {
    isOnline,
    verificationStatus,
    todayStats,
    deliveryRequests,
    notificationCount,
    loading,
  } = useSelector((state: RootState) => state.driver);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const onlineButtonScale = useSharedValue(1);
  const pulseAnim = useSharedValue(0);
  const isLoadingRef = useRef(false);
  const isRefreshingRef = useRef(false);

  // Initial animation effect (runs once)
  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  // Online status animation effect
  useEffect(() => {
    if (isOnline) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 300 });
    }
  }, [isOnline]);

  // Initial data loading effect (runs once on focus)
  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      // Clear any cached verification status to ensure fresh data
      dispatch({ type: 'driver/resetDriverState' });
      loadDriverData();
    }, [loadUserProfile, dispatch])
  );

  // Load deliveries when verification status or online status changes
  useEffect(() => {
    if (isOnline && verificationStatus?.isVerified) {
      dispatch(fetchDeliveryRequests());
    }
  }, [isOnline, verificationStatus?.isVerified, dispatch]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    const handleVerificationUpdate = (data: any) => {
      console.log('📋 Real-time verification update received in home screen:', data);
      
      // Force refresh verification status to get latest data
      dispatch(fetchDriverVerificationStatus(true));
      
      // Show success animation for approved steps
      if (data.status === 'approved') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    // Listen for verification status updates
    socketService.on('verification_status_updated', handleVerificationUpdate);

    // Cleanup on unmount
    return () => {
      socketService.off('verification_status_updated', handleVerificationUpdate);
    };
  }, [dispatch]);

  // Debug log when verification status changes and refresh profile photo
  useEffect(() => {
    if (verificationStatus) {
      console.log('📊 Verification Status Updated:', {
        driverLicense: verificationStatus.submissionStatus?.driverLicense?.status,
        profilePhoto: verificationStatus.submissionStatus?.profilePhoto?.status,
        phoneVerified: verificationStatus.submissionStatus?.phoneVerified?.status,
        overallVerified: verificationStatus.isVerified
      });
      
      // Refresh profile photo when verification status changes
      loadUserProfile();
    }
  }, [verificationStatus, loadUserProfile]);

  const loadUserProfile = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Use actual profile photo from backend, with fallback to verification profile photo
        const profilePic = currentUser.profilePicture || 
                          verificationStatus?.documents?.profilePhoto || 
                          null;
        setProfilePhoto(profilePic);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [getCurrentUser, verificationStatus]);

  const loadDriverData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      // Dispatch all Redux actions in parallel to load data
      // Force refresh verification status to get latest admin decisions
      await Promise.all([
        dispatch(fetchDriverVerificationStatus(true)), // Force refresh to bypass cache
        dispatch(fetchDriverStats()),
        dispatch(fetchNotifications()),
        isOnline && verificationStatus?.isVerified ? 
          dispatch(fetchDeliveryRequests()) : 
          Promise.resolve()
      ]);
    } finally {
      isLoadingRef.current = false;
    }
  }, [dispatch, isOnline, verificationStatus?.isVerified]);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    try {
      await loadDriverData();
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [loadDriverData]);

  const toggleOnlineStatus = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(toggleDriverOnlineStatus(!isOnline));
  }, [dispatch, isOnline]);

  const handleAcceptDelivery = useCallback(async (request: DeliveryRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
    Alert.alert(
      'Accept Delivery',
      `Accept delivery to ${request.deliveryAddress}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            dispatch(acceptDeliveryRequest(request.id));
            // Navigate to driver mode (for demo purposes)
            navigation.navigate('DriverModeScreen', { order: request });
          },
        },
      ]
    );
  }, [dispatch, navigation]);

  const renderVerificationFlow = () => {
    // Handle null verificationStatus
    if (!verificationStatus) {
      return (
        <View style={styles.verificationContainer}>
          <View style={styles.premiumVerificationCard}>
            <View style={styles.loadingContainer}>
              <View style={styles.loadingIconContainer}>
                <Icon name="shield" type="Feather" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.loadingText}>Loading verification status...</Text>
              <Text style={styles.loadingSubtext}>Please wait while we check your progress</Text>
            </View>
          </View>
        </View>
      );
    }

    const steps = [
      {
        id: 'profilePhoto',
        title: 'Profile Photo',
        description: 'Professional headshot',
        details: 'Clear, recent photo with good lighting',
        icon: 'camera',
        color: '#3B82F6',
        gradient: ['#3B82F6', '#1D4ED8'],
        requirement: 'Required',
        estimatedTime: '2 min',
        completed: verificationStatus.submissionStatus?.profilePhoto?.status === 'approved',
        status: verificationStatus.submissionStatus?.profilePhoto?.status || 'pending',
      },
      {
        id: 'phoneVerified',
        title: 'Phone Verification',
        description: 'SMS verification',
        details: 'Verify your phone number with SMS code',
        icon: 'smartphone',
        color: '#10B981',
        gradient: ['#10B981', '#047857'],
        requirement: 'Required',
        estimatedTime: '2 min',
        completed: verificationStatus.submissionStatus?.phoneVerified?.status === 'approved',
        status: verificationStatus.submissionStatus?.phoneVerified?.status || 'pending',
      },
      {
        id: 'driverLicense',
        title: 'Driver License',
        description: 'Valid license photos',
        details: 'Both front and back clearly visible',
        icon: 'credit-card',
        color: '#6366F1',
        gradient: ['#6366F1', '#4F46E5'],
        requirement: 'Required',
        estimatedTime: '3 min',
        completed: verificationStatus.submissionStatus?.driverLicense?.status === 'approved',
        status: verificationStatus.submissionStatus?.driverLicense?.status || 'pending',
      },
      {
        id: 'vehiclePhotos',
        title: 'Vehicle Photos',
        description: 'All angle views',
        details: 'Front, back, sides, and interior shots',
        icon: 'truck',
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#7C3AED'],
        requirement: 'Required',
        estimatedTime: '5 min',
        completed: verificationStatus.submissionStatus?.vehiclePhotos?.status === 'approved',
        status: verificationStatus.submissionStatus?.vehiclePhotos?.status || 'pending',
      },
      {
        id: 'vehiclePlate',
        title: 'License Plate',
        description: 'Clear plate photo',
        details: 'Numbers and letters clearly readable',
        icon: 'hash',
        color: '#F59E0B',
        gradient: ['#F59E0B', '#D97706'],
        requirement: 'Required',
        estimatedTime: '1 min',
        completed: verificationStatus.submissionStatus?.vehiclePlate?.status === 'approved',
        status: verificationStatus.submissionStatus?.vehiclePlate?.status || 'pending',
      },
      {
        id: 'insurance',
        title: 'Insurance Docs',
        description: 'Valid coverage proof',
        details: 'Current insurance certificate or card',
        icon: 'shield',
        color: '#EF4444',
        gradient: ['#EF4444', '#DC2626'],
        requirement: 'Required',
        estimatedTime: '3 min',
        completed: verificationStatus.submissionStatus?.insurance?.status === 'approved',
        status: verificationStatus.submissionStatus?.insurance?.status || 'pending',
      },
      {
        id: 'backgroundCheck',
        title: 'Background Check',
        description: 'Identity verification',
        details: 'Automated security screening',
        icon: 'check-circle',
        color: '#06B6D4',
        gradient: ['#06B6D4', '#0891B2'],
        requirement: 'Automatic',
        estimatedTime: '24 hrs',
        completed: verificationStatus.submissionStatus?.backgroundCheck?.status === 'approved',
        status: verificationStatus.submissionStatus?.backgroundCheck?.status || 'pending',
      },
    ];

    const completedCount = Object.values(verificationStatus.completedSteps || {}).filter(Boolean).length;
    const progress = completedCount / steps.length;

    return (
      <Animated.View 
        entering={FadeInDown.springify()}
        style={styles.verificationContainer}
      >
        {/* Premium Header Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.premiumVerificationCard}
        >
          <View style={styles.verificationHeaderContent}>
            <View style={styles.verificationIconContainer}>
              <LinearGradient
                colors={progress === 1 ? ['#10B981', '#047857'] : ['#667eea', '#764ba2']}
                style={styles.verificationIconGradient}
              >
                <Icon 
                  name={progress === 1 ? 'shield-check' : 'shield'} 
                  type="Feather" 
                  size={28} 
                  color={Colors.white} 
                />
              </LinearGradient>
            </View>
            <View style={styles.verificationTextContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.verificationPreTitle}>
                  {progress === 1 ? 'Verification' : 'Complete your'}
                </Text>
                <Text style={styles.verificationTitleEmphasis}>
                  {progress === 1 ? 'complete!' : 'verification'}
                </Text>
              </View>
              <Text style={styles.verificationProgress}>
                {Math.round(progress * 100)}% complete • {
                  progress === 1 ? 'All steps completed' : `${6 - completedCount} steps remaining`
                }
              </Text>
            </View>
            
            {progress === 1 && (
              <View style={styles.celebrationIcon}>
                <Icon name="award" type="Feather" size={24} color="#10B981" />
              </View>
            )}
          </View>
          
          {/* Enhanced Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { 
                    width: `${progress * 100}%`,
                    backgroundColor: progress === 1 ? '#10B981' : Colors.primary,
                  },
                ]}
              />
              <View style={styles.progressSteps}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressStep,
                      index < completedCount && styles.progressStepCompleted,
                      index === completedCount && !steps[index].completed && styles.progressStepActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Steps List */}
        <View style={styles.premiumStepsContainer}>
          {steps.map((step, index) => (
            <Animated.View
              key={step.id}
              entering={SlideInLeft.delay(200 + index * 100).springify()}
              style={styles.premiumStepCard}
            >
              <TouchableOpacity
                style={[
                  styles.stepCardPremium,
                  step.completed && styles.stepCardPremiumCompleted,
                ]}
                onPress={() => {
                  if (step.status !== 'approved') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    
                    // Handle phone verification separately
                    if (step.id === 'phoneVerified') {
                      navigation.navigate('PhoneVerification', { 
                        phoneNumber: user?.phone 
                      });
                    } else {
                      navigation.navigate('DriverVerification', { step: step.id });
                    }
                  }
                }}
                disabled={step.status === 'approved'}
                activeOpacity={0.7}
              >
                {/* Step Number */}
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>

                {/* Step Icon */}
                <View style={[
                  styles.premiumStepIcon,
                  { 
                    backgroundColor: step.status === 'approved' ? '#10B981' : 
                                   step.status === 'rejected' ? '#EF4444' : 
                                   `${step.color}15` 
                  }
                ]}>
                  {step.status === 'approved' ? (
                    <Icon name="check" type="Feather" size={24} color={Colors.white} />
                  ) : step.status === 'rejected' ? (
                    <Icon name="x" type="Feather" size={24} color={Colors.white} />
                  ) : (
                    <LinearGradient
                      colors={step.gradient}
                      style={styles.stepIconGradient}
                    >
                      <Icon name={step.icon} type="Feather" size={20} color={Colors.white} />
                    </LinearGradient>
                  )}
                </View>

                {/* Step Content */}
                <View style={styles.premiumStepContent}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepTitleContainer}>
                      <Text style={[
                        styles.premiumStepTitle,
                        step.status === 'approved' && styles.premiumStepTitleCompleted,
                        step.status === 'rejected' && styles.premiumStepTitleRejected
                      ]}>
                        {step.title}
                      </Text>
                      <View style={[
                        styles.requirementBadge,
                        { 
                          backgroundColor: step.requirement === 'Automatic' ? '#F3F4F6' : `${step.color}15`,
                        }
                      ]}>
                        <Text style={[
                          styles.requirementText,
                          { color: step.requirement === 'Automatic' ? '#6B7280' : step.color }
                        ]}>
                          {step.requirement}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.stepMeta}>
                      <Icon name="clock" type="Feather" size={12} color={Colors.textTertiary} />
                      <Text style={styles.estimatedTime}>{step.estimatedTime}</Text>
                    </View>
                  </View>

                  <Text style={[
                    styles.premiumStepDescription,
                    step.status === 'approved' && styles.premiumStepDescriptionCompleted,
                    step.status === 'rejected' && styles.premiumStepDescriptionRejected
                  ]}>
                    {step.status === 'rejected' ? 'Please resubmit with corrections' : step.description}
                  </Text>
                  
                  <Text style={styles.stepDetails}>
                    {step.details}
                  </Text>

                  {/* Status Indicator */}
                  <View style={styles.stepStatus}>
                    {step.completed ? (
                      <View style={styles.completedStatus}>
                        <Icon name="check-circle" type="Feather" size={14} color="#10B981" />
                        <Text style={styles.completedText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingStatus}>
                        <Icon name="arrow-right" type="Feather" size={14} color={step.color} />
                        <Text style={[styles.pendingText, { color: step.color }]}>Tap to start</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Call to Action */}
        {progress < 1 && (
          <Animated.View
            entering={FadeInDown.delay(1000).springify()}
            style={styles.ctaContainer}
          >
            <View style={styles.ctaCard}>
              <Icon name="info" type="Feather" size={20} color={Colors.primary} />
              <View style={styles.ctaContent}>
                <Text style={styles.ctaTitle}>Get verified faster</Text>
                <Text style={styles.ctaDescription}>
                  Complete all steps to start receiving delivery requests
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderDeliveryRequest = (request: DeliveryRequest, index: number) => {
    const urgencyColors = {
      high: '#EF4444',
      normal: '#F59E0B',
      low: '#10B981',
    };

    const serviceIcons = {
      Express: 'zap',
      Standard: 'package',
      Moving: 'truck',
      Food: 'coffee',
    };

    return (
      <Animated.View
        key={request.id}
        entering={SlideInRight.delay(index * 100).springify()}
        style={styles.deliveryCard}
      >
        <TouchableOpacity
          onPress={() => handleAcceptDelivery(request)}
          activeOpacity={0.9}
        >
          {/* Clean Delivery Card Design */}
          <View style={styles.deliveryCardContent}>
            {/* Header with Service Type */}
            <View style={styles.deliveryHeader}>
              <View style={styles.serviceTypeContainer}>
                <View style={[
                  styles.serviceIcon,
                  { backgroundColor: `${urgencyColors[request.urgency]}15` }
                ]}>
                  <Icon
                    name={serviceIcons[request.serviceType]}
                    type="Feather"
                    size={18}
                    color={urgencyColors[request.urgency]}
                  />
                </View>
                <View>
                  <Text style={styles.serviceTypeText}>{request.serviceType}</Text>
                  <Text style={styles.customerNameText}>{request.customerName}</Text>
                </View>
              </View>
              
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>${(request.price || 0).toFixed(2)}</Text>
                <Text style={[
                  styles.urgencyLabel,
                  { color: urgencyColors[request.urgency] }
                ]}>
                  {request.urgency === 'high' ? 'Urgent' : request.urgency}
                </Text>
              </View>
            </View>

            {/* Clean Route Display */}
            <View style={styles.routeSection}>
              <View style={styles.routeRow}>
                <View style={styles.routeIndicator}>
                  <View style={styles.routeDotOuter}>
                    <View style={styles.routeDotInner} />
                  </View>
                </View>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Pickup</Text>
                  <Text style={styles.addressText}>{request.pickupAddress}</Text>
                </View>
              </View>
              
              <View style={styles.routeConnector} />
              
              <View style={styles.routeRow}>
                <View style={styles.routeIndicator}>
                  <View style={[styles.routeDotOuter, styles.destinationDot]}>
                    <View style={styles.routeDotInnerDest} />
                  </View>
                </View>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Delivery</Text>
                  <Text style={styles.addressText}>{request.deliveryAddress}</Text>
                </View>
              </View>
            </View>

            {/* Info Pills */}
            <View style={styles.infoPillsContainer}>
              <View style={styles.infoPill}>
                <Icon name="navigation" type="Feather" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoPillText}>{request.distance}</Text>
              </View>
              <View style={styles.infoPill}>
                <Icon name="clock" type="Feather" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoPillText}>{request.estimatedTime}</Text>
              </View>
              {request.weight && (
                <View style={styles.infoPill}>
                  <Icon name="package" type="Feather" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoPillText}>{request.weight}</Text>
                </View>
              )}
            </View>

            {/* Accept Button */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptDelivery(request)}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Accept Delivery</Text>
              <Icon name="arrow-right" type="Feather" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAvailableDeliveries = () => {
    if (!isOnline) {
      return (
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.offlineContainer}
        >
          <View style={styles.offlineCard}>
            <Icon name="wifi-off" type="Feather" size={40} color={Colors.textSecondary} />
            <Text style={styles.offlineTitle}>You're currently</Text>
            <Text style={styles.offlineTitleEmphasis}>offline</Text>
            <Text style={styles.offlineDescription}>
              Go online to start receiving delivery requests
            </Text>
          </View>
        </Animated.View>
      );
    }

    if (deliveryRequests.length === 0) {
      return (
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.emptyContainer}
        >
          <View style={styles.emptyCard}>
            <Icon name="package" type="Feather" size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No deliveries</Text>
            <Text style={styles.emptyTitleEmphasis}>available</Text>
            <Text style={styles.emptyDescription}>
              New requests will appear here
            </Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <View style={styles.deliveriesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available</Text>
          <Text style={styles.sectionTitleEmphasis}>deliveries</Text>
        </View>
        {deliveryRequests.map((request, index) => renderDeliveryRequest(request, index))}
      </View>
    );
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ModernDriverProfile')}
            style={styles.profileSection}
          >
            <Image
              source={
                profilePhoto 
                  ? { uri: profilePhoto }
                  : { uri: 'https://i.pravatar.cc/150?img=5' }
              }
              style={styles.profileImage}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.driverName}>{user?.firstName || 'Driver'}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('DriverNotifications')}
            style={styles.notificationButton}
          >
            <View style={styles.notificationIconContainer}>
              <Icon name="bell" type="Feather" size={20} color={Colors.text} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Online Toggle - Clean Design */}
        <Animated.View style={[styles.onlineToggleWrapper, pulseStyle]}>
          <TouchableOpacity
            onPress={toggleOnlineStatus}
            style={styles.onlineToggle}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isOnline ? [Colors.primary, '#764ba2'] : ['#E5E7EB', '#D1D5DB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.onlineToggleGradient}
            >
              <View style={styles.onlineToggleContent}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? '#10B981' : '#6B7280' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: isOnline ? Colors.white : '#6B7280' }
                ]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text style={[
                  styles.statusSubtext,
                  { color: isOnline ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }
                ]}>
                  {isOnline ? 'Accepting requests' : 'Not accepting'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Cards - Only for verified drivers */}
        {verificationStatus?.isVerified && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statsScroll}
            contentContainerStyle={styles.statsContainer}
          >
            <Animated.View
              entering={SlideInLeft.springify()}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Icon name="package" type="Feather" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{todayStats.deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </Animated.View>
            
            <Animated.View
              entering={SlideInLeft.delay(100).springify()}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Icon name="dollar-sign" type="Feather" size={16} color="#10B981" />
              </View>
              <Text style={styles.statValue}>${todayStats.earnings}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </Animated.View>
            
            <Animated.View
              entering={SlideInLeft.delay(200).springify()}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Icon name="clock" type="Feather" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{todayStats.hoursOnline}h</Text>
              <Text style={styles.statLabel}>Online</Text>
            </Animated.View>
            
            <Animated.View
              entering={SlideInLeft.delay(300).springify()}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Icon name="star" type="Feather" size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{todayStats.rating || 'N/A'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Animated.View>
          </ScrollView>
        )}
      </View>

      {/* Content */}
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
        {verificationStatus?.isVerified ? renderAvailableDeliveries() : renderVerificationFlow()}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  notificationButton: {
    padding: 8,
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  notificationBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
  },
  
  // Online Toggle
  onlineToggleWrapper: {
    marginBottom: 16,
  },
  onlineToggle: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  onlineToggleGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  onlineToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  statusSubtext: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  
  // Stats
  statsScroll: {
    marginHorizontal: -20,
    marginBottom: -16,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.SFProDisplay?.Bold,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  
  // Enhanced Verification Flow - Premium Design
  verificationContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Premium Header Card
  premiumVerificationCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  verificationHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationIconContainer: {
    marginRight: 16,
  },
  verificationIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verificationTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  verificationPreTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.textPrimary,
    marginRight: 6,
  },
  verificationTitleEmphasis: {
    fontSize: 22,
    fontFamily: Fonts.PlayfairDisplay?.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  verificationProgress: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  celebrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Enhanced Progress Bar
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressSteps: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressStep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  progressStepCompleted: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#F59E0B',
    transform: [{ scale: 1.2 }],
  },
  
  // Premium Steps Container
  premiumStepsContainer: {
    gap: 16,
  },
  premiumStepCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepCardPremium: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepCardPremiumCompleted: {
    backgroundColor: '#FAFFFE',
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  
  // Step Elements
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
  },
  premiumStepIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumStepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepHeader: {
    marginBottom: 8,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  premiumStepTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  premiumStepTitleCompleted: {
    color: '#10B981',
  },
  premiumStepTitleRejected: {
    color: '#EF4444',
  },
  requirementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  requirementText: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay?.Bold,
    textTransform: 'uppercase',
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estimatedTime: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textTertiary,
  },
  premiumStepDescription: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  premiumStepDescriptionCompleted: {
    color: '#059669',
  },
  premiumStepDescriptionRejected: {
    color: '#DC2626',
  },
  stepDetails: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textTertiary,
    lineHeight: 16,
    marginBottom: 12,
  },
  stepStatus: {
    marginTop: 4,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: '#10B981',
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  
  // Call to Action
  ctaContainer: {
    marginTop: 20,
  },
  ctaCard: {
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  ctaContent: {
    flex: 1,
    marginLeft: 12,
  },
  ctaTitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  ctaDescription: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  
  // Delivery Cards - Clean Design
  deliveriesContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.text,
    marginRight: 6,
  },
  sectionTitleEmphasis: {
    fontSize: 22,
    fontFamily: Fonts.PlayfairDisplay?.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  deliveryCard: {
    marginBottom: 14,
  },
  deliveryCardContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  customerNameText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.SFProDisplay?.Bold,
  },
  urgencyLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  routeSection: {
    marginBottom: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIndicator: {
    width: 32,
    alignItems: 'center',
  },
  routeDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  destinationDot: {
    backgroundColor: '#10B98120',
  },
  routeDotInnerDest: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  routeConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 15,
    marginVertical: 2,
  },
  addressContainer: {
    flex: 1,
    marginLeft: 8,
  },
  addressLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontFamily: Fonts.SFProDisplay?.Medium,
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  infoPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  infoPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8,
    fontFamily: Fonts.SFProDisplay?.Medium,
  },
  
  // Empty States - Clean Design
  offlineContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 60,
  },
  offlineCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  offlineTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.text,
    marginTop: 16,
  },
  offlineTitleEmphasis: {
    fontSize: 22,
    fontFamily: Fonts.PlayfairDisplay?.Variable,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  offlineDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 60,
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
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Regular,
  },
});

export default ModernDriverHomeScreen;