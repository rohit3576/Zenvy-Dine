"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { Restaurant } from "@/types/restaurant";
import { Plus, Minus, ShoppingBag, CreditCard, Banknote } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface CartDrawerProps {
  restaurant: Restaurant;
  tableId: string;
}

export default function CartDrawer({ restaurant, tableId }: CartDrawerProps) {
  const { items, updateQuantity, clearCart, subtotal, totalItems } = useCartStore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();

  const taxAmount = (subtotal() * restaurant.settings.taxPercentage) / 100;
  const serviceCharge = (subtotal() * restaurant.settings.serviceChargePercentage) / 100;
  const grandTotal = subtotal() + taxAmount + serviceCharge;

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (document.getElementById("razorpay-checkout-js")) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async (method: "ONLINE" | "CASH") => {
    setIsPlacingOrder(true);
    try {
      const orderData = {
        restaurantId: restaurant.id,
        tableId: tableId,
        tableNumber: tableId, // Assuming tableId is the number for now
        items: items,
        subtotal: subtotal(),
        tax: taxAmount,
        serviceCharge: serviceCharge,
        total: grandTotal,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: method,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      if (method === "ONLINE") {
        toast.info("Initializing secure payment...");
        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error("Payment checkout could not be loaded.");
          return;
        }

        const createRazorpayOrder = httpsCallable(getFunctions(), "createRazorpayOrder");
        const response = await createRazorpayOrder({
          amount: grandTotal,
          currency: restaurant.settings.currency || "INR",
          receipt: docRef.id,
          restaurantId: restaurant.id,
        });
        const result = response.data as { order?: { id: string; amount: number; currency: string } };
        const razorpayOrder = result.order;

        if (!razorpayOrder) {
          throw new Error("Razorpay order was not returned");
        }

        await updateDoc(doc(db, "orders", docRef.id), {
          razorpayOrderId: razorpayOrder.id,
          updatedAt: serverTimestamp(),
        });

        const RazorpayCheckout = (window as typeof window & {
          Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
        }).Razorpay;

        if (!RazorpayCheckout) {
          throw new Error("Razorpay checkout is unavailable");
        }

        const verifyPayment = httpsCallable(getFunctions(), "verifyRazorpayPayment");
        const checkout = new RazorpayCheckout({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: restaurant.name,
          description: `Table ${tableId} order`,
          order_id: razorpayOrder.id,
          handler: async (payment: Record<string, string>) => {
            await verifyPayment({ ...payment, orderId: docRef.id });
            toast.success("Payment received. Your order is in the kitchen.");
            clearCart();
            router.refresh();
          },
          modal: {
            ondismiss: () => toast.info("Payment cancelled. Your order is still pending."),
          },
          theme: {
            color: restaurant.settings.themeColor || "#16a34a",
          },
        });

        checkout.open();
      } else {
        toast.success("Order placed successfully! Please pay at the counter.");
        clearCart();
        router.refresh();
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="w-full h-14 rounded-2xl shadow-2xl flex items-center justify-between px-6 bg-green-600 hover:bg-green-700 text-white" />
        }
      >
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold opacity-80">{totalItems()} Items</span>
            <span className="text-lg font-bold">Rs. {subtotal()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">VIEW CART</span>
            <ShoppingBag className="w-5 h-5" />
          </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] px-6 pb-10">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            Your Cart <ShoppingBag className="w-5 h-5" />
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-base">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">Rs. {item.price}</p>
                </div>
                <div className="flex items-center bg-muted rounded-full h-9 px-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full"
                    onClick={() => updateQuantity(item.id, "", item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full"
                    onClick={() => updateQuantity(item.id, "", item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-right font-bold w-16">
                  Rs. {item.totalPrice}
                </div>
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div className="py-6 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs. {subtotal()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST ({restaurant.settings.taxPercentage}%)</span>
              <span>Rs. {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Service Charge ({restaurant.settings.serviceChargePercentage}%)</span>
              <span>Rs. {serviceCharge.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-xl">
              <span>Grand Total</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            {restaurant.paymentSettings.payAtCounterEnabled && (
              <Button 
                variant="outline" 
                className="h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                disabled={isPlacingOrder}
                onClick={() => handlePlaceOrder("CASH")}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-[10px] font-bold">PAY AT COUNTER</span>
              </Button>
            )}
            {restaurant.paymentSettings.razorpayEnabled && (
              <Button 
                className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 bg-primary"
                disabled={isPlacingOrder}
                onClick={() => handlePlaceOrder("ONLINE")}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-[10px] font-bold">PAY ONLINE</span>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
