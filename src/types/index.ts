import { Timestamp } from "firebase/firestore";

export type Role = "OWNER" | "MANAGER" | "STAFF";

export type Permission =
  | "restaurant:read"
  | "restaurant:update"
  | "orders:read"
  | "orders:update"
  | "menu:manage"
  | "tables:manage"
  | "staff:manage"
  | "settings:manage";

export interface User {
  id: string;
  uid: string;
  email: string;
  role: Role;
  restaurantId: string | null;
  restaurantSlug: string | null;
  isActive: boolean;
  permissions: Permission[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
