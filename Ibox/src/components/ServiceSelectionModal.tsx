import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import { Icon } from '../ui/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

// Animation constants
const COMPACT_WIDTH = SCREEN_WIDTH * 0.92;
const EXPANDED_WIDTH = SCREEN_WIDTH;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.65;
const COMPACT_HEIGHT = 72;
const BOTTOM_MARGIN = 20;

interface ServiceSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceId: string) => void;
  onContinue?: (serviceId: string) => void;
  onReset?: () => void;
  destination?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialIcons';
  price: string;
  estimatedTime: string;
  color: string;
}

const services: Service[] = [
  {
    id: 'express',
    title: 'Express Delivery',
    description: 'Fast delivery for urgent packages',
    icon: 'flash',
    iconFamily: 'Ionicons',
    price: 'From $15',
    estimatedTime: '30-60 min',
    color: '#FF6B6B',
  },
  {
    id: 'standard',
    title: 'Standard Delivery',
    description: 'Regular delivery for everyday items',
    icon: 'cube-outline',
    iconFamily: 'Ionicons',
    price: 'From $8',
    estimatedTime: '1-3 hours',
    color: '#4ECDC4',
  },
  {
    id: 'moving',
    title: 'Moving Service',
    description: 'Professional moving assistance',
    icon: 'local-shipping',
    iconFamily: 'MaterialIcons',
    price: 'From $50',
    estimatedTime: '2-4 hours',
    color: '#45B7D1',
  },
];

const ServiceSelectionModal: React.FC<ServiceSelectionModalProps> = ({
  visible,
  onClose,
  onSelectService,
  onContinue,
  onReset,
  destination,
}) => {
  const [animationState, setAnimationState] = useState<'hidden' | 'compact' | 'expanded'>('hidden');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  
  // Animation values
  const animationProgress = useSharedValue(0); // 0 = hidden, 1 = compact, 2 = expanded
  const backdropOpacity = useSharedValue(0);
  const backdropBlur = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show compact state first
      setAnimationState('compact');
      animationProgress.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
        mass: 0.8,
      });
      // Don't show backdrop in compact state
      backdropOpacity.value = withTiming(0, { duration: 0 });
      contentOpacity.value = withTiming(1, { duration: 200 });
      
      // Auto-expand after a short delay for smooth transition
      setTimeout(() => {
        expandToFullWidth();
      }, 400); // Slightly longer delay for better transition from location picker
    } else {
      // Hide modal
      setAnimationState('hidden');
      animationProgress.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
      backdropBlur.value = withTiming(0, { duration: 200 });
      contentOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const expandToFullWidth = () => {
    setAnimationState('expanded');
    animationProgress.value = withSpring(2, {
      damping: 18,
      stiffness: 120,
      mass: 1,
    });
    backdropOpacity.value = withTiming(0.6, { duration: 300 });
    backdropBlur.value = withTiming(10, { duration: 300 });
  };

  const collapseToCompact = () => {
    setAnimationState('compact');
    animationProgress.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
      mass: 0.8,
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
    backdropBlur.value = withTiming(0, { duration: 200 });
    dragY.value = withSpring(0);
  };

  const closeModal = () => {
    onClose();
  };

  // Gesture handler for swipe interactions
  const panGesture = Gesture.Pan()
    .onStart(() => {})
    .onUpdate((event) => {
      if (animationState === 'expanded') {
        dragY.value = Math.max(0, event.translationY);
      }
    })
    .onEnd((event) => {
      if (animationState === 'expanded') {
        if (event.translationY > 100 || event.velocityY > 500) {
          if (dragY.value > EXPANDED_HEIGHT * 0.3) {
            runOnJS(closeModal)();
          } else {
            runOnJS(collapseToCompact)();
      }
    } else {
          dragY.value = withSpring(0);
        }
      }
    });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalContainerStyle = useAnimatedStyle(() => {
    const isExpanded = animationProgress.value >= 1.5;

    const width = interpolate(
      animationProgress.value,
      [0, 1, 2],
      [COMPACT_WIDTH, COMPACT_WIDTH, EXPANDED_WIDTH],
      Extrapolation.CLAMP
    );

    const height = interpolate(
      animationProgress.value,
      [0, 1, 2],
      [COMPACT_HEIGHT, COMPACT_HEIGHT, EXPANDED_HEIGHT],
      Extrapolation.CLAMP
    );

    const bottomOffset = interpolate(
      animationProgress.value,
      [0, 1, 2],
      [-(COMPACT_HEIGHT + BOTTOM_MARGIN), BOTTOM_MARGIN, 0],
      Extrapolation.CLAMP
    );

    const borderRadius = interpolate(
      animationProgress.value,
      [0, 1, 2],
      [24, 24, 20],
      Extrapolation.CLAMP
    );

    return {
      width,
      height: height + dragY.value,
      bottom: bottomOffset,
      borderRadius,
      transform: [{ translateY: isExpanded ? dragY.value : 0 }],
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [1, 1.5, 2],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    onSelectService(serviceId);
    // Smooth closing animation
    setTimeout(() => {
      collapseToCompact();
      setTimeout(() => {
        closeModal();
      }, 200);
    }, 200);
  };

  const renderIcon = (service: Service) => {
    const IconComponent = service.iconFamily === 'Ionicons' ? Ionicons : MaterialIcons;
    return (
      <IconComponent
        name={service.icon as any}
        size={22}
        color="white"
      />
    );
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop - Only show when expanded */}
      {animationState === 'expanded' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#000',
              },
              backdropStyle,
            ]}
          >
        <TouchableOpacity 
              style={{ flex: 1 }}
          activeOpacity={1}
              onPress={closeModal}
            />
      </Animated.View>

          {/* Blur View */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              },
              blurStyle,
            ]}
          >
            <BlurView
              intensity={10}
              style={{ flex: 1 }}
              experimentalBlurMethod="dimezisBlurView"
            />
          </Animated.View>
        </View>
      )}

      {/* Modal Container */}
      <View 
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          alignItems: 'center',
          zIndex: animationState === 'expanded' ? 1000 : 10,
        }}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 6,
                overflow: 'hidden',
              },
              modalContainerStyle,
            ]}
          >
            <Animated.View style={[{ flex: 1 }, contentStyle]}>
              {/* Handle Bar - Only visible when expanded */}
              {animationState === 'expanded' && (
                <Animated.View
                  style={[
                    {
                      alignItems: 'center',
                      paddingTop: 12,
                      paddingBottom: 8,
                    },
                    handleBarStyle,
                  ]}
                >
                  <View
                    style={{
                      width: 36,
                      height: 4,
                      backgroundColor: '#E5E5E5',
                      borderRadius: 2,
                    }}
                  />
                </Animated.View>
              )}

              {/* Compact State Content */}
              {animationState === 'compact' && (
                <Animated.View
                  entering={FadeIn.delay(100)}
                  style={{
                    height: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    marginRight: 12
                  }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: `${Colors.primary}12`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14
                    }}>
                      <Icon name="package" type="Feather" size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text
                          style={{
                            fontSize: 17,
                            fontFamily: Fonts.SFProDisplay.Medium,
                            color: '#1A1A1A',
                            letterSpacing: -0.3,
                          }}
                        >
                          Choose{' '}
                        </Text>
                        <Text
                          style={{
                            fontSize: 18,
                            fontFamily: Fonts.PlayfairDisplay.Variable,
                            fontStyle: 'italic',
                            color: Colors.primary,
                            letterSpacing: -0.3,
                          }}
                        >
                          Service
                        </Text>
          </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: Fonts.SFProDisplay.Regular,
                          color: '#6B7280',
                          marginTop: 1,
                        }}
                      >
                        Select delivery type
                      </Text>
        </View>
          </View>
                </Animated.View>
              )}

              {/* Expanded State Content */}
              {animationState === 'expanded' && (
                <View style={{ flex: 1 }}>
                  {/* Fixed Header */}
                  <Animated.View
                    entering={FadeIn.delay(150)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F0F0',
                    }}
                  >
                    <TouchableOpacity
                      onPress={closeModal}
                      style={{ marginRight: 16 }}
                      activeOpacity={0.6}
                    >
                      <Icon name="arrow-left" type="Feather" size={24} color="#666" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontFamily: Fonts.SFProDisplay.Medium,
                          color: '#333',
                        }}
                      >
                        Choose{' '}
                      </Text>
                      <Text
                        style={{
                          fontSize: 19,
                          fontFamily: Fonts.PlayfairDisplay.Variable,
                          fontStyle: 'italic',
                          color: Colors.primary,
                        }}
                      >
                        Service
                      </Text>
                    </View>
                  </Animated.View>

        {/* Destination Info */}
        {destination && (
          <Animated.View 
                      entering={FadeIn.delay(200)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginHorizontal: 20,
                        marginTop: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: `${Colors.primary}08`,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: `${Colors.primary}20`,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: `${Colors.primary}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Icon name="map-pin" type="Feather" size={16} color={Colors.primary} />
            </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: Fonts.SFProDisplay.Regular,
                          color: '#333',
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
              {destination}
            </Text>
          </Animated.View>
        )}

        {/* Services List */}
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <Animated.View entering={FadeIn.delay(250)}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: Fonts.SFProDisplay.Medium,
                          color: '#333',
                          marginBottom: 16,
                        }}
                      >
                        Available Services
                      </Text>

            {services.map((service, index) => (
                        <Animated.View
                          key={service.id}
                          entering={FadeIn.delay(300 + index * 50)}
                        >
              <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 16,
                              paddingHorizontal: 16,
                              backgroundColor: selectedServiceId === service.id ? `${service.color}08` : '#F8F8F8',
                              borderRadius: 16,
                              marginBottom: 12,
                              borderWidth: 1,
                              borderColor: selectedServiceId === service.id ? `${service.color}40` : '#E5E5E5',
                            }}
                onPress={() => handleServiceSelect(service.id)}
                activeOpacity={0.7}
              >
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: service.color,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                              }}
                            >
                    {renderIcon(service)}
                  </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontFamily: Fonts.SFProDisplay.Medium,
                                  color: '#1A1A1A',
                                  marginBottom: 4,
                                }}
                              >
                                {service.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontFamily: Fonts.SFProDisplay.Regular,
                                  color: '#6B7280',
                                  lineHeight: 18,
                                }}
                              >
                                {service.description}
                              </Text>
                </View>
                
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontFamily: Fonts.SFProDisplay.Medium,
                                  color: service.color,
                                  marginBottom: 2,
                                }}
                              >
                                {service.price}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: Fonts.SFProDisplay.Regular,
                                  color: '#9CA3AF',
                                }}
                              >
                                {service.estimatedTime}
                              </Text>
                </View>
              </TouchableOpacity>
                        </Animated.View>
            ))}
      </Animated.View>

                    {/* Reset Button */}
                    {onReset && (
                      <Animated.View
                        entering={FadeIn.delay(500)}
                        style={{ marginTop: 20 }}
                      >
                        <TouchableOpacity
                          style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
                            backgroundColor: '#F0F0F0',
                            borderRadius: 12,
                            gap: 8,
                          }}
                          onPress={onReset}
                          activeOpacity={0.7}
                        >
                          <Icon name="refresh-cw" type="Feather" size={16} color="#666" />
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: Fonts.SFProDisplay.Medium,
                              color: '#666',
                            }}
                          >
                            Reset Locations
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </ScrollView>
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    </>
  );
};

export default ServiceSelectionModal;