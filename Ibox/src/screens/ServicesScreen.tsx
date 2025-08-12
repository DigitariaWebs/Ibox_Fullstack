import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

const { width } = Dimensions.get('window');

interface ServicesScreenProps {
  navigation: any;
}

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialIcons';
  color: string;
  price: string;
  features: string[];
  screen?: string;
}

const services: ServiceItem[] = [
  {
    id: 'express',
    title: 'Express Delivery',
    description: 'Fast same-day delivery for urgent packages and time-sensitive deliveries',
    icon: 'flash',
    iconFamily: 'MaterialIcons',
    color: '#FF6B35',
    price: 'From $15',
    features: ['Same-day delivery', 'Real-time tracking', 'Priority handling', 'Instant notifications'],
    screen: 'ExpressScreen',
  },
  {
    id: 'standard',
    title: 'Standard Delivery',
    description: 'Reliable next-day delivery for regular packages and documents',
    icon: 'local-shipping',
    iconFamily: 'MaterialIcons',
    color: '#4ECDC4',
    price: 'From $8',
    features: ['Next-day delivery', 'Package insurance', 'Flexible scheduling', 'SMS updates'],
  },
  {
    id: 'moving',
    title: 'Moving Service',
    description: 'Complete moving assistance with professional movers and equipment',
    icon: 'home',
    iconFamily: 'MaterialIcons',
    color: '#45B7D1',
    price: 'From $50',
    features: ['Professional movers', 'Packing service', 'Furniture protection', 'Assembly help'],
    screen: 'DemenagementScreen',
  },
  {
    id: 'storage',
    title: 'Storage Service',
    description: 'Secure climate-controlled storage solutions for all your belongings',
    icon: 'storage',
    iconFamily: 'MaterialIcons',
    color: '#96CEB4',
    price: 'From $25/month',
    features: ['Climate controlled', '24/7 security', 'Flexible access', 'Monthly billing'],
    screen: 'StockageScreen',
  },
];

const ServicesScreen: React.FC<ServicesScreenProps> = ({ navigation }) => {

  const renderServiceIcon = (service: ServiceItem) => {
    const IconComponent = service.iconFamily === 'Ionicons' ? Ionicons : MaterialIcons;
    return (
      <IconComponent
        name={service.icon as any}
        size={32}
        color="white"
      />
    );
  };

  const ServiceCard = ({ service }: { service: ServiceItem }) => (
    <View style={styles.serviceCard}>
      <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
        {renderServiceIcon(service)}
      </View>
      
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        
        <View style={styles.servicePriceContainer}>
          <Text style={styles.servicePrice}>{service.price}</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          {service.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Services</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Our Service Portfolio</Text>
          <Text style={styles.heroSubtitle}>
            Discover our comprehensive range of delivery and logistics solutions
          </Text>
        </View>

        {/* Services Grid */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Choose iBox?</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.infoCardTitle}>Secure & Reliable</Text>
              <Text style={styles.infoCardText}>
                Your packages are insured and tracked throughout the delivery process
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.infoCardTitle}>Fast Delivery</Text>
              <Text style={styles.infoCardText}>
                Same-day and next-day delivery options available
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="headset" size={24} color="#10B981" />
              </View>
              <Text style={styles.infoCardTitle}>24/7 Support</Text>
              <Text style={styles.infoCardText}>
                Our customer support team is always here to help
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaSubtitle}>Book a delivery now and experience the difference</Text>
          
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.ctaButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  servicesContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceContent: {
    flex: 1,
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  servicePriceContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  featuresContainer: {
    gap: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  infoGrid: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ServicesScreen; 