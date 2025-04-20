import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Delivery } from '../../types/delivery';
import { api } from '../../services/api';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [welcomeOpacity] = useState(new Animated.Value(0));
  const [welcomeTranslateY] = useState(new Animated.Value(20));
  const [buttonScale] = useState(new Animated.Value(1));

  const fetchDeliveries = async () => {
    try {
      // TODO: Replace with actual driver ID from auth context
      const driverId = 'driver1';
      const activeDeliveries = await api.getActiveDeliveries(driverId);
      setDeliveries(activeDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Please enable location services in your device settings');
        return;
      }

      // First try to get a quick, less accurate location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location) {
        setLocationError('Could not get your location. Please check your GPS settings');
        return;
      }

      setCurrentLocation(location);

      // Then get a more accurate location in the background
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).then(accurateLocation => {
        if (accurateLocation) {
          setCurrentLocation(accurateLocation);
        }
      }).catch(error => {
        console.log('Error getting accurate location:', error);
      });

    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Error getting location. Please check your GPS settings');
    }
  };

  useEffect(() => {
    fetchDeliveries();
    getCurrentLocation();
    
    // Animate welcome message
    Animated.parallel([
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeTranslateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start button pulse animation
    const pulseAnimation = Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulseAnimation).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDeliveries(), getCurrentLocation()]);
    setRefreshing(false);
  };

  const handleDeliveryPress = (item: Delivery) => {
    setSelectedDelivery(item);
    router.push(`/delivery/${item.id}`);
  };

  const renderDeliveryItem = ({ item, index }: { item: Delivery; index: number }) => (
    <Animated.View
      style={[
        styles.deliveryItem,
        {
          opacity: welcomeOpacity,
          transform: [{ translateY: welcomeTranslateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => handleDeliveryPress(item)}
      >
        <View style={styles.deliveryHeader}>
          <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <ThemedText style={styles.statusText}>{item.status}</ThemedText>
          </View>
        </View>
        <View style={styles.deliveryDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#666" />
            <ThemedText style={styles.address}>{item.deliveryLocation.address}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#666" />
            <ThemedText style={styles.estimatedTime}>
              ETA: {formatTime(item.delivery_window.start_time)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString; // Fallback to original string if parsing fails
    }
  };

  // Add a loading indicator to show when location is being fetched
  const renderMap = () => {
    if (locationError) {
      return (
        <View style={styles.map}>
          <ThemedText style={styles.loadingText}>{locationError}</ThemedText>
        </View>
      );
    }

    if (!currentLocation) {
      return (
        <View style={styles.map}>
          <ThemedText style={styles.loadingText}>Getting your location...</ThemedText>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }}
          title="Your Location"
          pinColor="#007AFF"
        />
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
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.welcomeContainer,
            {
              opacity: welcomeOpacity,
              transform: [{ translateY: welcomeTranslateY }],
            },
          ]}
        >
          <ThemedText style={styles.welcomeText}>Welcome back, Agent Tom</ThemedText>
        </Animated.View>
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.startDeliveryButton}
            onPress={() => router.push('/delivery-navigation')}
          >
            <Ionicons name="bicycle" size={28} color="#fff" />
            <ThemedText style={styles.startDeliveryButtonText}>Start Delivery</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.deliveriesContainer}>
        <ThemedText style={styles.sectionTitle}>Active Deliveries</ThemedText>
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#32CD32"
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  driverName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonContainer: {
    marginTop: 10,
  },
  startDeliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#32CD32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startDeliveryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  deliveriesContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  deliveryItem: {
    marginBottom: 15,
  },
  deliveryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
  deliveryDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
    flex: 1,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#32CD32',
    marginLeft: 8,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 16,
    color: '#666',
  },
});
