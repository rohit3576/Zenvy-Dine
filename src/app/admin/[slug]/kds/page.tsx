"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Order } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Clock, CookingPot } from "lucide-react";
import { isDemoRestaurant } from "@/data/demo-restaurant";

export default function KDSPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.restaurantId) return;

    // KDS typically shows orders that are CONFIRMED or PREPARING
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", user.restaurantId),
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
      if (process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setOrders([]);
        setListenerError(null);
        return;
      }
      console.warn("KDS listener error:", error instanceof Error ? error.message : error);
      setListenerError("Could not subscribe to kitchen orders. Check Firestore rules and indexes.");
      toast.error("Kitchen realtime updates failed.");
    });

    return () => unsubscribe();
  }, [user]);

  const setStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status, updatedAt: new Date() });
      toast.success(`Order marked as ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update KDS.");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <CookingPot className="w-8 h-8" /> Kitchen Display System
        </h2>
        <div className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-full">
          {orders.length} Active Orders in Kitchen
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
        {listenerError && (
          <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {listenerError}
          </div>
        )}

        {orders.map((order) => (
          <Card key={order.id} className="h-fit border-l-4 border-l-orange-500">
            <CardHeader className="py-3 bg-muted/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">T-{order.tableNumber}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Clock className="w-3 h-3" />
                  {/* Simplistic timer could be added here */}
                  Active
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-4 space-y-4">
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between font-bold">
                      <span>{item.quantity} x {item.name}</span>
                    </div>
                    {item.addOns.length > 0 && (
                      <div className="text-xs text-muted-foreground pl-4">
                        {item.addOns.map(a => a.optionName).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                {order.status === "CONFIRMED" ? (
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => setStatus(order.id, "PREPARING")}
                  >
                    START COOKING
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setStatus(order.id, "READY")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> MARK READY
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full h-[60vh] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl">
            <CookingPot className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium">All caught up! No pending orders to cook.</p>
          </div>
        )}
      </div>
    </div>
  );
}
