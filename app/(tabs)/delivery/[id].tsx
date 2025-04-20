import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Delivery, DeliveryStatus, TemperatureSensitivity } from '../../../types/delivery';
import { api } from '../../../services/api';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

// Helper function to generate random coordinates within a radius (in kilometers)
const generateRandomLocation = (centerLat: number, centerLng: number, radiusInKm: number) => {
  const r = radiusInKm / 111.32; // Convert km to degrees
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Adjust the x-coordinate for the shrinking of the east-west distances
  const newX = x / Math.cos(centerLat);
  
  return {
    latitude: centerLat + y,
    longitude: centerLng + newX,
  };
};

const getTemperatureIcon = (sensitivity: TemperatureSensitivity) => {
  switch (sensitivity) {
    case TemperatureSensitivity.HOT:
      return 'flame';
    case TemperatureSensitivity.CHILLED:
      return 'snow';
    case TemperatureSensitivity.FROZEN:
      return 'ice-cream';
    case TemperatureSensitivity.AMBIENT:
    case TemperatureSensitivity.NONE:
    default:
      return 'thermometer';
  }
};

const getTemperatureColor = (sensitivity: TemperatureSensitivity) => {
  switch (sensitivity) {
    case TemperatureSensitivity.HOT:
      return '#FF4500';
    case TemperatureSensitivity.CHILLED:
      return '#1E90FF';
    case TemperatureSensitivity.FROZEN:
      return '#00BFFF';
    case TemperatureSensitivity.AMBIENT:
    case TemperatureSensitivity.NONE:
    default:
      return '#32CD32';
  }
};

const getStatusColor = (status: DeliveryStatus) => {
  switch (status) {
    case DeliveryStatus.PENDING:
      return '#FFA500';
    case DeliveryStatus.IN_TRANSIT:
      return '#1E90FF';
    case DeliveryStatus.DELIVERED:
      return '#32CD32';
    default:
      return '#666';
  }
};

const formatTime = (time: string) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [randomLocations, setRandomLocations] = useState<{
    pickup: { latitude: number; longitude: number };
    delivery: { latitude: number; longitude: number };
  } | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    fetchDeliveries();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (id && deliveries.length > 0) {
      const selectedDelivery = deliveries.find(d => d.id === id);
      if (selectedDelivery) {
        setDelivery(selectedDelivery);
      }
    } else if (deliveries.length > 0) {
      // If no specific ID is provided, show the first delivery
      setDelivery(deliveries[0]);
    }
  }, [id, deliveries]);

  useEffect(() => {
    if (currentLocation && !delivery?.pickupLocation) {
      const centerLat = currentLocation.coords.latitude;
      const centerLng = currentLocation.coords.longitude;
      
      setRandomLocations({
        pickup: generateRandomLocation(centerLat, centerLng, 2), // Within 2km
        delivery: generateRandomLocation(centerLat, centerLng, 5), // Within 5km
      });
    }
  }, [currentLocation, delivery]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      setLocationError('Error getting location');
      console.error('Error getting location:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const driverId = 'driver1'; // TODO: Replace with actual driver ID
      const activeDeliveries = await api.getActiveDeliveries(driverId);
      setDeliveries(activeDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDelivery = async () => {
    try {
      setLoading(true);
      if (delivery) {
        await api.updateDeliveryStatus(delivery.id, DeliveryStatus.IN_TRANSIT);
        router.push('/delivery-navigation');
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      Alert.alert('Error', 'Failed to start delivery');
    } finally {
      setLoading(false);
    }
  };

  if (!delivery) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.loadingText}>
          {loading ? 'Loading...' : 'No active deliveries'}
        </ThemedText>
      </View>
    );
  }

  const pickupLocation = delivery?.pickupLocation || randomLocations?.pickup;
  const deliveryLocation = delivery?.deliveryLocation || randomLocations?.delivery;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: pickupLocation?.latitude || delivery.pickupLocation.latitude,
            longitude: pickupLocation?.longitude || delivery.pickupLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          customMapStyle={mapStyle}
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Your Location"
              pinColor="#007AFF"
            />
          )}
          {pickupLocation && (
            <Marker
              coordinate={{
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude,
              }}
              title="Pickup Location"
              pinColor="#FFA500"
            />
          )}
          {deliveryLocation && (
            <Marker
              coordinate={{
                latitude: deliveryLocation.latitude,
                longitude: deliveryLocation.longitude,
              }}
              title="Delivery Location"
              pinColor="#32CD32"
            />
          )}
        </MapView>
      </ThemedView>

      <ThemedView style={styles.detailsContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.customerName}>{delivery.customerName}</ThemedText>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(delivery.status) },
              ]}
            />
            <ThemedText style={styles.statusText}>{delivery.status}</ThemedText>
          </View>
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Delivery Details</ThemedText>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#666" />
            <ThemedText style={styles.address}>{delivery.deliveryLocation.address}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color="#666" />
            <ThemedText style={styles.estimatedTime}>
              ETA: {formatTime(delivery.delivery_window.start_time)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Items</ThemedText>
          {delivery.items.map((item, index) => (
            <View key={item.id} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <View style={styles.itemQuantity}>
                  <ThemedText style={styles.quantityText}>x{item.quantity}</ThemedText>
                </View>
              </View>
              <View style={styles.itemDetails}>
                <View style={styles.temperatureInfo}>
                  <Ionicons 
                    name={getTemperatureIcon(item.temperature_sensitivity)} 
                    size={16} 
                    color={getTemperatureColor(item.temperature_sensitivity)} 
                  />
                  <ThemedText style={styles.temperatureText}>
                    {item.temperature_sensitivity}
                  </ThemedText>
                </View>
                {item.max_safe_time_minutes && (
                  <View style={styles.timeInfo}>
                    <Ionicons name="time" size={16} color="#666" />
                    <ThemedText style={styles.timeText}>
                      {item.max_safe_time_minutes} min safe
                    </ThemedText>
                  </View>
                )}
              </View>
              {item.special_handling_instructions && (
                <ThemedText style={styles.instructionsText}>
                  {item.special_handling_instructions}
                </ThemedText>
              )}
            </View>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#38414e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#212a37"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 15,
  },
  map: {
    flex: 1,
  },
  detailsContainer: {
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginTop: 10,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
    flex: 1,
  },
  estimatedTime: {
    fontSize: 16,
    color: '#32CD32',
    marginLeft: 8,
  },
  itemContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemQuantity: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    color: '#32CD32',
    fontSize: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  temperatureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  temperatureText: {
    fontSize: 14,
    color: '#666',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  instructionsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#32CD32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 16,
    color: '#666',
  },
}); 