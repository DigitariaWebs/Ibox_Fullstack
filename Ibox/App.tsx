import './global.css';
import React, { useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, View, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { MotiView } from 'moti';
import * as Font from 'expo-font';
import { fontAssets, Fonts } from './src/config/fonts';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, Text, SearchInput, Card, Input, Icon } from './src/ui';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import LanguageSelectionScreen from './src/LanguageSelectionScreen';
import AuthSelectionScreen from './src/AuthSelectionScreen';
import { RootState } from './src/store/store';
import LoadingScreen from './src/LoadingScreen';
import OnboardingScreen from './src/OnboardingScreen';
import LoginScreen from './src/LoginScreen';
import HomeScreen from './src/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import TransporterHomeScreen from './src/screens/TransporterHomeScreen';
import DriverModeScreen from './src/screens/DriverModeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import TrackPackageScreen from './src/screens/TrackPackageScreen';
import { SignUpProvider } from './src/contexts/SignUpContext';
import OnboardingEntryScreen from './src/screens/signup/OnboardingEntryScreen';
import AccountTypeScreen from './src/screens/signup/AccountTypeScreen';
import IdentityScreen from './src/screens/signup/IdentityScreen';
import AddressLocaleScreen from './src/screens/signup/AddressLocaleScreen';
import CustomerExtrasScreen from './src/screens/signup/CustomerExtrasScreen';
import PaymentMethodScreen from './src/screens/signup/PaymentMethodScreen';
import CustomerAccountTypeScreen from './src/screens/signup/CustomerAccountTypeScreen';
import BusinessDetailsScreen from './src/screens/signup/BusinessDetailsScreen';
import TransporterVehicleScreen from './src/screens/signup/TransporterVehicleScreen';
import TransporterComplianceScreen from './src/screens/signup/TransporterComplianceScreen';
import TransporterBankingScreen from './src/screens/signup/TransporterBankingScreen';
import ConfirmationScreen from './src/screens/signup/ConfirmationScreen';
import MapScreen from './src/screens/MapScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import AboutScreen from './src/screens/AboutScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import PackagePhotoScreen from './src/screens/PackagePhotoScreen';
import MeasuringScreen from './src/screens/MeasuringScreen';
import OrderSummaryScreen from './src/screens/OrderSummaryScreen';
import DriverSearchScreen from './src/screens/DriverSearchScreen';
import DriverFoundScreen from './src/screens/DriverFoundScreen';

// Driver Quick Action Screens
import EarningsHistoryScreen from './src/screens/EarningsHistoryScreen';
import DeliveryHistoryScreen from './src/screens/DeliveryHistoryScreen';
import VehicleInfoScreen from './src/screens/VehicleInfoScreen';
import PreferredRoutesScreen from './src/screens/PreferredRoutesScreen';
import DriverSupportScreen from './src/screens/DriverSupportScreen';

// Service Flow Screens
import ExpressFlow from './src/screens/flows/ExpressFlow';
import StandardFlow from './src/screens/flows/StandardFlow';
import MovingFlow from './src/screens/flows/MovingFlow';
import StorageFlow from './src/screens/flows/StorageFlow';
import MovingOrderSummary from './src/screens/flows/MovingOrderSummary';
import StorageOrderSummary from './src/screens/flows/StorageOrderSummary';
import ExpressOrderSummary from './src/screens/flows/ExpressOrderSummary';
import StandardOrderSummary from './src/screens/flows/StandardOrderSummary';

// Storage Service Screens
import StorageFacilityMapScreen from './src/screens/flows/StorageFacilityMapScreen';
import StorageFacilityDetailsScreen from './src/screens/flows/StorageFacilityDetailsScreen';
import StorageSubscriptionSuccessScreen from './src/screens/flows/StorageSubscriptionSuccessScreen';

// Auth Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';

// Import store and actions
import { increment, decrement, incrementByAmount } from './src/store/store';

function useLoadFonts() {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      await Font.loadAsync(fontAssets);
      setLoaded(true);
    })();
  }, []);
  return loaded;
}

const FontShowcase: React.FC = () => (
  <View style={{ marginBottom: 32 }}>
    <Text variant="h3" weight="semibold" style={{ marginBottom: 16 }}>
      Font Showcase
    </Text>
    <View style={{ gap: 12 }}>
      <Text style={{ fontFamily: Fonts.PlayfairDisplay.Variable, fontSize: 22 }}>
        PlayfairDisplay VariableFont
      </Text>
      <Text style={{ fontFamily: Fonts.Roboto.Variable, fontSize: 22 }}>
        Roboto VariableFont
      </Text>
      <Text style={{ fontFamily: Fonts.Montserrat.Variable, fontSize: 22 }}>
        Montserrat VariableFont
      </Text>
      <Text style={{ fontFamily: Fonts.SFProDisplay.Bold, fontSize: 22 }}>
        SF Pro Display Bold
      </Text>
      <Text style={{ fontFamily: Fonts.SFProDisplay.Medium, fontSize: 22 }}>
        SF Pro Display Medium
      </Text>
      <Text style={{ fontFamily: Fonts.SFProDisplay.Regular, fontSize: 22 }}>
        SF Pro Display Regular
      </Text>
      <Text style={{ fontFamily: Fonts.SFProDisplay.ThinItalic, fontSize: 22 }}>
        SF Pro Display ThinItalic
      </Text>
      <Text style={{ fontFamily: Fonts.WayCome.Regular, fontSize: 22 }}>
        WayCome Regular
      </Text>
    </View>
  </View>
);

const IconShowcase: React.FC = () => (
  <View style={{ marginBottom: 32 }}>
    <Text variant="h3" weight="semibold" style={{ marginBottom: 16 }}>
      Icon Showcase
    </Text>
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      <Icon name="search" type="Feather" size={32} color="#2563EB" />
      <Icon name="user" type="FontAwesome" size={32} color="#10B981" />
      <Icon name="star" type="MaterialIcons" size={32} color="#F59E0B" />
      <Icon name="check" type="Feather" size={32} color="#22C55E" />
      <Icon name="alert-circle" type="Feather" size={32} color="#EF4444" />
    </View>
  </View>
);

const Stack = createNativeStackNavigator();

const MainNavigator: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding, isLoading, user } = useAuth();
  const navigationRef = useRef<any>(null);

  // Handle navigation when auth state changes
  useEffect(() => {
    if (!navigationRef.current || isLoading) return;

    const handleAuthStateChange = () => {
      if (hasCompletedOnboarding && isAuthenticated) {
        // User is authenticated - navigate based on user type
        const targetScreen = user?.userType === 'transporter' ? 'TransporterHomeScreen' : 'HomeScreen';
        console.log(`🏠 Navigating to ${targetScreen} (authenticated as ${user?.userType || 'customer'})`);
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: targetScreen }],
        });
      } else if (hasCompletedOnboarding && !isAuthenticated) {
        // User has seen onboarding but needs to log in
        console.log('🔐 Navigating to AuthSelection (needs login)');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'AuthSelection' }],
        });
      } else {
        // New user - show onboarding
        console.log('👋 Navigating to OnboardingScreen (new user)');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'OnboardingScreen' }],
        });
      }
    };

    // Small delay to ensure navigation is ready
    const timer = setTimeout(handleAuthStateChange, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, user]);

  // Show loading screen while checking cached auth state
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Determine initial route based on auth state
  let initialRouteName = 'OnboardingScreen';
  
  if (hasCompletedOnboarding && isAuthenticated) {
    // User has completed onboarding and is logged in -> go to appropriate screen based on user type
    initialRouteName = user?.userType === 'transporter' ? 'TransporterHomeScreen' : 'HomeScreen';
  } else if (hasCompletedOnboarding && !isAuthenticated) {
    // User has seen onboarding before but needs to log in
    initialRouteName = 'AuthSelection';
  } else {
    // New user - show onboarding
    initialRouteName = 'OnboardingScreen';
  }

  console.log('🎯 Navigation decision:', {
    isAuthenticated,
    hasCompletedOnboarding,
    userType: user?.userType,
    initialRouteName,
  });

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName={initialRouteName}
        screenOptions={{
          gestureEnabled: true,
          headerShown: false,
        }}
      >
        {/* Onboarding & Auth Screens */}
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Signup Screens */}
        <Stack.Screen name="OnboardingEntry" component={OnboardingEntryScreen} />
        <Stack.Screen name="AccountType" component={AccountTypeScreen} />
        <Stack.Screen name="Identity" component={IdentityScreen} />
        <Stack.Screen name="AddressLocaleScreen" component={AddressLocaleScreen} />
        <Stack.Screen name="CustomerExtras" component={CustomerExtrasScreen} />
        <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
        <Stack.Screen name="CustomerAccountType" component={CustomerAccountTypeScreen} />
        <Stack.Screen name="BusinessDetails" component={BusinessDetailsScreen} />
        <Stack.Screen name="TransporterVehicle" component={TransporterVehicleScreen} />
        <Stack.Screen name="TransporterCompliance" component={TransporterComplianceScreen} />
        <Stack.Screen name="TransporterBanking" component={TransporterBankingScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        
        {/* Main App Screens */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="TransporterHomeScreen" component={TransporterHomeScreen} />
        <Stack.Screen name="DriverModeScreen" component={DriverModeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Orders" component={MyOrdersScreen} />
        <Stack.Screen name="Tracking" component={TrackPackageScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        
        {/* Service Screens */}
        
        {/* Settings Sub-screens */}
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen 
          name="AddAddressScreen" 
          component={AddAddressScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        
        {/* Map Screen */}
        <Stack.Screen 
          name="MapScreen" 
          component={MapScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        
        {/* Booking Flow Screens */}
        <Stack.Screen 
          name="PackagePhoto" 
          component={PackagePhotoScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        
        {/* Service Flow Screens */}
        <Stack.Screen 
          name="ExpressFlow" 
          component={ExpressFlow}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="StandardFlow" 
          component={StandardFlow}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="MovingFlow" 
          component={MovingFlow}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="StorageFlow" 
          component={StorageFlow}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        
        {/* Order Summary Screens */}
        <Stack.Screen 
          name="MovingOrderSummary" 
          component={MovingOrderSummary}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="StorageOrderSummary" 
          component={StorageOrderSummary}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ExpressOrderSummary" 
          component={ExpressOrderSummary}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="StandardOrderSummary" 
          component={StandardOrderSummary}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        
        {/* Storage Service Flow Screens */}
        <Stack.Screen 
          name="StorageFacilityMap" 
          component={StorageFacilityMapScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="StorageFacilityDetails" 
          component={StorageFacilityDetailsScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="StorageSubscriptionSuccess" 
          component={StorageSubscriptionSuccessScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        
        {/* Booking Flow Screens */}
        <Stack.Screen 
          name="Measuring" 
          component={MeasuringScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="OrderSummary" 
          component={OrderSummaryScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="DriverSearch" 
          component={DriverSearchScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="DriverFound" 
          component={DriverFoundScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        
        {/* Driver Quick Action Screens */}
        <Stack.Screen name="EarningsHistory" component={EarningsHistoryScreen} />
        <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
        <Stack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
        <Stack.Screen name="PreferredRoutes" component={PreferredRoutesScreen} />
        <Stack.Screen name="DriverSupport" component={DriverSupportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const fontsLoaded = useLoadFonts();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <SignUpProvider>
            <MainNavigator />
          </SignUpProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}
