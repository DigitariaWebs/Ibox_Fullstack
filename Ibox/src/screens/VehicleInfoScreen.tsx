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
  TextInput,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import api from '../services/api';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  type: 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'van';
  photos: string[];
  verified: boolean;
  insurance: {
    company: string;
    policyNumber: string;
    expiryDate: string;
  };
}

const VehicleInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VehicleInfo>>({});
  const [saving, setSaving] = useState(false);

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
      loadVehicleInfo();
    }, [])
  );

  const loadVehicleInfo = async () => {
    try {
      setLoading(true);
      console.log('🚗 Loading vehicle information...');
      
      const response = await api.get('/driver/vehicle');
      
      if (response?.success && response?.data) {
        setVehicleInfo(response.data);
        setFormData(response.data);
        console.log('✅ Vehicle info loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading vehicle info:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehicleInfo();
    setRefreshing(false);
  }, []);

  const handleEdit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(true);
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(vehicleInfo || {});
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('💾 Saving vehicle information...');
      
      const response = await api.put('/driver/vehicle', formData);
      
      if (response?.success) {
        setVehicleInfo({ ...vehicleInfo, ...formData } as VehicleInfo);
        setEditing(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Vehicle information updated successfully');
      }
    } catch (error: any) {
      console.error('❌ Error saving vehicle info:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error?.message || 'Failed to update vehicle information');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'Add Vehicle Photo',
      'Choose how you want to add a photo of your vehicle',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      console.log('📤 Uploading vehicle photo...');

      const formData = new FormData();
      formData.append('vehiclePhoto', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'vehicle.jpg',
      } as any);

      const response = await api.post('/driver/vehicle/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response?.success) {
        console.log('✅ Photo uploaded successfully');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadVehicleInfo(); // Refresh the data
      }
    } catch (error: any) {
      console.error('❌ Error uploading photo:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const vehicleTypes = [
    { id: 'car', name: 'Car', icon: 'car' },
    { id: 'motorcycle', name: 'Motorcycle', icon: 'zap' },
    { id: 'bicycle', name: 'Bicycle', icon: 'disc' },
    { id: 'truck', name: 'Truck', icon: 'truck' },
    { id: 'van', name: 'Van', icon: 'package' },
  ];

  const renderVehiclePhotos = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={styles.photoSection}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vehicle Photos</Text>
        <TouchableOpacity 
          style={styles.addPhotoButton}
          onPress={handleAddPhoto}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={18} color={Colors.primary} />
          <Text style={styles.addPhotoText}>Add Photo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
        {vehicleInfo?.photos?.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.vehiclePhoto} />
          </View>
        ))}
        
        {(!vehicleInfo?.photos || vehicleInfo.photos.length === 0) && (
          <View style={styles.noPhotosContainer}>
            <Feather name="camera" size={32} color={Colors.textTertiary} />
            <Text style={styles.noPhotosText}>No photos yet</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );

  const renderVehicleDetails = () => (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={styles.detailsSection}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Vehicle <Text style={styles.sectionTitleHighlight}>Details</Text>
        </Text>
        {!editing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={18} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </View>

      <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Make</Text>
            {editing ? (
                  <TextInput
                style={styles.detailInput}
                value={formData.make}
                onChangeText={(text) => setFormData({ ...formData, make: text })}
                placeholder="Enter make"
              />
            ) : (
              <Text style={styles.detailValue}>{vehicleInfo?.make || 'Not specified'}</Text>
              )}
            </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Model</Text>
            {editing ? (
                <TextInput
                  style={styles.detailInput}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholder="Enter model"
                />
              ) : (
              <Text style={styles.detailValue}>{vehicleInfo?.model || 'Not specified'}</Text>
              )}
          </View>
            </View>

            <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Year</Text>
            {editing ? (
                <TextInput
                  style={styles.detailInput}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                placeholder="Enter year"
                keyboardType="numeric"
                />
              ) : (
              <Text style={styles.detailValue}>{vehicleInfo?.year || 'Not specified'}</Text>
              )}
            </View>

          <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Color</Text>
            {editing ? (
                <TextInput
                  style={styles.detailInput}
                value={formData.color}
                onChangeText={(text) => setFormData({ ...formData, color: text })}
                placeholder="Enter color"
                />
              ) : (
              <Text style={styles.detailValue}>{vehicleInfo?.color || 'Not specified'}</Text>
              )}
            </View>
            </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>License Plate</Text>
          {editing ? (
            <TextInput
              style={styles.detailInput}
              value={formData.licensePlate}
              onChangeText={(text) => setFormData({ ...formData, licensePlate: text.toUpperCase() })}
              placeholder="Enter license plate"
              autoCapitalize="characters"
            />
          ) : (
            <Text style={styles.detailValue}>{vehicleInfo?.licensePlate || 'Not specified'}</Text>
          )}
            </View>

        {editing && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vehicle Type</Text>
            <View style={styles.vehicleTypeSelector}>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.vehicleTypeButton,
                    formData.type === type.id && styles.vehicleTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.id as any })}
                  activeOpacity={0.7}
                >
                  <Feather 
                    name={type.icon as any} 
                    size={16} 
                    color={formData.type === type.id ? 'white' : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.vehicleTypeButtonText,
                    formData.type === type.id && styles.vehicleTypeButtonTextActive
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderVerificationStatus = () => (
    <Animated.View
      entering={FadeInDown.delay(300)}
      style={styles.verificationSection}
    >
      <Text style={styles.sectionTitle}>Verification Status</Text>
      
      <View style={[
        styles.verificationCard,
        vehicleInfo?.verified ? styles.verificationCardVerified : styles.verificationCardPending
      ]}>
        <View style={styles.verificationIcon}>
          <Feather 
            name={vehicleInfo?.verified ? "shield-check" : "shield"} 
            size={24} 
            color={vehicleInfo?.verified ? "#10B981" : "#F59E0B"} 
          />
        </View>

        <View style={styles.verificationContent}>
          <Text style={styles.verificationTitle}>
            {vehicleInfo?.verified ? 'Verified Vehicle' : 'Verification Pending'}
          </Text>
          <Text style={styles.verificationSubtitle}>
            {vehicleInfo?.verified 
              ? 'Your vehicle has been verified and approved for deliveries'
              : 'Your vehicle information is being reviewed by our team'
            }
                    </Text>
                  </View>
                </View>
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
            <Text style={styles.headerTitle}>Vehicle</Text>
            <Text style={styles.headerTitleHighlight}>Information</Text>
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
          {renderVehiclePhotos()}
          {renderVehicleDetails()}
          {renderVerificationStatus()}
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
  
  // Photo Section
  photoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
  },
  sectionTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addPhotoText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.primary,
    marginLeft: 6,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: 12,
  },
  vehiclePhoto: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  noPhotosContainer: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotosText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  
  // Details Section
  detailsSection: {
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.primary,
    marginLeft: 6,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  detailInput: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  vehicleTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  vehicleTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleTypeButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  vehicleTypeButtonTextActive: {
    color: 'white',
  },
  
  // Verification Section
  verificationSection: {
    marginBottom: 32,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  verificationCardVerified: {
    borderLeftColor: '#10B981',
  },
  verificationCardPending: {
    borderLeftColor: '#F59E0B',
  },
  verificationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default VehicleInfoScreen;