import { BaseEntity } from "./index";

export interface Category extends BaseEntity {
  restaurantId: string;
  restaurantSlug?: string;
  name: string;
  order: number;
  isActive: boolean;
}

export interface MenuItem extends BaseEntity {
  restaurantId: string;
  restaurantSlug?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isBestseller: boolean;
  isAvailable: boolean;
  addOns: AddOnGroup[];
}

export interface AddOnGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: AddOnOption[];
}

export interface AddOnOption {
  id: string;
  name: string;
  price: number;
}
