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
  Image,
} from 'react-native';
import { Text, Icon, Button } from '../ui';
import { Colors } from '../config/colors';

interface AboutScreenProps {
  navigation: any;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Achievement {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface SocialLink {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;

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
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Utilisateurs actifs',
      value: '50K+',
      icon: 'users',
      color: '#0AA5A8',
    },
    {
      id: '2',
      title: 'Livraisons réussies',
      value: '1M+',
      icon: 'package',
      color: '#3B82F6',
    },
    {
      id: '3',
      title: 'Note moyenne',
      value: '4.9★',
      icon: 'star',
      color: '#F59E0B',
    },
    {
      id: '4',
      title: 'Villes desservies',
      value: '25+',
      icon: 'map-pin',
      color: '#8B5CF6',
    },
  ];

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Marie Dubois',
      role: 'Fondatrice & CEO',
      avatar: '👩‍💼',
    },
    {
      id: '2',
      name: 'Jean-Pierre Martin',
      role: 'CTO',
      avatar: '👨‍💻',
    },
    {
      id: '3',
      name: 'Sophie Tremblay',
      role: 'Responsable Opérations',
      avatar: '👩‍💻',
    },
    {
      id: '4',
      name: 'Arabi Achraf',
      role: 'Lead Developer',
      avatar: '👨‍💻',
    },
  ];

  const socialLinks: SocialLink[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      url: 'https://facebook.com/iboxcanada',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      url: 'https://twitter.com/iboxcanada',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      url: 'https://instagram.com/iboxcanada',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0A66C2',
      url: 'https://linkedin.com/company/ibox-canada',
    },
  ];

  const handleSocialPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    });
  };

  const handleEmailPress = () => {
    const emailUrl = 'mailto:contact@ibox.ca?subject=Contact iBox';
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
    });
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://ibox.ca').catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le site web');
    });
  };

  const handleLegalPress = (type: 'terms' | 'privacy') => {
    const url = type === 'terms' ? 'https://ibox.ca/terms' : 'https://ibox.ca/privacy';
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    });
  };

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <View style={styles.achievementCard}>
      <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '15' }]}>
        <Icon name={achievement.icon as any} type="Feather" size={24} color={achievement.color} />
      </View>
      <Text style={styles.achievementValue}>{achievement.value}</Text>
      <Text style={styles.achievementTitle}>{achievement.title}</Text>
    </View>
  );

  const TeamMemberCard = ({ member }: { member: TeamMember }) => (
    <View style={styles.teamMemberCard}>
      <Text style={styles.memberAvatar}>{member.avatar}</Text>
      <Text style={styles.memberName}>{member.name}</Text>
      <Text style={styles.memberRole}>{member.role}</Text>
    </View>
  );

  const SocialButton = ({ social }: { social: SocialLink }) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor: social.color + '15' }]}
      onPress={() => handleSocialPress(social.url)}
      activeOpacity={0.7}
    >
      <Icon name={social.icon as any} type="Feather" size={24} color={social.color} />
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Logo and Company Info */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: logoScaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Text style={styles.logoText}>iBox</Text>
            </View>
          </View>
          <Text style={styles.companyName}>iBox Canada</Text>
          <Text style={styles.companyTagline}>
            Révolutionnons ensemble la livraison au Québec
          </Text>
          <Text style={styles.appVersion}>Version 1.2.0</Text>
        </Animated.View>

        {/* Mission Section */}
        <Animated.View
          style={[
            styles.missionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Notre mission</Text>
          <Text style={styles.missionText}>
            Chez iBox, nous croyons que la livraison devrait être simple, rapide et fiable. 
            Notre mission est de connecter les communautés québécoises grâce à une plateforme 
            de livraison innovante qui respecte nos valeurs locales et notre environnement.
          </Text>
          <Text style={styles.missionText}>
            Nous nous engageons à soutenir les entreprises locales tout en offrant aux 
            consommateurs une expérience de livraison exceptionnelle, du colis express au 
            transport de marchandises.
          </Text>
        </Animated.View>

        {/* Achievements */}
        <Animated.View
          style={[
            styles.achievementsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Nos réalisations</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </Animated.View>

        {/* Team Section */}
        <Animated.View
          style={[
            styles.teamSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Notre équipe</Text>
          <Text style={styles.sectionDescription}>
            Une équipe passionnée et dédiée à votre service
          </Text>
          <View style={styles.teamGrid}>
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </View>
        </Animated.View>

        {/* Contact Section */}
        <Animated.View
          style={[
            styles.contactSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="mail" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>contact@ibox.ca</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="phone" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>+1 (514) 555-0123</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="map-pin" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>Montréal, QC, Canada</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="globe" type="Feather" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>www.ibox.ca</Text>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <Button
              title="Envoyer un email"
              onPress={handleEmailPress}
              style={styles.contactButton}
            />
            <Button
              title="Visiter le site web"
              onPress={handleWebsitePress}
              variant="outline"
              style={styles.contactButton}
            />
          </View>
        </Animated.View>

        {/* Social Media */}
        <Animated.View
          style={[
            styles.socialSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Suivez-nous</Text>
          <Text style={styles.sectionDescription}>
            Restez connecté avec nous sur les réseaux sociaux
          </Text>
          <View style={styles.socialButtons}>
            {socialLinks.map((social) => (
              <SocialButton key={social.id} social={social} />
            ))}
          </View>
        </Animated.View>

        {/* Legal Section */}
        <Animated.View
          style={[
            styles.legalSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Informations légales</Text>
          <View style={styles.legalButtons}>
            <Button
              title="Conditions d'utilisation"
              onPress={() => handleLegalPress('terms')}
              variant="outline"
              style={styles.legalButton}
            />
            <Button
              title="Politique de confidentialité"
              onPress={() => handleLegalPress('privacy')}
              variant="outline"
              style={styles.legalButton}
            />
          </View>
          
          <View style={styles.legalInfo}>
            <Text style={styles.legalText}>
              © 2024 iBox Canada Inc. Tous droits réservés.
            </Text>
            <Text style={styles.legalText}>
              Développé avec ❤️ à Montréal, Québec
            </Text>
            <Text style={styles.legalText}>
              Version de l'app: 1.2.0 • Build: 2024.01.15
            </Text>
            <Text style={styles.legalText}>
              Plateforme: {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
            </Text>
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
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  companyName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  companyTagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  missionSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  missionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  achievementsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  teamSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  teamMemberCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberAvatar: {
    fontSize: 32,
    marginBottom: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  memberRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  contactInfo: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactButtons: {
    gap: 12,
  },
  contactButton: {
    marginBottom: 0,
  },
  socialSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
  },
  legalButtons: {
    gap: 12,
    marginBottom: 24,
  },
  legalButton: {
    marginBottom: 0,
  },
  legalInfo: {
    alignItems: 'center',
    gap: 8,
  },
  legalText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default AboutScreen; 