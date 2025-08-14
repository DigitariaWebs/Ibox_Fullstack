import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
  Vibration,
} from 'react-native';
import { CameraView, CameraCapturedPicture, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../ui';
import { Colors } from '../config/colors';
import {
  deviceWidth,
  deviceHeight,
  theme,
  scale,
  verticalScale,
  moderateScale,
  safeAreaTop,
} from '../utils/responsive';

interface CameraGuideProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photo: CameraCapturedPicture) => void;
  title: string;
  instruction: string;
  guideType?: 'rectangle' | 'square' | 'document' | 'license';
}

const CameraGuide: React.FC<CameraGuideProps> = ({
  visible,
  onClose,
  onCapture,
  title,
  instruction,
  guideType = 'rectangle',
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Animation values for guide corners
  const cornerAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start corner animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cornerAnimation, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(cornerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      Vibration.vibrate(50); // Haptic feedback
      startPulseAnimation();
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      onCapture(photo);
    } catch (error) {
      console.error('Error taking picture:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const getGuideFrameStyle = () => {
    const baseWidth = deviceWidth * 0.8;
    const aspectRatios = {
      rectangle: 4 / 3,
      square: 1,
      document: 1.4,
      license: 1.6,
    };
    
    const height = baseWidth / aspectRatios[guideType];
    
    return {
      width: baseWidth,
      height: height,
      top: (deviceHeight - height) / 2 - verticalScale(50),
    };
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-off" type="Feather" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to take photos of your documents
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const guideFrameStyle = getGuideFrameStyle();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      >
        {/* Dark Overlay with Cutout */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={[styles.overlaySection, { height: guideFrameStyle.top }]} />
          
          {/* Middle section with sides */}
          <View style={styles.middleSection}>
            {/* Left overlay */}
            <View style={[
              styles.overlaySection,
              { width: (deviceWidth - guideFrameStyle.width) / 2 }
            ]} />
            
            {/* Clear area for guide frame */}
            <View style={[styles.guideFrame, guideFrameStyle]}>
              {/* Animated corner brackets */}
              <Animated.View style={[
                styles.corner,
                styles.topLeft,
                { opacity: cornerAnimation }
              ]} />
              <Animated.View style={[
                styles.corner,
                styles.topRight,
                { opacity: cornerAnimation }
              ]} />
              <Animated.View style={[
                styles.corner,
                styles.bottomLeft,
                { opacity: cornerAnimation }
              ]} />
              <Animated.View style={[
                styles.corner,
                styles.bottomRight,
                { opacity: cornerAnimation }
              ]} />
              
              {/* Guide lines for document alignment */}
              {guideType === 'document' && (
                <>
                  <View style={styles.guideLine} />
                  <View style={[styles.guideLine, styles.guideLineVertical]} />
                </>
              )}
            </View>
            
            {/* Right overlay */}
            <View style={[
              styles.overlaySection,
              { width: (deviceWidth - guideFrameStyle.width) / 2 }
            ]} />
          </View>
          
          {/* Bottom overlay */}
          <View style={[
            styles.overlaySection,
            { 
              flex: 1,
              minHeight: deviceHeight - guideFrameStyle.top - guideFrameStyle.height
            }
          ]} />
        </View>

        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="x" type="Feather" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.instruction}>{instruction}</Text>
          </View>
        </SafeAreaView>

        {/* Capture Controls */}
        <View style={styles.captureContainer}>
          <View style={styles.captureRow}>
            {/* Gallery button placeholder */}
            <View style={styles.gallerySpacer} />
            
            {/* Capture button */}
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.capturingButton]}
                onPress={takePicture}
                disabled={isCapturing}
                activeOpacity={0.8}
              >
                <View style={[styles.captureButtonInner, isCapturing && styles.capturingButtonInner]} />
              </TouchableOpacity>
            </Animated.View>
            
            {/* Flash toggle placeholder */}
            <View style={styles.flashSpacer} />
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  permissionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  permissionText: {
    fontSize: moderateScale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: theme.borderRadius.medium,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleSection: {
    flexDirection: 'row',
    height: 'auto',
  },
  guideFrame: {
    backgroundColor: 'transparent',
    position: 'relative',
    alignSelf: 'center',
  },
  corner: {
    position: 'absolute',
    width: scale(30),
    height: scale(30),
    borderColor: Colors.white,
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  guideLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
    left: '20%',
    right: '20%',
    height: 1,
    marginTop: -0.5,
  },
  guideLineVertical: {
    top: '20%',
    bottom: '20%',
    left: '50%',
    width: 1,
    height: 'auto',
    marginLeft: -0.5,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    zIndex: 10,
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  headerText: {
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: verticalScale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instruction: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captureContainer: {
    position: 'absolute',
    bottom: safeAreaTop,
    left: 0,
    right: 0,
    paddingBottom: verticalScale(32),
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(40),
  },
  gallerySpacer: {
    width: scale(50),
  },
  flashSpacer: {
    width: scale(50),
  },
  captureButton: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturingButton: {
    opacity: 0.8,
  },
  captureButtonInner: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Colors.white,
  },
  capturingButtonInner: {
    backgroundColor: theme.colors.primary,
  },
});

export default CameraGuide;