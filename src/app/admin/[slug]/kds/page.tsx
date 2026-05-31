"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Order } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Clock, CookingPot, Flame, UtensilsCrossed } from "lucide-react";
import { isDemoRestaurant, shouldUseLocalDemoFallback } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/premium";

export default function KDSPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("subscribe", {
      collection: "orders",
      constraints: ["restaurantSlug == value", "status in CONFIRMED/PREPARING", "orderBy createdAt asc"],
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
      queryPath: "orders",
    });

    // KDS typically shows orders that are CONFIRMED or PREPARING
    const q = query(
      collection(db, "orders"),
      where("restaurantSlug", "==", user.restaurantId),
      where("status", "in", ["CONFIRMED", "PREPARING"]),
      orderBy("createdAt", "asc") // Oldest first for KDS
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setListenerError(null);
    }, (error) => {
      if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setOrders([]);
        setListenerError(null);
        return;
      }
      logFirestoreError("orders.kds.subscribe", error, {
        collection: "orders",
        restaurantSlug: user.restaurantId,
        queryPath: "orders",
      });
      setListenerError(`Kitchen realtime updates are unavailable. ${formatFirestoreError(error)}`);
      toast.error(`Kitchen updates unavailable: ${formatFirestoreError(error)}`);
    });

    return () => unsubscribe();
  }, [user]);

  const setStatus = async (orderId: string, status: string) => {
    try {
      logFirestoreOperation("updateDoc", {
        collection: "orders",
        queryPath: `orders/${orderId}`,
        restaurantSlug: user?.restaurantId,
        status,
      });
      await updateDoc(doc(db, "orders", orderId), { status, updatedAt: new Date() });
      toast.success(`Order marked as ${status.toLowerCase()}`);
    } catch (error) {
      logFirestoreError("orders.kds.updateDoc", error, {
        collection: "orders",
        queryPath: `orders/${orderId}`,
        restaurantSlug: user?.restaurantId,
        status,
      });
      toast.error(`Failed to update KDS: ${formatFirestoreError(error)}`);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Kitchen"
        title="Kitchen Display System"
        description="Prioritize confirmed and preparing orders with large, touch-friendly production cards."
        action={<StatusBadge tone={orders.length > 0 ? "amber" : "green"}>{orders.length} active</StatusBadge>}
      />

      {listenerError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {listenerError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.2) }}
          >
            <Card className="h-full overflow-hidden border-l-4 border-l-amber-400">
              <CardHeader className="border-b border-black/[0.06] bg-slate-50 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-5xl font-semibold tracking-tight">T-{order.tableNumber}</CardTitle>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Active
                    </div>
                  </div>
                  <StatusBadge tone={order.status === "CONFIRMED" ? "blue" : "purple"}>{order.status}</StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex-1 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                      <div className="flex justify-between gap-3 font-semibold">
                        <span>{item.quantity} x {item.name}</span>
                      </div>
                      {item.addOns.length > 0 && (
                        <div className="mt-2 text-xs leading-5 text-muted-foreground">
                          {item.addOns.map(a => a.optionName).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-5">
                  {order.status === "CONFIRMED" ? (
                    <Button
                      variant="premium"
                      className="h-12 w-full rounded-2xl"
                      onClick={() => setStatus(order.id, "PREPARING")}
                    >
                      <Flame className="mr-2 h-4 w-4" />
                      Start cooking
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      className="h-12 w-full rounded-2xl"
                      onClick={() => setStatus(order.id, "READY")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark ready
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {!listenerError && orders.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={orders.length === 0 ? CookingPot : UtensilsCrossed}
              title="Kitchen is clear"
              description="Confirmed and preparing orders will appear here automatically."
            />
          </div>
        )}
      </div>
    </div>
  );
}
