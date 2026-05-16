import { Timestamp } from "firebase/firestore";

export type Role = "SUPER_ADMIN" | "RESTAURANT_OWNER" | "MANAGER" | "KITCHEN_STAFF" | "CASHIER";

export interface User {
  id: string;
  email: string;
  role: Role;
  restaurantId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
