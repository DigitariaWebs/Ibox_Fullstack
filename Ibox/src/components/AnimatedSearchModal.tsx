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
  withDelay,
  runOnJS,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
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

interface AnimatedSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelectPlace: (placeId: string, isStartLocation?: boolean) => void;
  suggestions: Place[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startLocation?: string;
  onChangeStartLocation?: () => void;
}

const AnimatedSearchModal: React.FC<AnimatedSearchModalProps> = ({
  visible,
  onClose,
  onSearch,
  onSelectPlace,
  suggestions,
  searchQuery,
  setSearchQuery,
  startLocation,
  onChangeStartLocation,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const searchInputScale = useSharedValue(0.9);
  const [inputFocused, setInputFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'destination' | 'start'>('destination');

  useEffect(() => {
    if (visible) {
      // Open animation
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      searchInputScale.value = withDelay(
        100,
        withSpring(1, {
          damping: 15,
          stiffness: 150,
        })
      );
    } else {
      // Close animation
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
      searchInputScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const searchInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: searchInputScale.value }],
    };
  });

  const handleClose = () => {
    Keyboard.dismiss();
    setInputFocused(false);
    onClose();
  };

  const handleSelectPlace = (placeId: string) => {
    const isStartLocation = searchMode === 'start';
    onSelectPlace(placeId, isStartLocation);
    if (isStartLocation) {
      setSearchMode('destination');
      setSearchQuery('');
    } else {
      handleClose();
    }
  };

  const handleChangeStartLocation = () => {
    setSearchMode('start');
    setSearchQuery('');
    if (onChangeStartLocation) {
      onChangeStartLocation();
    }
  };

  const renderSuggestionItem = ({ item, index }: { item: Place; index: number }) => {
    return (
      <Animated.View
        entering={FadeIn.delay(index * 50).duration(300)}
        exiting={FadeOut.duration(200)}
      >
        <TouchableOpacity
          style={styles.suggestionItem}
          onPress={() => handleSelectPlace(item.place_id)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionContent}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name="location-outline" 
                size={20} 
                color={Colors.primary} 
                style={styles.locationIcon}
              />
            </View>
            <View style={styles.textContainer}>
              {item.structured_formatting ? (
                <>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </>
              ) : (
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View style={[styles.modal, modalAnimatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons 
              name="close" 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {searchMode === 'start' ? 'Where from?' : 'Where to?'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Start Location Section */}
        {searchMode === 'destination' && (
          <Animated.View 
            style={styles.startLocationSection}
            entering={FadeIn.delay(150)}
          >
            <View style={styles.startLocationRow}>
              <View style={styles.startLocationInfo}>
                <View style={styles.startLocationIcon}>
                  <Ionicons 
                    name="location" 
                    size={18} 
                    color={Colors.success} 
                  />
                </View>
                <View style={styles.startLocationText}>
                  <Text style={styles.startLocationLabel}>From</Text>
                  <Text style={styles.startLocationValue} numberOfLines={1}>
                    {startLocation || 'Current Location'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.changeLocationButton}
                onPress={handleChangeStartLocation}
                activeOpacity={0.7}
              >
                <Text style={styles.changeLocationText}>Change</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Search Input */}
        <Animated.View style={[styles.searchContainer, searchInputAnimatedStyle]}>
          <View style={styles.searchInputWrapper}>
            <Ionicons 
              name="search" 
              size={20} 
              color={Colors.textSecondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={searchMode === 'start' ? 'Search pickup location...' : 'Search destination...'}
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                onSearch(text);
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoFocus={true}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </Animated.View>

        {/* Recent/Quick Actions */}
        {suggestions.length === 0 && searchQuery.length === 0 && (
          <Animated.View 
            style={styles.quickActions}
            entering={FadeIn.delay(200)}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.quickActionItem}>
              <Ionicons 
                name="home-outline" 
                size={22} 
                color={Colors.primary} 
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionText}>Add Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <MaterialIcons 
                name="work-outline" 
                size={22} 
                color={Colors.primary} 
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionText}>Add Work</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <Animated.View 
            style={styles.suggestionsContainer}
            entering={SlideInUp.delay(100)}
            exiting={SlideOutDown}
          >
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={renderSuggestionItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
            />
          </Animated.View>
        )}

        {/* No Results */}
        {suggestions.length === 0 && searchQuery.length > 2 && (
          <Animated.View 
            style={styles.noResults}
            entering={FadeIn.delay(300)}
          >
            <Feather 
              name="search" 
              size={48} 
              color={Colors.textSecondary} 
              style={styles.noResultsIcon}
            />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>
              Try searching for a different location
            </Text>
          </Animated.View>
        )}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 36,
  },
  startLocationSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  startLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  startLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startLocationText: {
    flex: 1,
  },
  startLocationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  startLocationValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  changeLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  changeLocationText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 10,
  },
  quickActionIcon: {
    marginRight: 15,
  },
  quickActionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  locationIcon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: 5,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  suggestionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AnimatedSearchModal;