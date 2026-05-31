"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Order, OrderStatus } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { UtensilsCrossed, ReceiptText, MessageCircle, Radio } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderReceipt } from "@/components/common/OrderReceipt";
import { Restaurant } from "@/types/restaurant";
import { notificationService } from "@/services/notification-service";
import { demoRestaurant, isDemoRestaurant, shouldUseLocalDemoFallback } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/premium";

type BadgeTone = "neutral" | "green" | "amber" | "blue" | "red" | "purple";

export default function LiveOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("subscribe", {
      collection: "orders",
      constraints: ["restaurantSlug == value", "orderBy createdAt desc"],
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
      queryPath: "orders",
    });

    const q = query(
      collection(db, "orders"),
      where("restaurantSlug", "==", user.restaurantId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setOrders([]);
        setLoading(false);
        return;
      }
      logFirestoreError("orders.subscribe", error, {
        collection: "orders",
        restaurantSlug: user.restaurantId,
        queryPath: "orders",
      });
      toast.error(`Live orders unavailable: ${formatFirestoreError(error)}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.restaurantId) return;

    getDoc(doc(db, "restaurants", user.restaurantId))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setRestaurant({ id: snapshot.id, ...snapshot.data() } as Restaurant);
        }
      })
      .catch((error) => {
        if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
          setRestaurant(demoRestaurant);
          return;
        }
        logFirestoreError("restaurants.getDoc", error, {
          collection: "restaurants",
          queryPath: `restaurants/${user.restaurantId}`,
          restaurantSlug: user.restaurantId,
        });
        toast.error(`Could not load restaurant profile for receipts: ${formatFirestoreError(error)}`);
      });
  }, [user?.restaurantId]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date()
      });
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      logFirestoreError("orders.updateDoc", error, {
        collection: "orders",
        queryPath: `orders/${orderId}`,
        restaurantSlug: user?.restaurantId,
        status,
      });
      toast.error(`Failed to update status: ${formatFirestoreError(error)}`);
    }
  };

  const getStatusTone = (status: OrderStatus): BadgeTone => {
    switch (status) {
      case "PENDING": return "amber";
      case "CONFIRMED": return "blue";
      case "PREPARING": return "purple";
      case "READY": return "green";
      case "SERVED": return "green";
      case "COMPLETED": return "neutral";
      case "CANCELLED": return "red";
      default: return "neutral";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Orders"
          title="Live Orders"
          description="Connecting to the dining room stream."
          action={<StatusBadge tone="blue">Loading</StatusBadge>}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="h-64 animate-pulse">
              <CardContent className="h-full p-5">
                <div className="h-5 w-24 rounded bg-slate-200" />
                <div className="mt-8 space-y-3">
                  <div className="h-3 rounded bg-slate-200" />
                  <div className="h-3 w-4/5 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Realtime"
        title="Live Orders"
        description="Review incoming orders, update kitchen status, print receipts, and share WhatsApp summaries."
        action={
          <StatusBadge tone="green">
            <Radio className="h-3 w-3 animate-pulse" />
            Active
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.035, 0.18) }}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader className="border-b border-black/[0.06] bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-4xl font-semibold tracking-tight">Table {order.tableNumber}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.createdAt ? format(order.createdAt.toDate(), "hh:mm a") : "Just now"}
                    </p>
                  </div>
                  <StatusBadge tone={getStatusTone(order.status)}>
                    {order.status}
                  </StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-4 text-sm">
                      <span className="font-medium text-foreground">{item.quantity}x {item.name}</span>
                      <span className="shrink-0 font-mono text-muted-foreground">Rs. {item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between rounded-2xl border border-black/[0.06] bg-slate-50 p-4 font-semibold">
                  <span>Total</span>
                  <span>Rs. {order.total}</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateOrderStatus(order.id, val as OrderStatus)}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl border-black/[0.08] bg-white font-semibold">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirm Order</SelectItem>
                      <SelectItem value="PREPARING">Preparing</SelectItem>
                      <SelectItem value="READY">Ready for Pickup</SelectItem>
                      <SelectItem value="SERVED">Served</SelectItem>
                      <SelectItem value="COMPLETED">Mark Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancel Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="glass" size="icon" className="h-11 w-11 rounded-xl" onClick={() => setReceiptOrder(order)} title="Print receipt">
                    <ReceiptText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="glass"
                    size="icon"
                    className="h-11 w-11 rounded-xl"
                    disabled={!restaurant}
                    onClick={() => restaurant && window.open(notificationService.getWhatsAppOrderLink(order, restaurant), "_blank")}
                    title="Send WhatsApp order notification"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={UtensilsCrossed}
              title="No active orders"
              description="New customer orders will appear here automatically as soon as guests place them."
            />
          </div>
        )}
      </div>

      <Dialog open={!!receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent className="max-w-md border-black/[0.08] bg-popover">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          {receiptOrder && restaurant && (
            <OrderReceipt order={receiptOrder} restaurant={restaurant} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
