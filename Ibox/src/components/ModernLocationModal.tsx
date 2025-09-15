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
  runOnJS,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

interface ModernLocationModalProps {
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

const ModernLocationModal: React.FC<ModernLocationModalProps> = ({
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

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });

      // Auto-show details if destination is already selected
      if (selectedDestination) {
        setTimeout(() => setShowDetails(true), 300);
      }
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      setShowDetails(false);
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

  const renderSearchContent = () => (
    <View style={styles.searchContent}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.searchTitle}>
          {searchMode === 'start' ? 'Pick up location' : 'Where to?'}
        </Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* From Location */}
      {searchMode === 'destination' && (
        <View style={styles.fromSection}>
          <View style={styles.fromLocationRow}>
            <View style={styles.fromIndicator} />
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
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchInputSection}>
        <View style={styles.searchInputWrapper}>
          <View style={styles.toIndicator} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchMode === 'start' ? 'Search pickup location' : 'Search destination'}
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              onSearch(text);
            }}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(index * 50)}>
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectPlace(item.place_id)}
              >
                <View style={styles.suggestionIcon}>
                  <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.suggestionContent}>
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
              </TouchableOpacity>
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.suggestionsList}
        />
      ) : searchQuery.length > 2 ? (
        <View style={styles.noResults}>
          <Feather name="map-pin" size={48} color={Colors.textSecondary} />
          <Text style={styles.noResultsText}>No locations found</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
        </View>
      ) : (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="home" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="business" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="time" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Recent</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderLocationDetails = () => (
    <View style={styles.detailsContent}>
      {/* Header */}
      <View style={styles.detailsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowDetails(false)}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>Select Service</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortButtonText}>Sort by</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Destination Info */}
      <View style={styles.destinationInfo}>
        <Text style={styles.destinationName} numberOfLines={2}>
          {selectedDestination?.title || 'Selected Location'}
        </Text>
        <Text style={styles.destinationAddress} numberOfLines={1}>
          {selectedDestination?.description || 'Destination address'}
        </Text>

        {/* Status Indicators */}
        <View style={styles.statusIndicators}>
          <View style={styles.statusItem}>
            <Ionicons name="time-outline" size={16} color={Colors.success} />
            <Text style={styles.statusText}>5-10 min pickup</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="car-outline" size={16} color={Colors.primary} />
            <Text style={styles.statusText}>3 services available</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="star" size={16} color="#FFB020" />
            <Text style={styles.statusText}>4.8 rating</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.selectServiceButton}
          onPress={onSelectService}
        >
          <Text style={styles.selectServiceText}>Select Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={onBookNow}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },

  // Search Content Styles
  searchContent: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fromSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fromLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fromIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginRight: 16,
  },
  fromInfo: {
    flex: 1,
  },
  fromLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  fromValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  changeButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  searchInputSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  suggestionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionIcon: {
    width: 40,
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 8,
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
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Details Content Styles
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
    borderBottomColor: Colors.border,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginRight: 4,
  },
  destinationInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  destinationName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  destinationAddress: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statusIndicators: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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

export default ModernLocationModal;