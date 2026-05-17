import { Timestamp } from "firebase/firestore";
import { Category, MenuItem } from "@/types/menu";
import { Restaurant, Table } from "@/types/restaurant";
import { Role } from "@/types";

const stamp = Timestamp.fromDate(new Date("2026-01-01T00:00:00.000Z"));

export const demoRestaurant: Restaurant = {
  id: "spice-garden",
  name: "Spice Garden",
  slug: "spice-garden",
  logoUrl: "/brand/zenvy-dine.svg",
  address: "42 MG Road, Bengaluru",
  phone: "+91 98765 43210",
  isActive: true,
  settings: {
    currency: "INR",
    taxPercentage: 5,
    serviceChargePercentage: 5,
    themeColor: "#16a34a",
    accentColor: "#f97316",
    notificationPhone: "+919876543210",
  },
  paymentSettings: {
    razorpayEnabled: true,
    payAtCounterEnabled: true,
  },
  createdAt: stamp,
  updatedAt: stamp,
};

export const demoCategories: Category[] = [
  { id: "starters", restaurantId: demoRestaurant.id, name: "Starters", order: 1, isActive: true, createdAt: stamp, updatedAt: stamp },
  { id: "mains", restaurantId: demoRestaurant.id, name: "Main Course", order: 2, isActive: true, createdAt: stamp, updatedAt: stamp },
  { id: "drinks", restaurantId: demoRestaurant.id, name: "Drinks & Desserts", order: 3, isActive: true, createdAt: stamp, updatedAt: stamp },
];

export const demoTables: Table[] = Array.from({ length: 5 }, (_, index) => ({
  id: `table-${index + 1}`,
  restaurantId: demoRestaurant.id,
  number: String(index + 1),
  capacity: index < 2 ? 2 : 4,
  isActive: true,
  createdAt: stamp,
  updatedAt: stamp,
}));

export type DemoStaffMember = {
  id: string;
  restaurantId: string;
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
};

export const demoStaff: DemoStaffMember[] = [
  {
    id: "spice-garden-owner",
    restaurantId: demoRestaurant.id,
    userId: "demo-owner",
    email: "owner@spicegarden.test",
    displayName: "Aarav Mehta",
    role: "RESTAURANT_OWNER",
    isActive: true,
  },
  {
    id: "spice-garden-manager",
    restaurantId: demoRestaurant.id,
    userId: "demo-manager",
    email: "manager@spicegarden.test",
    displayName: "Nisha Rao",
    role: "MANAGER",
    isActive: true,
  },
  {
    id: "spice-garden-kitchen",
    restaurantId: demoRestaurant.id,
    userId: "demo-kitchen",
    email: "kitchen@spicegarden.test",
    displayName: "Imran Khan",
    role: "KITCHEN_STAFF",
    isActive: true,
  },
];

export const demoMenuItems: MenuItem[] = [
  ["crispy-corn-chaat", "starters", "Crispy Corn Chaat", "Golden fried corn tossed with lime, chilli, coriander, and house chaat masala.", 220, true, true, "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&h=800&fit=crop"],
  ["paneer-tikka", "starters", "Paneer Tikka", "Charred paneer cubes in a smoky yoghurt marinade with mint chutney.", 340, true, true, "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=800&fit=crop"],
  ["chilli-chicken", "starters", "Chilli Chicken", "Crisp chicken bites tossed with peppers, onion, garlic, and soy chilli glaze.", 360, false, true, "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=800&fit=crop"],
  ["honey-chilli-potato", "starters", "Honey Chilli Potato", "Crispy potato fingers tossed in honey, sesame, and chilli sauce.", 240, true, false, "https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&h=800&fit=crop"],
  ["butter-chicken", "mains", "Butter Chicken", "Delhi-style chicken simmered in tomato, butter, cream, and kasuri methi.", 480, false, true, "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=800&fit=crop"],
  ["paneer-butter-masala", "mains", "Paneer Butter Masala", "Soft paneer in a rich makhani gravy finished with fresh cream.", 390, true, true, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&h=800&fit=crop"],
  ["dal-bukhara", "mains", "Dal Bukhara", "Slow-cooked black lentils with butter, tomato, and aromatic spices.", 330, true, false, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop"],
  ["chicken-biryani", "mains", "Chicken Dum Biryani", "Fragrant basmati rice layered with marinated chicken and biryani masala.", 420, false, true, "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=800&fit=crop"],
  ["garlic-naan", "mains", "Garlic Butter Naan", "Tandoor-baked naan brushed with garlic butter and coriander.", 90, true, true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=800&fit=crop"],
  ["gulab-jamun", "drinks", "Gulab Jamun", "Warm khoya dumplings soaked in saffron cardamom syrup.", 160, true, false, "https://images.unsplash.com/photo-1605197161470-5d2a9af5689b?w=800&h=800&fit=crop"],
  ["masala-chaas", "drinks", "Masala Chaas", "Chilled spiced buttermilk with roasted cumin and mint.", 120, true, false, "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop"],
  ["virgin-mojito", "drinks", "Virgin Mojito", "Mint, lime, soda, and crushed ice.", 180, true, true, "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&h=800&fit=crop"],
].map(([id, categoryId, name, description, price, isVeg, isBestseller]) => ({
  id: id as string,
  restaurantId: demoRestaurant.id,
  categoryId: categoryId as string,
  name: name as string,
  description: description as string,
  price: price as number,
  imageUrl: "/brand/zenvy-dine.svg",
  isVeg: isVeg as boolean,
  isBestseller: isBestseller as boolean,
  isAvailable: true,
  addOns: [],
  createdAt: stamp,
  updatedAt: stamp,
}));

export function isDemoRestaurant(slugOrId: string) {
  return slugOrId === demoRestaurant.id || slugOrId === demoRestaurant.slug;
}
