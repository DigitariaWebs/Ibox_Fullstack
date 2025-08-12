import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Text, Icon, Button } from '../ui';
import { Colors } from '../config/colors';

interface HelpSupportScreenProps {
  navigation: any;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'delivery' | 'payment' | 'account';
}

interface ContactOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => void;
}

interface SupportCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const supportCategories: SupportCategory[] = [
    {
      id: 'orders',
      title: 'My Orders',
      description: 'Track, manage and view order history',
      icon: 'package',
      color: '#0AA5A8',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'delivery',
      title: 'Delivery Issues',
      description: 'Report problems with deliveries',
      icon: 'truck',
      color: '#F59E0B',
      onPress: () => handleDeliveryIssues(),
    },
    {
      id: 'payment',
      title: 'Payment & Billing',
      description: 'Payment methods and billing questions',
      icon: 'credit-card',
      color: '#10B981',
      onPress: () => handlePaymentIssues(),
    },
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Profile, addresses and preferences',
      icon: 'user',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I track my order?',
      answer: 'You can track your order in real-time by going to "My Orders" and tapping on your order. Each order has a unique tracking number and shows live location updates.',
      category: 'delivery',
    },
    {
      id: '2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, and PayPal. All payments are encrypted and secure.',
      category: 'payment',
    },
    {
      id: '3',
      question: 'How do I change my delivery address?',
      answer: 'Go to Settings > Addresses to add, edit or remove delivery addresses. You can set a default address for faster checkout on future orders.',
      category: 'account',
    },
    {
      id: '4',
      question: 'What are the delivery time estimates?',
      answer: 'Delivery times vary by service type:\n• Express: 2-4 hours\n• Standard: 24-48 hours\n• Moving: Scheduled appointment\n• Storage: Immediate access',
      category: 'delivery',
    },
    {
      id: '5',
      question: 'How can I cancel my order?',
      answer: 'You can cancel an order before it\'s picked up by going to "My Orders", selecting your order, and tapping "Cancel Order". Refunds are processed automatically.',
      category: 'general',
    },
    {
      id: '6',
      question: 'What should I do if my package is damaged?',
      answer: 'If your package arrives damaged, please contact support immediately with photos. We\'ll process your claim within 24 hours and arrange a replacement or refund.',
      category: 'delivery',
    },
  ];

  const contactOptions: ContactOption[] = [
    {
      id: 'chat',
      title: 'Live Chat',
      subtitle: 'Available 24/7 • Instant response',
      icon: 'message-circle',
      color: '#0AA5A8',
      action: () => {
        Alert.alert(
          'Live Chat',
          'Live chat is coming soon! For now, please contact us via email or phone.',
          [{ text: 'OK' }]
        );
      },
    },
    {
      id: 'phone',
      title: 'Call Support',
      subtitle: '+1 (514) 555-0123 • Mon-Fri 8AM-6PM',
      icon: 'phone',
      color: '#3B82F6',
      action: () => {
        const phoneNumber = 'tel:+15145550123';
        Linking.openURL(phoneNumber).catch(() => {
          Alert.alert('Error', 'Unable to open phone app');
        });
      },
    },
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'support@ibox.com • Response within 2 hours',
      icon: 'mail',
      color: '#F97316',
      action: () => {
        const emailUrl = 'mailto:support@ibox.com?subject=iBox Support Request';
        Linking.openURL(emailUrl).catch(() => {
          Alert.alert('Error', 'Unable to open email app');
        });
      },
    },
  ];

  const categories = [
    { key: 'all', label: 'All', count: faqData.length },
    { key: 'general', label: 'General', count: faqData.filter(f => f.category === 'general').length },
    { key: 'delivery', label: 'Delivery', count: faqData.filter(f => f.category === 'delivery').length },
    { key: 'payment', label: 'Payment', count: faqData.filter(f => f.category === 'payment').length },
    { key: 'account', label: 'Account', count: faqData.filter(f => f.category === 'account').length },
  ];

  const handleFAQPress = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setExpandedFAQ(null);
  };

  const handleDeliveryIssues = () => {
    const emailUrl = 'mailto:support@ibox.com?subject=Delivery Issue Report&body=Please describe the delivery issue:\n\nOrder Number:\nIssue Description:\nPreferred Resolution:\n';
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const handlePaymentIssues = () => {
    const emailUrl = 'mailto:billing@ibox.com?subject=Payment Issue&body=Please describe the payment issue:\n\nOrder Number:\nPayment Method:\nIssue Description:\n';
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const handleReportBug = () => {
    const emailUrl = 'mailto:bugs@ibox.com?subject=Bug Report&body=Bug Description:\n\nSteps to Reproduce:\n1. \n2. \n3. \n\nExpected Behavior:\n\nActual Behavior:\n\nDevice Info:\n- Device: \n- OS Version: \n- App Version: 1.0.0';
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const SupportCategoryCard = ({ category }: { category: SupportCategory }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={category.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
        <Icon name={category.icon as any} type="Feather" size={24} color={category.color} />
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
      </View>
      <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  const CategoryFilter = ({ category }: { category: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryFilter,
        selectedCategory === category.key && styles.categoryFilterActive,
      ]}
      onPress={() => handleCategoryFilter(category.key)}
    >
      <Text style={[
        styles.categoryFilterText,
        selectedCategory === category.key && styles.categoryFilterTextActive,
      ]}>
        {category.label}
      </Text>
      <View style={[
        styles.categoryFilterBadge,
        selectedCategory === category.key && styles.categoryFilterBadgeActive,
      ]}>
        <Text style={[
          styles.categoryFilterBadgeText,
          selectedCategory === category.key && styles.categoryFilterBadgeTextActive,
        ]}>
          {category.count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FAQItem = ({ faq }: { faq: FAQItem }) => {
    const isExpanded = expandedFAQ === faq.id;
    
    return (
      <View style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => handleFAQPress(faq.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            type="Feather" 
            size={20} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  const ContactCard = ({ option }: { option: ContactOption }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View style={[styles.contactIcon, { backgroundColor: option.color + '15' }]}>
        <Icon name={option.icon as any} type="Feather" size={24} color={option.color} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{option.title}</Text>
        <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
      </View>
      <Icon name="arrow-right" type="Feather" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity style={styles.bugButton} onPress={handleReportBug}>
          <Icon name="bug" type="Feather" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <Animated.View
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.welcomeCard}>
            <Icon name="help-circle" type="Feather" size={40} color={Colors.primary} />
            <Text style={styles.welcomeTitle}>How can we help you?</Text>
            <Text style={styles.welcomeText}>
              Find answers to common questions or get in touch with our support team
            </Text>
          </View>
        </Animated.View>

        {/* Support Categories */}
        <Animated.View
          style={[
            styles.categoriesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesList}>
            {supportCategories.map((category) => (
              <SupportCategoryCard key={category.id} category={category} />
            ))}
          </View>
        </Animated.View>

        {/* Contact Options */}
        <Animated.View
          style={[
            styles.contactSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionDescription}>
            Our support team is here to help you
          </Text>
          
          <View style={styles.contactList}>
            {contactOptions.map((option) => (
              <ContactCard key={option.id} option={option} />
            ))}
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View
          style={[
            styles.faqSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionDescription}>
            Quick answers to common questions
          </Text>

          {/* Category Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <CategoryFilter key={category.key} category={category} />
            ))}
          </ScrollView>

          {/* FAQ List */}
          <View style={styles.faqList}>
            {filteredFAQs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View
          style={[
            styles.appInfoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.appInfoCard}>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Version</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Platform</Text>
              <Text style={styles.appInfoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Last Updated</Text>
              <Text style={styles.appInfoValue}>January 11, 2025</Text>
            </View>
          </View>

          <View style={styles.legalButtons}>
            <Button
              title="Privacy Policy"
              onPress={() => Linking.openURL('https://ibox.com/privacy')}
              variant="outline"
              style={styles.legalButton}
            />
            <Button
              title="Terms of Service"
              onPress={() => Linking.openURL('https://ibox.com/terms')}
              variant="outline"
              style={styles.legalButton}
            />
          </View>
        </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  bugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  categoriesList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contactList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  faqSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  categoriesContainer: {
    paddingBottom: 20,
    gap: 12,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryFilterActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryFilterTextActive: {
    color: Colors.white,
  },
  categoryFilterBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryFilterBadgeActive: {
    backgroundColor: Colors.white + '20',
  },
  categoryFilterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryFilterBadgeTextActive: {
    color: Colors.white,
  },
  faqList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  faqAnswerText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  appInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  appInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  appInfoLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  appInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  legalButtons: {
    gap: 12,
  },
  legalButton: {
    marginBottom: 0,
  },
});

export default HelpSupportScreen;