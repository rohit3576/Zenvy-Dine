import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OrderItem, SelectedAddOn } from "@/types/order";

interface CartStore {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (itemId: string, addOnKey: string) => void;
  updateQuantity: (itemId: string, addOnKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

// Helper to generate a unique key for items with different add-ons
const getAddOnKey = (addOns: SelectedAddOn[]) => {
  return addOns
    .map((a) => a.optionId)
    .sort()
    .join("-");
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const addOnKey = getAddOnKey(newItem.addOns);
        const existingItems = get().items;
        const existingItemIndex = existingItems.findIndex(
          (item) => item.id === newItem.id && getAddOnKey(item.addOns) === addOnKey
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...existingItems];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          updatedItems[existingItemIndex].totalPrice = 
            updatedItems[existingItemIndex].quantity * (updatedItems[existingItemIndex].price + 
            updatedItems[existingItemIndex].addOns.reduce((sum, a) => sum + a.price, 0));
          set({ items: updatedItems });
        } else {
          set({ items: [...existingItems, newItem] });
        }
      },
      removeItem: (itemId, addOnKey) => {
        set({
          items: get().items.filter(
            (item) => !(item.id === itemId && getAddOnKey(item.addOns) === addOnKey)
          ),
        });
      },
      updateQuantity: (itemId, addOnKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId, addOnKey);
          return;
        }
        const updatedItems = get().items.map((item) => {
          if (item.id === itemId && getAddOnKey(item.addOns) === addOnKey) {
            const itemBasePrice = item.price;
            const addOnsPrice = item.addOns.reduce((sum, a) => sum + a.price, 0);
            return {
              ...item,
              quantity,
              totalPrice: quantity * (itemBasePrice + addOnsPrice),
            };
          }
          return item;
        });
        set({ items: updatedItems });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
    }),
    {
      name: "zenvy-cart-storage",
    }
  )
);
