"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  Clock,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { StatusBadge, MetricCard, PageHeader } from "@/components/ui/premium";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.restaurantId) return;
    // Analytics fetching logic would go here
  }, [user]);

  const recentOrders = [1, 2, 3, 4, 5];
  const topItems = [
    { name: "Paneer Butter Masala", orders: 45, price: "Rs. 320" },
    { name: "Chicken Tikka", orders: 38, price: "Rs. 450" },
    { name: "Garlic Naan", orders: 32, price: "Rs. 60" },
    { name: "Virgin Mojito", orders: 28, price: "Rs. 180" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Today"
        title="Restaurant Command Center"
        description="Track dining room momentum, kitchen pressure, and service quality from one calm operational view."
        action={<StatusBadge tone="green">Realtime ready</StatusBadge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Revenue" value="Rs. 42,500" icon={IndianRupee} detail="+12.5% from yesterday" tone="emerald" />
        <MetricCard title="Orders" value="156" icon={ShoppingBag} detail="+8% from yesterday" tone="amber" />
        <MetricCard title="Active tables" value="12" icon={Users} detail="Dining room live" tone="blue" />
        <MetricCard title="Pending" value="5" icon={Clock} detail="Needs attention" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Latest dining room activity</p>
            </div>
            <StatusBadge tone="green">
              <TrendingUp className="h-3 w-3" />
              Live
            </StatusBadge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-black/[0.06] bg-slate-50 p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-sm font-bold text-primary">
                  T{order + 2}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Order #ORD-{1000 + order}</p>
                  <p className="mt-1 text-xs text-muted-foreground">2 mins ago - Table {order + 2}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Rs. 1,240</p>
                  <StatusBadge tone="purple">Preparing</StatusBadge>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">What guests are choosing today</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-slate-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-muted-foreground ring-1 ring-black/[0.06]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {item.price}
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Service floor health</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Orders, KDS, waiter calls, QR tables, and menu updates are consolidated in the left navigation.
            </p>
          </div>
          <StatusBadge tone="blue">Demo ready</StatusBadge>
        </CardContent>
      </Card>
    </div>
  );
}
