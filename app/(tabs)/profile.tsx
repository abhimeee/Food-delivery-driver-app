import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Driver } from '../../types/delivery';
import { api } from '../../services/api';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

export default function ProfileScreen() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual driver ID from auth context
      const driverId = 'driver1';
      const driverProfile = await api.getDriverProfile(driverId);
      setDriver(driverProfile);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      Alert.alert('Error', 'Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  if (!driver) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <Image
          source={require('../../assets/images/react-logo.png')}
          style={styles.avatar}
        />
        <ThemedText style={styles.name}>{driver.name}</ThemedText>
        <View style={styles.ratingContainer}>
          <ThemedText style={styles.rating}>{driver.rating.toFixed(1)}</ThemedText>
          <ThemedText style={styles.ratingLabel}>Rating</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
        
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <ThemedText style={styles.value}>{driver.email}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Phone</ThemedText>
          <ThemedText style={styles.value}>{driver.phone}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Vehicle Information</ThemedText>
        
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Vehicle Type</ThemedText>
          <ThemedText style={styles.value}>{driver.vehicleType}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Vehicle Number</ThemedText>
          <ThemedText style={styles.value}>{driver.vehicleNumber}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Delivery Statistics</ThemedText>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{driver.totalDeliveries}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Deliveries</ThemedText>
          </View>
        </View>
      </ThemedView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          // TODO: Implement logout functionality
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: () => {
                // Handle logout
              },
            },
          ]);
        }}
      >
        <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
    marginRight: 5,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 