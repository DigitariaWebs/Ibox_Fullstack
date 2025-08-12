import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  Animated,
  RefreshControl,
  ImageBackground,
  Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import { Text, Icon } from '../ui';
import { Colors } from '../config/colors';
import { RootState } from '../store/store';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Simple timed request interface
interface TimedRequest {
  request: any;
  createdAt: number;
  duration: number;
}

const TransporterHomeScreen: React.FC<any> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [timedRequests, setTimedRequests] = useState<TimedRequest[]>([]);
  
  // Get user data from Redux store
  const userData = useSelector((state: RootState) => state.user.userData);
  
  // Get auth functions
  const { logout } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // All possible delivery requests (50 total with variety)
  const allDeliveryRequests = [
    {
      id: 1,
      customerName: 'Sarah Johnson',
      serviceType: 'Express Delivery',
      pickupAddress: '123 Rue Saint-Denis, Downtown Montreal',
      deliveryAddress: '456 Boulevard René-Lévesque, Laval',
      distance: '15.2 km',
      estimatedTime: '25 min',
      price: '$28.50',
      weight: '2.5 kg',
      description: 'Important legal documents - handle with care',
      urgency: 'high',
    },
    {
      id: 2,
      customerName: 'Michael Chen',
      serviceType: 'Moving Service',
      pickupAddress: '789 Rue Sherbrooke, Plateau Mont-Royal',
      deliveryAddress: '321 Avenue du Parc, Longueuil',
      distance: '22.8 km',
      estimatedTime: '45 min',
      price: '$125.00',
      weight: '65+ kg',
      description: 'Studio apartment move - need help carrying furniture',
      urgency: 'normal',
    },
    {
      id: 3,
      customerName: 'Emma Wilson',
      serviceType: 'Package Delivery',
      pickupAddress: '555 Avenue Mont-Royal, Mile End',
      deliveryAddress: '888 Rue Wellington, Verdun',
      distance: '18.5 km',
      estimatedTime: '35 min',
      price: '$22.75',
      weight: '3.2 kg',
      description: 'Birthday gift package - fragile items inside',
      urgency: 'normal',
    },
    {
      id: 4,
      customerName: 'David Rodriguez',
      serviceType: 'Food Delivery',
      pickupAddress: '234 Rue Saint-Paul, Old Montreal',
      deliveryAddress: '567 Boulevard Saint-Laurent, Plateau',
      distance: '8.3 km',
      estimatedTime: '18 min',
      price: '$15.50',
      weight: '1.8 kg',
      description: 'Hot restaurant order - keep upright',
      urgency: 'high',
    },
    {
      id: 5,
      customerName: 'Lisa Thompson',
      serviceType: 'Express Delivery',
      pickupAddress: '890 Rue Crescent, Downtown',
      deliveryAddress: '123 Avenue des Pins, Westmount',
      distance: '12.7 km',
      estimatedTime: '22 min',
      price: '$32.00',
      weight: '0.8 kg',
      description: 'Medical prescription - urgent delivery needed',
      urgency: 'high',
    },
    {
      id: 6,
      customerName: 'James Park',
      serviceType: 'Furniture Delivery',
      pickupAddress: '456 Boulevard Décarie, NDG',
      deliveryAddress: '789 Rue Beaubien, Rosemont',
      distance: '19.4 km',
      estimatedTime: '42 min',
      price: '$95.00',
      weight: '45+ kg',
      description: 'IKEA furniture assembly required at destination',
      urgency: 'normal',
    },
    {
      id: 7,
      customerName: 'Maria Santos',
      serviceType: 'Same Day Delivery',
      pickupAddress: '321 Rue Sherbrooke West, McGill',
      deliveryAddress: '654 Avenue Papineau, Hochelaga',
      distance: '16.8 km',
      estimatedTime: '28 min',
      price: '$26.25',
      weight: '2.1 kg',
      description: 'Electronics repair - laptop and charger',
      urgency: 'normal',
    },
    {
      id: 8,
      customerName: 'Alex Kumar',
      serviceType: 'Business Delivery',
      pickupAddress: '987 Rue University, Downtown',
      deliveryAddress: '147 Boulevard René-Lévesque, CBD',
      distance: '5.2 km',
      estimatedTime: '12 min',
      price: '$18.75',
      weight: '1.5 kg',
      description: 'Corporate documents for board meeting',
      urgency: 'high',
    },
    {
      id: 9,
      customerName: 'Rachel Green',
      serviceType: 'Grocery Delivery',
      pickupAddress: '258 Avenue du Parc, Mile End',
      deliveryAddress: '369 Rue Saint-Denis, Plateau',
      distance: '7.6 km',
      estimatedTime: '16 min',
      price: '$19.50',
      weight: '8.3 kg',
      description: 'Weekly groceries - includes frozen items',
      urgency: 'normal',
    },
    {
      id: 10,
      customerName: 'Carlos Mendez',
      serviceType: 'Express Package',
      pickupAddress: '741 Boulevard Saint-Laurent, Little Italy',
      deliveryAddress: '852 Rue Ontario, Centre-Sud',
      distance: '13.9 km',
      estimatedTime: '24 min',
      price: '$29.00',
      weight: '4.7 kg',
      description: 'Art supplies for evening class',
      urgency: 'normal',
    },
    {
      id: 11,
      customerName: 'Jennifer Lee',
      serviceType: 'Medical Delivery',
      pickupAddress: '963 Rue Guy, Downtown',
      deliveryAddress: '174 Avenue Victoria, Westmount',
      distance: '9.1 km',
      estimatedTime: '19 min',
      price: '$35.00',
      weight: '0.5 kg',
      description: 'Prescription medication - temperature sensitive',
      urgency: 'high',
    },
    {
      id: 12,
      customerName: 'Robert Taylor',
      serviceType: 'Equipment Rental',
      pickupAddress: '285 Rue Wellington, Point St-Charles',
      deliveryAddress: '396 Boulevard Monk, Verdun',
      distance: '11.3 km',
      estimatedTime: '21 min',
      price: '$42.50',
      weight: '25+ kg',
      description: 'Power tools for weekend project',
      urgency: 'normal',
    },
    {
      id: 13,
      customerName: 'Amanda Foster',
      serviceType: 'Fashion Delivery',
      pickupAddress: '507 Rue Sainte-Catherine, Downtown',
      deliveryAddress: '618 Avenue Laurier, Outremont',
      distance: '14.2 km',
      estimatedTime: '26 min',
      price: '$24.75',
      weight: '1.2 kg',
      description: 'Designer dress for tonight\'s event',
      urgency: 'high',
    },
    {
      id: 14,
      customerName: 'Kevin O\'Brien',
      serviceType: 'Pet Supplies',
      pickupAddress: '729 Rue Jean-Talon, Little Italy',
      deliveryAddress: '840 Rue Jarry, Villeray',
      distance: '6.8 km',
      estimatedTime: '15 min',
      price: '$16.25',
      weight: '12.5 kg',
      description: 'Dog food and toys - heavy bag',
      urgency: 'normal',
    },
    {
      id: 15,
      customerName: 'Samantha Wright',
      serviceType: 'Flower Delivery',
      pickupAddress: '951 Boulevard Saint-Joseph, Plateau',
      deliveryAddress: '162 Rue de la Montagne, Downtown',
      distance: '10.7 km',
      estimatedTime: '20 min',
      price: '$28.00',
      weight: '2.8 kg',
      description: 'Anniversary bouquet - keep upright and cool',
      urgency: 'high',
    },
    {
      id: 16,
      customerName: 'Daniel Kim',
      serviceType: 'Tech Delivery',
      pickupAddress: '373 Rue Prince-Arthur, McGill Ghetto',
      deliveryAddress: '484 Boulevard de Maisonneuve, Downtown',
      distance: '4.9 km',
      estimatedTime: '11 min',
      price: '$21.00',
      weight: '3.6 kg',
      description: 'New laptop setup and installation',
      urgency: 'normal',
    },
    {
      id: 17,
      customerName: 'Monica Patel',
      serviceType: 'Catering Delivery',
      pickupAddress: '595 Avenue du Mont-Royal, Plateau',
      deliveryAddress: '706 Rue Fleury, Ahuntsic',
      distance: '17.5 km',
      estimatedTime: '32 min',
      price: '$38.50',
      weight: '15+ kg',
      description: 'Office party catering - multiple trays',
      urgency: 'high',
    },
    {
      id: 18,
      customerName: 'Benjamin Clark',
      serviceType: 'Book Delivery',
      pickupAddress: '817 Rue Saint-Hubert, Quartier Latin',
      deliveryAddress: '928 Boulevard Rosemont, Rosemont',
      distance: '12.1 km',
      estimatedTime: '23 min',
      price: '$19.75',
      weight: '6.4 kg',
      description: 'University textbooks - handle carefully',
      urgency: 'normal',
    },
    {
      id: 19,
      customerName: 'Isabella Martinez',
      serviceType: 'Pharmacy Delivery',
      pickupAddress: '139 Rue Beaubien, Rosemont',
      deliveryAddress: '250 Avenue du Parc, Mile End',
      distance: '8.7 km',
      estimatedTime: '17 min',
      price: '$24.50',
      weight: '0.9 kg',
      description: 'Baby formula and medications',
      urgency: 'high',
    },
    {
      id: 20,
      customerName: 'Christopher Davis',
      serviceType: 'Appliance Delivery',
      pickupAddress: '361 Boulevard Henri-Bourassa, Ahuntsic',
      deliveryAddress: '472 Rue Gilford, Plateau',
      distance: '21.3 km',
      estimatedTime: '38 min',
      price: '$85.00',
      weight: '35+ kg',
      description: 'Microwave installation required',
      urgency: 'normal',
    },
    {
      id: 21,
      customerName: 'Hannah Miller',
      serviceType: 'Art Delivery',
      pickupAddress: '583 Rue Saint-Denis, UQAM',
      deliveryAddress: '694 Avenue Christophe-Colomb, Plateau',
      distance: '9.4 km',
      estimatedTime: '18 min',
      price: '$45.00',
      weight: '8.1 kg',
      description: 'Framed paintings - extremely fragile',
      urgency: 'normal',
    },
    {
      id: 22,
      customerName: 'Nathan Brown',
      serviceType: 'Sports Equipment',
      pickupAddress: '705 Rue Jarry West, Parc-Extension',
      deliveryAddress: '816 Boulevard Gouin, Ahuntsic',
      distance: '13.6 km',
      estimatedTime: '25 min',
      price: '$33.25',
      weight: '18+ kg',
      description: 'Hockey gear for tonight\'s game',
      urgency: 'high',
    },
    {
      id: 23,
      customerName: 'Olivia Johnson',
      serviceType: 'Beauty Products',
      pickupAddress: '927 Rue Rachel, Plateau',
      deliveryAddress: '138 Avenue Laurier West, Mile End',
      distance: '6.2 km',
      estimatedTime: '14 min',
      price: '$17.50',
      weight: '1.6 kg',
      description: 'Makeup and skincare products',
      urgency: 'normal',
    },
    {
      id: 24,
      customerName: 'Ethan Wilson',
      serviceType: 'Gaming Delivery',
      pickupAddress: '249 Rue Ontario East, Centre-Sud',
      deliveryAddress: '360 Boulevard Saint-Laurent, Chinatown',
      distance: '5.8 km',
      estimatedTime: '13 min',
      price: '$20.75',
      weight: '2.3 kg',
      description: 'New video game console and accessories',
      urgency: 'normal',
    },
    {
      id: 25,
      customerName: 'Sophia Garcia',
      serviceType: 'Bakery Delivery',
      pickupAddress: '471 Rue Fairmount, Mile End',
      deliveryAddress: '582 Rue de la Gauchetière, Chinatown',
      distance: '11.9 km',
      estimatedTime: '22 min',
      price: '$26.00',
      weight: '4.5 kg',
      description: 'Wedding cake - handle with extreme care',
      urgency: 'high',
    },
    {
      id: 26,
      customerName: 'Jacob Anderson',
      serviceType: 'Office Supplies',
      pickupAddress: '693 Boulevard René-Lévesque West, Downtown',
      deliveryAddress: '804 Rue Saint-Jacques, Old Montreal',
      distance: '7.1 km',
      estimatedTime: '16 min',
      price: '$22.25',
      weight: '5.7 kg',
      description: 'Printer paper and office equipment',
      urgency: 'normal',
    },
    {
      id: 27,
      customerName: 'Mia Thompson',
      serviceType: 'Baby Items',
      pickupAddress: '815 Avenue du Mont-Royal East, Plateau',
      deliveryAddress: '926 Rue Boyer, Plateau',
      distance: '3.4 km',
      estimatedTime: '9 min',
      price: '$14.50',
      weight: '3.8 kg',
      description: 'Diapers and baby clothes - new parent',
      urgency: 'normal',
    },
    {
      id: 28,
      customerName: 'Logan Martinez',
      serviceType: 'Auto Parts',
      pickupAddress: '137 Rue Jean-Talon West, Parc-Extension',
      deliveryAddress: '248 Boulevard Crémazie, Rosemont',
      distance: '15.7 km',
      estimatedTime: '29 min',
      price: '$31.75',
      weight: '12+ kg',
      description: 'Car brake pads and oil filter',
      urgency: 'normal',
    },
    {
      id: 29,
      customerName: 'Ava Rodriguez',
      serviceType: 'Plant Delivery',
      pickupAddress: '359 Rue Duluth, Plateau',
      deliveryAddress: '470 Avenue Papineau, Centre-Sud',
      distance: '8.9 km',
      estimatedTime: '17 min',
      price: '$25.50',
      weight: '7.2 kg',
      description: 'Indoor plants and planters - keep upright',
      urgency: 'normal',
    },
    {
      id: 30,
      customerName: 'Mason Lee',
      serviceType: 'Musical Instruments',
      pickupAddress: '581 Boulevard Saint-Joseph, Plateau',
      deliveryAddress: '692 Rue Fleury West, Ahuntsic',
      distance: '18.2 km',
      estimatedTime: '34 min',
      price: '$52.00',
      weight: '22+ kg',
      description: 'Guitar and amplifier - fragile equipment',
      urgency: 'normal',
    },
    {
      id: 31,
      customerName: 'Alexandre Roy',
      serviceType: 'Urgent Package',
      pickupAddress: '234 Avenue Mont-Royal, Plateau',
      deliveryAddress: '567 Rue Wellington, Verdun',
      distance: '12.3 km',
      estimatedTime: '20 min',
      price: '$35.00',
      weight: '1.2 kg',
      description: 'Urgent medication - priority delivery',
      urgency: 'high',
    },
    {
      id: 32,
      customerName: 'Isabelle Tremblay',
      serviceType: 'Moving Service',
      pickupAddress: '890 Boulevard Pie-IX, Hochelaga',
      deliveryAddress: '123 Rue Principale, Boucherville',
      distance: '28.7 km',
      estimatedTime: '50 min',
      price: '$150.00',
      weight: '75+ kg',
      description: '2-bedroom apartment move - help required',
      urgency: 'normal',
    },
    {
      id: 33,
      customerName: 'Marc Lefebvre',
      serviceType: 'Package Delivery',
      pickupAddress: '456 Rue Sainte-Catherine, Downtown',
      deliveryAddress: '789 Boulevard Taschereau, Longueuil',
      distance: '16.8 km',
      estimatedTime: '30 min',
      price: '$22.00',
      weight: '3.1 kg',
      description: 'Electronic equipment - delicate handling',
      urgency: 'normal',
    },
    {
      id: 34,
      customerName: 'Lucie Gagnon',
      serviceType: 'Express Delivery',
      pickupAddress: '321 Boulevard Saint-Laurent, Downtown',
      deliveryAddress: '654 Avenue des Pins, Westmount',
      distance: '8.4 km',
      estimatedTime: '15 min',
      price: '$40.00',
      weight: '0.8 kg',
      description: 'Urgent contract documents',
      urgency: 'high',
    },
    {
      id: 35,
      customerName: 'Pierre Bouchard',
      serviceType: 'Freight Delivery',
      pickupAddress: '987 Rue Industrielle, Anjou',
      deliveryAddress: '147 Boulevard de la Rive-Sud, Longueuil',
      distance: '24.1 km',
      estimatedTime: '40 min',
      price: '$85.00',
      weight: '180 kg',
      description: 'Food products - refrigeration required',
      urgency: 'normal',
    },
    {
      id: 36,
      customerName: 'Catherine Morin',
      serviceType: 'Gift Delivery',
      pickupAddress: '741 Avenue du Parc, Mile End',
      deliveryAddress: '852 Rue Saint-Charles, Longueuil',
      distance: '19.3 km',
      estimatedTime: '35 min',
      price: '$28.00',
      weight: '4.2 kg',
      description: 'Birthday gifts - fragile wrapping',
      urgency: 'normal',
    },
    {
      id: 37,
      customerName: 'Robert Lavoie',
      serviceType: 'Office Moving',
      pickupAddress: '159 Rue Fleury, Ahuntsic',
      deliveryAddress: '753 Boulevard Curé-Labelle, Laval',
      distance: '31.5 km',
      estimatedTime: '55 min',
      price: '$180.00',
      weight: '90+ kg',
      description: 'Office move - heavy furniture',
      urgency: 'high',
    },
    {
      id: 38,
      customerName: 'Nathalie Côté',
      serviceType: 'Express Package',
      pickupAddress: '462 Rue Rachel, Plateau',
      deliveryAddress: '785 Avenue Victoria, Saint-Lambert',
      distance: '14.7 km',
      estimatedTime: '22 min',
      price: '$45.00',
      weight: '1.5 kg',
      description: 'Échantillons médicaux - livraison immédiate',
      urgency: 'high',
    },
    {
      id: 39,
      customerName: 'Daniel Bélanger',
      serviceType: 'Colis',
      pickupAddress: '963 Boulevard Saint-Joseph, Montréal, QC',
      deliveryAddress: '258 Rue Principale, Brossard, QC',
      distance: '21.9 km',
      estimatedTime: '38 min',
      price: '$32.00',
      weight: '5.7 kg',
      description: 'Pièces automobiles - manipulation soigneuse',
      urgency: 'normal',
    },
    {
      id: 40,
      customerName: 'Sylvie Bergeron',
      serviceType: 'Palette',
      pickupAddress: '357 Rue Notre-Dame, Montréal, QC',
      deliveryAddress: '951 Boulevard Marie-Victorin, Longueuil, QC',
      distance: '17.2 km',
      estimatedTime: '32 min',
      price: '$75.00',
      weight: '220 kg',
      description: 'Matériaux de construction - accès difficile',
      urgency: 'normal',
    },
    {
      id: 41,
      customerName: 'François Pelletier',
      serviceType: 'Express',
      pickupAddress: '684 Avenue Laurier, Montréal, QC',
      deliveryAddress: '426 Rue King, Sherbrooke, QC',
      distance: '145.3 km',
      estimatedTime: '1h 40min',
      price: '$200.00',
      weight: '2.1 kg',
      description: 'Documents légaux urgents - long trajet',
      urgency: 'high',
    },
    {
      id: 42,
      customerName: 'Julie Mercier',
      serviceType: 'Colis',
      pickupAddress: '528 Rue Beaubien, Montréal, QC',
      deliveryAddress: '179 Avenue des Érables, Chambly, QC',
      distance: '26.4 km',
      estimatedTime: '42 min',
      price: '$38.00',
      weight: '3.8 kg',
      description: 'Produits artisanaux - emballage spécial',
      urgency: 'normal',
    },
    {
      id: 43,
      customerName: 'Martin Dubé',
      serviceType: 'Déménagement',
      pickupAddress: '813 Rue Jarry, Montréal, QC',
      deliveryAddress: '642 Boulevard des Promenades, Saint-Bruno, QC',
      distance: '23.6 km',
      estimatedTime: '45 min',
      price: '$140.00',
      weight: '65+ kg',
      description: 'Déménagement 1 chambre - 3e étage sans ascenseur',
      urgency: 'normal',
    },
    {
      id: 44,
      customerName: 'Chantal Rousseau',
      serviceType: 'Express',
      pickupAddress: '395 Boulevard René-Lévesque, Montréal, QC',
      deliveryAddress: '717 Rue Saint-Paul, Québec, QC',
      distance: '251.8 km',
      estimatedTime: '3h 10min',
      price: '$350.00',
      weight: '1.3 kg',
      description: 'Contrat urgent - livraison même jour Québec',
      urgency: 'high',
    },
    {
      id: 45,
      customerName: 'Éric Fontaine',
      serviceType: 'Palette',
      pickupAddress: '476 Rue de la Commune, Montréal, QC',
      deliveryAddress: '238 Avenue du Commerce, Dorval, QC',
      distance: '29.1 km',
      estimatedTime: '48 min',
      price: '$95.00',
      weight: '300 kg',
      description: 'Équipement industriel lourd - grue requise',
      urgency: 'normal',
    },
    {
      id: 46,
      customerName: 'Véronique Leblanc',
      serviceType: 'Colis',
      pickupAddress: '692 Rue Sherbrooke, Montréal, QC',
      deliveryAddress: '384 Rue des Pins, Laval, QC',
      distance: '20.7 km',
      estimatedTime: '36 min',
      price: '$30.00',
      weight: '2.9 kg',
      description: 'Vêtements de créateur - manipulation délicate',
      urgency: 'normal',
    },
    {
      id: 47,
      customerName: 'Stéphane Girard',
      serviceType: 'Express',
      pickupAddress: '847 Avenue Papineau, Montréal, QC',
      deliveryAddress: '519 Boulevard Gouin, Laval, QC',
      distance: '18.9 km',
      estimatedTime: '28 min',
      price: '$50.00',
      weight: '0.6 kg',
      description: 'Clés de voiture de luxe - livraison prioritaire',
      urgency: 'high',
    },
    {
      id: 48,
      customerName: 'Anne-Marie Dubois',
      serviceType: 'Pharmacy Delivery',
      pickupAddress: '728 Boulevard Saint-Michel, Montreal',
      deliveryAddress: '394 Rue de Bellechasse, Rosemont',
      distance: '11.2 km',
      estimatedTime: '19 min',
      price: '$27.50',
      weight: '1.1 kg',
      description: 'Senior citizen medication - priority delivery',
      urgency: 'high',
    },
    {
      id: 49,
      customerName: 'Thomas Anderson',
      serviceType: 'IT Equipment',
      pickupAddress: '516 Rue Guy, Downtown',
      deliveryAddress: '807 Avenue du Parc, Mile End',
      distance: '9.8 km',
      estimatedTime: '17 min',
      price: '$35.00',
      weight: '4.3 kg',
      description: 'Server equipment - handle with care',
      urgency: 'normal',
    },
    {
      id: 50,
      customerName: 'Sophie Lamarche',
      serviceType: 'Wedding Supplies',
      pickupAddress: '639 Rue Saint-Paul, Old Montreal',
      deliveryAddress: '918 Boulevard Gouin, Pierrefonds',
      distance: '27.4 km',
      estimatedTime: '43 min',
      price: '$65.00',
      weight: '12.8 kg',
      description: 'Wedding decorations - fragile items',
      urgency: 'high',
    },
    {
      id: 51,
      customerName: 'Gabriel Moreau',
      serviceType: 'Emergency Parts',
      pickupAddress: '142 Rue Wellington, Verdun',
      deliveryAddress: '753 Boulevard Newman, LaSalle',
      distance: '8.6 km',
      estimatedTime: '14 min',
      price: '$42.00',
      weight: '6.7 kg',
      description: 'Emergency plumbing parts - urgent repair',
      urgency: 'high',
    },
    {
      id: 52,
      customerName: 'Camille Rodrigue',
      serviceType: 'Textile Delivery',
      pickupAddress: '485 Avenue du Mont-Royal, Plateau',
      deliveryAddress: '629 Rue Beaubien, Rosemont',
      distance: '6.3 km',
      estimatedTime: '13 min',
      price: '$19.25',
      weight: '3.4 kg',
      description: 'Designer fabric samples for fashion show',
      urgency: 'normal',
    },
  ];

  // Single master interval that manages all requests
  useEffect(() => {
    // Initial animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Start with some initial requests
    initializeRequests();

    // Master interval - handles all request management
    const masterInterval = setInterval(() => {
      const now = Date.now();
      
      setTimedRequests(currentTimedRequests => {
        // Remove expired requests
        const activeRequests = currentTimedRequests.filter(
          timedReq => (now - timedReq.createdAt) < timedReq.duration
        );
        
        // Add new requests if we need more (maintain 3-4 requests)
        const updatedRequests = [...activeRequests];
        const targetCount = 4;
        const needMore = targetCount - activeRequests.length;
        
        for (let i = 0; i < needMore; i++) {
          // Get available requests (not currently visible)
          const visibleIds = updatedRequests.map(tr => tr.request.id);
          const availableRequests = allDeliveryRequests.filter(
            req => !visibleIds.includes(req.id)
          );
          
          // Pick a random request (allow reuse if we've shown all)
          const requestPool = availableRequests.length > 0 ? availableRequests : allDeliveryRequests;
          const randomRequest = requestPool[Math.floor(Math.random() * requestPool.length)];
          
          // Create new timed request
          const newTimedRequest: TimedRequest = {
            request: randomRequest,
            createdAt: now + (i * 500), // Stagger new requests slightly
            duration: 12000 // 12 seconds
          };
          
          updatedRequests.push(newTimedRequest);
        }
        
        return updatedRequests;
      });
    }, 500); // Check every 500ms for smooth operation

    return () => clearInterval(masterInterval);
  }, []);

  // Initialize with some starting requests
  const initializeRequests = () => {
    const now = Date.now();
    const shuffled = [...allDeliveryRequests].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    
    const initialTimedRequests: TimedRequest[] = selected.map((request, index) => ({
      request,
      createdAt: now + (index * 1000), // Stagger by 1 second
      duration: 12000
    }));
    
    setTimedRequests(initialTimedRequests);
  };

  // Helper function to get time remaining for a request
  const getTimeRemaining = (timedRequest: TimedRequest): number => {
    const now = Date.now();
    const elapsed = now - timedRequest.createdAt;
    const remaining = Math.max(0, timedRequest.duration - elapsed);
    return Math.ceil(remaining / 1000); // Return seconds remaining
  };

  const getDisplayName = () => {
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return 'Transporteur';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#EF4444';
      case 'normal': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleAcceptRequest = (requestId: number) => {
    Alert.alert(
      'Accepter la demande',
      'Voulez-vous accepter cette demande de livraison?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Accepter', 
          onPress: () => {
            console.log('Request accepted:', requestId);
            
            // Find the accepted order in timed requests
            const acceptedTimedRequest = timedRequests.find(tr => tr.request.id === requestId);
            if (acceptedTimedRequest) {
              const acceptedOrder = acceptedTimedRequest.request;
              
              // Add coordinates to the order for map navigation
              const orderWithCoords = {
                ...acceptedOrder,
                pickupCoords: {
                  latitude: 45.5017 + (Math.random() - 0.5) * 0.01, // Montreal area with some variation
                  longitude: -73.5673 + (Math.random() - 0.5) * 0.01,
                },
                deliveryCoords: {
                  latitude: 45.5017 + (Math.random() - 0.5) * 0.02, // Different location in Montreal area
                  longitude: -73.5673 + (Math.random() - 0.5) * 0.02,
                }
              };
              
              // Navigate to driver mode with the order details
              navigation.navigate('DriverModeScreen', { order: orderWithCoords });
            }
            
            // Remove the accepted request immediately
            setTimedRequests(prev => prev.filter(tr => tr.request.id !== requestId));
          }
        }
      ]
    );
  };

  const handleDeclineRequest = (requestId: number) => {
    Alert.alert(
      'Décliner la demande',
      'Voulez-vous décliner cette demande de livraison?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Décliner', 
          style: 'destructive',
          onPress: () => {
            console.log('Request declined:', requestId);
            // Remove the declined request immediately
            setTimedRequests(prev => prev.filter(tr => tr.request.id !== requestId));
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = () => {
    console.log('🔄 Logout button pressed'); // Debug log
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Starting logout process...');
              await logout();
              console.log('✅ Driver logged out successfully');
              // The navigation will be handled automatically by App.tsx based on auth state change
            } catch (error) {
              console.error('❌ Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Profile Header */}
        <Animated.View style={[styles.profileSection, { opacity: fadeAnim }]}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileInfo}>
                <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                  <ImageBackground
                    source={{ uri: 'https://i.pravatar.cc/100?img=8' }}
                    style={styles.profileImage}
                    imageStyle={styles.profileImageStyle}
                  />
                  <View style={styles.onlineIndicator} />
                </TouchableOpacity>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>{getDisplayName()}</Text>
                  <Text style={styles.profileRole}>Driver • Online</Text>
                  <View style={styles.profileStats}>
                    <View style={styles.statItem}>
                      <Icon name="star" type="Feather" size={14} color="#F59E0B" />
                      <Text style={styles.profileStat}>4.8 rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <Text style={styles.profileStat}>47 deliveries</Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.profileMenuButton} onPress={handleProfilePress}>
                  <Icon name="user" type="Feather" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="log-out" type="Feather" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>$156</Text>
                <Text style={styles.quickStatLabel}>Today</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>12</Text>
                <Text style={styles.quickStatLabel}>Trips</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>7.5h</Text>
                <Text style={styles.quickStatLabel}>Online</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Delivery Requests */}
        <Animated.View style={[styles.requestsSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Deliveries</Text>
            <View style={styles.requestCountBadge}>
              <Text style={styles.requestCount}>{timedRequests.length}</Text>
            </View>
          </View>

          {timedRequests.map((timedRequest) => {
            const request = timedRequest.request;
            const timeRemaining = getTimeRemaining(timedRequest);
            
            return (
            <Animated.View 
              key={request.id} 
              style={[
                styles.requestCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: fadeAnim }]
                }
              ]}
            >
              {/* Request Header */}
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <View style={styles.requestTitleRow}>
                    <Text style={styles.customerName}>{request.customerName}</Text>
                    {request.urgency === 'high' && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceType}>{request.serviceType}</Text>
                </View>
                <View style={styles.requestMeta}>
                  <Text style={styles.requestPrice}>{request.price}</Text>
                  <View style={styles.timerContainer}>
                    <Icon name="clock" type="Feather" size={12} color={timeRemaining <= 3 ? Colors.error : Colors.textSecondary} />
                    <Text style={[styles.timerText, { color: timeRemaining <= 3 ? Colors.error : Colors.textSecondary }]}>
                      {timeRemaining}s
                    </Text>
                  </View>
                </View>
              </View>

              {/* Request Details */}
              <View style={styles.requestDetails}>
                <View style={styles.routeSection}>
                  <View style={styles.routeItem}>
                    <View style={styles.routeIcon}>
                      <View style={styles.pickupDot} />
                    </View>
                    <Text style={styles.routeText} numberOfLines={1}>{request.pickupAddress}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeItem}>
                    <View style={styles.routeIcon}>
                      <View style={styles.dropoffDot} />
                    </View>
                    <Text style={styles.routeText} numberOfLines={1}>{request.deliveryAddress}</Text>
                  </View>
                </View>
                
                <Text style={styles.requestDescription}>{request.description}</Text>
                
                <View style={styles.requestSpecs}>
                  <View style={styles.specItem}>
                    <Icon name="navigation" type="Feather" size={14} color={Colors.textSecondary} />
                    <Text style={styles.specText}>{request.distance}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Icon name="clock" type="Feather" size={14} color={Colors.textSecondary} />
                    <Text style={styles.specText}>{request.estimatedTime}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Icon name="package" type="Feather" size={14} color={Colors.textSecondary} />
                    <Text style={styles.specText}>{request.weight}</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.declineButton}
                  onPress={() => handleDeclineRequest(request.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="x" type="Feather" size={18} color={Colors.error} />
                  <Text style={styles.declineText}>Décliner</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="check" type="Feather" size={18} color={Colors.white} />
                  <Text style={styles.acceptText}>Accepter</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
            );
          })}
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
  scrollView: {
    flex: 1,
  },
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.textSecondary,
  },
  profileImageStyle: {
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  profileStat: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  profileMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Requests Section
  requestsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  requestCountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  requestCount: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  // Request Card
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '700',
  },
  serviceType: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  requestMeta: {
    alignItems: 'flex-end',
  },
  requestPrice: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  timerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  // Request Details
  requestDetails: {
    marginBottom: 16,
  },
  routeSection: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  routeIcon: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 1,
    height: 8,
    backgroundColor: Colors.border,
    marginLeft: 10,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  requestDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  requestSpecs: {
    flexDirection: 'row',
    gap: 16,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.error,
    gap: 8,
  },
  declineText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  acceptText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default TransporterHomeScreen;