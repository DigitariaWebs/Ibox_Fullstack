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
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import api from '../services/api';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface DocumentItem {
  id: string;
  type: 'profile_photo' | 'driver_license_front' | 'driver_license_back' | 'vehicle_registration' | 'insurance' | 'background_check';
  title: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  url?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

interface VerificationStatus {
  isVerified: boolean;
  completedSteps: number;
  totalSteps: number;
  documents: DocumentItem[];
}

const DocumentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
      loadVerificationStatus();
    }, [])
  );

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      console.log('📄 Loading verification documents...');
      
      const response = await api.get('/driver/verification/status');
      
      if (response?.success && response?.data) {
        setVerificationStatus(response.data);
        console.log('✅ Verification status loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVerificationStatus();
    setRefreshing(false);
  }, []);

  const handleDocumentUpload = async (document: DocumentItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'Upload Document',
      `Upload your ${document.title.toLowerCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takePhoto(document) },
        { text: 'Choose from Gallery', onPress: () => pickFromGallery(document) },
      ]
    );
  };

  const takePhoto = async (document: DocumentItem) => {
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
        await uploadDocument(document, result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async (document: DocumentItem) => {
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
        await uploadDocument(document, result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadDocument = async (document: DocumentItem, asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingId(document.id);
      console.log('📤 Uploading document:', document.type);

      const formData = new FormData();
      formData.append('documentType', document.type);
      formData.append('file', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `${document.type}.jpg`,
      } as any);

      const response = await api.post('/driver/verification/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response?.success) {
        console.log('✅ Document uploaded successfully');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadVerificationStatus(); // Refresh the status
      } else {
        throw new Error(response?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('❌ Error uploading document:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload Failed', error?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return 'check-circle';
      case 'rejected': return 'x-circle';
      case 'uploaded': return 'clock';
      default: return 'upload';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'uploaded': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'uploaded': return 'Under Review';
      default: return 'Upload Required';
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const renderProgressCard = () => {
    if (!verificationStatus) return null;

    const progress = verificationStatus.completedSteps / verificationStatus.totalSteps;
    
    return (
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={styles.progressCard}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Verification Progress</Text>
          <Text style={styles.progressText}>
            {verificationStatus.completedSteps} of {verificationStatus.totalSteps} completed
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                { width: `${Math.max(progress * 100, 5)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        
        {verificationStatus.isVerified && (
          <View style={styles.verifiedBadge}>
            <Feather name="shield-check" size={16} color="white" />
            <Text style={styles.verifiedText}>Verified Driver</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderDocumentItem = (document: DocumentItem, index: number) => (
    <Animated.View
      key={document.id}
      entering={FadeInDown.delay(200 + index * 50)}
      style={styles.documentCard}
    >
      <TouchableOpacity
        style={styles.documentContent}
        onPress={() => handleDocumentUpload(document)}
        activeOpacity={0.7}
        disabled={uploadingId === document.id}
      >
        <View style={styles.documentLeft}>
          <View style={[
            styles.documentIcon,
            { backgroundColor: `${document.color}15` }
          ]}>
            {uploadingId === document.id ? (
              <ActivityIndicator size="small" color={document.color} />
            ) : (
              <Feather name={document.icon as any} size={24} color={document.color} />
            )}
          </View>
          
          <View style={styles.documentInfo}>
            <View style={styles.documentTitleRow}>
              <Text style={styles.documentTitle}>{document.title}</Text>
              {document.required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.documentDescription}>{document.description}</Text>
            
            {document.rejectionReason && (
              <Text style={styles.rejectionReason}>
                Rejected: {document.rejectionReason}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.documentRight}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(document.status)}15` }
          ]}>
            <Feather 
              name={getStatusIcon(document.status) as any} 
              size={16} 
              color={getStatusColor(document.status)} 
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(document.status) }
            ]}>
              {getStatusText(document.status)}
            </Text>
          </View>
          
          {document.url && (
            <TouchableOpacity style={styles.viewButton}>
              <Feather name="eye" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="file-text" size={48} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Documents</Text>
      <Text style={styles.emptySubtitle}>
        Your verification documents will appear here
      </Text>
    </View>
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
            <Text style={styles.headerTitleHighlight}>Documents</Text>
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
          {loading && !verificationStatus ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading documents...</Text>
            </View>
          ) : (
            <>
              {renderProgressCard()}
              
              {verificationStatus?.documents && verificationStatus.documents.length > 0 ? (
                <View style={styles.documentsContainer}>
                  <Text style={styles.sectionTitle}>
                    Required <Text style={styles.sectionTitleHighlight}>Documents</Text>
                  </Text>
                  
                  {verificationStatus.documents.map((document, index) => 
                    renderDocumentItem(document, index)
                  )}
                </View>
              ) : (
                renderEmptyState()
              )}
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
    marginLeft: 6,
  },
  documentsContainer: {
    paddingBottom: 32,
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
  documentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  documentContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  documentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: '#D97706',
  },
  documentDescription: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  rejectionReason: {
    fontSize: 12,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: '#EF4444',
    marginTop: 4,
  },
  documentRight: {
    alignItems: 'flex-end',
    gap: 8,
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
    fontFamily: Fonts.SFProDisplay.Medium,
    marginLeft: 6,
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default DocumentsScreen;
