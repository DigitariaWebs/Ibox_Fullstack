import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

interface DriverSupportScreenProps {
  navigation: any;
}

const DriverSupportScreen: React.FC<DriverSupportScreenProps> = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const quickActions = [
    {
      id: 'emergency',
      title: 'Emergency Support',
      subtitle: '24/7 emergency assistance',
      icon: 'phone-call',
      color: '#EF4444',
      action: () => Linking.openURL('tel:911'),
    },
    {
      id: 'live_chat',
      title: 'Live Chat Support',
      subtitle: 'Chat with our support team',
      icon: 'message-circle',
      color: '#10B981',
      action: () => console.log('Opening live chat'),
    },
    {
      id: 'call_support',
      title: 'Call Support',
      subtitle: 'Mon-Fri 8AM-8PM EST',
      icon: 'phone',
      color: '#3B82F6',
      action: () => Linking.openURL('tel:+15145550123'),
    },
    {
      id: 'email_support',
      title: 'Email Support',
      subtitle: 'Get help via email',
      icon: 'mail',
      color: '#F59E0B',
      action: () => Linking.openURL('mailto:support@ibox.com'),
    },
  ];

  const supportCategories = [
    {
      id: 'delivery_issues',
      title: 'Delivery Issues',
      subtitle: 'Problems with pickups or drop-offs',
      icon: 'truck',
      color: '#0AA5A8',
    },
    {
      id: 'payment_issues',
      title: 'Payment & Earnings',
      subtitle: 'Questions about payments',
      icon: 'dollar-sign',
      color: '#10B981',
    },
    {
      id: 'app_issues',
      title: 'App Technical Issues',
      subtitle: 'Bugs and technical problems',
      icon: 'smartphone',
      color: '#8B5CF6',
    },
    {
      id: 'account_issues',
      title: 'Account & Profile',
      subtitle: 'Account settings and verification',
      icon: 'user',
      color: '#F59E0B',
    },
    {
      id: 'vehicle_issues',
      title: 'Vehicle & Documents',
      subtitle: 'Vehicle registration and docs',
      icon: 'file-text',
      color: '#3B82F6',
    },
    {
      id: 'safety_issues',
      title: 'Safety & Security',
      subtitle: 'Report safety concerns',
      icon: 'shield',
      color: '#EF4444',
    },
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I get paid for my deliveries?',
      answer: 'Payments are processed weekly every Friday. You can view your earnings in the Earnings History section and update your payment method in Vehicle Info.',
    },
    {
      id: 2,
      question: 'What should I do if a customer is not available?',
      answer: 'First, try calling the customer. If they don\'t answer, wait 5 minutes and try again. If still no response, contact support through the app for guidance.',
    },
    {
      id: 3,
      question: 'How do I report a problem with my delivery?',
      answer: 'You can report issues directly in the app by going to Delivery History and selecting the specific delivery. You can also contact support immediately.',
    },
    {
      id: 4,
      question: 'Can I change my availability schedule?',
      answer: 'Yes, you can update your availability in the driver profile settings. Changes take effect immediately for new delivery requests.',
    },
    {
      id: 5,
      question: 'What documents do I need to keep updated?',
      answer: 'Keep your driver\'s license, vehicle registration, insurance, and commercial license current. You\'ll receive notifications before they expire.',
    },
    {
      id: 6,
      question: 'How do I handle damaged packages?',
      answer: 'Take photos of any damage immediately, report it through the app, and contact support. Do not attempt delivery of damaged items.',
    },
  ];

  const recentTickets = [
    {
      id: 'T2024001',
      title: 'Payment not received',
      status: 'resolved',
      date: '2 days ago',
      category: 'Payment',
    },
    {
      id: 'T2024002',
      title: 'App crash during delivery',
      status: 'in_progress',
      date: '1 week ago',
      category: 'Technical',
    },
    {
      id: 'T2024003',
      title: 'Customer complaint follow-up',
      status: 'closed',
      date: '2 weeks ago',
      category: 'Delivery',
    },
  ];

  const handleCategoryPress = (category: any) => {
    console.log(`Opening support for: ${category.title}`);
    // Navigate to category-specific support
  };

  const handleFAQPress = (faqId: number) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'open':
        return '#EF4444';
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionItem}
                onPress={action.action}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Icon name={action.icon as any} type="Feather" size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Get Help With</Text>
          <View style={styles.categoriesList}>
            {supportCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Icon name={category.icon as any} type="Feather" size={20} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                </View>
                <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {faqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => handleFAQPress(faq.id)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Icon
                    name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                    type="Feather"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </View>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Support Tickets */}
        <View style={styles.ticketsSection}>
          <Text style={styles.sectionTitle}>Recent Support Tickets</Text>
          <View style={styles.ticketsList}>
            {recentTickets.map((ticket) => (
              <TouchableOpacity key={ticket.id} style={styles.ticketItem}>
                <View style={styles.ticketInfo}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketId}>{ticket.id}</Text>
                    <View style={[styles.ticketStatus, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                      <Text style={[styles.ticketStatusText, { color: getStatusColor(ticket.status) }]}>
                        {ticket.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  <View style={styles.ticketMeta}>
                    <Text style={styles.ticketCategory}>{ticket.category}</Text>
                    <Text style={styles.ticketDate}>• {ticket.date}</Text>
                  </View>
                </View>
                <Icon name="chevron-right" type="Feather" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.viewAllTicketsButton}>
            <Text style={styles.viewAllTicketsText}>View All Support Tickets</Text>
            <Icon name="external-link" type="Feather" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Icon name="headphones" type="Feather" size={24} color={Colors.primary} />
              <Text style={styles.contactTitle}>Need More Help?</Text>
            </View>
            <Text style={styles.contactDescription}>
              Our support team is available 24/7 for emergency issues and Mon-Fri 8AM-8PM EST for general support.
            </Text>
            <View style={styles.contactMethods}>
              <TouchableOpacity 
                style={styles.contactMethod}
                onPress={() => Linking.openURL('tel:+15145550123')}
              >
                <Icon name="phone" type="Feather" size={16} color={Colors.primary} />
                <Text style={styles.contactMethodText}>+1 (514) 555-0123</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactMethod}
                onPress={() => Linking.openURL('mailto:support@ibox.com')}
              >
                <Icon name="mail" type="Feather" size={16} color={Colors.primary} />
                <Text style={styles.contactMethodText}>support@ibox.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoriesList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  faqList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  ticketsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ticketsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ticketStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ticketDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  viewAllTicketsButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  viewAllTicketsText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  contactDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactMethods: {
    gap: 8,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  bottomPadding: {
    height: 40,
  },
});

export default DriverSupportScreen;