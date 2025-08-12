import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Linking, Button, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Text } from '../ui';
import MapTransition from '../components/MapTransition';

interface MapScreenProps {
  navigation: any;
  route?: {
    params?: {
      initialPosition?: { x: number; y: number; width: number; height: number };
    };
  };
}

const openAppleMaps = (lat: number, lng: number) => {
  const url = `http://maps.apple.com/?ll=${lat},${lng}`;
  Linking.openURL(url);
};

const MapScreen: React.FC<MapScreenProps> = ({ navigation, route }) => {
  const [isVisible, setIsVisible] = useState(false);
  const initialPosition = route?.params?.initialPosition;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => {
      navigation.goBack();
    }, 300);
  };

  return (
    <MapTransition isVisible={isVisible} initialPosition={initialPosition}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Open Apple Maps</Text>
          <Text style={styles.subtitle}>Tap the button below to open Apple Maps at Paris, France.</Text>
          <Button title="Open Apple Maps" onPress={() => openAppleMaps(48.8566, 2.3522)} />
        </View>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>
    </MapTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default MapScreen;
