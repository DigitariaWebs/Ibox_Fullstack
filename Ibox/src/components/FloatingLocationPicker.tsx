import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
import { Icon } from '../ui/Icon';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';

interface FloatingLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect?: (location: any) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

// Animation constants
const COMPACT_WIDTH = SCREEN_WIDTH * 0.92;
const EXPANDED_WIDTH = SCREEN_WIDTH;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75;
const FULLSCREEN_HEIGHT = SCREEN_HEIGHT; // Full screen height for search mode
const COMPACT_HEIGHT = 66; // Optimized height for perfect vertical centering
const BOTTOM_MARGIN = 20; // Optimal spacing from bottom

export const FloatingLocationPicker: React.FC<FloatingLocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
}) => {
  const [animationState, setAnimationState] = useState<'hidden' | 'compact' | 'expanded' | 'fullscreen'>('hidden');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Google Maps API Key
  const GOOGLE_API_KEY = 'AIzaSyAzPxqQ9QhUq_cmXkkcE-6DcgJn-EDngzI';

  // Animation values
  const animationProgress = useSharedValue(0); // 0 = hidden, 1 = compact, 2 = expanded, 3 = fullscreen
  const backdropOpacity = useSharedValue(0);
  const backdropBlur = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);

  React.useEffect(() => {
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

  const expandToFullscreen = () => {
    setAnimationState('fullscreen');
    animationProgress.value = withSpring(3, {
      damping: 20,
      stiffness: 150,
      mass: 1,
    });
    backdropOpacity.value = withTiming(0.8, { duration: 300 });
    backdropBlur.value = withTiming(15, { duration: 300 });
  };

  const collapseFromFullscreen = () => {
    setAnimationState('expanded');
    animationProgress.value = withSpring(2, {
      damping: 18,
      stiffness: 120,
      mass: 1,
    });
    backdropOpacity.value = withTiming(0.6, { duration: 200 });
    backdropBlur.value = withTiming(10, { duration: 200 });
    setSearchText(''); // Clear search when collapsing
  };

  const collapseToCompact = () => {
    setAnimationState('compact');
    animationProgress.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
      mass: 0.8,
    });
    backdropOpacity.value = withTiming(0, { duration: 200 }); // Remove backdrop when collapsing
    backdropBlur.value = withTiming(0, { duration: 200 });
    dragY.value = withSpring(0);
    setSearchText(''); // Clear search when collapsing
  };

  const closeModal = () => {
    // Clean up search state when closing
    setSearchText('');
    setSearchResults([]);
    onClose();
  };

  // Search for places using Google Maps API
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Searching for places:', query);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Search response status:', data.status);
      
      if (data.status === 'OK' && data.predictions) {
        console.log('✅ Found', data.predictions.length, 'suggestions');
        const results = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          name: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
          address: prediction.structured_formatting?.secondary_text || prediction.description,
          description: prediction.description,
          fullAddress: prediction.description,
        }));
        setSearchResults(results);
      } else {
        console.log('⚠️ Search API returned status:', data.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search handler
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 500); // 500ms debounce
  };

  // Gesture handler for swipe interactions
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the initial drag position when gesture starts
    })
    .onUpdate((event) => {
      // Only allow dragging in expanded state, not fullscreen
      if (animationState === 'expanded') {
        dragY.value = Math.max(0, event.translationY);
      }
    })
    .onEnd((event) => {
      if (animationState === 'expanded') {
        if (event.translationY > 100 || event.velocityY > 500) {
          // Swipe down to close or collapse
          if (dragY.value > EXPANDED_HEIGHT * 0.3) {
            runOnJS(closeModal)();
          } else {
            runOnJS(collapseToCompact)();
          }
        } else {
          // Snap back
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
    const isFullscreen = animationProgress.value >= 2.5;

    const width = interpolate(
      animationProgress.value,
      [0, 1, 2, 3],
      [COMPACT_WIDTH, COMPACT_WIDTH, EXPANDED_WIDTH, SCREEN_WIDTH],
      Extrapolation.CLAMP
    );

    const height = interpolate(
      animationProgress.value,
      [0, 1, 2, 3],
      [COMPACT_HEIGHT, COMPACT_HEIGHT, EXPANDED_HEIGHT, FULLSCREEN_HEIGHT],
      Extrapolation.CLAMP
    );

    const bottomOffset = interpolate(
      animationProgress.value,
      [0, 1, 2, 3],
      [-(COMPACT_HEIGHT + BOTTOM_MARGIN), BOTTOM_MARGIN, 0, 0],
      Extrapolation.CLAMP
    );

    const borderRadius = interpolate(
      animationProgress.value,
      [0, 1, 2, 3],
      [24, 24, 20, 0],
      Extrapolation.CLAMP
    );

    return {
      width,
      height: height + dragY.value,
      bottom: bottomOffset,
      borderRadius,
      transform: [{ translateY: isExpanded && !isFullscreen ? dragY.value : 0 }],
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [1, 1.5, 2, 3],
      [0, 0.5, 1, 0], // Hide handle bar in fullscreen
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  if (!visible) return null;

  return (
    <>
      {/* Backdrop - Show when expanded or fullscreen */}
      {(animationState === 'expanded' || animationState === 'fullscreen') && (
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
              onPress={animationState === 'fullscreen' ? collapseFromFullscreen : collapseToCompact}
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
          zIndex: animationState === 'expanded' || animationState === 'fullscreen' ? 1000 : 10,
        }}
        pointerEvents="box-none" // Always allow touch through except on the modal itself
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
            {/* Handle Bar - Only visible when expanded (not in fullscreen) */}
            {(animationState === 'expanded') && (
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
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: `${Colors.primary}12`, // Softer teal background
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="navigation" type="Feather" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: Fonts.SFProDisplay.Medium,
                          color: '#1A1A1A',
                          letterSpacing: -0.2,
                        }}
                      >
                        Where{' '}
                      </Text>
                      <Text
                        style={{
                          fontSize: 17,
                          fontFamily: Fonts.PlayfairDisplay.Variable,
                          fontStyle: 'italic',
                          color: Colors.primary,
                          letterSpacing: -0.2,
                        }}
                      >
                        to
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: Fonts.SFProDisplay.Medium,
                          color: '#1A1A1A',
                          letterSpacing: -0.2,
                        }}
                      >
                        ?
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: Fonts.SFProDisplay.Regular,
                        color: '#6B7280',
                        marginTop: 1,
                        lineHeight: 16,
                      }}
                    >
                      Choose your destination
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={expandToFullWidth}
                  style={{
                    backgroundColor: Colors.primary,
                    paddingHorizontal: 18,
                    paddingVertical: 9,
                    borderRadius: 20,
                    shadowColor: Colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontFamily: Fonts.SFProDisplay.Medium,
                      fontWeight: '600',
                      letterSpacing: 0.1,
                    }}
                  >
                    Search
                  </Text>
                </TouchableOpacity>
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
                    onPress={collapseToCompact}
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
                      Where{' '}
                    </Text>
                    <Text
                      style={{
                        fontSize: 19,
                        fontFamily: Fonts.PlayfairDisplay.Variable,
                        fontStyle: 'italic',
                        color: Colors.primary,
                      }}
                    >
                      to
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: Fonts.SFProDisplay.Medium,
                        color: '#333',
                      }}
                    >
                      ?
                    </Text>
                  </View>
                </Animated.View>

                {/* Scrollable Content */}
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Current Location */}
                  <Animated.View
                    entering={FadeIn.delay(200)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F0F0',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: Colors.primary,
                        marginRight: 16,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: Fonts.SFProDisplay.Regular,
                          color: '#999',
                          marginBottom: 2,
                        }}
                      >
                        FROM
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: Fonts.SFProDisplay.Medium,
                          color: '#333',
                        }}
                      >
                        Current Location
                      </Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.6}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: Fonts.SFProDisplay.Regular,
                          color: Colors.primary,
                        }}
                      >
                        Change
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Search Input */}
                  <TouchableOpacity
                    onPress={expandToFullscreen}
                    activeOpacity={0.7}
                  >
                    <Animated.View
                      entering={FadeIn.delay(250)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#F8F8F8',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        marginVertical: 16,
                      }}
                    >
                      <Icon name="search" type="Feather" size={20} color="#999" />
                      <Text
                        style={{
                          marginLeft: 12,
                          fontSize: 16,
                          fontFamily: Fonts.SFProDisplay.Regular,
                          color: '#999',
                          flex: 1,
                        }}
                      >
                        Search destination
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>

                  {/* Recent Locations */}
                  <Animated.View
                    entering={FadeIn.delay(300)}
                    style={{ marginBottom: 20 }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: Fonts.SFProDisplay.Medium,
                        color: '#333',
                        marginBottom: 16,
                      }}
                    >
                      Recent locations
                    </Text>

                    {/* Recent location items */}
                    {[
                      { name: 'Home', address: '123 Main Street, City' },
                      { name: 'Work', address: '456 Business Ave, Downtown' },
                      { name: 'Shopping Mall', address: '789 Commerce Blvd' },
                    ].map((location, index) => (
                      <Animated.View
                        key={location.name}
                        entering={FadeIn.delay(350 + index * 50)}
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderBottomWidth: index < 2 ? 1 : 0,
                            borderBottomColor: '#F0F0F0',
                          }}
                          activeOpacity={0.6}
                          onPress={() => {
                            // First collapse to compact state briefly
                            collapseToCompact();
                            // Then trigger location selection after a short delay
                            setTimeout(() => {
                              onLocationSelect?.(location);
                              // Close modal after triggering selection
                              setTimeout(() => {
                                closeModal();
                              }, 100);
                            }, 200);
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: '#F0F0F0',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <Icon
                              name={index === 0 ? "home" : index === 1 ? "briefcase" : "shopping-bag"}
                              type="Feather"
                              size={18}
                              color="#666"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontFamily: Fonts.SFProDisplay.Medium,
                                color: '#333',
                                marginBottom: 2,
                              }}
                            >
                              {location.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                fontFamily: Fonts.SFProDisplay.Regular,
                                color: '#666',
                              }}
                            >
                              {location.address}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </Animated.View>
                </ScrollView>
              </View>
            )}

            {/* Fullscreen State Content */}
            {animationState === 'fullscreen' && (
              <View style={{ flex: 1 }}>
                {/* Fixed Header */}
                <Animated.View
                  entering={FadeIn.delay(100)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT : 20,
                    paddingBottom: 16,
                    paddingHorizontal: 20,
                    backgroundColor: 'white',
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                  }}
                >
                  <TouchableOpacity
                    onPress={collapseFromFullscreen}
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
                      Search{' '}
                    </Text>
                    <Text
                      style={{
                        fontSize: 19,
                        fontFamily: Fonts.PlayfairDisplay.Variable,
                        fontStyle: 'italic',
                        color: Colors.primary,
                      }}
                    >
                      Location
                    </Text>
                  </View>
                </Animated.View>

                {/* Search Input Bar */}
                <Animated.View
                  entering={FadeIn.delay(150)}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: 'white',
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8F8F8',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Icon name="search" type="Feather" size={20} color="#999" />
                    <TextInput
                      style={{
                        marginLeft: 12,
                        fontSize: 16,
                        fontFamily: Fonts.SFProDisplay.Regular,
                        color: '#333',
                        flex: 1,
                      }}
                      placeholder="Enter destination address..."
                      placeholderTextColor="#999"
                      value={searchText}
                      onChangeText={handleSearchTextChange}
                      autoFocus={true}
                      returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSearchText('');
                          setSearchResults([]);
                        }}
                        activeOpacity={0.6}
                      >
                        <Icon name="x-circle" type="Feather" size={18} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>

                {/* Search Results */}
                <ScrollView
                  style={{ flex: 1, backgroundColor: 'white' }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Search results from Google Maps API */}
                  {searchText.length > 0 ? (
                    <Animated.View
                      entering={FadeIn.delay(200)}
                      style={{ marginTop: 16 }}
                    >
                      {isSearching ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: Fonts.SFProDisplay.Regular,
                              color: '#999',
                            }}
                          >
                            Searching...
                          </Text>
                        </View>
                      ) : searchResults.length > 0 ? (
                        <>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: Fonts.SFProDisplay.Medium,
                              color: '#666',
                              marginBottom: 12,
                            }}
                          >
                            Search Results
                          </Text>
                          {searchResults.map((result, index) => (
                            <TouchableOpacity
                              key={result.place_id || index}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                                borderBottomColor: '#F0F0F0',
                              }}
                              activeOpacity={0.6}
                              onPress={() => {
                                // First collapse to compact state briefly
                                collapseToCompact();
                                // Then trigger location selection after a short delay
                                setTimeout(() => {
                                  onLocationSelect?.(result);
                                  // Close modal after triggering selection
                                  setTimeout(() => {
                                    closeModal();
                                  }, 100);
                                }, 200);
                              }}
                            >
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: '#F0F0F0',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: 12,
                                }}
                              >
                                <Icon name="map-pin" type="Feather" size={18} color="#666" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontFamily: Fonts.SFProDisplay.Medium,
                                    color: '#333',
                                    marginBottom: 2,
                                  }}
                                  numberOfLines={1}
                                >
                                  {result.name}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontFamily: Fonts.SFProDisplay.Regular,
                                    color: '#666',
                                  }}
                                  numberOfLines={2}
                                >
                                  {result.address}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </>
                      ) : searchText.length >= 3 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: Fonts.SFProDisplay.Regular,
                              color: '#999',
                            }}
                          >
                            No results found
                          </Text>
                        </View>
                      ) : null}
                    </Animated.View>
                  ) : (
                    <Animated.View
                      entering={FadeIn.delay(200)}
                      style={{ marginTop: 20 }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: Fonts.SFProDisplay.Medium,
                          color: '#333',
                          marginBottom: 16,
                        }}
                      >
                        Suggestions
                      </Text>
                      {[
                        { name: 'Current Location', icon: 'navigation' },
                        { name: 'Choose on Map', icon: 'map' },
                      ].map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            borderBottomWidth: index < 1 ? 1 : 0,
                            borderBottomColor: '#F0F0F0',
                          }}
                          activeOpacity={0.6}
                          onPress={() => {
                            // First collapse from fullscreen to expanded
                            collapseFromFullscreen();
                            // Then collapse to compact state
                            setTimeout(() => {
                              collapseToCompact();
                              // Then trigger location selection
                              setTimeout(() => {
                                onLocationSelect?.({ name: suggestion.name });
                                // Close modal after triggering selection
                                setTimeout(() => {
                                  closeModal();
                                }, 100);
                              }, 200);
                            }, 200);
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: `${Colors.primary}12`,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <Icon 
                              name={suggestion.icon} 
                              type="Feather" 
                              size={18} 
                              color={Colors.primary} 
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 16,
                              fontFamily: Fonts.SFProDisplay.Medium,
                              color: '#333',
                              flex: 1,
                            }}
                          >
                            {suggestion.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
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