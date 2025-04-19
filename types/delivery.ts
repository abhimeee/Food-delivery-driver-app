export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  pickupLocation: Location;
  deliveryLocation: Location;
  estimatedTime: string;
  actualTime?: string;
  notes?: string;
}

export interface DeliveryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export type DeliveryStatus = 
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
} 