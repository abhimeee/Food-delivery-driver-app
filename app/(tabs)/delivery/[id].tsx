import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Delivery } from '../../../types/delivery';
import { api } from '../../../services/api';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';

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

export default function DeliveryDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [randomLocations, setRandomLocations] = useState<{
    pickup: { latitude: number; longitude: number };
    delivery: { latitude: number; longitude: number };
  } | null>(null);

  useEffect(() => {
    fetchDeliveryDetails();
    getCurrentLocation();
  }, [id]);

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

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const deliveryDetails = await api.getDeliveryDetails(id as string);
      setDelivery(deliveryDetails);
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await api.updateDeliveryStatus(delivery!.id, newStatus);
      setDelivery({ ...delivery!, status: newStatus as any });
      Alert.alert('Success', 'Delivery status updated successfully');
    } catch (error) {
      console.error('Error updating delivery status:', error);
      Alert.alert('Error', 'Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  if (!delivery && !randomLocations) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
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
          initialRegion={
            currentLocation
              ? {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }
              : pickupLocation
              ? {
                  latitude: pickupLocation.latitude,
                  longitude: pickupLocation.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }
              : undefined
          }
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
        <ThemedText style={styles.sectionTitle}>Order Details</ThemedText>
        
        {delivery ? (
          <>
            <View style={styles.infoSection}>
              <ThemedText style={styles.label}>Customer</ThemedText>
              <ThemedText style={styles.value}>{delivery.customerName}</ThemedText>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.label}>Phone</ThemedText>
              <ThemedText style={styles.value}>{delivery.customerPhone}</ThemedText>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.label}>Delivery Address</ThemedText>
              <ThemedText style={styles.value}>{delivery.deliveryLocation?.address || 'Zomalounge'}</ThemedText>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.label}>Estimated Time</ThemedText>
              <ThemedText style={styles.value}>{delivery.estimatedTime}</ThemedText>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <ThemedText style={[styles.value, styles.statusText]}>
                {delivery.status}
              </ThemedText>
            </View>

            <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
            {delivery.items.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemDetails}>
                  Qty: {item.quantity} • ${item.price}
                </ThemedText>
              </View>
            ))}

            {delivery.notes && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.label}>Notes</ThemedText>
                <ThemedText style={styles.value}>{delivery.notes}</ThemedText>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {delivery.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.button, styles.pickupButton]}
                  onPress={() => handleStatusUpdate('picked_up')}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>Mark as Picked Up</ThemedText>
                </TouchableOpacity>
              )}

              {delivery.status === 'picked_up' && (
                <TouchableOpacity
                  style={[styles.button, styles.deliverButton]}
                  onPress={() => handleStatusUpdate('delivered')}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>Mark as Delivered</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <ThemedText style={styles.demoText}>
            This is a demo delivery. The actual delivery details will be shown here.
          </ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  infoSection: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  statusText: {
    textTransform: 'capitalize',
  },
  itemContainer: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  pickupButton: {
    backgroundColor: '#FFA500',
  },
  deliverButton: {
    backgroundColor: '#32CD32',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
}); 