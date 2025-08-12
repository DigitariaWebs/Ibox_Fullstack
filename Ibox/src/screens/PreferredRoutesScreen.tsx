import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';

interface PreferredRoutesScreenProps {
  navigation: any;
}

const PreferredRoutesScreen: React.FC<PreferredRoutesScreenProps> = ({ navigation }) => {
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [preferFastestRoute, setPreferFastestRoute] = useState(true);

  const savedRoutes = [
    {
      id: 1,
      name: 'Downtown Loop',
      description: 'Best route for downtown deliveries',
      startPoint: 'Old Montreal',
      endPoint: 'Plateau Mont-Royal',
      distance: '8.5 km',
      avgTime: '25 min',
      isActive: true,
      frequency: 'Daily',
      color: '#10B981',
    },
    {
      id: 2,
      name: 'Airport Express',
      description: 'Fast route to Pierre Elliott Trudeau Airport',
      startPoint: 'Downtown Montreal',
      endPoint: 'YUL Airport',
      distance: '22.3 km',
      avgTime: '35 min',
      isActive: true,
      frequency: 'Weekly',
      color: '#3B82F6',
    },
    {
      id: 3,
      name: 'West Island Route',
      description: 'Suburban delivery route',
      startPoint: 'Westmount',
      endPoint: 'Pointe-Claire',
      distance: '18.7 km',
      avgTime: '28 min',
      isActive: false,
      frequency: 'Occasionally',
      color: '#F59E0B',
    },
    {
      id: 4,
      name: 'South Shore Express',
      description: 'Cross-bridge route to South Shore',
      startPoint: 'Downtown Montreal',
      endPoint: 'Longueuil',
      distance: '15.2 km',
      avgTime: '32 min',
      isActive: true,
      frequency: 'Daily',
      color: '#8B5CF6',
    },
  ];

  const trafficPreferences = [
    {
      id: 'avoid_rush_hour',
      title: 'Avoid Rush Hour Routes',
      subtitle: 'Skip busy routes during peak hours',
      value: true,
    },
    {
      id: 'construction_alerts',
      title: 'Construction Alerts',
      subtitle: 'Get notified about road construction',
      value: true,
    },
    {
      id: 'real_time_traffic',
      title: 'Real-time Traffic Updates',
      subtitle: 'Receive live traffic information',
      value: true,
    },
  ];

  const handleDeleteRoute = (routeId: number, routeName: string) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${routeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log(`Deleting route ${routeId}`);
            // Handle route deletion
          },
        },
      ]
    );
  };

  const handleToggleRoute = (routeId: number) => {
    console.log(`Toggling route ${routeId}`);
    // Handle route toggle
  };

  const handleEditRoute = (routeId: number) => {
    console.log(`Editing route ${routeId}`);
    // Navigate to route editor
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" type="Feather" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferred Routes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="plus" type="Feather" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Route Preferences */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Route Preferences</Text>
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Avoid Toll Roads</Text>
                <Text style={styles.preferenceSubtitle}>Skip toll roads when possible</Text>
              </View>
              <Switch
                value={avoidTolls}
                onValueChange={setAvoidTolls}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={avoidTolls ? Colors.primary : Colors.textSecondary}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Avoid Highways</Text>
                <Text style={styles.preferenceSubtitle}>Use local roads when practical</Text>
              </View>
              <Switch
                value={avoidHighways}
                onValueChange={setAvoidHighways}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={avoidHighways ? Colors.primary : Colors.textSecondary}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Prefer Fastest Route</Text>
                <Text style={styles.preferenceSubtitle}>Prioritize time over distance</Text>
              </View>
              <Switch
                value={preferFastestRoute}
                onValueChange={setPreferFastestRoute}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={preferFastestRoute ? Colors.primary : Colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Saved Routes */}
        <View style={styles.routesSection}>
          <Text style={styles.sectionTitle}>Saved Routes</Text>
          <View style={styles.routesList}>
            {savedRoutes.map((route) => (
              <View key={route.id} style={styles.routeItem}>
                <View style={styles.routeHeader}>
                  <View style={styles.routeInfo}>
                    <View style={styles.routeTitleRow}>
                      <View style={[styles.routeColorDot, { backgroundColor: route.color }]} />
                      <Text style={styles.routeName}>{route.name}</Text>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: route.isActive ? '#10B981' + '20' : Colors.border }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: route.isActive ? '#10B981' : Colors.textSecondary }
                        ]}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.routeDescription}>{route.description}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => handleEditRoute(route.id)}
                  >
                    <Icon name="more-horizontal" type="Feather" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.routePoints}>
                    <View style={styles.routePoint}>
                      <View style={styles.startDot} />
                      <Text style={styles.pointText} numberOfLines={1}>{route.startPoint}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <View style={styles.endDot} />
                      <Text style={styles.pointText} numberOfLines={1}>{route.endPoint}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.routeStats}>
                  <View style={styles.statItem}>
                    <Icon name="navigation" type="Feather" size={14} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{route.distance}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="clock" type="Feather" size={14} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{route.avgTime}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="repeat" type="Feather" size={14} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{route.frequency}</Text>
                  </View>
                </View>

                <View style={styles.routeActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleToggleRoute(route.id)}
                  >
                    <Icon 
                      name={route.isActive ? "pause" : "play"} 
                      type="Feather" 
                      size={16} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.actionButtonText}>
                      {route.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteRoute(route.id, route.name)}
                  >
                    <Icon name="trash-2" type="Feather" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Traffic Preferences */}
        <View style={styles.trafficSection}>
          <Text style={styles.sectionTitle}>Traffic & Alerts</Text>
          <View style={styles.trafficCard}>
            {trafficPreferences.map((preference, index) => (
              <View key={preference.id} style={styles.trafficItem}>
                <View style={styles.trafficInfo}>
                  <Text style={styles.trafficTitle}>{preference.title}</Text>
                  <Text style={styles.trafficSubtitle}>{preference.subtitle}</Text>
                </View>
                <Switch
                  value={preference.value}
                  onValueChange={(value) => console.log(`${preference.id}: ${value}`)}
                  trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                  thumbColor={preference.value ? Colors.primary : Colors.textSecondary}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Add New Route */}
        <View style={styles.addRouteSection}>
          <TouchableOpacity style={styles.addRouteButton}>
            <Icon name="plus-circle" type="Feather" size={24} color={Colors.primary} />
            <View style={styles.addRouteText}>
              <Text style={styles.addRouteTitle}>Create New Route</Text>
              <Text style={styles.addRouteSubtitle}>Add a frequently used route</Text>
            </View>
            <Icon name="chevron-right" type="Feather" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
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
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  preferencesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  preferencesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  routesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  routesList: {
    gap: 12,
  },
  routeItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  routeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  routeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 20,
  },
  moreButton: {
    padding: 4,
  },
  routeDetails: {
    marginBottom: 12,
  },
  routePoints: {
    paddingLeft: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  startDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  endDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginBottom: 4,
  },
  pointText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingLeft: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#EF4444' + '10',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  trafficSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  trafficCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trafficItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  trafficInfo: {
    flex: 1,
  },
  trafficTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  trafficSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addRouteSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  addRouteButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addRouteText: {
    flex: 1,
  },
  addRouteTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 2,
  },
  addRouteSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    opacity: 0.7,
  },
  bottomPadding: {
    height: 40,
  },
});

export default PreferredRoutesScreen;