import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Colors } from '../config/colors';

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;
const SCREEN_HEIGHT = windowDims?.height || 667;

type RootStackParamList = {
  PackagePhoto: {
    service: string;
    startLocation: string;
    startLocationCoords: {latitude: number; longitude: number};
    destination: any;
  };
  Measuring: {
    service: string;
    startLocation: string;
    startLocationCoords: {latitude: number; longitude: number};
    destination: any;
    packagePhoto: string;
  };
  [key: string]: any;
};

interface PackagePhotoScreenProps {
  navigation: NavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'PackagePhoto'>;
}

const PackagePhotoScreen: React.FC<PackagePhotoScreenProps> = ({
  navigation,
  route,
}) => {
  console.log('📷 PackagePhoto: Component mounted');
  
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('Preparing analysis...');
  const cameraRef = useRef<CameraView>(null);
  
  console.log('📷 PackagePhoto: Screen dimensions:', { width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  
  const captureScale = useSharedValue(1);
  const photoOpacity = useSharedValue(0);
  const analysisProgress = useSharedValue(0);

  useEffect(() => {
    if (capturedPhoto) {
      photoOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [capturedPhoto]);

  // Simulate AI analysis when photo is captured
  useEffect(() => {
    if (capturedPhoto && !isAnalyzing) {
      setIsAnalyzing(true);
      
      // Simulate progressive AI analysis
      const analysisSteps = [
        { delay: 800, progress: 0.1, status: 'Initializing AI vision model...' },
        { delay: 1600, progress: 0.2, status: 'Detecting package edges and corners...' },
        { delay: 2400, progress: 0.35, status: 'Analyzing surface textures...' },
        { delay: 3200, progress: 0.5, status: 'Calculating precise dimensions...' },
        { delay: 4000, progress: 0.65, status: 'Estimating material density...' },
        { delay: 4800, progress: 0.8, status: 'Computing weight distribution...' },
        { delay: 5600, progress: 0.9, status: 'Validating measurements...' },
        { delay: 6400, progress: 1.0, status: 'Analysis complete!' },
      ];

      analysisSteps.forEach((step, index) => {
        setTimeout(() => {
          analysisProgress.value = withTiming(step.progress, { duration: 400 });
          setCurrentStep(step.status);
          
          if (index === analysisSteps.length - 1) {
            setTimeout(() => {
              continueToNext();
            }, 800);
          }
        }, step.delay);
      });
    }
  }, [capturedPhoto]);

  const captureAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: captureScale.value }],
    };
  });

  const photoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: photoOpacity.value,
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${analysisProgress.value * 100}%`,
    };
  });

  const handleCameraPermission = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to take a photo of your package.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Settings', onPress: () => requestPermission() },
          ]
        );
        return false;
      }
    }
    return true;
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      captureScale.value = withSpring(0.9, { duration: 100 }, () => {
        captureScale.value = withSpring(1, { duration: 200 });
      });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const retakePicture = () => {
    photoOpacity.value = withTiming(0, { duration: 200 }, () => {
      setCapturedPhoto(null);
      setIsAnalyzing(false);
      analysisProgress.value = 0;
      setCurrentStep('Preparing analysis...');
    });
  };

  const continueToNext = () => {
    if (capturedPhoto) {
      const { nextScreen, serviceType } = route.params;
      
      // Navigate based on service type or nextScreen parameter
      if (nextScreen) {
        console.log('📷 PackagePhoto: Navigating to', nextScreen);
        navigation.navigate(nextScreen, {
          ...route.params,
          packagePhoto: capturedPhoto,
        });
      } else if (serviceType === 'standard') {
        navigation.navigate('Measuring', {
          ...route.params,
          packagePhoto: capturedPhoto,
        });
      } else {
        // Default flow for other services
        navigation.navigate('Measuring', {
          ...route.params,
          packagePhoto: capturedPhoto,
        });
      }
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={80} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to take a photo of your package
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBackPress}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show AI Analysis Screen
  if (isAnalyzing && capturedPhoto) {
    return (
      <View style={styles.analysisContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        
        <View style={styles.analysisContent}>
          <Animated.View entering={FadeIn.delay(200)}>
            <View style={styles.aiIcon}>
              <MaterialIcons name="auto-awesome" size={48} color={Colors.primary} />
            </View>
          </Animated.View>
          
          <Animated.Text 
            style={styles.analysisTitle}
            entering={SlideInUp.delay(400)}
          >
            AI Package Analysis
          </Animated.Text>
          
          <Animated.Text 
            style={styles.analysisSubtitle}
            entering={SlideInUp.delay(600)}
          >
            Our AI is analyzing your package photo to determine optimal pricing
          </Animated.Text>
          
          <Animated.View 
            style={styles.photoContainer}
            entering={SlideInUp.delay(800)}
          >
            <Image source={{ uri: capturedPhoto }} style={styles.packagePhoto} />
            <View style={styles.scanOverlay}>
              <View style={styles.scanLine} />
            </View>
          </Animated.View>
          
          <Animated.View 
            style={styles.progressContainer}
            entering={SlideInUp.delay(1000)}
          >
            <Text style={styles.stepText}>{currentStep}</Text>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(analysisProgress.value * 100)}% Complete
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Photo</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera View */}
      {!capturedPhoto ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        >
          {/* Camera Overlay */}
          <View style={styles.cameraOverlay}>
            <View style={styles.instructionContainer}>
              <Animated.View entering={FadeIn.delay(500)}>
                <Text style={styles.instructionText}>
                  Position your package in the frame
                </Text>
                <Text style={styles.instructionSubtext}>
                  Make sure the entire package is visible
                </Text>
              </Animated.View>
            </View>

            {/* Package Frame */}
            <View style={styles.packageFrame}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.topRight]} />
              <View style={[styles.frameCorner, styles.bottomLeft]} />
              <View style={[styles.frameCorner, styles.bottomRight]} />
            </View>

            {/* Capture Button */}
            <View style={styles.captureContainer}>
              <Animated.View style={captureAnimatedStyle}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                  disabled={!cameraReady}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </CameraView>
      ) : (
        /* Photo Preview with Retake Option */
        <Animated.View style={[styles.photoPreview, photoAnimatedStyle]}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
          
          {/* Photo Actions */}
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={retakePicture}
            >
              <Ionicons name="camera" size={20} color={Colors.textSecondary} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT / 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: Colors.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  instructionContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  packageFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    bottom: '35%',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  photoPreview: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  photoActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    gap: 8,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Analysis Screen Styles (copied from ExpressOrderSummary)
  analysisContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  analysisContent: {
    alignItems: 'center',
    width: '100%',
  },
  aiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  analysisSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  packagePhoto: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    minHeight: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});

export default PackagePhotoScreen;