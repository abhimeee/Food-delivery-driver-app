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
import { Delivery } from '../../../types/delivery';
import { api } from '../../../services/api';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';

export default function DeliveryDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [id]);

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

  if (!delivery) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: delivery.pickupLocation?.latitude,
            longitude: delivery.pickupLocation?.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: delivery.pickupLocation?.latitude,
              longitude: delivery.pickupLocation?.longitude,
            }}
            title="Pickup Location"
            pinColor="#FFA500"
          />
          <Marker
            coordinate={{
              latitude: delivery.deliveryLocation?.latitude,
              longitude: delivery.deliveryLocation?.longitude,
            }}
            title="Delivery Location"
            pinColor="#32CD32"
          />
        </MapView>
      </ThemedView>

      <ThemedView style={styles.detailsContainer}>
        <ThemedText style={styles.sectionTitle}>Order Details</ThemedText>
        
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
          <ThemedText style={styles.value}>{delivery.deliveryLocation.address}</ThemedText>
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
}); 