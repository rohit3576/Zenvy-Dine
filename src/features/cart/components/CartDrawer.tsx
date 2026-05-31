"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { Restaurant } from "@/types/restaurant";
import { Plus, Minus, ShoppingBag, CreditCard, Banknote, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";

interface CartDrawerProps {
  restaurant: Restaurant;
  tableId: string;
  onOrderPlaced?: (orderId: string) => void;
}

export default function CartDrawer({ restaurant, tableId, onOrderPlaced }: CartDrawerProps) {
  const { items, updateQuantity, clearCart, subtotal, totalItems } = useCartStore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();

  const taxAmount = (subtotal() * restaurant.settings.taxPercentage) / 100;
  const serviceCharge = (subtotal() * restaurant.settings.serviceChargePercentage) / 100;
  const grandTotal = subtotal() + taxAmount + serviceCharge;
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const isOnlinePaymentConfigured = Boolean(razorpayKey && !razorpayKey.startsWith("your_"));
  const currency = restaurant.settings.currency === "INR" || !restaurant.settings.currency ? "Rs." : restaurant.settings.currency;
  const formatMoney = (amount: number) => `${currency} ${Number(amount || 0).toFixed(amount % 1 === 0 ? 0 : 2)}`;

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
    if (items.length === 0) {
      toast.error("Add at least one item before checkout.");
      return;
    }

    if (method === "ONLINE" && !isOnlinePaymentConfigured) {
      toast.error("Online payments are not configured for this environment.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
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

      logFirestoreOperation("addDoc", {
        collection: "orders",
        queryPath: "orders",
        restaurantSlug: restaurant.slug,
        tableId,
        paymentMethod: method,
      });
      const docRef = await addDoc(collection(db, "orders"), orderData);
      onOrderPlaced?.(docRef.id);

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
          restaurantSlug: restaurant.slug,
        });
        const result = response.data as { order?: { id: string; amount: number; currency: string } };
        const razorpayOrder = result.order;

        if (!razorpayOrder) {
          throw new Error("Razorpay order was not returned");
        }

        logFirestoreOperation("updateDoc", {
          collection: "orders",
          queryPath: `orders/${docRef.id}`,
          restaurantSlug: restaurant.slug,
          field: "razorpayOrderId",
        });
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
            try {
              await verifyPayment({ ...payment, orderId: docRef.id });
              toast.success("Payment received. Your order is in the kitchen.");
              clearCart();
              router.refresh();
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.error("Payment verification failed. Please contact the counter.");
            }
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
      logFirestoreError("orders.addDoc", error, {
        collection: "orders",
        queryPath: "orders",
        restaurantSlug: restaurant.slug,
        tableId,
        paymentMethod: method,
      });
      toast.error(`Failed to place order: ${formatFirestoreError(error)}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="h-16 w-full rounded-2xl border border-blue-500 bg-primary px-5 text-primary-foreground shadow-[0_12px_30px_rgba(10,132,255,0.26)] transition-transform active:scale-[0.98]" />
        }
      >
        <div className="flex min-w-0 flex-col items-start">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-75">{totalItems()} items</span>
          <span className="truncate text-lg font-semibold">{formatMoney(subtotal())}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          Cart
          <ShoppingBag className="h-5 w-5" />
        </div>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="mx-auto h-[92vh] max-h-[760px] max-w-md rounded-t-[2rem] border-black/[0.08] bg-popover px-0 pb-0 shadow-[0_-18px_54px_rgba(15,23,42,0.18)]"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <SheetHeader className="px-6 pb-2 pt-5">
          <SheetTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            Your cart
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-3 pt-2 no-scrollbar">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="mb-3 rounded-2xl border border-black/[0.06] bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 font-semibold leading-5">{item.name}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{formatMoney(item.price)}</p>
                    </div>
                    <div className="text-right text-sm font-semibold">{formatMoney(item.totalPrice)}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex h-10 items-center rounded-full bg-white px-1 ring-1 ring-black/[0.08]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.id, "", item.quantity - 1)}
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.id, "", item.quantity + 1)}
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Table {tableId}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t border-black/[0.06] bg-slate-50 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal())}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST ({restaurant.settings.taxPercentage}%)</span>
                <span>{formatMoney(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service charge ({restaurant.settings.serviceChargePercentage}%)</span>
                <span>{formatMoney(serviceCharge)}</span>
              </div>
              <Separator className="bg-black/[0.08]" />
              <div className="flex justify-between text-xl font-semibold">
                <span>Total</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {restaurant.paymentSettings.payAtCounterEnabled && (
                <Button
                  variant="glass"
                  className="h-14 rounded-2xl"
                  disabled={isPlacingOrder}
                  onClick={() => handlePlaceOrder("CASH")}
                >
                  {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
                  Counter
                </Button>
              )}
              {restaurant.paymentSettings.razorpayEnabled && (
                <Button
                  variant="premium"
                  className="h-14 rounded-2xl"
                  disabled={isPlacingOrder || !isOnlinePaymentConfigured}
                  onClick={() => handlePlaceOrder("ONLINE")}
                  title={!isOnlinePaymentConfigured ? "Set NEXT_PUBLIC_RAZORPAY_KEY_ID to enable online payments" : "Pay online"}
                >
                  {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                  Online
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
