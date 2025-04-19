import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Delivery } from '../../types/delivery';
import { api } from '../../services/api';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

export default function DashboardScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const fetchDeliveries = async () => {
    try {
      // TODO: Replace with actual driver ID from auth context
      const driverId = 'driver-123';
      const activeDeliveries = await api.getActiveDeliveries(driverId);
      setDeliveries(activeDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={styles.deliveryItem}
      onPress={() => setSelectedDelivery(item)}
    >
      <ThemedView style={styles.deliveryCard}>
        <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
        <ThemedText style={styles.address}>{item.deliveryLocation.address}</ThemedText>
        <ThemedText style={styles.estimatedTime}>
          ETA: {item.estimatedTime}
        </ThemedText>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <ThemedText style={styles.statusText}>{item.status}</ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'picked_up':
        return '#4169E1';
      case 'in_transit':
        return '#32CD32';
      case 'delivered':
        return '#008000';
      case 'cancelled':
        return '#FF0000';
      default:
        return '#808080';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {selectedDelivery && (
          <>
            <Marker
              coordinate={{
                latitude: selectedDelivery.pickupLocation.latitude,
                longitude: selectedDelivery.pickupLocation.longitude,
              }}
              title="Pickup Location"
              pinColor="#FFA500"
            />
            <Marker
              coordinate={{
                latitude: selectedDelivery.deliveryLocation.latitude,
                longitude: selectedDelivery.deliveryLocation.longitude,
              }}
              title="Delivery Location"
              pinColor="#32CD32"
            />
            <Polyline
              coordinates={[
                {
                  latitude: selectedDelivery.pickupLocation.latitude,
                  longitude: selectedDelivery.pickupLocation.longitude,
                },
                {
                  latitude: selectedDelivery.deliveryLocation.latitude,
                  longitude: selectedDelivery.deliveryLocation.longitude,
                },
              ]}
              strokeColor="#007AFF"
              strokeWidth={3}
            />
          </>
        )}
      </MapView>

      <View style={styles.deliveriesContainer}>
        <ThemedText style={styles.sectionTitle}>Active Deliveries</ThemedText>
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  deliveriesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  deliveryItem: {
    marginBottom: 15,
  },
  deliveryCard: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
});
