import { BaseEntity } from "./index";

export interface Restaurant extends BaseEntity {
  name: string;
  slug: string; // Unique URL identifier
  restaurantSlug?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  settings: RestaurantSettings;
  paymentSettings: PaymentSettings;
  isActive: boolean;
}

export interface RestaurantSettings {
  currency: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  themeColor?: string;
  accentColor?: string;
  notificationPhone?: string;
}

export interface PaymentSettings {
  razorpayEnabled: boolean;
  payAtCounterEnabled: boolean;
}

export interface Table extends BaseEntity {
  restaurantId: string;
  restaurantSlug?: string;
  number: string;
  capacity?: number;
  isActive: boolean;
  qrCodeUrl?: string;
}
