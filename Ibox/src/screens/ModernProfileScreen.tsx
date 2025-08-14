import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../config/colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'customer' | 'transporter';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  language: string;
  profilePicture?: string;
  dateOfBirth?: string;
  addresses: Array<{
    _id: string;
    type: 'primary' | 'secondary';
    address: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
  }>;
  isBusiness?: boolean;
  businessDetails?: {
    companyName: string;
    taxId: string;
    businessType: string;
    website?: string;
  };
  transporterDetails?: {
    vehicleType: string;
    licensePlate: string;
    payloadCapacity: number;
    licenseNumber: string;
    isVerified: boolean;
    rating: number;
    totalDeliveries: number;
    isAvailable: boolean;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageRating: number;
  };
  createdAt: string;
  lastLoginAt: string;
}

const ModernProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: authUser, logout, getCurrentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Handle refresh trigger from EditProfile screen
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh && params?.timestamp) {
      console.log('🔄 Refresh triggered from EditProfile screen');
      fetchProfileData(false); // Not silent - show loading state
    }
  }, [route.params]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen is focused
      const timeSinceLastSync = new Date().getTime() - lastSyncTime.getTime();
      const shouldRefresh = timeSinceLastSync > 5000; // Refresh if more than 5 seconds since last sync
      
      if (shouldRefresh && !loading) {
        console.log('🔄 Profile screen focused - refreshing data');
        fetchProfileData(true); // Silent refresh
      }

      // Set up interval for auto-refresh while screen is focused
      const intervalId = setInterval(() => {
        console.log('⏰ Auto-refreshing profile data');
        fetchProfileData(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds

      return () => {
        clearInterval(intervalId);
      };
    }, [lastSyncTime, loading])
  );

  // Also refresh when returning from EditProfile screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we're returning from EditProfile
      const navState = typeof (navigation as any).getState === 'function' 
        ? (navigation as any).getState() 
        : undefined;
      const previousRoute = navState?.routes?.[navState.index - 1];
      
      if (previousRoute?.name === 'EditProfile') {
        console.log('📱 Returning from EditProfile - refreshing profile');
        fetchProfileData(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const fetchProfileData = async (silent = false) => {
    try {
      if (!silent) {
        setError(null);
      }
      
      // Show syncing indicator for silent updates
      if (silent) {
        setIsSyncing(true);
      }
      
      const profileData = await api.getUserProfile();
      setProfile(profileData);
      setLastSyncTime(new Date());
      
      // Show subtle success feedback for manual refresh
      if (refreshing && !silent) {
        console.log('✅ Profile data refreshed successfully');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      
      // Only show error if not a silent refresh or if there's no existing data
      if (!silent || !profile) {
        if (err instanceof Error) {
          if (err.message.includes('Authentication') || err.message.includes('401')) {
            setError('Please log in again to view your profile.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load profile. Please try again.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsSyncing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLastSyncText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePicture },
        { text: 'Photo Library', onPress: pickImage },
      ]
    );
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setIsSyncing(true);

      // Ensure absolute URL when backend returns a relative path
      const toAbsoluteUrl = (url?: string) => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        const base = (api.getConfig().baseUrl || '').replace('/api/v1', '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
      };

      // Use the upload API that properly handles multipart form data
      const result = await api.uploadFile(imageUri, 'profile');

      if (result.success && result.url) {
        const newUrl = toAbsoluteUrl(result.url);

        // Update UI immediately
        setProfile(prev => (prev ? { ...prev, profilePicture: newUrl } : prev));

        // Best-effort refresh of AuthContext user data
        try {
          await getCurrentUser();
        } catch {}

        Alert.alert('Success', 'Profile picture updated successfully!');

        // Silent refresh from server
        await fetchProfileData(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to upload profile picture.');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderStatsCard = () => {
    if (!profile?.stats) return null;

    const isTransporter = profile.userType === 'transporter';
    
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          {isTransporter && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.stats.averageRating > 0 ? profile.stats.averageRating.toFixed(1) : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.error }]}>
              {profile.stats.cancelledOrders}
            </Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTransporterInfo = () => {
    if (!profile?.transporterDetails) return null;

    const details = profile.transporterDetails;
    
    return (
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>
        
        <View style={styles.infoRow}>
          <Feather name="truck" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Vehicle Type</Text>
            <Text style={styles.infoValue}>{details.vehicleType}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="confirmation-number" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>License Plate</Text>
            <Text style={styles.infoValue}>{details.licensePlate}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Feather name="package" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Payload Capacity</Text>
            <Text style={styles.infoValue}>{details.payloadCapacity} kg</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="verified" size={20} color={details.isVerified ? Colors.success : Colors.warning} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Verification Status</Text>
            <Text style={[styles.infoValue, { 
              color: details.isVerified ? Colors.success : Colors.warning 
            }]}>
              {details.isVerified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="radio-button-on" size={20} color={details.isAvailable ? Colors.success : Colors.error} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Availability</Text>
            <Text style={[styles.infoValue, { 
              color: details.isAvailable ? Colors.success : Colors.error 
            }]}>
              {details.isAvailable ? 'Available' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBusinessInfo = () => {
    if (!profile?.isBusiness || !profile?.businessDetails) return null;

    const business = profile.businessDetails;
    
    return (
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Business Information</Text>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="business" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Company Name</Text>
            <Text style={styles.infoValue}>{business.companyName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="receipt" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Tax ID</Text>
            <Text style={styles.infoValue}>{business.taxId}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="category" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Business Type</Text>
            <Text style={styles.infoValue}>{business.businessType}</Text>
          </View>
        </View>

        {business.website && (
          <View style={styles.infoRow}>
            <MaterialIcons name="language" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={[styles.infoValue, { color: Colors.primary }]}>
                {business.website}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderMenuItems = () => (
    <View style={styles.menuCard}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          navigation.navigate('EditProfile' as never);
        }}
      >
        <View style={styles.menuItemLeft}>
          <Feather name="edit" size={20} color={Colors.primary} />
          <Text style={styles.menuItemText}>Edit Profile</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProfileData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.syncContainer}>
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.syncIndicator} />
            ) : (
              <Ionicons name="sync" size={10} color={Colors.textTertiary} style={styles.syncIcon} />
            )}
            <Text style={styles.syncText}>{getLastSyncText()}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleProfilePicturePress}
            activeOpacity={0.8}
          >
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(profile.firstName, profile.lastName)}
                </Text>
              </View>
            )}
            <View style={[
              styles.verificationBadge,
              { backgroundColor: profile.isEmailVerified ? Colors.success : Colors.warning }
            ]}>
              <Ionicons 
                name={profile.isEmailVerified ? "checkmark" : "time"} 
                size={12} 
                color={Colors.white} 
              />
            </View>
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <Text style={styles.profileType}>
            {profile.userType === 'customer' 
              ? (profile.isBusiness ? 'Business Customer' : 'Customer')
              : 'Transporter'
            }
          </Text>
          
          <View style={styles.verificationStatus}>
            <View style={styles.statusItem}>
              <Ionicons 
                name={profile.isEmailVerified ? "checkmark-circle" : "time"} 
                size={16} 
                color={profile.isEmailVerified ? Colors.success : Colors.warning} 
              />
              <Text style={styles.statusText}>Email</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons 
                name={profile.isPhoneVerified ? "checkmark-circle" : "time"} 
                size={16} 
                color={profile.isPhoneVerified ? Colors.success : Colors.warning} 
              />
              <Text style={styles.statusText}>Phone</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        {renderStatsCard()}

        {/* Transporter Information */}
        {renderTransporterInfo()}

        {/* Business Information */}
        {renderBusinessInfo()}

        {/* Account Details */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Details</Text>
          
          <View style={styles.infoRow}>
            <Feather name="phone" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name="globe" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>
                {profile.language === 'en' ? 'English' : 'Français'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name="calendar" size={20} color={Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{formatDate(profile.createdAt)}</Text>
            </View>
          </View>

          {profile.lastLoginAt && (
            <View style={styles.infoRow}>
              <Feather name="clock" size={20} color={Colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Login</Text>
                <Text style={styles.infoValue}>{formatDate(profile.lastLoginAt)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        {renderMenuItems()}
      </ScrollView>
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
    minWidth: 32,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  syncIndicator: {
    marginRight: 4,
    width: 10,
    height: 10,
  },
  syncIcon: {
    marginRight: 4,
  },
  syncText: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  refreshButton: {
    padding: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
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
  profileHeader: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  verificationStatus: {
    flexDirection: 'row',
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 56,
  },
});

export default ModernProfileScreen;