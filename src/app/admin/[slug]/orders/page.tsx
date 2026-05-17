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
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Order, OrderStatus } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, UtensilsCrossed, ReceiptText, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderReceipt } from "@/components/common/OrderReceipt";
import { Restaurant } from "@/types/restaurant";
import { notificationService } from "@/services/notification-service";
import { demoRestaurant, isDemoRestaurant } from "@/data/demo-restaurant";

export default function LiveOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user?.restaurantId) return;

    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", user.restaurantId),
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
      if (process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setOrders([]);
        setLoading(false);
        return;
      }
      console.warn("Firestore listener error:", error instanceof Error ? error.message : error);
      toast.error("Failed to load live orders.");
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
        if (process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
          setRestaurant(demoRestaurant);
          return;
        }
        console.warn("Restaurant load error:", error instanceof Error ? error.message : error);
        toast.error("Could not load restaurant profile for receipts.");
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
      console.error("Update error:", error);
      toast.error("Failed to update status.");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CONFIRMED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PREPARING": return "bg-purple-100 text-purple-800 border-purple-200";
      case "READY": return "bg-green-100 text-green-800 border-green-200";
      case "SERVED": return "bg-teal-100 text-teal-800 border-teal-200";
      case "COMPLETED": return "bg-gray-100 text-gray-800 border-gray-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Live Orders</h2>
        <Badge variant="outline" className="px-3 py-1 animate-pulse border-green-500 text-green-600">
          Realtime Updates Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden border-2 transition-all hover:border-primary/50">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Table {order.tableNumber}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.createdAt ? format(order.createdAt.toDate(), "hh:mm a") : "Just now"}
                  </p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-medium">{item.quantity}x {item.name}</span>
                    <span className="text-muted-foreground font-mono">Rs. {item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total Amount</span>
                <span>Rs. {order.total}</span>
              </div>

              <div className="pt-2">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Select 
                    value={order.status} 
                    onValueChange={(val) => updateOrderStatus(order.id, val as OrderStatus)}
                  >
                    <SelectTrigger className="w-full font-bold">
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
                  <Button variant="outline" size="icon" onClick={() => setReceiptOrder(order)} title="Print receipt">
                    <ReceiptText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!restaurant}
                    onClick={() => restaurant && window.open(notificationService.getWhatsAppOrderLink(order, restaurant), "_blank")}
                    title="Send WhatsApp order notification"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-xl border-2 border-dashed">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">No active orders</p>
              <p className="text-muted-foreground">New orders from customers will appear here in real-time.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent className="max-w-md">
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
