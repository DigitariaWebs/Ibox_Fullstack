import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Button, Text, Icon } from './ui';
import { Colors } from './config/colors';
import { useTranslation } from './config/i18n';

const LANGUAGES = [
  { 
    code: 'en', 
    label: 'English', 
    nativeLabel: 'English',
    flag: require('../assets/images/flag_en.png'),
    description: 'Set interface language to English',
  },
  { 
    code: 'fr', 
    label: 'Français', 
    nativeLabel: 'Français',
    flag: require('../assets/images/flag_fr.png'),
    description: 'Définir la langue de l\'interface en français',
  },
];

interface LanguageSelectionScreenProps {
  navigation: any;
}

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({ navigation }) => {
  const { t, locale, setLocale } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'fr'>(locale);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSelect = (code: 'en' | 'fr') => {
    setSelectedLanguage(code);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      setLocale(selectedLanguage);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        selectedLanguage === 'fr' ? 'Langue mise à jour' : 'Language Updated',
        selectedLanguage === 'fr' 
          ? 'La langue de l\'interface a été mise à jour avec succès!' 
          : 'Interface language has been updated successfully!',
        [
          { 
            text: selectedLanguage === 'fr' ? 'OK' : 'OK', 
            onPress: () => {
              if (navigation && navigation.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        selectedLanguage === 'fr' ? 'Erreur' : 'Error',
        selectedLanguage === 'fr' 
          ? 'Une erreur est survenue lors de la mise à jour' 
          : 'An error occurred while updating the language'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = selectedLanguage !== locale;

  const LanguageCard = ({ language }: { language: typeof LANGUAGES[0] }) => {
    const isSelected = selectedLanguage === language.code;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageCard,
          isSelected && styles.languageCardSelected,
        ]}
        onPress={() => handleSelect(language.code as 'en' | 'fr')}
        activeOpacity={0.7}
      >
        <View style={styles.languageInfo}>
          <Image source={language.flag} style={styles.flagIcon} />
          <View style={styles.languageDetails}>
            <Text style={styles.languageLabel}>{language.label}</Text>
            <Text style={styles.languageDescription} numberOfLines={1}>
              {language.description}
            </Text>
          </View>
        </View>
        
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>
          {locale === 'fr' ? 'Langue' : 'Language'}
        </Text>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Language Info */}
        <Animated.View
          style={[
            styles.currentLanguageSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.currentLanguageCard}>
            <Icon name="globe" type="Feather" size={24} color={Colors.primary} />
            <Text style={styles.currentLanguageTitle}>
              {locale === 'fr' ? 'Langue actuelle' : 'Current Language'}
            </Text>
            <Text style={styles.currentLanguageText}>
              {LANGUAGES.find(lang => lang.code === locale)?.label || 'Français'}
            </Text>
          </View>
        </Animated.View>

        {/* Language Selection */}
        <Animated.View
          style={[
            styles.languageSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>
            {locale === 'fr' ? 'Sélectionner une langue' : 'Select Language'}
          </Text>
          <Text style={styles.sectionDescription}>
            {locale === 'fr' 
              ? 'Choisissez la langue de l\'interface de l\'application'
              : 'Choose the language for the app interface'
            }
          </Text>
          
          <View style={styles.languageList}>
            {LANGUAGES.map((language) => (
              <LanguageCard key={language.code} language={language} />
            ))}
          </View>
        </Animated.View>

        {/* Language Features */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>
            {locale === 'fr' ? 'Fonctionnalités' : 'Features'}
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>
                {locale === 'fr' 
                  ? 'Interface traduite intégralement'
                  : 'Fully translated interface'
                }
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="check-circle" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>
                {locale === 'fr' 
                  ? 'Formats de date et nombre localisés'
                  : 'Localized date and number formats'
                }
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="check-circle" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>
                {locale === 'fr' 
                  ? 'Sauvegarde automatique des préférences'
                  : 'Automatic preference saving'
                }
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Save Button */}
        {hasChanges && (
          <Animated.View
            style={[
              styles.saveSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Button
              title={
                isSaving
                  ? (locale === 'fr' ? 'Sauvegarde...' : 'Saving...')
                  : (locale === 'fr' ? 'Sauvegarder les modifications' : 'Save Changes')
              }
              onPress={handleSave}
              variant="primary"
              disabled={isSaving}
              icon={
                isSaving ? (
                  <Icon name="loader" type="Feather" size={20} color={Colors.white} />
                ) : (
                  <Icon name="check" type="Feather" size={20} color={Colors.white} />
                )
              }
              style={styles.saveButton}
            />
          </Animated.View>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  currentLanguageSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  currentLanguageCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentLanguageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  currentLanguageText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  languageSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  languageList: {
    gap: 12,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  languageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  languageDetails: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  languageDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  featuresSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  saveSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  saveButton: {
    marginBottom: 0,
  },
});

export default LanguageSelectionScreen; 