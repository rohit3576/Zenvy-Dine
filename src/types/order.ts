import { BaseEntity } from "./index";

export type OrderStatus = 
  | "PENDING" 
  | "CONFIRMED" 
  | "PREPARING" 
  | "READY" 
  | "SERVED" 
  | "COMPLETED" 
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type PaymentMethod = "ONLINE" | "CASH";

export interface Order extends BaseEntity {
  restaurantId: string;
  restaurantSlug?: string;
  tableId: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string; // Razorpay payment ID
  razorpayOrderId?: string;
  specialInstructions?: string;
}

export interface OrderItem {
  id: string; // MenuItem ID
  name: string;
  price: number;
  quantity: number;
  addOns: SelectedAddOn[];
  totalPrice: number;
}

export interface SelectedAddOn {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}
