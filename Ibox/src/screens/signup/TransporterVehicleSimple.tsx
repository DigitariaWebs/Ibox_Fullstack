import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Button, Text, Icon, Input } from '../../ui';
import { useSignUp } from '../../contexts/SignUpContext';
import { transporterVehicleSchema } from '../../validation/signUpSchemas';
import CameraGuide from '../../components/CameraGuide';
import { CameraCapturedPicture } from 'expo-camera';
import {
  deviceHeight,
  deviceWidth,
  isSmallDevice,
  getScreenLayout,
  theme,
  moderateScale,
  verticalScale,
  scale,
} from '../../utils/responsive';

interface TransporterVehicleSimpleProps {
  navigation: any;
}

interface FormData {
  vehicleType: string;
  plate: string;
  payloadKg: string;
  vehiclePhotos: string[];
  licenseImage: string;
}

const VEHICLE_TYPES = [
  { id: 'van', label: 'Van', icon: '🚐', description: 'Medium packages' },
  { id: 'truck', label: 'Truck', icon: '🚚', description: 'Large items' },
  { id: 'car', label: 'Car', icon: '🚗', description: 'Small packages' },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', description: 'Express delivery' },
];

const PHOTO_REQUIREMENTS = [
  { id: 'front', title: 'Front View', instruction: 'Position vehicle front in frame', required: true },
  { id: 'back', title: 'Back View', instruction: 'Position vehicle back in frame', required: true },
  { id: 'side', title: 'Side View', instruction: 'Position vehicle side in frame', required: false },
  { id: 'license', title: "Driver's License", instruction: 'Position license in frame', required: true },
];

const TransporterVehicleSimple: React.FC<TransporterVehicleSimpleProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    vehicleType: signUpData.vehicleType || '',
    plate: signUpData.plate || '',
    payloadKg: signUpData.payloadKg?.toString() || '',
    vehiclePhotos: signUpData.vehiclePhotos || [],
    licenseImage: signUpData.licenseImage || '',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<string>('');
  const [capturedPhotos, setCapturedPhotos] = useState<{ [key: string]: string }>({});

  const screenLayout = getScreenLayout();

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = async () => {
    try {
      await transporterVehicleSchema.validate(formData, { abortEarly: false });
      setErrors({});
      setIsValid(true);
    } catch (validationErrors: any) {
      const errorObj: Partial<FormData> = {};
      validationErrors.inner?.forEach((error: any) => {
        errorObj[error.path as keyof FormData] = error.message;
      });
      setErrors(errorObj);
      setIsValid(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isValid) {
      updateSignUpData({
        vehicleType: formData.vehicleType,
        plate: formData.plate,
        payloadKg: parseInt(formData.payloadKg),
        vehiclePhotos: formData.vehiclePhotos,
        licenseImage: formData.licenseImage,
      });
      setCurrentStep(5);
      navigation.navigate('TransporterCompliance');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const openCamera = (photoType: string) => {
    setCurrentPhotoType(photoType);
    setCameraVisible(true);
  };

  const handlePhotoCapture = (photo: CameraCapturedPicture) => {
    if (currentPhotoType === 'license') {
      setFormData(prev => ({ ...prev, licenseImage: photo.uri }));
    } else {
      const newPhotos = { ...capturedPhotos, [currentPhotoType]: photo.uri };
      setCapturedPhotos(newPhotos);
      setFormData(prev => ({ ...prev, vehiclePhotos: Object.values(newPhotos) }));
    }
    setCameraVisible(false);
    setCurrentPhotoType('');
  };

  const getCurrentPhotoRequirement = () => {
    return PHOTO_REQUIREMENTS.find(req => req.id === currentPhotoType) || PHOTO_REQUIREMENTS[0];
  };

  const renderVehicleType = ({ item }: { item: typeof VEHICLE_TYPES[0] }) => (
    <TouchableOpacity
      style={[
        styles.vehicleCard,
        formData.vehicleType === item.id && styles.vehicleCardSelected
      ]}
      onPress={() => updateField('vehicleType', item.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.vehicleEmoji}>{item.icon}</Text>
      <Text style={[
        styles.vehicleLabel,
        formData.vehicleType === item.id && styles.vehicleLabelSelected
      ]}>
        {item.label}
      </Text>
      <Text style={[
        styles.vehicleDescription,
        formData.vehicleType === item.id && styles.vehicleDescriptionSelected
      ]}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  const renderPhotoItem = ({ item }: { item: typeof PHOTO_REQUIREMENTS[0] }) => {
    const photoUri = item.id === 'license' ? formData.licenseImage : capturedPhotos[item.id];
    
    return (
      <TouchableOpacity
        style={styles.photoCard}
        onPress={() => openCamera(item.id)}
        activeOpacity={0.8}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Icon 
              name="camera" 
              type="Feather" 
              size={scale(24)} 
              color={theme.colors.textSecondary} 
            />
          </View>
        )}
        
        <View style={styles.photoInfo}>
          <Text style={styles.photoTitle}>{item.title}</Text>
          {item.required && !photoUri && (
            <Text style={styles.requiredText}>Required</Text>
          )}
          {photoUri && (
            <Icon 
              name="check-circle" 
              type="Feather" 
              size={scale(16)} 
              color={theme.colors.success} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="chevron-left" type="Feather" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 4</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Vehicle Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <FlatList
            data={VEHICLE_TYPES}
            renderItem={renderVehicleType}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehicleList}
          />
          {errors.vehicleType && (
            <Text style={styles.errorText}>{errors.vehicleType}</Text>
          )}
        </View>
        
        {/* Vehicle Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.inputRow}>
            <Input
              placeholder="License plate"
              value={formData.plate}
              onChangeText={(value) => updateField('plate', value.toUpperCase())}
              error={errors.plate}
              style={styles.input}
            />
            <Input
              placeholder="Payload (kg)"
              value={formData.payloadKg}
              onChangeText={(value) => updateField('payloadKg', value)}
              keyboardType="numeric"
              error={errors.payloadKg}
              style={styles.input}
            />
          </View>
        </View>
        
        {/* Photos Section */}
        <View style={[styles.section, styles.photoSection]}>
          <Text style={styles.sectionTitle}>Required Photos</Text>
          <FlatList
            data={PHOTO_REQUIREMENTS}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.photoRow}
            contentContainerStyle={styles.photoGrid}
          />
        </View>
        
        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            disabled={!isValid}
            style={styles.nextButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color="white" />}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Camera Guide */}
      <CameraGuide
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handlePhotoCapture}
        title={getCurrentPhotoRequirement().title}
        instruction={getCurrentPhotoRequirement().instruction}
        guideType={currentPhotoType === 'license' ? 'document' : 'rectangle'}
      />
    </SafeAreaView>
  );
};

const screenLayout = getScreenLayout();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    height: screenLayout.headerHeight,
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(22),
    backgroundColor: theme.colors.surfaceDark,
  },
  stepIndicator: {
    fontSize: moderateScale(16),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  photoSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: verticalScale(16),
  },
  vehicleList: {
    gap: scale(12),
  },
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: scale(16),
    alignItems: 'center',
    minWidth: scale(100),
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
  },
  vehicleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  vehicleEmoji: {
    fontSize: moderateScale(24),
    marginBottom: verticalScale(8),
  },
  vehicleLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: verticalScale(4),
  },
  vehicleLabelSelected: {
    color: 'white',
  },
  vehicleDescription: {
    fontSize: moderateScale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  vehicleDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  input: {
    flex: 1,
  },
  photoGrid: {
    gap: scale(16),
  },
  photoRow: {
    justifyContent: 'space-between',
  },
  photoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: scale(12),
    flex: 1,
    marginHorizontal: scale(4),
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.small,
  },
  photoPlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  photoPreview: {
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.small,
    marginBottom: verticalScale(8),
    backgroundColor: theme.colors.borderLight,
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  requiredText: {
    fontSize: moderateScale(10),
    color: theme.colors.error,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingVertical: verticalScale(20),
  },
  nextButton: {
    width: '100%',
    height: verticalScale(56),
  },
  errorText: {
    fontSize: moderateScale(12),
    color: theme.colors.error,
    marginTop: verticalScale(4),
  },
});

export default TransporterVehicleSimple;