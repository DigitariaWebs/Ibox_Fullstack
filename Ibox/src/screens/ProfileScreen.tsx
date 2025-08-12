import React from 'react';
import ModernProfileScreen from './ModernProfileScreen';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  // Use the new unified modern profile screen for all user types
  return <ModernProfileScreen />;
};

export default ProfileScreen;