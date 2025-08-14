import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Button, Text, Icon, Input } from '../../ui';
import { Colors } from '../../config/colors';
import { useSignUp } from '../../contexts/SignUpContext';
import { transporterVehicleSchema } from '../../validation/signUpSchemas';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  CameraCapturedPicture,
} from 'expo-camera';
import { Images } from '../../config/assets';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransporterVehicleRedesignedProps {
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
  { id: 'van', label: 'Van', icon: 'truck' },
  { id: 'truck', label: 'Truck', icon: 'truck' },
  { id: 'car', label: 'Car', icon: 'navigation' },
  { id: 'motorcycle', label: 'Motorcycle', icon: 'zap' },
];

const PHOTO_STEPS = [
  { id: 'front', title: 'Vehicle Front', icon: 'camera', image: Images.front_car },
  { id: 'back', title: 'Vehicle Back', icon: 'camera', image: Images.back_car },
  { id: 'side', title: 'Vehicle Side', icon: 'camera', image: Images.side_car },
  { id: 'plate', title: 'License Plate', icon: 'credit-card', image: Images.plate },
  { id: 'license_front', title: 'License Front', icon: 'credit-card', image: Images.license },
  { id: 'license_back', title: 'License Back', icon: 'credit-card', image: Images.license },
];

const TransporterVehicleRedesigned: React.FC<TransporterVehicleRedesignedProps> = ({ navigation }) => {
  const { signUpData, updateSignUpData, setCurrentStep } = useSignUp();
  
  const [currentSubStep, setCurrentSubStep] = useState(0); // 0: Type, 1: Details, 2: Photos
  const [formData, setFormData] = useState<FormData>({
    vehicleType: signUpData.vehicleType || '',
    plate: signUpData.plate || '',
    payloadKg: signUpData.payloadKg?.toString() || '',
    vehiclePhotos: [],
    licenseImage: signUpData.licenseImages?.[0] || '',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<{ [key: string]: string }>({});
  const [licenseImage, setLicenseImage] = useState('');
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const screenLayout = getScreenLayout();

  // Update formData with captured photos
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      vehiclePhotos: Object.values(capturedPhotos),
      licenseImage: licenseImage,
    }));
  }, [capturedPhotos, licenseImage]);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubStepNext = () => {
    if (currentSubStep === 0) {
      if (!formData.vehicleType) {
        Alert.alert('Please select', 'Choose your vehicle type to continue');
        return;
      }
      setCurrentSubStep(1);
    } else if (currentSubStep === 1) {
      if (!formData.plate || !formData.payloadKg) {
        Alert.alert('Complete details', 'Please fill in all vehicle details');
        return;
      }
      setCurrentSubStep(2);
    } else if (currentSubStep === 2) {
      // Go directly to camera
      startCameraCapture();
    }
  };

  const handleSubStepBack = () => {
    if (currentSubStep > 0) {
      setCurrentSubStep(currentSubStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const startCameraCapture = async () => {
    if (!permission?.granted) {
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
      const stepId = PHOTO_STEPS[currentPhotoStep].id;
      
      if (stepId === 'license_front' || stepId === 'license_back') {
        // Store both license photos in the same licenseImage field (we can separate them later if needed)
        if (stepId === 'license_front') {
          setLicenseImage(photo.uri); // For now, just store the front
        }
        // Add to captured photos for display purposes
        setCapturedPhotos(prev => ({ ...prev, [stepId]: photo.uri }));
      } else {
        setCapturedPhotos(prev => ({ ...prev, [stepId]: photo.uri }));
      }
      
      if (currentPhotoStep < PHOTO_STEPS.length - 1) {
        setCurrentPhotoStep(prev => prev + 1);
      } else {
        setIsCameraOpen(false);
        // Complete and go to next screen
        handleFinalNext();
      }
    }
  };

  const handleFinalNext = () => {
    updateSignUpData({
      vehicleType: formData.vehicleType,
      plate: formData.plate,
      payloadKg: parseFloat(formData.payloadKg),
      vehiclePhotos: Object.values(capturedPhotos),
      licenseImages: licenseImage ? [licenseImage] : [],
    });
    setCurrentStep(5);
    navigation.navigate('TransporterCompliance');
  };


  const getSubStepTitle = () => {
    switch (currentSubStep) {
      case 0: return 'Select Vehicle Type';
      case 1: return 'Vehicle Details';
      case 2: return 'Document Photos';
      default: return '';
    }
  };


  // Camera View
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef as unknown as React.RefObject<CameraView>}
          style={styles.camera}
          facing="back"
        />
        
        {/* Header with progress */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={styles.cameraBackButton}
            onPress={() => setIsCameraOpen(false)}
          >
            <Icon name="arrow-left" type="Feather" size={24} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.cameraProgress}>
            <Text style={styles.cameraProgressText}>
              {currentPhotoStep + 1} of {PHOTO_STEPS.length}
            </Text>
            <View style={styles.cameraProgressBar}>
              <View 
                style={[
                  styles.cameraProgressFill,
                  { width: `${((currentPhotoStep + 1) / PHOTO_STEPS.length) * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Example Image */}
        <View style={styles.exampleImageContainer}>
          <View style={styles.exampleImageWrapper}>
            <Image 
              source={PHOTO_STEPS[currentPhotoStep].image} 
              style={styles.exampleImage}
              resizeMode="contain"
            />
            <Text style={styles.exampleImageText}>
              {PHOTO_STEPS[currentPhotoStep].title}
            </Text>
          </View>
        </View>

        {/* Frame Guide */}
        <View style={styles.cameraFrameContainer}>
          <View style={styles.cameraFrame}>
            <View style={[styles.cameraCorner, styles.cameraCornerTL]} />
            <View style={[styles.cameraCorner, styles.cameraCornerTR]} />
            <View style={[styles.cameraCorner, styles.cameraCornerBL]} />
            <View style={[styles.cameraCorner, styles.cameraCornerBR]} />
          </View>
        </View>

        {/* Capture Button */}
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          {currentPhotoStep < PHOTO_STEPS.length - 1 && (
            <TouchableOpacity 
              style={styles.skipPhotoButton}
              onPress={() => setCurrentPhotoStep(prev => prev + 1)}
            >
              <Text style={styles.skipPhotoText}>Skip this photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Main Form View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleSubStepBack}>
          <Icon name="chevron-left" type="Feather" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 4 of 6</Text>
      </View>

      {/* Sub-step Progress */}
      <View style={styles.subStepContainer}>
        <View style={styles.subStepProgress}>
          {[0, 1, 2].map((step) => (
            <View key={step} style={styles.subStepItem}>
              <View style={[
                styles.subStepDot,
                currentSubStep >= step && styles.subStepDotActive,
                currentSubStep === step && styles.subStepDotCurrent,
              ]}>
                {currentSubStep > step && (
                  <Icon name="check" type="Feather" size={12} color={Colors.white} />
                )}
              </View>
              {step < 2 && (
                <View style={[
                  styles.subStepLine,
                  currentSubStep > step && styles.subStepLineActive,
                ]} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.subStepTitle}>{getSubStepTitle()}</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Sub-step 0: Vehicle Type */}
        {currentSubStep === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>What do you drive?</Text>
            <Text style={styles.subtitle}>Select your vehicle type</Text>
            
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    formData.vehicleType === vehicle.id && styles.vehicleCardSelected
                  ]}
                  onPress={() => updateField('vehicleType', vehicle.id)}
                  activeOpacity={0.9}
                >
                  <View style={[
                    styles.vehicleIconContainer,
                    formData.vehicleType === vehicle.id && styles.vehicleIconContainerSelected
                  ]}>
                    <Icon 
                      name={vehicle.icon} 
                      type="Feather" 
                      size={32} 
                      color={formData.vehicleType === vehicle.id ? Colors.white : Colors.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.vehicleLabel,
                    formData.vehicleType === vehicle.id && styles.vehicleLabelSelected
                  ]}>
                    {vehicle.label}
                  </Text>
                  {formData.vehicleType === vehicle.id && (
                    <View style={styles.vehicleCheck}>
                      <Icon name="check" type="Feather" size={16} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sub-step 1: Vehicle Details */}
        {currentSubStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Vehicle Information</Text>
            <Text style={styles.subtitle}>Enter your vehicle details</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="hash" type="Feather" size={20} color={Colors.textSecondary} />
                <Input
                  placeholder="License plate number"
                  value={formData.plate}
                  onChangeText={(value) => updateField('plate', value.toUpperCase())}
                  style={styles.input}
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <Icon name="package" type="Feather" size={20} color={Colors.textSecondary} />
                <Input
                  placeholder="Payload capacity (kg)"
                  value={formData.payloadKg}
                  onChangeText={(value) => updateField('payloadKg', value)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        )}

        {/* Sub-step 2: Photos Overview */}
        {currentSubStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Document Photos</Text>
            <Text style={styles.subtitle}>We need photos of your vehicle and license</Text>
            
            <View style={styles.photosList}>
              {PHOTO_STEPS.map((step) => {
                const photoUri = (step.id === 'license_front' || step.id === 'license_back') 
                  ? capturedPhotos[step.id] 
                  : capturedPhotos[step.id];
                return (
                  <View key={step.id} style={styles.photoItem}>
                    <View style={styles.photoItemIcon}>
                      <Icon 
                        name={photoUri ? 'check-circle' : step.icon} 
                        type="Feather" 
                        size={20} 
                        color={photoUri ? Colors.success : Colors.textSecondary} 
                      />
                    </View>
                    <Text style={[
                      styles.photoItemText,
                      photoUri && styles.photoItemTextComplete
                    ]}>
                      {step.title}
                    </Text>
                    {photoUri && (
                      <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={currentSubStep === 2 ? "Take Photos" : "Continue"}
            onPress={handleSubStepNext}
            variant="primary"
            style={styles.nextButton}
            icon={<Icon name="arrow-right" type="Feather" size={20} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    height: getScreenLayout().headerHeight,
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
  subStepContainer: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(16),
  },
  subStepProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  subStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subStepDot: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subStepDotActive: {
    backgroundColor: Colors.primary,
  },
  subStepDotCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  subStepLine: {
    width: scale(60),
    height: 2,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: scale(4),
  },
  subStepLineActive: {
    backgroundColor: Colors.primary,
  },
  subStepTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    justifyContent: 'space-between',
  },
  stepContent: {
    flex: 1,
    paddingTop: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: theme.colors.textSecondary,
    marginBottom: verticalScale(32),
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(16),
  },
  vehicleCard: {
    flex: 1,
    minWidth: scale(150),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: scale(20),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  vehicleIconContainer: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  vehicleIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  vehicleLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: theme.colors.text,
  },
  vehicleLabelSelected: {
    color: Colors.white,
  },
  vehicleCheck: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    gap: verticalScale(20),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  input: {
    flex: 1,
    marginLeft: scale(12),
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  photosList: {
    gap: verticalScale(16),
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: scale(16),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  photoItemIcon: {
    marginRight: scale(12),
  },
  photoItemText: {
    flex: 1,
    fontSize: moderateScale(16),
    color: theme.colors.text,
  },
  photoItemTextComplete: {
    color: Colors.success,
    fontWeight: '600',
  },
  photoThumbnail: {
    width: scale(50),
    height: scale(50),
    borderRadius: theme.borderRadius.small,
  },
  buttonContainer: {
    paddingVertical: verticalScale(20),
  },
  nextButton: {
    width: '100%',
    height: verticalScale(56),
    borderRadius: theme.borderRadius.xl,
  },

  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: verticalScale(50),
    paddingHorizontal: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  cameraBackButton: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: scale(22),
    marginBottom: verticalScale(12),
  },
  cameraProgress: {
    paddingBottom: verticalScale(16),
  },
  cameraProgressText: {
    fontSize: moderateScale(14),
    color: Colors.white,
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  cameraProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cameraProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  exampleImageContainer: {
    position: 'absolute',
    top: verticalScale(120),
    left: scale(20),
    right: scale(20),
    alignItems: 'center',
    zIndex: 5,
  },
  exampleImageWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    padding: scale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  exampleImage: {
    width: scale(80),
    height: scale(60),
    marginBottom: scale(8),
  },
  exampleImageText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  cameraFrameContainer: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    right: '10%',
    height: SCREEN_HEIGHT * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cameraCorner: {
    position: 'absolute',
    width: scale(40),
    height: scale(40),
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  cameraCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cameraCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cameraCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cameraCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  cameraControls: {
    position: 'absolute',
    bottom: verticalScale(40),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: scale(32),
    backgroundColor: Colors.white,
  },
  skipPhotoButton: {
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  skipPhotoText: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});

export default TransporterVehicleRedesigned;