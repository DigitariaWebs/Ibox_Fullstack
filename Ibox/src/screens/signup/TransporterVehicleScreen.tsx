import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Button, Text, Icon, Input } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { transporterVehicleSchema } from '../../validation/signUpSchemas';
import * as ImagePicker from 'expo-image-picker';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  CameraCapturedPicture,
} from 'expo-camera';
import { Images } from '../../config/assets';

interface TransporterVehicleScreenProps {
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
  { id: 'van', label: 'Van', icon: 'truck', description: 'Medium packages, furniture' },
  { id: 'truck', label: 'Truck', icon: 'truck', description: 'Large items, bulk deliveries' },
  { id: 'car', label: 'Car', icon: 'navigation', description: 'Small packages, documents' },
  { id: 'motorcycle', label: 'Motorcycle', icon: 'zap', description: 'Express deliveries' },
  { id: 'bicycle', label: 'Bicycle', icon: 'activity', description: 'Local, eco-friendly' },
];

const TransporterVehicleScreen: React.FC<TransporterVehicleScreenProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [formData, setFormData] = useState<FormData>({
    vehicleType: signUpData.vehicleType || '',
    plate: signUpData.plate || '',
    payloadKg: signUpData.payloadKg?.toString() || '',
    vehiclePhotos: [],
    licenseImage: signUpData.licenseImages?.[0] || '',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isValid, setIsValid] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<{ [key: string]: string }>({});
  const [licenseImage, setLicenseImage] = useState('');
  const cameraRef = useRef<CameraView>(null);

  const PHOTO_STEPS = [
    { id: 'front', title: 'Front View', illustration: Images.front_car, instruction: 'Take a photo of the front of your vehicle' },
    { id: 'back', title: 'Back View', illustration: Images.back_car, instruction: 'Take a photo of the back of your vehicle' },
    { id: 'side', title: 'Side View', illustration: Images.side_car, instruction: 'Take a photo of the side of your vehicle' },
    { id: 'plate', title: 'License Plate', illustration: Images.plate, instruction: 'Take a clear photo of your license plate' },
    { id: 'license', title: "Driver's License", illustration: Images.license, instruction: 'Take a photo of your driver\'s license' },
  ];

  const [permission, requestPermission] = useCameraPermissions();

  // Update formData with captured photos
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      vehiclePhotos: Object.values(capturedPhotos),
      licenseImage: licenseImage,
    }));
  }, [capturedPhotos, licenseImage]);

  // Validate each time form data changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  const startGuidedCapture = async () => {
    if (permission == null) return;
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('No access to camera');
        return;
      }
    }
    setIsCameraOpen(true);
    setCurrentPhotoStep(0);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({});
      if (currentPhotoStep < PHOTO_STEPS.length - 1) {
        setCapturedPhotos(prev => ({ ...prev, [PHOTO_STEPS[currentPhotoStep].id]: photo.uri }));
      } else {
        setLicenseImage(photo.uri);
      }
      if (currentPhotoStep < PHOTO_STEPS.length - 1) {
        setCurrentPhotoStep(prev => prev + 1);
      } else {
        setIsCameraOpen(false);
      }
    }
  };

  const retakePicture = () => {
    if (currentPhotoStep < PHOTO_STEPS.length - 1) {
      setCapturedPhotos(prev => {
        const newPhotos = { ...prev };
        delete newPhotos[PHOTO_STEPS[currentPhotoStep].id];
        return newPhotos;
      });
    } else {
      setLicenseImage('');
    }
  };

  const validateForm = async () => {
    try {
      const validationData = {
        ...formData,
        payloadKg: parseFloat(formData.payloadKg) || 0,
      };
      await transporterVehicleSchema.validate(validationData, { abortEarly: false });
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

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    console.log('formData:', formData);
    console.log('isValid:', isValid);
    if (!isValid) {
      Alert.alert('Incomplete', 'Please complete the required fields.');
      return;
    }

    // proceed regardless of photo count
    updateSignUpData({
      vehicleType: formData.vehicleType,
      plate: formData.plate,
      payloadKg: parseFloat(formData.payloadKg),
      vehiclePhotos: Object.values(capturedPhotos),
      licenseImages: licenseImage ? [licenseImage] : [],
    });
    setCurrentStep(6);
    navigation.navigate('TransporterCompliance');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getVehicleTypeInfo = (typeId: string) => {
    return VEHICLE_TYPES.find(type => type.id === typeId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                      <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 4 of 7</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Tell us about your vehicle
              </Text>
              <Text style={styles.subtitle}>
                Vehicle information helps customers choose the right transporter for their needs
              </Text>
            </View>
            
            {/* Vehicle Type Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="truck" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Vehicle Type</Text>
              </View>
              
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      formData.vehicleType === vehicle.id && styles.vehicleCardSelected
                    ]}
                    onPress={() => updateField('vehicleType', vehicle.id)}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name={vehicle.icon} 
                      type="Feather" 
                      size={24} 
                      color={formData.vehicleType === vehicle.id ? Colors.white : Colors.primary} 
                    />
                    <Text style={[
                      styles.vehicleLabel,
                      formData.vehicleType === vehicle.id && styles.vehicleLabelSelected
                    ]}>
                      {vehicle.label}
                    </Text>
                    <Text style={[
                      styles.vehicleDescription,
                      formData.vehicleType === vehicle.id && styles.vehicleDescriptionSelected
                    ]}>
                      {vehicle.description}
                    </Text>
                    {formData.vehicleType === vehicle.id && (
                      <View style={styles.vehicleCheck}>
                        <Icon name="check" type="Feather" size={16} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.vehicleType && (
                <Text style={styles.errorText}>{errors.vehicleType}</Text>
              )}
            </View>
            
            {/* Vehicle Details Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="info" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Vehicle Details</Text>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="hash" type="Feather" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Input
                    placeholder="License plate number"
                    value={formData.plate}
                    onChangeText={(value) => updateField('plate', value.toUpperCase())}
                    error={errors.plate}
                    style={[styles.inputField, { flex: 1 }]}
                  />
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="package" type="Feather" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Input
                    placeholder="Payload capacity (kg)"
                    value={formData.payloadKg}
                    onChangeText={(value) => updateField('payloadKg', value)}
                    keyboardType="numeric"
                    error={errors.payloadKg}
                    style={[styles.inputField, { flex: 1 }]}
                  />
                </View>
              </View>
            </View>
            
            {/* Guided Photos Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="camera" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Vehicle & License Photos</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Required</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <Button
                  title="Start Guided Photo Capture"
                  onPress={startGuidedCapture}
                  variant="secondary"
                />
                {/* Display captured photos horizontally */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:12}}>
                  <View style={{flexDirection:'row', gap:12}}>
                    {Object.entries(capturedPhotos).map(([, uri]) => (
                      <Image key={uri} source={{ uri }} style={styles.photoImage} />
                    ))}
                    {licenseImage && (
                      <Image source={{ uri: licenseImage }} style={styles.photoImage} />
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
            
            {/* Preview Card */}
            {formData.vehicleType && (
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Icon name="eye" type="Feather" size={18} color={Colors.primary} />
                  <Text style={styles.previewTitle}>How customers will see your vehicle</Text>
                </View>
                <View style={styles.previewContent}>
                  <View style={styles.previewVehicle}>
                    <Icon 
                      name={getVehicleTypeInfo(formData.vehicleType)?.icon || 'truck'} 
                      type="Feather" 
                      size={24} 
                      color={Colors.primary} 
                    />
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewVehicleType}>
                        {getVehicleTypeInfo(formData.vehicleType)?.label}
                      </Text>
                      <Text style={styles.previewDetails}>
                        {formData.plate && `${formData.plate} • `}
                        {formData.payloadKg && `${formData.payloadKg}kg capacity`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue to compliance"
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>

      {isCameraOpen && (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef as unknown as React.RefObject<CameraView>}
            style={styles.camera}
            facing="back"
          >
            {/* Close / Back Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsCameraOpen(false)}
            >
              <Icon name="x" type="Feather" size={28} color={Colors.white} />
            </TouchableOpacity>

            {/* Illustration & Instruction */}
            <View style={styles.cameraInstructionWrapper}>
              <Image
                source={PHOTO_STEPS[currentPhotoStep].illustration}
                style={styles.illustration}
              />
              <Text style={styles.instructionText}>
                {PHOTO_STEPS[currentPhotoStep].instruction}
              </Text>
            </View>

            {/* Capture Button */}
            <View style={styles.captureWrapper}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
            </View>
          </CameraView>
        </View>
      )}
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 34,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 16,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  vehicleLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  vehicleLabelSelected: {
    color: Colors.white,
  },
  vehicleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  vehicleDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  vehicleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    marginBottom: 0,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
  },
  photoImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  photoHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewContent: {
    gap: 8,
  },
  previewVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewVehicleType: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  previewDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  nextButton: {
    width: '100%',
  },
  cameraContainer: { flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000' },
  camera: { flex: 1 },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
  },
  cameraInstructionWrapper: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  captureWrapper: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  illustration: {
    width: '60%',
    aspectRatio: 1,
    opacity: 0.5,
    resizeMode: 'contain',
  },
  instruction: { color: 'white', fontSize: 18, margin: 20 },
});

export default TransporterVehicleScreen;