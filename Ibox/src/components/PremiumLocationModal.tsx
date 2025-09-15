import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Place {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PremiumLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelectPlace: (placeId: string, isStartLocation?: boolean) => void;
  suggestions: Place[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startLocation?: string;
  onChangeStartLocation?: () => void;
  selectedDestination?: any;
  onSelectService?: () => void;
  onBookNow?: () => void;
}

const PremiumLocationModal: React.FC<PremiumLocationModalProps> = ({
  visible,
  onClose,
  onSearch,
  onSelectPlace,
  suggestions,
  searchQuery,
  setSearchQuery,
  startLocation,
  onChangeStartLocation,
  selectedDestination,
  onSelectService,
  onBookNow,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const blurIntensity = useSharedValue(0);
  const [searchMode, setSearchMode] = useState<'destination' | 'start'>('destination');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (visible) {
      // Smooth entrance animation
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      blurIntensity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, { damping: 25, stiffness: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });

      if (selectedDestination) {
        setTimeout(() => setShowDetails(true), 500);
      }
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      blurIntensity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(SCREEN_HEIGHT * 0.5, { duration: 400, easing: Easing.in(Easing.cubic) });
      scale.value = withTiming(0.9, { duration: 300 });
      setShowDetails(false);
    }
  }, [visible, selectedDestination]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(blurIntensity.value, [0, 1], [0, 1]),
  }));

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSelectPlace = (placeId: string) => {
    const isStartLocation = searchMode === 'start';
    onSelectPlace(placeId, isStartLocation);

    if (isStartLocation) {
      setSearchMode('destination');
      setSearchQuery('');
    } else {
      setSearchQuery('');
      setShowDetails(true);
    }
  };

  const renderSearchContent = () => (
    <View style={styles.searchContent}>
      {/* Premium Header */}
      <View style={styles.premiumHeader}>
        <TouchableOpacity style={styles.closeButtonPremium} onPress={handleClose}>
          <View style={styles.closeButtonGlow} />
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {searchMode === 'start' ? 'Pick up location' : 'Where to?'}
          </Text>
          <Text style={styles.headerSubtitle}>Find your destination</Text>
        </View>

        <TouchableOpacity style={styles.filterButtonPremium}>
          <View style={styles.filterGlow} />
          <Feather name="sliders" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Glassmorphism From Section */}
      {searchMode === 'destination' && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.fromSectionPremium}>
          <View style={styles.glassmorphismContainer}>
            <BlurView intensity={20} style={styles.fromBlurContainer}>
              <View style={styles.fromContentPremium}>
                <View style={styles.fromIndicatorPremium}>
                  <View style={styles.indicatorGlow} />
                  <Ionicons name="radio-button-on" size={16} color={Colors.success} />
                </View>

                <View style={styles.fromInfoPremium}>
                  <Text style={styles.fromLabelPremium}>From</Text>
                  <Text style={styles.fromValuePremium} numberOfLines={1}>
                    {startLocation || '📍 Current Location'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.changeButtonPremium}
                  onPress={() => setSearchMode('start')}
                >
                  <LinearGradient
                    colors={['rgba(10, 165, 168, 0.1)', 'rgba(10, 165, 168, 0.05)']}
                    style={styles.changeButtonGradient}
                  >
                    <Text style={styles.changeButtonTextPremium}>Change</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Animated.View>
      )}

      {/* Premium Search Input */}
      <Animated.View entering={SlideInUp.delay(300)} style={styles.searchSectionPremium}>
        <View style={styles.searchInputPremium}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.95)']}
            style={styles.searchGradient}
          >
            <View style={styles.searchInnerContainer}>
              <View style={styles.searchIconContainer}>
                <View style={styles.searchIconGlow} />
                <Ionicons name="search" size={22} color={Colors.primary} />
              </View>

              <TextInput
                style={styles.searchInputText}
                placeholder={searchMode === 'start' ? 'Enter pickup location...' : 'Where would you like to go?'}
                placeholderTextColor="rgba(107, 114, 128, 0.6)"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  onSearch(text);
                }}
                autoFocus={true}
                returnKeyType="search"
              />

              {searchQuery.length > 0 && (
                <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Ionicons name="close-circle" size={20} color="rgba(107, 114, 128, 0.4)" />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Enhanced Suggestions */}
      {suggestions.length > 0 ? (
        <Animated.View entering={SlideInUp.delay(100)} style={styles.suggestionsWrapper}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.delay(index * 100).springify()}>
                <TouchableOpacity
                  style={styles.suggestionItemPremium}
                  onPress={() => handleSelectPlace(item.place_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionContent}>
                    <View style={styles.suggestionIconPremium}>
                      <View style={styles.suggestionIconGlow} />
                      <Ionicons name="location" size={18} color={Colors.primary} />
                    </View>

                    <View style={styles.suggestionTextContainer}>
                      {item.structured_formatting ? (
                        <>
                          <Text style={styles.suggestionMainPremium} numberOfLines={1}>
                            {item.structured_formatting.main_text}
                          </Text>
                          <Text style={styles.suggestionSecondaryPremium} numberOfLines={1}>
                            {item.structured_formatting.secondary_text}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.suggestionMainPremium} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                    </View>

                    <View style={styles.suggestionArrow}>
                      <Ionicons name="chevron-forward" size={16} color="rgba(107, 114, 128, 0.4)" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
          />
        </Animated.View>
      ) : searchQuery.length > 2 ? (
        <Animated.View entering={FadeIn.delay(300)} style={styles.noResultsPremium}>
          <View style={styles.noResultsIconContainer}>
            <View style={styles.noResultsIconGlow} />
            <Feather name="map-pin" size={48} color="rgba(107, 114, 128, 0.3)" />
          </View>
          <Text style={styles.noResultsTextPremium}>No locations found</Text>
          <Text style={styles.noResultsSubtextPremium}>Try searching with different keywords</Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.delay(400)} style={styles.quickActionsPremium}>
          <Text style={styles.quickActionsTitle}>Quick Access</Text>

          {[
            { icon: 'home', title: 'Home', subtitle: 'Your home address' },
            { icon: 'business', title: 'Work', subtitle: 'Your workplace' },
            { icon: 'time', title: 'Recent', subtitle: 'Recently visited places' },
          ].map((item, index) => (
            <Animated.View key={item.title} entering={FadeIn.delay(500 + index * 100)}>
              <TouchableOpacity style={styles.quickActionItemPremium}>
                <View style={styles.quickActionIconPremium}>
                  <View style={styles.quickActionIconGlow} />
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.quickActionTextPremium}>
                  <Text style={styles.quickActionTitlePremium}>{item.title}</Text>
                  <Text style={styles.quickActionSubtitlePremium}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(107, 114, 128, 0.3)" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </View>
  );

  const renderLocationDetails = () => (
    <Animated.View entering={SlideInUp} style={styles.detailsContent}>
      {/* Premium Details Header */}
      <View style={styles.detailsHeaderPremium}>
        <TouchableOpacity style={styles.backButtonPremium} onPress={() => setShowDetails(false)}>
          <View style={styles.backButtonGlow} />
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.detailsTitlePremium}>Location Details</Text>

        <TouchableOpacity style={styles.sortButtonPremium}>
          <LinearGradient
            colors={['rgba(10, 165, 168, 0.08)', 'rgba(10, 165, 168, 0.03)']}
            style={styles.sortGradient}
          >
            <Text style={styles.sortTextPremium}>Sort</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Enhanced Destination Info */}
      <View style={styles.destinationInfoPremium}>
        <Text style={styles.destinationNamePremium} numberOfLines={2}>
          {selectedDestination?.title || 'Selected Location'}
        </Text>
        <Text style={styles.destinationAddressPremium} numberOfLines={1}>
          📍 {selectedDestination?.description || 'Destination address'}
        </Text>

        {/* Premium Status Indicators */}
        <View style={styles.statusIndicatorsPremium}>
          {[
            { icon: 'time-outline', text: '5-10 min pickup', color: Colors.success },
            { icon: 'car-outline', text: '3 services available', color: Colors.primary },
            { icon: 'star', text: '4.8 • Excellent rating', color: '#FFB020' },
          ].map((status, index) => (
            <Animated.View key={index} entering={FadeIn.delay(200 + index * 100)} style={styles.statusItemPremium}>
              <View style={styles.statusIconContainer}>
                <View style={[styles.statusIconGlow, { backgroundColor: `${status.color}20` }]} />
                <Ionicons name={status.icon as any} size={16} color={status.color} />
              </View>
              <Text style={styles.statusTextPremium}>{status.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Ultra-Premium Action Buttons */}
      <Animated.View entering={SlideInUp.delay(300)} style={styles.actionButtonsPremium}>
        <TouchableOpacity
          style={styles.selectServiceButtonPremium}
          onPress={onSelectService}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.selectServiceGradient}
          >
            <Ionicons name="apps" size={18} color="white" />
            <Text style={styles.selectServiceTextPremium}>Select Service</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookNowButtonPremium}
          onPress={onBookNow}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.bookNowGradient}
          >
            <Ionicons name="rocket" size={18} color="white" />
            <Text style={styles.bookNowTextPremium}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Enhanced Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.blurBackdrop, blurStyle]}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} />
      </Animated.View>

      {/* Premium Modal */}
      <Animated.View style={[styles.modal, modalStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']}
          style={styles.modalGradient}
        >
          {showDetails && selectedDestination ? renderLocationDetails() : renderSearchContent()}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouch: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.5,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalGradient: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // Search Content Styles
  searchContent: {
    flex: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },
  closeButtonPremium: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  filterButtonPremium: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 165, 168, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 165, 168, 0.03)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  // Glassmorphism From Section
  fromSectionPremium: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  glassmorphismContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  fromBlurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  fromContentPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  fromIndicatorPremium: {
    position: 'relative',
    marginRight: 16,
  },
  indicatorGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    top: -4,
    left: -4,
  },
  fromInfoPremium: {
    flex: 1,
  },
  fromLabelPremium: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fromValuePremium: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  changeButtonPremium: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  changeButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  changeButtonTextPremium: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Premium Search Input
  searchSectionPremium: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  searchInputPremium: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  searchGradient: {
    borderRadius: 24,
  },
  searchInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  searchIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  searchIconGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 165, 168, 0.08)',
    top: -5,
    left: -5,
  },
  searchInputText: {
    flex: 1,
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },

  // Enhanced Suggestions
  suggestionsWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItemPremium: {
    marginBottom: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  suggestionIconPremium: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 165, 168, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  suggestionIconGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 165, 168, 0.03)',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainPremium: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  suggestionSecondaryPremium: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  suggestionArrow: {
    marginLeft: 12,
  },

  // No Results Premium
  noResultsPremium: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  noResultsIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  noResultsIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
    top: -16,
    left: -16,
  },
  noResultsTextPremium: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  noResultsSubtextPremium: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Quick Actions Premium
  quickActionsPremium: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  quickActionItemPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  quickActionIconPremium: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 165, 168, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionIconGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 165, 168, 0.03)',
  },
  quickActionTextPremium: {
    flex: 1,
  },
  quickActionTitlePremium: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quickActionSubtitlePremium: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Details Content Premium
  detailsContent: {
    flex: 1,
  },
  detailsHeaderPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },
  backButtonPremium: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
  },
  detailsTitlePremium: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  sortButtonPremium: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  sortGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortTextPremium: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },

  // Destination Info Premium
  destinationInfoPremium: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  destinationNamePremium: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  destinationAddressPremium: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 24,
  },
  statusIndicatorsPremium: {
    gap: 16,
  },
  statusItemPremium: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIconGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  statusTextPremium: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Action Buttons Premium
  actionButtonsPremium: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.3)',
    gap: 16,
  },
  selectServiceButtonPremium: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selectServiceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  selectServiceTextPremium: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  bookNowButtonPremium: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bookNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  bookNowTextPremium: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
});

export default PremiumLocationModal;