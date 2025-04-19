import { Delivery, Driver } from '../types/delivery';

const API_BASE_URL = 'http://16.171.225.122:8000';

export const api = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  // Deliveries
  getActiveDeliveries: async (driverId: string): Promise<Delivery[]> => {
    const response = await fetch(`${API_BASE_URL}/deliveries/active/${driverId}`);
    return response.json();
  },

  getDeliveryDetails: async (deliveryId: string): Promise<Delivery> => {
    const response = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}`);
    return response.json();
  },

  updateDeliveryStatus: async (deliveryId: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  // Driver Profile
  getDriverProfile: async (driverId: string): Promise<Driver> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`);
    return response.json();
  },

  updateDriverLocation: async (driverId: string, latitude: number, longitude: number) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });
    return response.json();
  },
}; 