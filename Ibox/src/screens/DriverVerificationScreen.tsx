import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  step: string;
}

interface UploadedImage {
  uri: string;
  type: 'front' | 'back' | 'left' | 'right' | 'interior' | 'single';
}

const DriverVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { step } = route.params as RouteParams;
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Animation values
  const scaleAnim = useSharedValue(0.95);
  const progressAnim = useSharedValue(0);
  const successAnim = useSharedValue(0);
  const headerAnim = useSharedValue(0);
  const cardAnim = useSharedValue(30);
  
  useEffect(() => {
    // Initial animations
    headerAnim.value = withDelay(100, withTiming(1, { duration: 800 }));
    cardAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    scaleAnim.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 100 }));
    
    // Update progress based on uploaded images
    const config = getStepConfig();
    const progress = uploadedImages.length / Math.max(config.imageTypes.length, 1);
    progressAnim.value = withTiming(progress, { duration: 500 });
  }, [uploadedImages]);

  const getStepConfig = () => {
    switch (step) {
      case 'profilePhoto':
        return {
          title: 'Profile Photo',
          subtitle: 'Professional headshot verification',
          description: 'Upload a clear, recent photo of yourself for identity verification',
          detailedInstructions: 'This helps customers and our team recognize you during deliveries. Make sure your face is clearly visible and well-lit.',
          icon: 'camera',
          color: '#3B82F6',
          gradient: ['#3B82F6', '#1D4ED8'],
          estimatedTime: '2 minutes',
          requirements: [
            { text: 'Face clearly visible and centered', icon: 'user', tip: 'Position yourself directly facing the camera' },
            { text: 'Good lighting, preferably natural', icon: 'sun', tip: 'Face a window or use bright indoor lighting' },
            { text: 'No sunglasses, hats, or face coverings', icon: 'eye', tip: 'Remove any items that obscure your face' },
            { text: 'Professional appearance and expression', icon: 'smile', tip: 'Dress as you would for work deliveries' },
            { text: 'Plain background preferred', icon: 'image', tip: 'Stand against a wall or plain backdrop' },
          ],
          imageTypes: ['single'],
          tips: [
            'Use your phone\'s front camera for best results',
            'Take the photo in a well-lit room or outdoors',
            'Keep a neutral, friendly expression',
          ],
        };
      case 'driverLicense':
        return {
          title: 'Driver License',
          subtitle: 'Valid driving credentials',
          description: 'Upload clear photos of both sides of your current driver license',
          detailedInstructions: 'We need to verify your legal driving status and ensure all information is current and valid.',
          icon: 'credit-card',
          color: '#10B981',
          gradient: ['#10B981', '#047857'],
          estimatedTime: '3 minutes',
          requirements: [
            { text: 'Both front and back sides required', icon: 'copy', tip: 'Take separate photos of each side' },
            { text: 'All text clearly readable', icon: 'type', tip: 'Ensure no blur or distortion in the text' },
            { text: 'No glare, shadows, or reflections', icon: 'zap-off', tip: 'Avoid bright lights and camera flash' },
            { text: 'License must be current and valid', icon: 'calendar', tip: 'Check your expiration date before uploading' },
            { text: 'Flat surface, no bending or folding', icon: 'square', tip: 'Place on a flat, dark surface' },
          ],
          imageTypes: ['front', 'back'],
          tips: [
            'Place license on a dark, flat surface',
            'Use good lighting but avoid flash',
            'Make sure all corners are visible in the photo',
          ],
        };
      case 'vehiclePhotos':
        return {
          title: 'Vehicle Photos',
          subtitle: 'Complete vehicle documentation',
          description: 'Capture your vehicle from all required angles to verify condition',
          detailedInstructions: 'These photos help customers identify your vehicle and ensure it meets our safety and quality standards.',
          icon: 'truck',
          color: '#8B5CF6',
          gradient: ['#8B5CF6', '#7C3AED'],
          estimatedTime: '5 minutes',
          requirements: [
            { text: 'Front view showing entire vehicle', icon: 'arrow-up', tip: 'Stand back far enough to capture the whole car' },
            { text: 'Back view with license plate visible', icon: 'arrow-down', tip: 'Ensure plate numbers are clearly readable' },
            { text: 'Left and right side profiles', icon: 'arrow-left', tip: 'Show the full length of each side' },
            { text: 'Interior dashboard and front seats', icon: 'home', tip: 'Clean interior before photographing' },
            { text: 'Vehicle appears clean and maintained', icon: 'check-circle', tip: 'Wash your car before taking photos' },
          ],
          imageTypes: ['front', 'back', 'left', 'right', 'interior'],
          tips: [
            'Take photos during daylight for best visibility',
            'Clean your vehicle before photographing',
            'Remove personal items from interior shots',
          ],
        };
      case 'vehiclePlate':
        return {
          title: 'License Plate',
          subtitle: 'Vehicle identification',
          description: 'Capture a clear photo of your vehicle\'s license plate',
          detailedInstructions: 'This verifies that your vehicle matches your registration and helps with delivery identification.',
          icon: 'hash',
          color: '#F59E0B',
          gradient: ['#F59E0B', '#D97706'],
          estimatedTime: '1 minute',
          requirements: [
            { text: 'All characters clearly visible', icon: 'type', tip: 'Get close enough to read every character' },
            { text: 'No dirt, snow, or obstructions', icon: 'x-circle', tip: 'Clean the plate before photographing' },
            { text: 'Straight-on angle, not tilted', icon: 'square', tip: 'Position yourself directly in front of the plate' },
            { text: 'Good lighting without glare', icon: 'sun', tip: 'Avoid direct sunlight causing reflections' },
          ],
          imageTypes: ['single'],
          tips: [
            'Clean your license plate before photographing',
            'Take photo from directly in front of the plate',
            'Ensure all numbers and letters are sharp and clear',
          ],
        };
      case 'insurance':
        return {
          title: 'Insurance Documents',
          subtitle: 'Valid coverage verification',
          description: 'Upload current vehicle insurance certificate or card',
          detailedInstructions: 'We require proof of valid insurance coverage to protect both you and our customers during deliveries.',
          icon: 'shield',
          color: '#EF4444',
          gradient: ['#EF4444', '#DC2626'],
          estimatedTime: '3 minutes',
          requirements: [
            { text: 'Current policy, not expired', icon: 'calendar', tip: 'Check the effective dates on your policy' },
            { text: 'Your name exactly as registered', icon: 'user', tip: 'Name must match your driver license' },
            { text: 'Vehicle details match registration', icon: 'truck', tip: 'VIN, make, and model must be correct' },
            { text: 'Coverage amounts clearly visible', icon: 'dollar-sign', tip: 'All liability amounts must be readable' },
            { text: 'Official insurance company document', icon: 'file-text', tip: 'Use original insurance card or certificate' },
          ],
          imageTypes: ['front', 'back'],
          tips: [
            'Use your physical insurance card if available',
            'Digital insurance cards from apps are acceptable',
            'Ensure all text is clear and readable',
          ],
        };
      case 'backgroundCheck':
        return {
          title: 'Background Check',
          subtitle: 'Security verification process',
          description: 'Complete automated background and driving record verification',
          detailedInstructions: 'This comprehensive check ensures the safety and security of our platform for all users.',
          icon: 'check-circle',
          color: '#06B6D4',
          gradient: ['#06B6D4', '#0891B2'],
          estimatedTime: '24-48 hours',
          requirements: [
            { text: 'Valid government-issued ID verification', icon: 'credit-card', tip: 'Your driver license will be cross-referenced' },
            { text: 'Criminal background history check', icon: 'shield', tip: 'Standard screening for safety compliance' },
            { text: 'Driving record verification', icon: 'truck', tip: 'Ensures safe driving history' },
            { text: 'Identity and address confirmation', icon: 'home', tip: 'Verifies your current information' },
          ],
          imageTypes: [],
          tips: [
            'This process is completely automated',
            'You\'ll receive email updates on progress',
            'Most checks complete within 24 hours',
          ],
        };
      default:
        return {
          title: 'Verification',
          subtitle: 'Document verification',
          description: 'Complete your verification process',
          detailedInstructions: '',
          icon: 'check',
          color: Colors.primary,
          gradient: [Colors.primary, '#764ba2'],
          estimatedTime: '5 minutes',
          requirements: [],
          imageTypes: [],
          tips: [],
        };
    }
  };

  const config = getStepConfig();

  const pickImage = async (type: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'single' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newImage: UploadedImage = {
        uri: result.assets[0].uri,
        type: type as any,
      };
      setUploadedImages([...uploadedImages, newImage]);
    }
  };

  const takePhoto = async (type: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permissions are required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'single' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newImage: UploadedImage = {
        uri: result.assets[0].uri,
        type: type as any,
      };
      setUploadedImages([...uploadedImages, newImage]);
    }
  };

  const removeImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  const handleImageUpload = (type: string) => {
    Alert.alert(
      'Choose Source',
      'Select image source',
      [
        { text: 'Camera', onPress: () => takePhoto(type) },
        { text: 'Gallery', onPress: () => pickImage(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (uploadedImages.length < config.imageTypes.length) {
      Alert.alert('Incomplete', 'Please upload all required images.');
      return;
    }

    setIsUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Upload to backend
    setTimeout(() => {
      setIsUploading(false);
      Alert.alert(
        'Success',
        'Documents uploaded successfully. We will review them shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 2000);
  };

  const renderEnhancedImageUploadCard = (type: string, label: string, index: number) => {
    const existingImage = uploadedImages.find(img => img.type === type);
    const config = getStepConfig();

    return (
      <Animated.View
        entering={ZoomIn.delay(800 + index * 150).springify()}
        key={type}
        style={config.imageTypes.length === 1 ? styles.premiumUploadCardSingle : styles.premiumUploadCard}
      >
        {existingImage ? (
          <View style={styles.premiumUploadedImageContainer}>
            {/* Image Preview */}
            <Image source={{ uri: existingImage.uri }} style={styles.premiumUploadedImage} />
            
            {/* Success Overlay */}
            <View style={styles.imageSuccessOverlay}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.9)', 'rgba(5, 150, 105, 0.9)']}
                style={styles.successGradient}
              >
                <Icon name="check-circle" type="Feather" size={28} color={Colors.white} />
                <Text style={styles.successText}>Verified</Text>
              </LinearGradient>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.premiumRemoveImageButton}
              onPress={() => {
                const index = uploadedImages.indexOf(existingImage);
                removeImage(index);
              }}
              activeOpacity={0.8}
            >
              <BlurView intensity={60} tint="dark" style={styles.premiumRemoveImageBlur}>
                <Icon name="x" type="Feather" size={18} color={Colors.white} />
              </BlurView>
            </TouchableOpacity>

            {/* Enhanced Image Label */}
            <View style={styles.premiumImageLabel}>
              <BlurView intensity={40} tint="dark" style={styles.imageLabelBlur}>
                <Text style={styles.premiumImageLabelText}>{label}</Text>
              </BlurView>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.premiumUploadButton}
            onPress={() => handleImageUpload(type)}
            activeOpacity={0.8}
          >
            {/* Upload Icon with Animation */}
            <View style={[styles.premiumUploadIconContainer, { backgroundColor: `${config.color}15` }]}>
              <LinearGradient
                colors={config.gradient}
                style={styles.uploadIconGradient}
              >
                <Icon name="camera" type="Feather" size={32} color={Colors.white} />
              </LinearGradient>
            </View>
            
            {/* Upload Content */}
            <View style={styles.uploadContent}>
              <Text style={styles.premiumUploadButtonText}>{label}</Text>
              <Text style={styles.premiumUploadButtonHint}>Tap to capture or select</Text>
            </View>

            {/* Upload Indicator */}
            <View style={styles.uploadIndicator}>
              <Icon name="plus-circle" type="Feather" size={20} color={config.color} />
            </View>

            {/* Dashed Border Animation */}
            <View style={[styles.dashedBorder, { borderColor: `${config.color}40` }]} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderImageUploadCard = (type: string, label: string) => {
    return renderEnhancedImageUploadCard(type, label, 0);
  };

  const getImageLabels = () => {
    switch (step) {
      case 'vehiclePhotos':
        return {
          front: 'Front View',
          back: 'Back View',
          left: 'Left Side',
          right: 'Right Side',
          interior: 'Interior',
        };
      case 'driverLicense':
      case 'insurance':
        return {
          front: 'Front Side',
          back: 'Back Side',
        };
      default:
        return {
          single: config.title,
        };
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [
      {
        translateY: interpolate(
          headerAnim.value,
          [0, 1],
          [-20, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardAnim.value },
      { scale: scaleAnim.value },
    ],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  if (step === 'backgroundCheck') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Enhanced Header */}
        <Animated.View style={[headerAnimatedStyle]}>
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumHeader}
          >
            <TouchableOpacity
              style={styles.premiumBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                <Icon name="arrow-left" type="Feather" size={24} color={Colors.white} />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Icon name={config.icon} type="Feather" size={24} color={Colors.white} />
                </View>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.premiumHeaderTitle}>{config.title}</Text>
                <Text style={styles.premiumHeaderSubtitle}>{config.subtitle}</Text>
              </View>
            </View>

            <View style={styles.headerDecorations}>
              <View style={styles.headerDot} />
              <View style={styles.headerDot} />
              <View style={styles.headerDot} />
            </View>
          </LinearGradient>
        </Animated.View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[cardAnimatedStyle, styles.backgroundCheckContainer]}>
            {/* Hero Card */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.premiumInfoCard}
            >
              <View style={styles.heroIconContainer}>
                <LinearGradient
                  colors={config.gradient}
                  style={styles.heroIcon}
                >
                  <Icon name="shield" type="Feather" size={40} color={Colors.white} />
                </LinearGradient>
                <View style={styles.heroIconGlow} />
              </View>
              
              <Text style={styles.premiumInfoTitle}>Automated Security Verification</Text>
              <Text style={styles.premiumInfoDescription}>
                {config.detailedInstructions}
              </Text>
              
              <View style={styles.timeEstimate}>
                <Icon name="clock" type="Feather" size={16} color={config.color} />
                <Text style={[styles.timeText, { color: config.color }]}>
                  Processing time: {config.estimatedTime}
                </Text>
              </View>
            </Animated.View>

            {/* Enhanced Requirements */}
            <Animated.View
              entering={FadeInDown.delay(500).springify()}
              style={styles.premiumRequirementsCard}
            >
              <View style={styles.requirementsHeader}>
                <Text style={styles.premiumRequirementsTitle}>
                  What we verify during this process:
                </Text>
              </View>
              
              {config.requirements.map((requirement, index) => (
                <Animated.View
                  key={index}
                  entering={SlideInRight.delay(700 + index * 100).springify()}
                  style={styles.premiumRequirementItem}
                >
                  <View style={styles.requirementIconContainer}>
                    <LinearGradient
                      colors={['#10B981', '#047857']}
                      style={styles.requirementIconGradient}
                    >
                      <Icon name={requirement.icon} type="Feather" size={16} color={Colors.white} />
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.requirementContent}>
                    <Text style={styles.premiumRequirementText}>{requirement.text}</Text>
                    <Text style={styles.requirementTip}>{requirement.tip}</Text>
                  </View>
                  
                  <Icon name="check-circle" type="Feather" size={18} color="#10B981" />
                </Animated.View>
              ))}
            </Animated.View>

            {/* Tips Section */}
            {config.tips.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(900).springify()}
                style={styles.tipsCard}
              >
                <View style={styles.tipsHeader}>
                  <Icon name="lightbulb" type="Feather" size={18} color="#F59E0B" />
                  <Text style={styles.tipsTitle}>Good to know</Text>
                </View>
                
                {config.tips.map((tip, index) => (
                  <Animated.View
                    key={index}
                    entering={SlideInLeft.delay(1000 + index * 100).springify()}
                    style={styles.tipItem}
                  >
                    <View style={styles.tipDot} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </Animated.View>
                ))}
              </Animated.View>
            )}

            {/* Premium CTA Button */}
            <Animated.View
              entering={FadeInUp.delay(1200).springify()}
              style={styles.premiumSubmitContainer}
            >
              <TouchableOpacity
                style={styles.premiumConsentButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    'Background Check Consent',
                    'By proceeding, you authorize us to conduct a comprehensive background verification. This helps ensure platform safety for all users.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'I Authorize',
                        style: 'default',
                        onPress: () => {
                          setShowSuccess(true);
                          successAnim.value = withSpring(1);
                          setTimeout(() => {
                            Alert.alert(
                              'Background Check Initiated', 
                              'Your background verification has been started. We\'ll notify you via email once the process is complete.',
                              [{ text: 'Got it', onPress: () => navigation.goBack() }]
                            );
                          }, 1500);
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumConsentButtonGradient}
                >
                  <View style={styles.consentButtonContent}>
                    <Text style={styles.premiumConsentButtonText}>
                      Authorize Background Check
                    </Text>
                    <Text style={styles.consentButtonSubtext}>
                      Secure & confidential verification
                    </Text>
                  </View>
                  <View style={styles.consentButtonIcon}>
                    <Icon name="shield-check" type="Feather" size={24} color={Colors.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  const imageLabels = getImageLabels();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Header with Progress */}
      <Animated.View style={[headerAnimatedStyle]}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumHeader}
        >
          <TouchableOpacity
            style={styles.premiumBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
              <Icon name="arrow-left" type="Feather" size={24} color={Colors.white} />
            </BlurView>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Icon name={config.icon} type="Feather" size={24} color={Colors.white} />
              </View>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.premiumHeaderTitle}>{config.title}</Text>
              <Text style={styles.premiumHeaderSubtitle}>{config.subtitle}</Text>
            </View>
          </View>

          {/* Progress Indicator */}
          <View style={styles.headerProgress}>
            <Text style={styles.progressText}>
              {uploadedImages.length}/{config.imageTypes.length}
            </Text>
          </View>
        </LinearGradient>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressBarFill,
                progressAnimatedStyle,
                { backgroundColor: config.color }
              ]}
            />
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={cardAnimatedStyle}>
          {/* Hero Instructions Card */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.premiumInstructionsCard}
          >
            <View style={styles.instructionsHero}>
              <View style={styles.instructionsIconContainer}>
                <LinearGradient
                  colors={config.gradient}
                  style={styles.instructionsIcon}
                >
                  <Icon name={config.icon} type="Feather" size={32} color={Colors.white} />
                </LinearGradient>
              </View>
              
              <View style={styles.instructionsContent}>
                <Text style={styles.premiumInstructionsTitle}>{config.description}</Text>
                <Text style={styles.instructionsDescription}>
                  {config.detailedInstructions}
                </Text>
                
                <View style={styles.timeEstimate}>
                  <Icon name="clock" type="Feather" size={16} color={config.color} />
                  <Text style={[styles.timeText, { color: config.color }]}>
                    Est. time: {config.estimatedTime}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Enhanced Requirements List */}
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.premiumRequirementsCard}
          >
            <View style={styles.requirementsHeader}>
              <Text style={styles.premiumRequirementsTitle}>
                Photo requirements & tips
              </Text>
            </View>
            
            {config.requirements.map((requirement, index) => (
              <Animated.View
                key={index}
                entering={SlideInRight.delay(700 + index * 100).springify()}
                style={styles.premiumRequirementItem}
              >
                <View style={styles.requirementIconContainer}>
                  <LinearGradient
                    colors={[config.color, config.gradient[1]]}
                    style={styles.requirementIconGradient}
                  >
                    <Icon name={requirement.icon} type="Feather" size={16} color={Colors.white} />
                  </LinearGradient>
                </View>
                
                <View style={styles.requirementContent}>
                  <Text style={styles.premiumRequirementText}>{requirement.text}</Text>
                  <Text style={styles.requirementTip}>{requirement.tip}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.requirementHelp}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Tip', requirement.tip);
                  }}
                >
                  <Icon name="help-circle" type="Feather" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Enhanced Upload Grid */}
          <View style={styles.premiumUploadGrid}>
            {config.imageTypes.map((type, index) => 
              renderEnhancedImageUploadCard(type, imageLabels[type], index)
            )}
          </View>

          {/* Tips Section */}
          {config.tips.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(900).springify()}
              style={styles.tipsCard}
            >
              <View style={styles.tipsHeader}>
                <Icon name="lightbulb" type="Feather" size={18} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Pro tips for better photos</Text>
              </View>
              
              {config.tips.map((tip, index) => (
                <Animated.View
                  key={index}
                  entering={SlideInLeft.delay(1000 + index * 100).springify()}
                  style={styles.tipItem}
                >
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Enhanced Submit Button */}
          {uploadedImages.length === config.imageTypes.length && (
            <Animated.View
              entering={FadeInUp.delay(1200).springify()}
              style={styles.premiumSubmitContainer}
            >
              <TouchableOpacity
                style={styles.premiumSubmitButton}
                onPress={handleSubmit}
                disabled={isUploading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumSubmitButtonGradient}
                >
                  {isUploading ? (
                    <View style={styles.submitButtonContent}>
                      <ActivityIndicator size="small" color={Colors.white} />
                      <Text style={styles.premiumSubmitButtonText}>Processing...</Text>
                    </View>
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Text style={styles.premiumSubmitButtonText}>Submit for Verification</Text>
                      <Text style={styles.submitButtonSubtext}>
                        Review typically takes 2-4 hours
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.submitButtonIcon}>
                    <Icon 
                      name={isUploading ? "upload-cloud" : "check-circle"} 
                      type="Feather" 
                      size={24} 
                      color={Colors.white} 
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
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
  
  // Premium Header System
  premiumHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 10,
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 60,
  },
  headerIconContainer: {
    marginRight: 16,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  premiumHeaderTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
    marginBottom: 4,
  },
  premiumHeaderSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.PlayfairDisplay?.Variable,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
  },
  headerProgress: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
  },
  headerDecorations: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  
  // Progress Bar
  progressBarContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  
  // Premium Cards
  premiumInstructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  instructionsHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsIconContainer: {
    marginRight: 20,
  },
  instructionsIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  instructionsContent: {
    flex: 1,
    paddingTop: 8,
  },
  premiumInstructionsTitle: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 26,
  },
  instructionsDescription: {
    fontSize: 15,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay?.Medium,
    marginLeft: 6,
  },
  
  // Premium Requirements
  premiumRequirementsCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  requirementsHeader: {
    marginBottom: 20,
  },
  premiumRequirementsTitle: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.textPrimary,
  },
  premiumRequirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingVertical: 4,
  },
  requirementIconContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  requirementIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  requirementContent: {
    flex: 1,
    marginRight: 12,
  },
  premiumRequirementText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay?.Medium,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  requirementTip: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  requirementHelp: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  
  // Premium Upload Grid
  premiumUploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  premiumUploadCard: {
    width: (width - 52) / 2,
    height: (width - 52) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumUploadCardSingle: {
    width: width - 40,
    height: 200,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Premium Upload Button
  premiumUploadButton: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    position: 'relative',
    padding: 20,
  },
  premiumUploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumUploadButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  premiumUploadButtonHint: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  uploadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  dashedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    opacity: 0.5,
  },
  
  // Premium Uploaded Image
  premiumUploadedImageContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumUploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  imageSuccessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  successText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
    marginTop: 8,
  },
  premiumRemoveImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumRemoveImageBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  premiumImageLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  imageLabelBlur: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  premiumImageLabelText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
    textAlign: 'center',
  },
  
  // Tips Card
  tipsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: '#92400E',
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 12,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: '#92400E',
    lineHeight: 20,
  },
  
  // Premium Submit Button
  premiumSubmitContainer: {
    marginTop: 24,
  },
  premiumSubmitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumSubmitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  submitButtonContent: {
    flex: 1,
  },
  premiumSubmitButtonText: {
    fontSize: 18,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
    marginBottom: 4,
  },
  submitButtonSubtext: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: 'rgba(255,255,255,0.9)',
  },
  submitButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Premium Background Check Styles
  backgroundCheckContainer: {
    flex: 1,
  },
  premiumInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heroIconGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    opacity: 0.6,
  },
  premiumInfoTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumInfoDescription: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Premium Consent Button
  premiumConsentButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  premiumConsentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 28,
  },
  consentButtonContent: {
    flex: 1,
  },
  premiumConsentButtonText: {
    fontSize: 20,
    fontFamily: Fonts.SFProDisplay?.Bold,
    color: Colors.white,
    marginBottom: 6,
  },
  consentButtonSubtext: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay?.Regular,
    color: 'rgba(255,255,255,0.9)',
  },
  consentButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DriverVerificationScreen;

