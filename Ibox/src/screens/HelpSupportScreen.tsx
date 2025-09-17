import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../config/colors';
import { Fonts } from '../config/fonts';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20;

interface ContactMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'delivery' | 'payment' | 'account' | 'technical';
  expanded?: boolean;
}

interface SupportTicket {
  subject: string;
  message: string;
  category: 'delivery' | 'payment' | 'account' | 'technical' | 'other';
}

const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<'faq' | 'contact' | 'ticket'>('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<SupportTicket>({
    subject: '',
    message: '',
    category: 'delivery',
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  useEffect(() => {
    // Initial animations
    fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
    slideAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const contactMethods: ContactMethod[] = [
    {
      id: 'phone',
      title: 'Call Support',
      subtitle: 'Speak with our support team directly',
      icon: 'phone',
      color: '#10B981',
      action: () => {
        Alert.alert(
          'Call Support',
          'Would you like to call our support team?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call Now',
              onPress: () => Linking.openURL('tel:+1234567890')
            }
          ]
        );
      },
    },
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Send us a detailed message',
      icon: 'mail',
      color: '#3B82F6',
      action: () => {
        Linking.openURL('mailto:support@ibox.com?subject=Driver Support Request');
      },
    },
    {
      id: 'chat',
      title: 'Live Chat',
      subtitle: 'Chat with us in real-time',
      icon: 'message-circle',
      color: '#8B5CF6',
      action: () => {
        Alert.alert('Live Chat', 'Live chat feature coming soon!');
      },
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: 'Message us on WhatsApp',
      icon: 'message-square',
      color: '#10B981',
      action: () => {
        Linking.openURL('https://wa.me/1234567890?text=Hi, I need help with my driver account');
      },
    },
  ];

  const faqItems: FAQItem[] = [
    {
      id: '1',
      category: 'delivery',
      question: 'How do I accept delivery requests?',
      answer: 'When you receive a delivery notification, tap on it to view the details. You can then choose to accept or decline the request. Make sure to respond quickly as requests may expire.',
    },
    {
      id: '2',
      category: 'delivery',
      question: 'What should I do if I can\'t find the customer?',
      answer: 'First, try calling or messaging the customer through the app. If you still can\'t locate them, use the "Report Issue" button in the app to document the situation and contact support.',
    },
    {
      id: '3',
      category: 'payment',
      question: 'When do I get paid?',
      answer: 'Earnings are processed weekly and deposited directly to your registered bank account every Monday for the previous week\'s deliveries. You can view your payment history in the Earnings section.',
    },
    {
      id: '4',
      category: 'payment',
      question: 'How are delivery fees calculated?',
      answer: 'Delivery fees are based on distance, time, demand, and service type. Express deliveries and peak hours may have surge pricing. You can see the breakdown for each delivery in your earnings history.',
    },
    {
      id: '5',
      category: 'account',
      question: 'How do I update my vehicle information?',
      answer: 'Go to your profile, then tap on "Vehicle Information". You can update your vehicle details, license plate, and upload new photos. Changes may require verification.',
    },
    {
      id: '6',
      category: 'account',
      question: 'Why is my account under review?',
      answer: 'Account reviews can happen for various reasons including document verification, quality concerns, or routine security checks. You\'ll receive an email with specific details and next steps.',
    },
    {
      id: '7',
      category: 'technical',
      question: 'The app is not working properly, what should I do?',
      answer: 'First, try closing and reopening the app. If issues persist, check your internet connection and restart your phone. For ongoing problems, contact support with details about the issue.',
    },
    {
      id: '8',
      category: 'technical',
      question: 'How do I enable location services?',
      answer: 'Go to your phone\'s Settings > Privacy > Location Services > iBox Driver and ensure it\'s set to "While Using App" or "Always". Location access is required for delivery matching.',
    },
  ];

  const handleTabChange = async (tab: 'faq' | 'contact' | 'ticket') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  };

  const handleFAQToggle = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSubmitTicket = async () => {
    if (!ticketData.subject.trim() || !ticketData.message.trim()) {
      Alert.alert('Required Fields', 'Please fill in both subject and message fields.');
      return;
    }

    try {
      setSubmittingTicket(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Ticket Submitted',
        'Your support request has been submitted successfully. We\'ll get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setTicketData({ subject: '', message: '', category: 'delivery' });
              setSelectedTab('faq');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      {[
        { id: 'faq', title: 'FAQ', icon: 'help-circle' },
        { id: 'contact', title: 'Contact', icon: 'phone' },
        { id: 'ticket', title: 'Submit Ticket', icon: 'edit' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            selectedTab === tab.id && styles.tabButtonActive
          ]}
          onPress={() => handleTabChange(tab.id as any)}
          activeOpacity={0.7}
        >
          <Feather 
            name={tab.icon as any} 
            size={18} 
            color={selectedTab === tab.id ? 'white' : Colors.textSecondary} 
          />
          <Text style={[
            styles.tabButtonText,
            selectedTab === tab.id && styles.tabButtonTextActive
          ]}>
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFAQContent = () => (
    <View style={styles.faqContainer}>
      {faqItems.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(100 + index * 30)}
          style={styles.faqCard}
        >
          <TouchableOpacity
            style={styles.faqQuestion}
            onPress={() => handleFAQToggle(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.faqQuestionLeft}>
              <View style={[
                styles.faqCategoryBadge,
                { backgroundColor: getCategoryColor(item.category) }
              ]}>
                <Text style={styles.faqCategoryText}>
                  {item.category.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.faqQuestionText}>{item.question}</Text>
            </View>
            <Feather 
              name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {expandedFAQ === item.id && (
            <View style={styles.faqAnswer}>
              <Text style={styles.faqAnswerText}>{item.answer}</Text>
            </View>
          )}
        </Animated.View>
      ))}
    </View>
  );

  const renderContactContent = () => (
    <View style={styles.contactContainer}>
      <Text style={styles.contactTitle}>
        Get in <Text style={styles.contactTitleHighlight}>Touch</Text>
      </Text>
      <Text style={styles.contactSubtitle}>
        Choose the best way to reach our support team
      </Text>
      
      {contactMethods.map((method, index) => (
        <Animated.View
          key={method.id}
          entering={FadeInDown.delay(100 + index * 50)}
          style={styles.contactCard}
        >
          <TouchableOpacity
            style={styles.contactContent}
            onPress={method.action}
            activeOpacity={0.7}
          >
            <View style={[
              styles.contactIcon,
              { backgroundColor: `${method.color}15` }
            ]}>
              <Feather name={method.icon as any} size={24} color={method.color} />
            </View>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactMethodTitle}>{method.title}</Text>
              <Text style={styles.contactMethodSubtitle}>{method.subtitle}</Text>
            </View>
            
            <Feather name="arrow-right" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderTicketContent = () => (
    <View style={styles.ticketContainer}>
      <Text style={styles.ticketTitle}>
        Submit a <Text style={styles.ticketTitleHighlight}>Support Ticket</Text>
      </Text>
      <Text style={styles.ticketSubtitle}>
        Describe your issue and we'll help you resolve it
      </Text>
      
      <View style={styles.ticketForm}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categorySelector}>
            {[
              { id: 'delivery', label: 'Delivery Issues' },
              { id: 'payment', label: 'Payment & Earnings' },
              { id: 'account', label: 'Account Issues' },
              { id: 'technical', label: 'Technical Support' },
              { id: 'other', label: 'Other' },
            ].map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  ticketData.category === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setTicketData({ ...ticketData, category: category.id as any })}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryButtonText,
                  ticketData.category === category.id && styles.categoryButtonTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Subject</Text>
          <TextInput
            style={styles.textInput}
            value={ticketData.subject}
            onChangeText={(text) => setTicketData({ ...ticketData, subject: text })}
            placeholder="Briefly describe your issue"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Message</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={ticketData.message}
            onChangeText={(text) => setTicketData({ ...ticketData, message: text })}
            placeholder="Provide detailed information about your issue..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={6}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            submittingTicket && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitTicket}
          disabled={submittingTicket}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
          </Text>
          {!submittingTicket && (
            <Feather name="send" size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'delivery': return '#3B82F615';
      case 'payment': return '#10B98115';
      case 'account': return '#F59E0B15';
      case 'technical': return '#EF444415';
      default: return '#6B728015';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#667eea', '#764ba2']}
        locations={[0, 0.6, 1]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Help &</Text>
            <Text style={styles.headerTitleHighlight}>Support</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={containerStyle}>
          {renderTabSelector()}
          
          {selectedTab === 'faq' && renderFAQContent()}
          {selectedTab === 'contact' && renderContactContent()}
          {selectedTab === 'ticket' && renderTicketContent()}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
    marginRight: 6,
  },
  headerTitleHighlight: {
    fontSize: 24,
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: 'white',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: 'white',
  },
  
  // FAQ Styles
  faqContainer: {
    gap: 16,
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestionLeft: {
    flex: 1,
  },
  faqCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  faqCategoryText: {
    fontSize: 10,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textSecondary,
  },
  faqQuestionText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 16,
  },
  
  // Contact Styles
  contactContainer: {
    gap: 16,
  },
  contactTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  contactTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  contactSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contactMethodSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Ticket Styles
  ticketContainer: {
    gap: 24,
  },
  ticketTitle: {
    fontSize: 24,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  ticketTitleHighlight: {
    fontFamily: Fonts.PlayfairDisplay.Variable,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  ticketSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  ticketForm: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textPrimary,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: Fonts.SFProDisplay.Medium,
    color: Colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Regular,
    color: Colors.textPrimary,
    backgroundColor: 'white',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SFProDisplay.Bold,
    color: 'white',
  },
});

export default HelpSupportScreen;