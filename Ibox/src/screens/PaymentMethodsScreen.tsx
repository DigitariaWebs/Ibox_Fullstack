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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text, Icon, Input, Button } from '../ui';
import { Colors } from '../config/colors';

interface PaymentMethodsScreenProps {
  navigation: any;
}

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  cvv: string;
  isDefault: boolean;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'unknown';
  nickname: string;
}

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  cvv: string;
  nickname: string;
  type: 'credit' | 'debit';
}

interface FormErrors {
  cardNumber?: string;
  expiryDate?: string;
  holderName?: string;
  cvv?: string;
  nickname?: string;
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
  // Mock payment methods data
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit',
      cardNumber: '4532123456789012',
      expiryDate: '12/26',
      holderName: 'Jean Dupont',
      cvv: '123',
      isDefault: true,
      cardBrand: 'visa',
      nickname: 'Visa principale',
    },
    {
      id: '2',
      type: 'debit',
      cardNumber: '5555666677778888',
      expiryDate: '09/25',
      holderName: 'Jean Dupont',
      cvv: '456',
      isDefault: false,
      cardBrand: 'mastercard',
      nickname: 'Mastercard Débit',
    },
    {
      id: '3',
      type: 'credit',
      cardNumber: '378282246310005',
      expiryDate: '03/27',
      holderName: 'Jean Dupont',
      cvv: '1234',
      isDefault: false,
      cardBrand: 'amex',
      nickname: 'Amex Gold',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentForm>({
    cardNumber: '',
    expiryDate: '',
    holderName: '',
    cvv: '',
    nickname: '',
    type: 'credit',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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

  const cardTypes = [
    { key: 'credit', label: 'Crédit', icon: 'credit-card', color: '#0AA5A8' },
    { key: 'debit', label: 'Débit', icon: 'card', color: '#3B82F6' },
  ];

  const detectCardBrand = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
    const number = cardNumber.replace(/\s/g, '');
    
    if (number.match(/^4/)) return 'visa';
    if (number.match(/^5[1-5]/) || number.match(/^2[2-7]/)) return 'mastercard';
    if (number.match(/^3[47]/)) return 'amex';
    
    return 'unknown';
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const maskCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const last4 = cleaned.slice(-4);
    const masked = '**** **** **** ' + last4;
    return masked;
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa':
        return require('../../assets/images/logos/visa.png');
      case 'mastercard':
        return require('../../assets/images/logos/mastercard.png');
      case 'amex':
        return require('../../assets/images/logos/amex.png');
      default:
        return null;
    }
  };

  const getCardBrandColor = (brand: string) => {
    switch (brand) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return '#6B7280';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Le nom est requis';
    }

    if (!formData.holderName.trim()) {
      newErrors.holderName = 'Le nom du titulaire est requis';
    }

    // Card number validation
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Le numéro de carte est requis';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = 'Numéro de carte invalide';
    }

    // Expiry date validation
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'La date d\'expiration est requise';
    } else if (!expiryRegex.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Format invalide (MM/AA)';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Carte expirée';
      }
    }

    // CVV validation
    const cvvLength = detectCardBrand(formData.cardNumber) === 'amex' ? 4 : 3;
    if (!formData.cvv) {
      newErrors.cvv = 'Le CVV est requis';
    } else if (formData.cvv.length !== cvvLength) {
      newErrors.cvv = `CVV doit contenir ${cvvLength} chiffres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '');
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      cardNumber: '',
      expiryDate: '',
      holderName: '',
      cvv: '',
      nickname: '',
      type: 'credit',
    });
    setErrors({});
    setEditingCard(null);
  };

  const handleAddCard = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditCard = (card: PaymentMethod) => {
    setFormData({
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      holderName: card.holderName,
      cvv: card.cvv,
      nickname: card.nickname,
      type: card.type,
    });
    setEditingCard(card);
    setShowAddModal(true);
  };

  const handleSaveCard = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const cardBrand = detectCardBrand(formData.cardNumber);

      if (editingCard) {
        // Update existing card
        setPaymentMethods(prev => prev.map(card => 
          card.id === editingCard.id 
            ? { ...card, ...formData, cardBrand }
            : card
        ));
      } else {
        // Add new card
        const newCard: PaymentMethod = {
          id: Date.now().toString(),
          ...formData,
          cardBrand,
          isDefault: paymentMethods.length === 0, // First card is default
        };
        setPaymentMethods(prev => [...prev, newCard]);
      }

      setIsLoading(false);
      setShowAddModal(false);
      resetForm();

      Alert.alert(
        'Succès',
        editingCard ? 'Carte modifiée avec succès!' : 'Carte ajoutée avec succès!'
      );
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleDeleteCard = (card: PaymentMethod) => {
    Alert.alert(
      'Supprimer la carte',
      `Êtes-vous sûr de vouloir supprimer "${card.nickname}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => {
              const filtered = prev.filter(c => c.id !== card.id);
              // If we deleted the default card, make the first one default
              if (card.isDefault && filtered.length > 0) {
                filtered[0].isDefault = true;
              }
              return filtered;
            });
          },
        },
      ]
    );
  };

  const handleSetDefault = (cardId: string) => {
    setPaymentMethods(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === cardId,
    })));
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const PaymentCard = ({ card }: { card: PaymentMethod }) => {
    const cardIcon = getCardBrandIcon(card.cardBrand);
    const cardColor = getCardBrandColor(card.cardBrand);
    
    return (
      <View style={[styles.paymentCard, { borderLeftColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.cardBrandContainer}>
              {cardIcon && (
                <Image source={cardIcon} style={styles.cardBrandIcon} />
              )}
              <View style={styles.cardDetails}>
                <Text style={styles.cardNickname}>{card.nickname}</Text>
                <Text style={styles.cardType}>
                  {card.type === 'credit' ? 'Crédit' : 'Débit'}
                </Text>
              </View>
            </View>
            
            {card.isDefault && (
              <View style={styles.defaultBadge}>
                <Icon name="star" type="Feather" size={12} color={Colors.white} />
                <Text style={styles.defaultBadgeText}>Principal</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleEditCard(card)}
            >
              <Icon name="edit-2" type="Feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleDeleteCard(card)}
            >
              <Icon name="trash-2" type="Feather" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardNumber}>{maskCardNumber(card.cardNumber)}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.holderName}>{card.holderName}</Text>
            <Text style={styles.expiryDate}>{card.expiryDate}</Text>
          </View>
        </View>
        
        {!card.isDefault && (
          <TouchableOpacity 
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(card.id)}
          >
            <Icon name="star" type="Feather" size={14} color={Colors.primary} />
            <Text style={styles.setDefaultText}>Définir comme principal</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
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
        <Text style={styles.headerTitle}>Moyens de paiement</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
          <Icon name="plus" type="Feather" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Payment Methods Count */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statsCard}>
            <Icon name="credit-card" type="Feather" size={24} color={Colors.primary} />
            <Text style={styles.statsNumber}>{paymentMethods.length}</Text>
            <Text style={styles.statsLabel}>
              {paymentMethods.length === 1 ? 'carte enregistrée' : 'cartes enregistrées'}
            </Text>
          </View>
        </Animated.View>

        {/* Payment Methods List */}
        <Animated.View
          style={[
            styles.paymentMethodsList,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="credit-card" type="Feather" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Aucune carte</Text>
              <Text style={styles.emptyStateText}>
                Ajoutez votre première carte de paiement pour faciliter vos achats
              </Text>
              <Button
                title="Ajouter une carte"
                onPress={handleAddCard}
                variant="primary"
                icon={<Icon name="plus" type="Feather" size={20} color={Colors.white} />}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            paymentMethods.map((card) => (
              <PaymentCard key={card.id} card={card} />
            ))
          )}
        </Animated.View>

        {/* Add Card Button */}
        {paymentMethods.length > 0 && (
          <Animated.View
            style={[
              styles.addSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Button
              title="Ajouter une nouvelle carte"
              onPress={handleAddCard}
              variant="outline"
              icon={<Icon name="plus" type="Feather" size={20} color={Colors.primary} />}
              style={styles.addCardButton}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Add/Edit Card Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackButton} onPress={handleCloseModal}>
                <Icon name="x" type="Feather" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingCard ? 'Modifier la carte' : 'Nouvelle carte'}
              </Text>
              <TouchableOpacity 
                style={[styles.modalSaveButton, !formData.nickname.trim() && styles.modalSaveButtonDisabled]}
                onPress={handleSaveCard}
                disabled={!formData.nickname.trim() || isLoading}
              >
                <Text style={[styles.modalSaveButtonText, !formData.nickname.trim() && styles.modalSaveButtonTextDisabled]}>
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Card Preview */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Aperçu de la carte</Text>
                <View style={[styles.cardPreview, { borderLeftColor: getCardBrandColor(detectCardBrand(formData.cardNumber)) }]}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewNickname}>
                      {formData.nickname || 'Nouvelle carte'}
                    </Text>
                    <Text style={styles.previewType}>
                      {formData.type === 'credit' ? 'Crédit' : 'Débit'}
                    </Text>
                  </View>
                  <Text style={styles.previewNumber}>
                    {formData.cardNumber || '**** **** **** ****'}
                  </Text>
                  <View style={styles.previewFooter}>
                    <Text style={styles.previewHolder}>
                      {formData.holderName || 'NOM DU TITULAIRE'}
                    </Text>
                    <Text style={styles.previewExpiry}>
                      {formData.expiryDate || 'MM/AA'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Type Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Type de carte</Text>
                <View style={styles.typeSelector}>
                  {cardTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        formData.type === type.key && styles.typeOptionSelected,
                      ]}
                      onPress={() => handleInputChange('type', type.key as any)}
                    >
                      <Icon 
                        name={type.icon as any} 
                        type="Feather" 
                        size={20} 
                        color={formData.type === type.key ? Colors.white : type.color} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        formData.type === type.key && styles.typeOptionTextSelected,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.modalSection}>
                <Input
                  label="Nom de la carte"
                  value={formData.nickname}
                  onChangeText={(value) => handleInputChange('nickname', value)}
                  error={errors.nickname}
                  placeholder="Ex: Visa principale, Mastercard pro..."
                  leftIcon={<Icon name="tag" type="Feather" size={20} color={Colors.textSecondary} />}
                />

                <Input
                  label="Nom du titulaire"
                  value={formData.holderName}
                  onChangeText={(value) => handleInputChange('holderName', value)}
                  error={errors.holderName}
                  placeholder="Jean Dupont"
                  autoCapitalize="words"
                  leftIcon={<Icon name="user" type="Feather" size={20} color={Colors.textSecondary} />}
                />

                <Input
                  label="Numéro de carte"
                  value={formData.cardNumber}
                  onChangeText={(value) => handleInputChange('cardNumber', value)}
                  error={errors.cardNumber}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="numeric"
                  maxLength={19}
                  leftIcon={<Icon name="credit-card" type="Feather" size={20} color={Colors.textSecondary} />}
                />

                <View style={styles.formRow}>
                  <View style={styles.formHalf}>
                    <Input
                      label="Date d'expiration"
                      value={formData.expiryDate}
                      onChangeText={(value) => handleInputChange('expiryDate', value)}
                      error={errors.expiryDate}
                      placeholder="MM/AA"
                      keyboardType="numeric"
                      maxLength={5}
                      leftIcon={<Icon name="calendar" type="Feather" size={20} color={Colors.textSecondary} />}
                    />
                  </View>
                  <View style={styles.formHalf}>
                    <Input
                      label="CVV"
                      value={formData.cvv}
                      onChangeText={(value) => handleInputChange('cvv', value)}
                      error={errors.cvv}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={detectCardBrand(formData.cardNumber) === 'amex' ? 4 : 3}
                      secureTextEntry
                      leftIcon={<Icon name="shield" type="Feather" size={20} color={Colors.textSecondary} />}
                    />
                  </View>
                </View>
              </View>

              {/* Security Notice */}
              <View style={styles.securityNotice}>
                <Icon name="shield" type="Feather" size={20} color={Colors.primary} />
                <Text style={styles.securityText}>
                  Vos informations de paiement sont sécurisées et chiffrées
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  paymentMethodsList: {
    paddingHorizontal: 20,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 20,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardBrandIcon: {
    width: 32,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  cardDetails: {
    flex: 1,
  },
  cardNickname: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardType: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  cardContent: {
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holderName: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  expiryDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
  },
  addSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addCardButton: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  modalSaveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  modalSaveButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  modalScrollView: {
    flex: 1,
  },
  modalSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  cardPreview: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewNickname: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewType: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  previewNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 2,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewHolder: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  previewExpiry: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  typeOptionTextSelected: {
    color: Colors.white,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  securityText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
});

export default PaymentMethodsScreen; 