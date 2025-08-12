import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  ImageBackground,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

interface VehicleInfoScreenProps {
  navigation: any;
}

const VehicleInfoScreen: React.FC<VehicleInfoScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    make: 'Mercedes',
    model: 'Sprinter',
    year: '2021',
    plateNumber: 'MTL-4582',
    color: 'White',
    capacity: '3.5 tons',
    dimensions: '6.1m × 2.4m × 2.7m',
    fuelType: 'Diesel',
    insurance: 'Active',
    registration: 'Valid until Dec 2024',
  });

  const handleSave = () => {
    Alert.alert('Success', 'Vehicle information updated successfully!');
    setIsEditing(false);
  };

  const handleAddPhoto = () => {
    Alert.alert(
      'Add Vehicle Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera selected') },
        { text: 'Photo Library', onPress: () => console.log('Library selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const documents = [
    {
      id: 1,
      title: 'Vehicle Registration',
      status: 'Valid',
      expiry: 'Dec 2024',
      icon: 'file-text',
      color: '#10B981',
    },
    {
      id: 2,
      title: 'Insurance Certificate',
      status: 'Active',
      expiry: 'Mar 2025',
      icon: 'shield',
      color: '#3B82F6',
    },
    {
      id: 3,
      title: 'Safety Inspection',
      status: 'Valid',
      expiry: 'Jun 2024',
      icon: 'check-circle',
      color: '#F59E0B',
    },
    {
      id: 4,
      title: 'Commercial License',
      status: 'Active',
      expiry: 'Sep 2025',
      icon: 'award',
      color: '#8B5CF6',
    },
  ];

  const maintenanceHistory = [
    {
      date: 'Nov 15, 2023',
      type: 'Oil Change',
      mileage: '45,320 km',
      cost: '$85.00',
      status: 'completed',
    },
    {
      date: 'Oct 2, 2023',
      type: 'Tire Rotation',
      mileage: '44,180 km',
      cost: '$60.00',
      status: 'completed',
    },
    {
      date: 'Sep 8, 2023',
      type: 'Brake Inspection',
      mileage: '43,450 km',
      cost: '$120.00',
      status: 'completed',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Information</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Icon 
            name={isEditing ? "check" : "edit-2"} 
            type="Feather" 
            size={20} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vehicle Photo */}
        <View style={styles.photoSection}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop' }}
            style={styles.vehiclePhoto}
            imageStyle={styles.vehiclePhotoStyle}
          >
            <TouchableOpacity style={styles.photoOverlay} onPress={handleAddPhoto}>
              <Icon name="camera" type="Feather" size={24} color={Colors.white} />
              <Text style={styles.photoOverlayText}>Update Photo</Text>
            </TouchableOpacity>
          </ImageBackground>
        </View>

        {/* Vehicle Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Make & Model</Text>
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.detailInput, { flex: 1, marginRight: 8 }]}
                    value={vehicleData.make}
                    onChangeText={(text) => setVehicleData({...vehicleData, make: text})}
                  />
                  <TextInput
                    style={[styles.detailInput, { flex: 1 }]}
                    value={vehicleData.model}
                    onChangeText={(text) => setVehicleData({...vehicleData, model: text})}
                  />
                </View>
              ) : (
                <Text style={styles.detailValue}>{vehicleData.make} {vehicleData.model}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={vehicleData.year}
                  onChangeText={(text) => setVehicleData({...vehicleData, year: text})}
                />
              ) : (
                <Text style={styles.detailValue}>{vehicleData.year}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>License Plate</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={vehicleData.plateNumber}
                  onChangeText={(text) => setVehicleData({...vehicleData, plateNumber: text})}
                />
              ) : (
                <Text style={styles.detailValue}>{vehicleData.plateNumber}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Color</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={vehicleData.color}
                  onChangeText={(text) => setVehicleData({...vehicleData, color: text})}
                />
              ) : (
                <Text style={styles.detailValue}>{vehicleData.color}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Capacity</Text>
              <Text style={styles.detailValue}>{vehicleData.capacity}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dimensions</Text>
              <Text style={styles.detailValue}>{vehicleData.dimensions}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fuel Type</Text>
              <Text style={styles.detailValue}>{vehicleData.fuelType}</Text>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documents & Licenses</Text>
          <View style={styles.documentsList}>
            {documents.map((document) => (
              <TouchableOpacity key={document.id} style={styles.documentItem}>
                <View style={[styles.documentIcon, { backgroundColor: document.color + '20' }]}>
                  <Icon name={document.icon as any} type="Feather" size={20} color={document.color} />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{document.title}</Text>
                  <Text style={styles.documentExpiry}>Expires: {document.expiry}</Text>
                </View>
                <View style={styles.documentStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: document.color + '20' }]}>
                    <Text style={[styles.statusText, { color: document.color }]}>
                      {document.status}
                    </Text>
                  </View>
                  <Icon name="chevron-right" type="Feather" size={16} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Maintenance History */}
        <View style={styles.maintenanceSection}>
          <Text style={styles.sectionTitle}>Maintenance History</Text>
          <View style={styles.maintenanceList}>
            {maintenanceHistory.map((maintenance, index) => (
              <View key={index} style={styles.maintenanceItem}>
                <View style={styles.maintenanceLeft}>
                  <Text style={styles.maintenanceType}>{maintenance.type}</Text>
                  <Text style={styles.maintenanceDate}>{maintenance.date}</Text>
                  <Text style={styles.maintenanceMileage}>{maintenance.mileage}</Text>
                </View>
                <View style={styles.maintenanceRight}>
                  <Text style={styles.maintenanceCost}>{maintenance.cost}</Text>
                  <View style={styles.maintenanceStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.maintenanceStatusText}>Completed</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.addMaintenanceButton}>
            <Icon name="plus" type="Feather" size={16} color={Colors.primary} />
            <Text style={styles.addMaintenanceText}>Add Maintenance Record</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionItem}>
              <Icon name="calendar" type="Feather" size={20} color="#F59E0B" />
              <Text style={styles.actionText}>Schedule Maintenance</Text>
              <Icon name="chevron-right" type="Feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Icon name="camera" type="Feather" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Add Vehicle Photos</Text>
              <Icon name="chevron-right" type="Feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Icon name="upload" type="Feather" size={20} color="#10B981" />
              <Text style={styles.actionText}>Upload Documents</Text>
              <Icon name="chevron-right" type="Feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
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
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  photoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  vehiclePhoto: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclePhotoStyle: {
    borderRadius: 12,
  },
  photoOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  photoOverlayText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  detailInput: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 100,
    textAlign: 'right',
  },
  editRow: {
    flexDirection: 'row',
    flex: 1,
  },
  documentsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  documentsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  documentExpiry: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  documentStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  maintenanceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  maintenanceList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
  },
  maintenanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  maintenanceLeft: {
    flex: 1,
  },
  maintenanceType: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  maintenanceDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  maintenanceMileage: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  maintenanceRight: {
    alignItems: 'flex-end',
  },
  maintenanceCost: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  maintenanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  maintenanceStatusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  addMaintenanceButton: {
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
  addMaintenanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});

export default VehicleInfoScreen;