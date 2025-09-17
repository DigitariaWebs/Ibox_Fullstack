import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Fonts } from '../../config/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MovingFlowProps {
  navigation: any;
  route: any;
}

const MovingFlow: React.FC<MovingFlowProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [floorInfo, setFloorInfo] = useState({
    pickupFloor: '',
    deliveryFloor: '',
    hasElevatorPickup: false,
    hasElevatorDelivery: false,
    hasStairsPickup: false,
    hasStairsDelivery: false,
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');

  // Animation values
  const progressValue = useSharedValue(0);
  const stepTransition = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const totalSteps = 5; // Increased from 3 to 5

  useEffect(() => {
    progressValue.value = withTiming((currentStep - 1) / (totalSteps - 1), {
      duration: 500,
    });
    
    stepTransition.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
  }, [currentStep]);

  // Apartment size options with modern design
  const sizeOptions = [
    {
      id: 'studio',
      title: 'Studio',
      subtitle: 'Perfect for small spaces',
      rooms: '1-2 rooms',
      duration: '3-4 hours',
      price: '$149',
      icon: 'home-outline',
      gradient: ['#667eea', '#764ba2'],
      popular: false,
    },
    {
      id: '2br',
      title: '2-3 Bedroom',
      subtitle: 'Ideal for families',
      rooms: '3-5 rooms',
      duration: '5-7 hours',
      price: '$249',
      icon: 'business-outline',
      gradient: ['#f093fb', '#f5576c'],
      popular: true,
    },
    {
      id: 'house',
      title: 'Full House',
      subtitle: 'Complete home moving',
      rooms: '5+ rooms',
      duration: '8+ hours',
      price: '$399',
      icon: 'home',
      gradient: ['#4facfe', '#00f2fe'],
      popular: false,
    },
  ];

  // Inventory items with categories - for list view
  const inventoryItems = [
    { id: 'sofa', name: 'Sofa / Couch', icon: 'weekend', category: 'furniture', color: '#FF6B6B' },
    { id: 'bed', name: 'Bed (King/Queen)', icon: 'bed', category: 'furniture', color: '#4ECDC4' },
    { id: 'mattress', name: 'Mattress', icon: 'hotel', category: 'furniture', color: '#45B7D1' },
    { id: 'table', name: 'Dining Table', icon: 'table-restaurant', category: 'furniture', color: '#96CEB4' },
    { id: 'desk', name: 'Office Desk', icon: 'desk', category: 'furniture', color: '#FECA57' },
    { id: 'wardrobe', name: 'Wardrobe / Dresser', icon: 'door-sliding', category: 'furniture', color: '#9B59B6' },
    { id: 'chairs', name: 'Chairs', icon: 'chair', category: 'furniture', color: '#3498DB' },
    { id: 'tv', name: 'TV / Electronics', icon: 'tv', category: 'electronics', color: '#E74C3C' },
    { id: 'fridge', name: 'Refrigerator', icon: 'kitchen', category: 'appliances', color: '#1ABC9C' },
    { id: 'washer', name: 'Washer / Dryer', icon: 'local-laundry-service', category: 'appliances', color: '#F39C12' },
    { id: 'boxes_small', name: 'Small Boxes (< 20 lbs)', icon: 'inventory-2', category: 'packing', color: '#16A085' },
    { id: 'boxes_large', name: 'Large Boxes (> 20 lbs)', icon: 'inventory', category: 'packing', color: '#D35400' },
    { id: 'fragile', name: 'Fragile Items', icon: 'warning', category: 'special', color: '#C0392B' },
    { id: 'artwork', name: 'Artwork / Mirrors', icon: 'image', category: 'special', color: '#8E44AD' },
  ];

  // Additional services - compact design
  const additionalServices = [
    { id: 'packing', name: 'Packing', icon: 'inventory', price: '+$50', color: '#FF6B6B' },
    { id: 'unpacking', name: 'Unpacking', icon: 'unarchive', price: '+$40', color: '#4ECDC4' },
    { id: 'assembly', name: 'Assembly', icon: 'build', price: '+$60', color: '#45B7D1' },
    { id: 'cleaning', name: 'Cleaning', icon: 'cleaning-services', price: '+$80', color: '#96CEB4' },
    { id: 'insurance', name: 'Insurance', icon: 'shield', price: '+$30', color: '#FECA57' },
    { id: 'storage', name: 'Storage', icon: 'warehouse', price: '+$70', color: '#9B59B6' },
  ];

  const floorOptions = [
    { value: 'ground', label: 'Ground Floor' },
    { value: '1', label: '1st Floor' },
    { value: '2', label: '2nd Floor' },
    { value: '3', label: '3rd Floor' },
    { value: '4+', label: '4th Floor +' },
  ];

  const handleNext = () => {
    if (currentStep === 1 && !selectedSize) {
      return; // Don't proceed without size selection
    }
    
    if (currentStep < totalSteps) {
      buttonScale.value = withSequence(
        withSpring(0.95, { duration: 100 }),
        withSpring(1, { duration: 100 })
      );
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to summary
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = () => {
    const selectedSizeData = sizeOptions.find(opt => opt.id === selectedSize);
    
    navigation.navigate('MovingOrderSummary', {
      ...route.params,
      apartmentSize: selectedSizeData,
      inventoryItems: selectedItems,
      floorInfo,
      additionalServices: selectedServices,
      specialNotes,
      serviceType: 'moving',
    });
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === itemId);
      if (exists) {
        return prev.filter(item => item.id !== itemId);
      }
      const item = inventoryItems.find(i => i.id === itemId);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setSelectedItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.min(99, quantity) };
        }
        return item;
      }));
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${interpolate(
      progressValue.value,
      [0, 1],
      [0, 100],
      Extrapolation.CLAMP
    )}%`,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: stepTransition.value,
    transform: [
      {
        translateX: interpolate(
          stepTransition.value,
          [0, 1],
          [50, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepsRow}>
        {[1, 2, 3, 4, 5].map((step, index) => (
          <React.Fragment key={step}>
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive,
                  currentStep > step && styles.stepCircleCompleted,
                ]}
              >
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      currentStep >= step && styles.stepNumberActive,
                    ]}
                  >
                    {step}
                  </Text>
            )}
          </View>
              <Text style={styles.stepLabel}>
                {step === 1 ? 'Size' : 
                 step === 2 ? 'Items' : 
                 step === 3 ? 'Access' :
                 step === 4 ? 'Services' : 'Notes'}
              </Text>
        </View>
            {index < 4 && (
              <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
            )}
          </React.Fragment>
      ))}
      </View>
    </View>
  );

  const renderSizeStep = () => (
    <Animated.View style={[contentStyle, { flex: 1 }]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          What's your <Text style={styles.stepTitleHighlight}>space</Text> size?
        </Text>
        <Text style={styles.stepSubtitle}>
          Select the size that best matches your needs
        </Text>
      </View>
      
      <ScrollView 
        style={styles.optionsScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sizeContainer}
      >
        {sizeOptions.map((option, index) => (
          <Animated.View
              key={option.id}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            <TouchableOpacity
              style={[
                styles.sizeCard,
                selectedSize === option.id && styles.sizeCardSelected
              ]}
              onPress={() => setSelectedSize(option.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedSize === option.id ? option.gradient : ['#F8F9FA', '#FFFFFF']}
                style={styles.sizeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              
                <View style={styles.sizeContent}>
                  <View style={styles.sizeIconContainer}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={32} 
                      color={selectedSize === option.id ? 'white' : Colors.primary} 
                    />
              </View>
              
                  <View style={styles.sizeInfo}>
                    <Text style={[
                      styles.sizeTitle,
                      selectedSize === option.id && styles.sizeTitleSelected
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={[
                      styles.sizeSubtitle,
                      selectedSize === option.id && styles.sizeSubtitleSelected
                    ]}>
                      {option.subtitle}
                    </Text>
                    <View style={styles.sizeDetails}>
                      <View style={styles.sizeDetailItem}>
                        <Feather 
                          name="home" 
                          size={12} 
                          color={selectedSize === option.id ? 'rgba(255,255,255,0.8)' : Colors.textSecondary} 
                        />
                        <Text style={[
                          styles.sizeDetailText,
                          selectedSize === option.id && styles.sizeDetailTextSelected
                        ]}>
                          {option.rooms}
                        </Text>
              </View>
                      <View style={styles.sizeDetailItem}>
                        <Feather 
                          name="clock" 
                          size={12} 
                          color={selectedSize === option.id ? 'rgba(255,255,255,0.8)' : Colors.textSecondary} 
                        />
                        <Text style={[
                          styles.sizeDetailText,
                          selectedSize === option.id && styles.sizeDetailTextSelected
                        ]}>
                          {option.duration}
                        </Text>
                      </View>
        </View>
      </View>
      
                  <View style={styles.sizePriceContainer}>
                    <Text style={[
                      styles.sizePrice,
                      selectedSize === option.id && styles.sizePriceSelected
                    ]}>
                      {option.price}
                    </Text>
                    <Text style={[
                      styles.sizePriceLabel,
                      selectedSize === option.id && styles.sizePriceLabelSelected
                    ]}>
                      starting
                    </Text>
    </View>
                </View>
                
                {selectedSize === option.id && (
                  <View style={styles.selectedCheckmark}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderItemsStep = () => {
    const selectedItemsMap = selectedItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as any);
    
    return (
      <Animated.View style={[contentStyle, { flex: 1 }]}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            What are you <Text style={styles.stepTitleHighlight}>moving</Text>?
          </Text>
          <Text style={styles.stepSubtitle}>
            Add items and quantities
          </Text>
        </View>
        
        <ScrollView 
          style={styles.optionsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsListContainer}
        >
          {inventoryItems.map((item, index) => {
            const isSelected = !!selectedItemsMap[item.id];
            const quantity = selectedItemsMap[item.id]?.quantity || 0;
              
              return (
              <Animated.View
                  key={item.id}
                entering={FadeInUp.delay(index * 30).springify()}
                style={styles.itemListRow}
              >
                <TouchableOpacity
                  style={[
                    styles.itemListContent,
                    isSelected && styles.itemListContentSelected
                  ]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.itemListIcon,
                    { backgroundColor: isSelected ? item.color : `${item.color}20` }
                  ]}>
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={20} 
                      color={isSelected ? 'white' : item.color} 
                    />
                  </View>
                  
                  <Text style={[
                    styles.itemListName,
                    isSelected && styles.itemListNameSelected
                  ]}>
                    {item.name}
                  </Text>
                  
                  <View style={styles.itemListActions}>
                    {isSelected ? (
                      <View style={styles.quantityRow}>
                      <TouchableOpacity
                          style={styles.quantityBtn}
                          onPress={() => updateQuantity(item.id, quantity - 1)}
                      >
                          <Ionicons name="remove" size={18} color="#667eea" />
                      </TouchableOpacity>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                      <TouchableOpacity
                          style={styles.quantityBtn}
                          onPress={() => updateQuantity(item.id, quantity + 1)}
                      >
                          <Ionicons name="add" size={18} color="#667eea" />
                      </TouchableOpacity>
                    </View>
                    ) : (
                      <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add-circle-outline" size={24} color="#667eea" />
                      </TouchableOpacity>
                  )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
              );
            })}
          
          {selectedItems.length > 0 && (
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryText}>
                {selectedItems.length} items • {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} total pieces
              </Text>
          </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderFloorStep = () => (
    <Animated.View style={[contentStyle, { flex: 1 }]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          Building <Text style={styles.stepTitleHighlight}>access</Text> details
        </Text>
        <Text style={styles.stepSubtitle}>
          Help us plan for stairs and elevators
        </Text>
      </View>

      <ScrollView 
        style={styles.optionsScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.floorContainer}
      >
        {/* Pickup Location */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIcon}>
                <Feather name="arrow-up-circle" size={20} color="#667eea" />
              </View>
              <Text style={styles.locationTitle}>Pickup Location</Text>
            </View>
            
            <View style={styles.floorSelector}>
              <Text style={styles.floorLabel}>Floor Level</Text>
              <View style={styles.floorOptions}>
                {floorOptions.map((floor) => (
              <TouchableOpacity
                    key={floor.value}
                    style={[
                      styles.floorOption,
                      floorInfo.pickupFloor === floor.value && styles.floorOptionSelected
                    ]}
                    onPress={() => setFloorInfo({...floorInfo, pickupFloor: floor.value})}
                  >
                    <Text style={[
                      styles.floorOptionText,
                      floorInfo.pickupFloor === floor.value && styles.floorOptionTextSelected
                    ]}>
                      {floor.label}
                    </Text>
              </TouchableOpacity>
                ))}
              </View>
            </View>
              
            <View style={styles.accessOptions}>
                  <TouchableOpacity
                    style={[
                  styles.accessOption,
                  floorInfo.hasElevatorPickup && styles.accessOptionSelected
                ]}
                onPress={() => setFloorInfo({...floorInfo, hasElevatorPickup: !floorInfo.hasElevatorPickup})}
              >
                <MaterialIcons 
                  name="elevator" 
                  size={20} 
                  color={floorInfo.hasElevatorPickup ? 'white' : '#667eea'} 
                />
                <Text style={[
                  styles.accessOptionText,
                  floorInfo.hasElevatorPickup && styles.accessOptionTextSelected
                ]}>
                  Elevator Available
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.accessOption,
                  floorInfo.hasStairsPickup && styles.accessOptionSelected
                ]}
                onPress={() => setFloorInfo({...floorInfo, hasStairsPickup: !floorInfo.hasStairsPickup})}
              >
                <MaterialIcons 
                  name="stairs" 
                  size={20} 
                  color={floorInfo.hasStairsPickup ? 'white' : '#667eea'} 
                />
                <Text style={[
                  styles.accessOptionText,
                  floorInfo.hasStairsPickup && styles.accessOptionTextSelected
                ]}>
                  Stairs Only
                </Text>
              </TouchableOpacity>
              </View>
          </View>
        </Animated.View>

        {/* Delivery Location */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIcon}>
                <Feather name="arrow-down-circle" size={20} color="#f5576c" />
              </View>
              <Text style={styles.locationTitle}>Delivery Location</Text>
            </View>
            
            <View style={styles.floorSelector}>
              <Text style={styles.floorLabel}>Floor Level</Text>
              <View style={styles.floorOptions}>
                {floorOptions.map((floor) => (
              <TouchableOpacity
                    key={floor.value}
                    style={[
                      styles.floorOption,
                      floorInfo.deliveryFloor === floor.value && styles.floorOptionSelected
                    ]}
                    onPress={() => setFloorInfo({...floorInfo, deliveryFloor: floor.value})}
                  >
                    <Text style={[
                      styles.floorOptionText,
                      floorInfo.deliveryFloor === floor.value && styles.floorOptionTextSelected
                    ]}>
                      {floor.label}
                    </Text>
              </TouchableOpacity>
                ))}
            </View>
        </View>
        
            <View style={styles.accessOptions}>
              <TouchableOpacity
                style={[
                  styles.accessOption,
                  floorInfo.hasElevatorDelivery && styles.accessOptionSelected
                ]}
                onPress={() => setFloorInfo({...floorInfo, hasElevatorDelivery: !floorInfo.hasElevatorDelivery})}
              >
                <MaterialIcons 
                  name="elevator" 
                  size={20} 
                  color={floorInfo.hasElevatorDelivery ? 'white' : '#f5576c'} 
                />
                <Text style={[
                  styles.accessOptionText,
                  floorInfo.hasElevatorDelivery && styles.accessOptionTextSelected
                ]}>
                  Elevator Available
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.accessOption,
                  floorInfo.hasStairsDelivery && styles.accessOptionSelected
                ]}
                onPress={() => setFloorInfo({...floorInfo, hasStairsDelivery: !floorInfo.hasStairsDelivery})}
              >
                <MaterialIcons 
                  name="stairs" 
                  size={20} 
                  color={floorInfo.hasStairsDelivery ? 'white' : '#f5576c'} 
                />
                <Text style={[
                  styles.accessOptionText,
                  floorInfo.hasStairsDelivery && styles.accessOptionTextSelected
                ]}>
                  Stairs Only
                </Text>
              </TouchableOpacity>
        </View>
      </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
    );

  const renderServicesStep = () => (
    <Animated.View style={[contentStyle, { flex: 1 }]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          Additional <Text style={styles.stepTitleHighlight}>services</Text>?
        </Text>
        <Text style={styles.stepSubtitle}>
          Enhance your moving experience
        </Text>
      </View>
      
      <View style={styles.servicesContainer}>
        <View style={styles.servicesCompactGrid}>
          {additionalServices.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={FadeInUp.delay(index * 50).springify()}
              style={styles.serviceCompactWrapper}
            >
              <TouchableOpacity
              style={[
                  styles.serviceCompactCard,
                  selectedServices.includes(service.id) && styles.serviceCompactCardSelected
              ]}
              onPress={() => toggleService(service.id)}
                activeOpacity={0.8}
            >
              <View style={[
                  styles.serviceCompactIcon,
                  { backgroundColor: selectedServices.includes(service.id) ? service.color : `${service.color}20` }
              ]}>
                <MaterialIcons 
                    name={service.icon as any} 
                    size={18} 
                    color={selectedServices.includes(service.id) ? 'white' : service.color} 
                />
              </View>
              <Text style={[
                  styles.serviceCompactName,
                  selectedServices.includes(service.id) && styles.serviceCompactNameSelected
                ]}>
                  {service.name}
                </Text>
                <Text style={[
                  styles.serviceCompactPrice,
                  selectedServices.includes(service.id) && styles.serviceCompactPriceSelected
                ]}>
                  {service.price}
                </Text>
            </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderNotesStep = () => (
    <Animated.View style={[contentStyle, { flex: 1 }]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          Special <Text style={styles.stepTitleHighlight}>instructions</Text>
        </Text>
        <Text style={styles.stepSubtitle}>
          Any important details for the movers?
        </Text>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.notesContent}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <Animated.View
              entering={FadeIn.delay(200).springify()}
              style={styles.notesInputContainer}
            >
              <TextInput
                style={styles.notesInput}
                placeholder="E.g., Narrow hallway, fragile antiques, piano requires special handling..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                value={specialNotes}
                onChangeText={setSpecialNotes}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.notesCounter}>
                {specialNotes.length}/500
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeIn.delay(300).springify()}
              style={styles.quickNotesContainer}
            >
              <Text style={styles.quickNotesTitle}>Quick notes:</Text>
              <View style={styles.quickNotesGrid}>
                {['Heavy furniture', 'Fragile items', 'Narrow access', 'Parking restrictions'].map((note, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickNote}
                    onPress={() => setSpecialNotes(prev => prev + (prev ? ', ' : '') + note)}
                  >
                    <Text style={styles.quickNoteText}>{note}</Text>
                  </TouchableOpacity>
                ))}
      </View>
            </Animated.View>
    </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  const calculateTotal = () => {
    const sizePrice = parseInt(sizeOptions.find(o => o.id === selectedSize)?.price.replace('$', '') || '0');
    const servicesPrice = selectedServices.length * 50; // Average service price
    const floorCharge = (floorInfo.pickupFloor === '3' || floorInfo.pickupFloor === '4+' || 
                         floorInfo.deliveryFloor === '3' || floorInfo.deliveryFloor === '4+') ? 50 : 0;
    return sizePrice + servicesPrice + floorCharge;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header with Status Bar Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerWrapper}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusBarSpace} />
      <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
          <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Moving Service</Text>
            <Text style={styles.headerSubtitle}>Professional relocation</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressAnimatedStyle]}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <View style={styles.content}>
        {currentStep === 1 && renderSizeStep()}
        {currentStep === 2 && renderItemsStep()}
        {currentStep === 3 && renderFloorStep()}
        {currentStep === 4 && renderServicesStep()}
        {currentStep === 5 && renderNotesStep()}
      </View>

      {/* Price Summary (if items selected) */}
      {(selectedSize || selectedItems.length > 0) && (
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Price</Text>
            <Text style={styles.priceValue}>
              {sizeOptions.find(o => o.id === selectedSize)?.price || '$0'}
            </Text>
          </View>
          {selectedServices.length > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Services</Text>
              <Text style={styles.priceValue}>+${selectedServices.length * 50}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${calculateTotal()}</Text>
          </View>
        </View>
      )}

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
        style={[
            styles.continueButton,
            (currentStep === 1 && !selectedSize) && styles.continueButtonDisabled
          ]}
          onPress={handleNext}
          disabled={currentStep === 1 && !selectedSize}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (currentStep === 1 && !selectedSize) 
                ? ['#E0E0E0', '#D0D0D0']
                : ['#667eea', '#764ba2']
            }
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Animated.View style={[styles.continueContent, buttonAnimatedStyle]}>
              <Text style={styles.continueButtonText}>
                {currentStep === totalSteps ? 'Review Order' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
      </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerWrapper: {
    // Extends gradient behind status bar
  },
  statusBarSpace: {
    height: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  stepIndicatorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#667eea',
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: Colors.success,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  content: {
    flex: 1,
  },
  stepHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  stepTitleHighlight: {
    color: '#667eea',
    fontFamily: Fonts.PlayfairDisplay?.Variable || 'System',
    fontStyle: 'italic',
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  optionsScroll: {
    flex: 1,
  },
  
  // Size Step Styles
  sizeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sizeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sizeCardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  sizeGradient: {
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  sizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sizeInfo: {
    flex: 1,
  },
  sizeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  sizeTitleSelected: {
    color: 'white',
  },
  sizeSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  sizeSubtitleSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  sizeDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  sizeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  sizeDetailTextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  sizePriceContainer: {
    alignItems: 'flex-end',
  },
  sizePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  sizePriceSelected: {
    color: 'white',
  },
  sizePriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  sizePriceLabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  
  // Items List Step Styles
  itemsListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemListRow: {
    marginBottom: 8,
  },
  itemListContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  itemListContentSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea08',
  },
  itemListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemListName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  itemListNameSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  itemListActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  addBtn: {
    padding: 4,
  },
  selectedSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#667eea10',
    borderRadius: 8,
  },
  selectedSummaryText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  
  // Floor Step Styles
  floorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  locationSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  floorSelector: {
    marginBottom: 16,
  },
  floorLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  floorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  floorOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  floorOptionSelected: {
    backgroundColor: '#667eea',
  },
  floorOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  floorOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  accessOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  accessOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    gap: 8,
  },
  accessOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  accessOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  accessOptionTextSelected: {
    color: 'white',
  },
  
  // Services Step Styles (Compact)
  servicesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  servicesCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  serviceCompactWrapper: {
    width: '33.33%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  serviceCompactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    minHeight: 85,
  },
  serviceCompactCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea08',
  },
  serviceCompactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  serviceCompactName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: Fonts.SFProDisplay?.Medium || 'System',
  },
  serviceCompactNameSelected: {
    color: '#667eea',
  },
  serviceCompactPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  serviceCompactPriceSelected: {
    color: '#667eea',
  },
  
  // Notes Step Styles
  notesContent: {
    flex: 1,
  },
  notesInputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    minHeight: 150,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  notesCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  quickNotesContainer: {
    paddingHorizontal: 20,
  },
  quickNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  quickNotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickNote: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  quickNoteText: {
    fontSize: 13,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
    color: '#666',
  },
  
  // Price Summary
  priceSummary: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.SFProDisplay?.Regular || 'System',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    fontFamily: Fonts.SFProDisplay?.Bold || 'System',
  },
  
  // Bottom Container
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueGradient: {
    paddingVertical: 16,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: Fonts.SFProDisplay?.Semibold || 'System',
  },
});

export default MovingFlow;