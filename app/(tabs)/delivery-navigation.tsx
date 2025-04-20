import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Delivery } from '../../types/delivery';
import { api } from '../../services/api';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '../../config';

interface DirectionStep {
  distance: string;
  duration: string;
  instruction: string;
  maneuver?: string;
}

interface PolylinePoint {
  latitude: number;
  longitude: number;
}

export default function DeliveryNavigationScreen() {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [currentDeliveryIndex, setCurrentDeliveryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState<DirectionStep[]>([]);
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<string>('');
  const [routeCoordinates, setRouteCoordinates] = useState<PolylinePoint[]>([]);
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [overlayTranslateY] = useState(new Animated.Value(50));
  const [heading, setHeading] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const mapRef = useRef<MapView>(null);
  const lastLocation = useRef<Location.LocationObject | null>(null);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Please enable location services in your device settings');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location) {
        setLocationError('Could not get your location. Please check your GPS settings');
        return;
      }

      // Calculate heading if we have a previous location
      if (lastLocation.current) {
        const dx = location.coords.longitude - lastLocation.current.coords.longitude;
        const dy = location.coords.latitude - lastLocation.current.coords.latitude;
        const newHeading = Math.atan2(dx, dy) * (180 / Math.PI);
        setHeading(newHeading);
      }

      setCurrentLocation(location);
      lastLocation.current = location;
      updateMapCamera(location);

      if (deliveries.length > 0) {
        console.log("going to fetch directions")
        fetchDirections(location);
      }

      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).then(accurateLocation => {
        if (accurateLocation) {
          setCurrentLocation(accurateLocation);
          if (deliveries.length > 0) {
            console.log("again going to fetch directions")
            fetchDirections(accurateLocation);
          }
        }
      }).catch(error => {
        console.log('Error getting accurate location:', error);
      });

    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Error getting location. Please check your GPS settings');
    }
  };

  const fetchDirections = async (location: Location.LocationObject) => {
    try {
      const currentDelivery = deliveries[currentDeliveryIndex];
      const origin = `${location.coords.latitude},${location.coords.longitude}`;
      const destination = `${currentDelivery.deliveryLocation.latitude},${currentDelivery.deliveryLocation.longitude}`;
      console.log('Origin is:', origin);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&vehicleType=twoWheeler&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      console.log('Directions API Response:', data);
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const steps = route.legs[0].steps.map((step: any) => ({
          distance: step.distance.text,
          duration: step.duration.text,
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          maneuver: step.maneuver,
        }));
        
        setDirections(steps);
        setTotalDistance(route.legs[0].distance.text);
        setTotalDuration(route.legs[0].duration.text);
        
        // Extract coordinates from the route's overview_polyline
        const points = route.overview_polyline.points;
        const coordinates = route.legs[0].steps.map((step: any) => ({
          latitude: step.start_location.lat,
          longitude: step.start_location.lng,
        }));
        
        // Add the last point of the route
        coordinates.push({
          latitude: route.legs[0].steps[route.legs[0].steps.length - 1].end_location.lat,
          longitude: route.legs[0].steps[route.legs[0].steps.length - 1].end_location.lng,
        });
        
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error', 'Failed to fetch directions. Please check your internet connection.');
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

  useEffect(() => {
    fetchDeliveries();
    getCurrentLocation();
    // Update location every 30 seconds
    const interval = setInterval(getCurrentLocation, 4000);

    // Animate overlay
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(overlayTranslateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearInterval(interval);
  }, []);

  const handleCompleteDelivery = async () => {
    try {
      setLoading(true);
      const currentDelivery = deliveries[currentDeliveryIndex];
      await api.updateDeliveryStatus(currentDelivery.id, 'delivered');
      
      if (currentDeliveryIndex < deliveries.length - 1) {
        setCurrentDeliveryIndex(currentDeliveryIndex + 1);
      } else {
        Alert.alert('Success', 'All deliveries completed!');
        router.back();
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
      Alert.alert('Error', 'Failed to complete delivery');
    } finally {
      setLoading(false);
    }
  };

  const getManeuverIcon = (maneuver?: string) => {
    switch (maneuver) {
      case 'turn-left':
        return 'arrow-back';
      case 'turn-right':
        return 'arrow-forward';
      case 'turn-slight-left':
        return 'arrow-back';
      case 'turn-slight-right':
        return 'arrow-forward';
      case 'turn-sharp-left':
        return 'arrow-back';
      case 'turn-sharp-right':
        return 'arrow-forward';
      case 'uturn-left':
        return 'arrow-undo';
      case 'uturn-right':
        return 'arrow-redo';
      case 'straight':
        return 'arrow-up';
      case 'ramp-left':
        return 'arrow-back';
      case 'ramp-right':
        return 'arrow-forward';
      case 'merge':
        return 'git-merge';
      case 'fork-left':
        return 'git-branch';
      case 'fork-right':
        return 'git-branch';
      case 'ferry':
        return 'boat';
      case 'ferry-train':
        return 'train';
      default:
        return 'navigate';
    }
  };

  const updateMapCamera = (location: Location.LocationObject) => {
    if (mapRef.current && isFollowing) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: heading,
        pitch: 45,
        zoom: 18,
      });
    }
  };

  const toggleFollowMode = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing && currentLocation) {
      updateMapCamera(currentLocation);
    }
  };

  const recenterMap = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        heading: heading,
        pitch: 45,
        zoom: 18,
      });
    }
  };

  const renderMap = () => {
    if (locationError) {
      return (
        <View style={styles.map}>
          <ThemedText style={styles.loadingText}>{locationError}</ThemedText>
        </View>
      );
    }

    if (!currentLocation || deliveries.length === 0) {
      return (
        <View style={styles.map}>
          <ThemedText style={styles.loadingText}>
            {loading ? 'Loading...' : 'No active deliveries'}
          </ThemedText>
        </View>
      );
    }

    const currentDelivery = deliveries[currentDeliveryIndex];
    const pickupLocation = currentDelivery.pickupLocation;
    const deliveryLocation = currentDelivery.deliveryLocation;

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        customMapStyle={mapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        followsUserLocation={isFollowing}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        <Marker
          coordinate={{
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          }}
          title="Pickup Location"
          pinColor="#FFA500"
        />
        <Marker
          coordinate={{
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
          }}
          title="Delivery Location"
          pinColor="#32CD32"
        />
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#32CD32"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}
      
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={toggleFollowMode}
        >
          <Ionicons 
            name={isFollowing ? "navigate" : "navigate-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={recenterMap}
        >
          <Ionicons 
            name="locate" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            transform: [{ translateY: overlayTranslateY }],
          },
        ]}
      >
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryHeader}>
            <ThemedText style={styles.deliveryNumber}>
              Delivery {currentDeliveryIndex + 1} of {deliveries.length}
            </ThemedText>
            <View style={styles.distanceTimeContainer}>
              <View style={styles.distanceTimeItem}>
                <Ionicons name="bicycle" size={20} color="#32CD32" />
                <ThemedText style={styles.distanceTimeText}>{totalDistance}</ThemedText>
              </View>
              <View style={styles.distanceTimeItem}>
                <Ionicons name="time" size={20} color="#32CD32" />
                <ThemedText style={styles.distanceTimeText}>{totalDuration}</ThemedText>
              </View>
            </View>
          </View>
          

          <ThemedText style={styles.address}>
            {deliveries[currentDeliveryIndex]?.deliveryLocation.address || 'Loading...'}
          </ThemedText>
        </View>

        <ScrollView 
          style={styles.directionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {directions.map((step, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.directionStep,
                {
                  opacity: overlayOpacity,
                  transform: [{ translateY: overlayTranslateY }],
                },
              ]}
            >
              <Ionicons 
                name={getManeuverIcon(step.maneuver)} 
                size={24} 
                color="#32CD32" 
                style={styles.directionIcon}
              />
              <View style={styles.directionTextContainer}>
                <ThemedText style={styles.directionText}>{step.instruction}</ThemedText>
                <View style={styles.stepDetails}>
                  <ThemedText style={styles.stepDetailText}>{step.distance}</ThemedText>
                  <ThemedText style={styles.stepDetailText}>{step.duration}</ThemedText>
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteDelivery}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <ThemedText style={styles.completeButtonText}>
            {loading ? 'Completing...' : 'Complete Delivery'}
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </View>
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
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryInfo: {
    marginBottom: 15,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryNumber: {
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  distanceTimeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  distanceTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  distanceTimeText: {
    color: '#32CD32',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  address: {
    fontSize: 16,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  directionsContainer: {
    maxHeight: 200,
    marginBottom: 15,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  directionIcon: {
    marginRight: 10,
  },
  directionTextContainer: {
    flex: 1,
  },
  directionText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  stepDetails: {
    flexDirection: 'row',
    gap: 10,
  },
  stepDetailText: {
    color: '#666',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32CD32',
    padding: 10,
    borderRadius: 15,
    gap: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  mapButton: {
    backgroundColor: '#32CD32',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 