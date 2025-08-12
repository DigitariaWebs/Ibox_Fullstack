import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Dimensions,
  SafeAreaView,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../config/colors';
import { Text, Button } from '../../ui';

// Safe window dimensions
const windowDims = Dimensions.get('window');
const SCREEN_WIDTH = windowDims?.width || 375;

interface MovingFlowProps {
  navigation: any;
  route: any;
}

const MovingFlow: React.FC<MovingFlowProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedApartmentSize, setSelectedApartmentSize] = useState<string>('');
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Scroll refs to maintain position
  const inventoryScrollRef = useRef<ScrollView>(null);
  const servicesScrollRef = useRef<ScrollView>(null);

  const animateStepTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const steps = [
    { number: 1, title: 'Taille', active: currentStep === 1 },
    { number: 2, title: 'Inventaire', active: currentStep === 2 },
    { number: 3, title: 'Services', active: currentStep === 3 },
  ];

  const apartmentSizeOptions = [
    {
      id: 'studio',
      title: 'Studio / 1 Chambre',
      subtitle: 'Petit appartement',
      description: '1-2 pièces, 3-4 heures',
      price: 'À partir de $129',
      icon: 'home',
      duration: '3-4h',
    },
    {
      id: '2br',
      title: '2-3 Chambres',
      subtitle: 'Appartement familial',
      description: '2-3 chambres, 4-6 heures',
      price: 'À partir de $199',
      icon: 'apartment',
      duration: '4-6h',
      popular: true,
    },
    {
      id: '4br',
      title: '4+ Chambres',
      subtitle: 'Grande maison',
      description: '4+ chambres, 6-8 heures',
      price: 'À partir de $299',
      icon: 'domain',
      duration: '6-8h',
    },
  ];

  const inventoryOptions = [
    { id: 'sofa', title: 'Canapé', icon: 'weekend', category: 'furniture' },
    { id: 'bed', title: 'Lit', icon: 'bed', category: 'furniture' },
    { id: 'table', title: 'Table', icon: 'table-restaurant', category: 'furniture' },
    { id: 'chair', title: 'Chaises', icon: 'chair', category: 'furniture' },
    { id: 'dresser', title: 'Commode', icon: 'storage', category: 'furniture' },
    { id: 'wardrobe', title: 'Armoire', icon: 'door-sliding', category: 'furniture' },
    { id: 'tv', title: 'Télé', icon: 'tv', category: 'electronics' },
    { id: 'fridge', title: 'Réfrigérateur', icon: 'kitchen', category: 'appliances' },
    { id: 'washer', title: 'Lave-linge', icon: 'local-laundry-service', category: 'appliances' },
    { id: 'boxes', title: 'Cartons', icon: 'inventory-2', category: 'boxes' },
  ];

  const serviceOptions = [
    { id: 'packing', title: 'Service d\'emballage', icon: 'inventory' },
    { id: 'unpacking', title: 'Service de déballage', icon: 'unarchive' },
    { id: 'assembly', title: 'Montage de meubles', icon: 'build' },
    { id: 'storage', title: 'Stockage temporaire', icon: 'storage' },
    { id: 'cleaning', title: 'Nettoyage', icon: 'cleaning-services' },
    { id: 'protection', title: 'Protection des biens', icon: 'shield' },
  ];

  const handleApartmentSizeSelect = (sizeId: string) => {
    setSelectedApartmentSize(sizeId);
    setTimeout(() => {
      setCurrentStep(2);
      animateStepTransition();
    }, 300);
  };

  const toggleInventoryItem = (item: any) => {
    setSelectedInventoryItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedInventoryItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      setSelectedInventoryItems(prev => 
        prev.map(i => i.id === itemId ? { ...i, quantity } : i)
      );
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinueToNext = () => {
    if (currentStep === 1 && !selectedApartmentSize) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner la taille de votre appartement.');
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      animateStepTransition();
    } else {
      handleSubmitMoving();
    }
  };

  const handleSubmitMoving = () => {
    const selectedSizeData = apartmentSizeOptions.find(opt => opt.id === selectedApartmentSize);
    
    // Moving service goes directly to summary without photo
    navigation.navigate('MovingOrderSummary', {
      ...route.params,
      apartmentSize: selectedSizeData,
      inventoryItems: selectedInventoryItems,
      additionalServices: selectedServices,
      serviceType: 'moving',
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      animateStepTransition();
    } else {
      navigation.goBack();
    }
  };

  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={step.number} style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            step.active && styles.progressDotActive,
            currentStep > step.number && styles.progressDotCompleted,
          ]}>
            {currentStep > step.number ? (
              <MaterialIcons name="check" size={12} color={Colors.white} />
            ) : (
              <Text style={[
                styles.progressNumber,
                step.active && styles.progressNumberActive,
              ]}>{step.number}</Text>
            )}
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.progressLine,
              currentStep > step.number && styles.progressLineCompleted,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const ApartmentSizeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Quelle est la taille ?</Text>
        <Text style={styles.stepSubtitle}>Sélectionnez la taille de votre appartement</Text>
      </View>
      
      <View style={styles.stepContent}>
        <View style={styles.optionsGrid}>
          {apartmentSizeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedApartmentSize === option.id && styles.optionCardSelected,
                option.popular && styles.optionCardPopular,
              ]}
              onPress={() => handleApartmentSizeSelect(option.id)}
              activeOpacity={0.7}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAIRE</Text>
                </View>
              )}
              
              <View style={styles.optionIcon}>
                <MaterialIcons name={option.icon} size={28} color={Colors.primary} />
              </View>
              
              <Text style={styles.optionName}>{option.title}</Text>
              <Text style={styles.optionDuration}>{option.duration}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              
              <View style={styles.optionPriceContainer}>
                <Text style={styles.optionPrice}>{option.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
    </View>
  );

  const InventoryStep = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(inventoryOptions.length / itemsPerPage);
    
    const getCurrentPageItems = () => {
      const startIndex = currentPage * itemsPerPage;
      return inventoryOptions.slice(startIndex, startIndex + itemsPerPage);
    };
    
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Que déménagez-vous ?</Text>
          <Text style={styles.stepSubtitle}>Sélectionnez vos meubles et objets</Text>
          {totalPages > 1 && (
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>{currentPage + 1} / {totalPages}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.inventoryGrid}>
            {getCurrentPageItems().map((item) => {
              const selectedItem = selectedInventoryItems.find(i => i.id === item.id);
              const isSelected = !!selectedItem;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.inventoryCard,
                    isSelected && styles.inventoryCardSelected,
                  ]}
                  onPress={() => toggleInventoryItem(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.inventoryIcon}>
                    <MaterialIcons name={item.icon} size={20} color={isSelected ? Colors.white : Colors.primary} />
                  </View>
                  <Text style={[
                    styles.inventoryName,
                    isSelected && styles.inventoryNameSelected,
                  ]}>{item.title}</Text>
                  
                  {isSelected && (
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateItemQuantity(item.id, selectedItem.quantity - 1)}
                      >
                        <MaterialIcons name="remove" size={12} color={Colors.white} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{selectedItem.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateItemQuantity(item.id, selectedItem.quantity + 1)}
                      >
                        <MaterialIcons name="add" size={12} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <MaterialIcons name="chevron-left" size={24} color={currentPage === 0 ? Colors.textSecondary : Colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.paginationDots}>
                {Array.from({ length: totalPages }, (_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.paginationDot,
                      currentPage === index && styles.paginationDotActive,
                    ]}
                    onPress={() => setCurrentPage(index)}
                  />
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages - 1 ? Colors.textSecondary : Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.stepFooter}>
          <Button
            title="Continuer"
            onPress={handleContinueToNext}
            style={styles.continueButton}
          />
        </View>
      </View>
    );
  };

  const ServicesStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Services additionnels</Text>
        <Text style={styles.stepSubtitle}>Sélectionnez les services que vous souhaitez</Text>
      </View>
      
      <View style={styles.stepContentServices}>
        <View style={styles.servicesGrid}>
          {serviceOptions.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedServices.includes(service.id) && styles.serviceCardSelected,
              ]}
              onPress={() => toggleService(service.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.serviceIconContainer,
                selectedServices.includes(service.id) && styles.serviceIconContainerSelected,
              ]}>
                <MaterialIcons 
                  name={service.icon} 
                  size={20} 
                  color={selectedServices.includes(service.id) ? Colors.white : Colors.primary} 
                />
              </View>
              <Text style={[
                styles.serviceTitle,
                selectedServices.includes(service.id) && styles.serviceTitleSelected,
              ]}>{service.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </View>
      
      <View style={styles.stepFooter}>
        <Button
          title="Voir le résumé"
          onPress={handleContinueToNext}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
      enabled={true}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Moving Service</Text>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepCounter}>{currentStep}/3</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Step Content - Full Screen */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {currentStep === 1 && <ApartmentSizeStep />}
        {currentStep === 2 && <InventoryStep />}
        {currentStep === 3 && <ServicesStep />}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50, // Account for status bar on iOS
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  stepIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressNumberActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  progressLineCompleted: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepFooter: {
    paddingTop: 20,
  },
  optionsGrid: {
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionCardPopular: {
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    textAlign: 'center',
  },
  optionDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  optionPriceContainer: {
    alignItems: 'center',
  },
  optionPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceCard: {
    width: (SCREEN_WIDTH - 70) / 3,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 80,
    justifyContent: 'center',
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  serviceTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  serviceTitleSelected: {
    color: Colors.primary,
  },
  continueButton: {
    marginBottom: 20,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inventoryCard: {
    width: (SCREEN_WIDTH - 70) / 3,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 100,
    justifyContent: 'center',
  },
  inventoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  inventoryIcon: {
    marginBottom: 8,
  },
  inventoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  inventoryNameSelected: {
    color: Colors.white,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    minWidth: 16,
    textAlign: 'center',
  },
  paginationInfo: {
    marginTop: 8,
  },
  paginationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
  },
  stepContentServices: {
    flex: 1,
    justifyContent: 'space-between',
  },
});

export default MovingFlow;