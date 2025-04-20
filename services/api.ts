import { Delivery, DeliveryStatus, OrderRequest, RouteResponse, Driver } from '../types/delivery';

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
  async getActiveDeliveries(driverId: string): Promise<Delivery[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/active/${driverId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
  },

  async getDeliveryDetails(deliveryId: string): Promise<Delivery> {
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch delivery details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      throw error;
    }
  },

  async updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery> {
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update delivery status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
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

  async getOptimizedRoute(orders: OrderRequest): Promise<RouteResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orders),
      });
      if (!response.ok) {
        throw new Error('Failed to get optimized route');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting optimized route:', error);
      throw error;
    }
  },

  async updateDeliveryActualTime(deliveryId: string, actualTime: string): Promise<Delivery> {
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}/actual-time`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actualTime }),
      });
      if (!response.ok) {
        throw new Error('Failed to update delivery actual time');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating delivery actual time:', error);
      throw error;
    }
  },
}; 