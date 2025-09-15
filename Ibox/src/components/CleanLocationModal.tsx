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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Place {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface CleanLocationModalProps {
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

const CleanLocationModal: React.FC<CleanLocationModalProps> = ({
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
  const [searchMode, setSearchMode] = useState<'destination' | 'start'>('destination');
  const [showDetails, setShowDetails] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });

      if (selectedDestination) {
        setTimeout(() => setShowDetails(true), 200);
      }
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(SCREEN_HEIGHT * 0.3, { duration: 300, easing: Easing.in(Easing.quad) });
      setShowDetails(false);
      setSearchInputFocused(false);
    }
  }, [visible, selectedDestination]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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

  const handleSearchInputPress = () => {
    setSearchInputFocused(true);
  };

  const renderSearchContent = () => (
    <View style={styles.searchContent}>
      {/* Clean Header */}
      <View style={styles.cleanHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {searchMode === 'start' ? 'Pick up location' : 'Where '}
            {searchMode === 'destination' && (
              <Text style={styles.headerTitlePlayfair}>to</Text>
            )}
            {searchMode === 'destination' && '?'}
          </Text>
        </View>

        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* From Section (Clean Card Style) */}
      {searchMode === 'destination' && (
        <Animated.View entering={FadeIn.delay(100)} style={styles.fromSectionCard}>
          <View style={styles.fromContent}>
            <View style={styles.fromIconContainer}>
              <Ionicons name="radio-button-on" size={16} color={Colors.success} />
            </View>

            <View style={styles.fromInfo}>
              <Text style={styles.fromLabel}>From</Text>
              <Text style={styles.fromValue} numberOfLines={1}>
                {startLocation || 'Current Location'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setSearchMode('start')}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Clean Search Input */}
      <Animated.View entering={SlideInUp.delay(150)} style={styles.searchSection}>
        <TouchableOpacity
          style={[styles.searchInputContainer, searchInputFocused && styles.searchInputFocused]}
          onPress={handleSearchInputPress}
          activeOpacity={1}
        >
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
          </View>

          {searchInputFocused ? (
            <TextInput
              style={styles.searchInput}
              placeholder={searchMode === 'start' ? 'Enter pickup location' : 'Search destination'}
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                onSearch(text);
              }}
              onBlur={() => setSearchInputFocused(false)}
              autoFocus={true}
              returnKeyType="search"
            />
          ) : (
            <Text style={styles.searchPlaceholder}>
              {searchMode === 'start' ? 'Enter pickup location' : 'Search destination'}
            </Text>
          )}

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Suggestions or Quick Access */}
      {suggestions.length > 0 ? (
        <Animated.View entering={SlideInUp.delay(100)} style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.delay(index * 50)}>
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectPlace(item.place_id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Ionicons name="location" size={18} color={Colors.textSecondary} />
                  </View>

                  <View style={styles.suggestionTextContainer}>
                    {item.structured_formatting ? (
                      <>
                        <Text style={styles.suggestionMain} numberOfLines={1}>
                          {item.structured_formatting.main_text}
                        </Text>
                        <Text style={styles.suggestionSecondary} numberOfLines={1}>
                          {item.structured_formatting.secondary_text}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.suggestionMain} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
          />
        </Animated.View>
      ) : searchQuery.length > 2 ? (
        <Animated.View entering={FadeIn.delay(200)} style={styles.noResults}>
          <Feather name="map-pin" size={48} color={Colors.textSecondary} style={styles.noResultsIcon} />
          <Text style={styles.noResultsText}>No locations found</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.delay(200)} style={styles.quickAccessSection}>
          <Text style={styles.quickAccessTitle}>Quick Access</Text>

          {[
            { icon: 'home', title: 'Home', subtitle: 'Add home address' },
            { icon: 'business', title: 'Work', subtitle: 'Add work address' },
            { icon: 'time', title: 'Recent', subtitle: 'Recently visited' },
          ].map((item, index) => (
            <Animated.View key={item.title} entering={FadeIn.delay(250 + index * 100)}>
              <TouchableOpacity style={styles.quickAccessItem}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color="white" />
                </View>

                <View style={styles.quickAccessTextContainer}>
                  <Text style={styles.quickAccessItemTitle}>{item.title}</Text>
                  <Text style={styles.quickAccessItemSubtitle}>{item.subtitle}</Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </View>
  );

  const renderLocationDetails = () => (
    <Animated.View entering={SlideInUp} style={styles.detailsContent}>
      {/* Details Header */}
      <View style={styles.detailsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowDetails(false)}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.detailsTitle}>Location Details</Text>

        <TouchableOpacity style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Destination Info Card */}
      <View style={styles.destinationCard}>
        <Text style={styles.destinationName} numberOfLines={2}>
          {selectedDestination?.title || 'Selected Location'}
        </Text>
        <Text style={styles.destinationAddress} numberOfLines={1}>
          {selectedDestination?.description || 'Destination address'}
        </Text>

        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          {[
            { icon: 'time-outline', text: '5-10 min pickup', color: Colors.success },
            { icon: 'car-outline', text: '3 services available', color: Colors.primary },
            { icon: 'star', text: '4.8 rating', color: '#FFB020' },
          ].map((status, index) => (
            <Animated.View key={index} entering={FadeIn.delay(100 + index * 50)} style={styles.statusItem}>
              <Ionicons name={status.icon as any} size={16} color={status.color} />
              <Text style={styles.statusText}>{status.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <Animated.View entering={SlideInUp.delay(200)} style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.selectServiceButton}
          onPress={onSelectService}
          activeOpacity={0.8}
        >
          <Text style={styles.selectServiceText}>Select Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={onBookNow}
          activeOpacity={0.8}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} />
      </Animated.View>

      {/* Modal */}
      <Animated.View style={[styles.modal, modalStyle]}>
        {showDetails && selectedDestination ? renderLocationDetails() : renderSearchContent()}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropTouch: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20, // Clean rounded corners like screenshot
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },

  // Search Content Styles
  searchContent: {
    flex: 1,
  },
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerTitlePlayfair: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontWeight: '400',
    fontSize: 22,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // From Section Card
  fromSectionCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fromContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  fromIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fromInfo: {
    flex: 1,
  },
  fromLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fromValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changeButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInputFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'white',
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Suggestions
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // No Results
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Quick Access Section
  quickAccessSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAccessIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22, // Perfect circle like screenshot
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickAccessTextContainer: {
    flex: 1,
  },
  quickAccessItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quickAccessItemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Details Content
  detailsContent: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Destination Card
  destinationCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  destinationName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  destinationAddress: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 20,
  },
  statusContainer: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  selectServiceButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectServiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bookNowButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default CleanLocationModal;