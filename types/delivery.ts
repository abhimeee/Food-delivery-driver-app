export enum DeliveryStatus {
  PENDING = "pending",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

export enum TemperatureSensitivity {
  NONE = "none",
  AMBIENT = "ambient",
  CHILLED = "chilled",
  FROZEN = "frozen",
  HOT = "hot"
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface DeliveryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  temperature_sensitivity: TemperatureSensitivity;
  max_safe_time_minutes?: number;
  special_handling_instructions?: string;
}

export interface DeliveryWindow {
  start_time: string;
  end_time: string;
  priority: number;
  late_penalty?: number;
}

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
  delivery_window: DeliveryWindow;
  actualTime?: string;
  notes?: string;
}

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

export interface Order {
  order_id: string;
  order_time: string;
  restaurant_id: string;
  customer_id: string;
  customer_lat: number;
  customer_long: number;
  product_type: string;
  delivery_priority: string;
  delivery_deadline: string;
}

export interface OrderRequest {
  orders: Order[];
}

export interface RouteResponse {
  optimized_order_ids: string[];
} 