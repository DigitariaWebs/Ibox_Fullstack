import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../config/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  {
    id: 'storage',
    title: 'Storage Service',
    description: 'Secure storage solutions',
    icon: 'archive',
    iconFamily: 'Ionicons',
    price: 'From $25/month',
    estimatedTime: 'Flexible',
    color: '#96CEB4',
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
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const renderIcon = (service: Service) => {
    const IconComponent = service.iconFamily === 'Ionicons' ? Ionicons : MaterialIcons;
    return (
      <IconComponent
        name={service.icon as any}
        size={28}
        color="white"
      />
    );
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    onSelectService(serviceId);
    onClose();
  };

  const handleContinue = () => {
    if (selectedServiceId && onContinue) {
      onContinue(selectedServiceId);
    }
    onClose();
  };

  const getSelectedService = () => {
    return services.find(service => service.id === selectedServiceId);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
          activeOpacity={1}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal Content */}
      <Animated.View style={[styles.modal, modalAnimatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons 
              name="close" 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Service</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Reset Locations Button */}
        {onReset && (
          <View style={styles.resetContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <Text style={styles.resetText}>Reset Locations</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Destination Info */}
        {destination && (
          <Animated.View 
            style={styles.destinationInfo}
            entering={FadeIn.delay(200)}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color={Colors.primary} 
            />
            <Text style={styles.destinationText} numberOfLines={2}>
              {destination}
            </Text>
          </Animated.View>
        )}

        {/* Services List */}
        <ScrollView 
          style={styles.servicesContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Available Services</Text>
          
          {services.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={SlideInUp.delay(index * 100).duration(400)}
              exiting={SlideOutDown.duration(200)}
            >
              <TouchableOpacity
                style={styles.serviceItem}
                onPress={() => handleServiceSelect(service.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                  {renderIcon(service)}
                </View>
                
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Price:</Text>
                      <Text style={styles.priceValue}>{service.price}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.timeValue}>{service.estimatedTime}</Text>
                    </View>
                  </View>
                </View>
                
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
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
    zIndex: 1500,
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
    marginTop: 100,
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
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
  },
  destinationText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  servicesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  resetContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    gap: 6,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});

export default ServiceSelectionModal;