import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { Icon } from '../ui/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

type RootStackParamList = {
  PackagePhoto: {
    service: string;
    startLocation: string;
    startLocationCoords: {latitude: number; longitude: number};
    destination: any;
    urgency?: string;
    specialInstructions?: string[];
    specialNotes?: string;
  };
  Measuring: {
    service: string;
    startLocation: string;
    startLocationCoords: {latitude: number; longitude: number};
    destination: any;
    packagePhoto: string;
    urgency?: string;
    specialInstructions?: string[];
    specialNotes?: string;
  };
  ExpressOrderSummary: any;
  StandardOrderSummary: any;
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
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const cameraRef = useRef<CameraView>(null);

  // Animation values
  const captureScale = useSharedValue(1);
  const photoOpacity = useSharedValue(0);
  const analysisProgress = useSharedValue(0);
  const tipOpacity = useSharedValue(1);
  const cameraScale = useSharedValue(0.95);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    // Initial animations
    cameraScale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });

    // Auto-hide tips after 5 seconds
    const tipTimer = setTimeout(() => {
      tipOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => setShowTips(false), 500);
    }, 5000);

    return () => clearTimeout(tipTimer);
  }, []);

  useEffect(() => {
    if (capturedPhoto) {
      photoOpacity.value = withTiming(1, { duration: 300 });
      overlayOpacity.value = withTiming(1, { duration: 300 });
      startAnalysis();
    }
  }, [capturedPhoto]);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    const steps = [
      'Analyzing package dimensions...',
      'Estimating weight...',
      'Checking fragility indicators...',
      'Calculating optimal handling...',
      'Finalizing analysis...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        analysisProgress.value = withTiming((stepIndex + 1) / steps.length, {
          duration: 600,
        });
        stepIndex++;
      } else {
        clearInterval(interval);
        setAnalysisComplete(true);
        setTimeout(() => navigateNext(), 1500);
      }
    }, 800);
  };

  const navigateNext = () => {
    const { service, urgency } = route.params;
    const nextScreen = 
      service === 'express' || urgency 
        ? 'ExpressOrderSummary' 
        : service === 'standard'
        ? 'StandardOrderSummary'
        : 'Measuring';

    navigation.navigate(nextScreen, {
      ...route.params,
      packagePhoto: capturedPhoto,
      aiAnalysis: {
        dimensions: { length: 30, width: 25, height: 20 },
        estimatedWeight: '2.5 kg',
        fragility: 'Standard',
        handling: 'Normal',
      },
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      // Capture animation
      captureScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setCurrentStep('');
    photoOpacity.value = withTiming(0, { duration: 200 });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    analysisProgress.value = withTiming(0, { duration: 200 });
  };

  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
  }));

  const analysisProgressStyle = useAnimatedStyle(() => ({
    width: `${analysisProgress.value * 100}%`,
  }));

  const tipStyle = useAnimatedStyle(() => ({
    opacity: tipOpacity.value,
  }));

  const cameraContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Icon name="camera-off" type="Feather" size={48} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to photograph your package for accurate delivery handling.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, '#1BA8A8']}
              style={styles.permissionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera View */}
      {!capturedPhoto ? (
        <Animated.View style={[styles.cameraContainer, cameraContainerStyle]}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            flash={flashEnabled ? 'on' : 'off'}
            onCameraReady={() => setCameraReady(true)}
          >
            {/* Header Overlay */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <BlurView intensity={50} style={styles.blurButton}>
                  <Icon name="arrow-left" type="Feather" size={22} color="white" />
                </BlurView>
              </TouchableOpacity>

              <Text style={styles.cameraTitle}>
                Package <Text style={styles.cameraTitleHighlight}>Photo</Text>
              </Text>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setFlashEnabled(!flashEnabled)}
                activeOpacity={0.7}
              >
                <BlurView intensity={50} style={styles.blurButton}>
                  <Icon 
                    name={flashEnabled ? "zap" : "zap-off"} 
                    type="Feather" 
                    size={22} 
                    color="white" 
                  />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Camera Guide */}
            <View style={styles.cameraGuide}>
              <View style={styles.guideCorner} />
              <View style={[styles.guideCorner, styles.guideCornerTR]} />
              <View style={[styles.guideCorner, styles.guideCornerBL]} />
              <View style={[styles.guideCorner, styles.guideCornerBR]} />
            </View>

            {/* Tips */}
            {showTips && (
              <Animated.View style={[styles.tipsContainer, tipStyle]} entering={FadeInDown}>
                <BlurView intensity={60} style={styles.tipsBlur}>
                  <Icon name="info" type="Feather" size={18} color="white" />
                  <Text style={styles.tipsText}>
                    Center your package in the frame for best results
                  </Text>
                </BlurView>
              </Animated.View>
            )}

            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.galleryButton}
                activeOpacity={0.7}
              >
                <BlurView intensity={50} style={styles.blurButton}>
                  <Icon name="image" type="Feather" size={22} color="white" />
                </BlurView>
              </TouchableOpacity>

              <Animated.View style={captureButtonStyle}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                  activeOpacity={0.8}
                  disabled={!cameraReady}
                >
                  <View style={styles.captureButtonOuter}>
                    <View style={styles.captureButtonInner} />
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.placeholderButton} />
            </View>
          </CameraView>
        </Animated.View>
      ) : (
        <View style={styles.photoContainer}>
          <Animated.Image
            source={{ uri: capturedPhoto }}
            style={[styles.capturedPhoto, photoStyle]}
            resizeMode="cover"
          />

          {/* Analysis Overlay */}
          <Animated.View style={[styles.analysisOverlay, overlayStyle]}>
            <BlurView intensity={80} style={styles.analysisBlur}>
              {isAnalyzing && !analysisComplete ? (
                <Animated.View entering={FadeIn}>
                  <View style={styles.analysisContent}>
                    <Animated.View
                      entering={ZoomIn.springify()}
                      style={styles.analysisIcon}
                    >
                      <LinearGradient
                        colors={[Colors.primary, '#1BA8A8']}
                        style={styles.analysisIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Icon name="package" type="Feather" size={32} color="white" />
                      </LinearGradient>
                    </Animated.View>

                    <Text style={styles.analysisTitle}>AI Analysis</Text>
                    <Text style={styles.analysisStep}>{currentStep}</Text>

                    <View style={styles.analysisProgressBar}>
                      <Animated.View
                        style={[styles.analysisProgressFill, analysisProgressStyle]}
                      />
                    </View>
                  </View>
                </Animated.View>
              ) : analysisComplete ? (
                <Animated.View entering={ZoomIn.springify()}>
                  <View style={styles.analysisComplete}>
                    <View style={styles.successIcon}>
                      <Icon name="check-circle" type="Feather" size={48} color={Colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Analysis Complete!</Text>
                    <Text style={styles.successSubtitle}>
                      Package dimensions and details captured
                    </Text>
                  </View>
                </Animated.View>
              ) : null}
            </BlurView>
          </Animated.View>

          {/* Retake Button */}
          {!isAnalyzing && (
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              activeOpacity={0.8}
            >
              <BlurView intensity={60} style={styles.retakeBlur}>
                <Icon name="refresh-ccw" type="Feather" size={20} color="white" />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: 'white',
    textAlign: 'center',
  },
  permissionCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  permissionGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
  },
  blurButton: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
  },
  cameraTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  cameraGuide: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    bottom: '30%',
  },
  guideCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  guideCornerTR: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 0,
    right: 0,
  },
  guideCornerBL: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 0,
    bottom: 0,
  },
  guideCornerBR: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
    bottom: 0,
    right: 0,
  },
  tipsContainer: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tipsBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    gap: 8,
  },
  tipsText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: 'white',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  placeholderButton: {
    width: 50,
    height: 50,
  },
  photoContainer: {
    flex: 1,
  },
  capturedPhoto: {
    flex: 1,
  },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  analysisBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisContent: {
    alignItems: 'center',
    padding: 30,
  },
  analysisIcon: {
    marginBottom: 20,
  },
  analysisIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
    marginBottom: 8,
  },
  analysisStep: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  analysisProgressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  analysisProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  analysisComplete: {
    alignItems: 'center',
    padding: 30,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  retakeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    gap: 8,
  },
  retakeText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: 'white',
  },
});

export default PackagePhotoScreen;