"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  IndianRupee,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-green-500 flex items-center mt-1">
          <TrendingUp className="h-3 w-3 mr-1" /> {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.restaurantId) return;
    // Analytics fetching logic would go here
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value="Rs. 42,500" icon={IndianRupee} trend="+12.5% from yesterday" />
        <StatCard title="Total Orders" value="156" icon={ShoppingBag} trend="+8% from yesterday" />
        <StatCard title="Active Tables" value="12" icon={Users} />
        <StatCard title="Pending Orders" value="5" icon={Clock} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      T{i+2}
                    </div>
                    <div>
                      <p className="text-sm font-bold">Order #ORD-{1000 + i}</p>
                      <p className="text-xs text-muted-foreground">2 mins ago - Table {i+2}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">Rs. 1,240</p>
                    <Badge variant="secondary" className="text-[10px] h-5">PREPARING</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "Paneer Butter Masala", orders: 45, price: "Rs. 320" },
                { name: "Chicken Tikka", orders: 38, price: "Rs. 450" },
                { name: "Garlic Naan", orders: 32, price: "Rs. 60" },
                { name: "Virgin Mojito", orders: 28, price: "Rs. 180" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded">{item.orders} orders</span>
                    <span className="text-sm font-bold">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
