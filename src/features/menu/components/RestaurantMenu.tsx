"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Plus, Minus, BellRing } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Restaurant } from "@/types/restaurant";
import { Category, MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import CartDrawer from "@/features/cart/components/CartDrawer";
import { toast } from "sonner";
import { isDemoRestaurant } from "@/data/demo-restaurant";

interface RestaurantMenuProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  tableId: string;
}

export default function RestaurantMenu({ restaurant, categories, items, tableId }: RestaurantMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const { addItem, updateQuantity, items: cartItems, totalItems } = useCartStore();

  useEffect(() => {
    if (!restaurant.settings.themeColor) return;
    document.documentElement.style.setProperty("--primary", restaurant.settings.themeColor);
  }, [restaurant.settings.themeColor]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const description = item.description || "";
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const getItemQuantity = (itemId: string) => {
    return cartItems
      .filter((item) => item.id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const callWaiter = async () => {
    setIsCallingWaiter(true);
    try {
      if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurant.id)) {
        toast.success("A waiter has been notified in local demo mode.");
        return;
      }
      await addDoc(collection(db, "waiterCalls"), {
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        tableNumber: tableId,
        status: "OPEN",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("A waiter has been notified.");
    } catch (error) {
      console.warn("Waiter call error:", error instanceof Error ? error.message : error);
      toast.error("Could not call a waiter. Please try again.");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant.logoUrl && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border">
                <Image src={restaurant.logoUrl} alt={restaurant.name} fill className="object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{restaurant.name}</h1>
              <p className="text-xs text-muted-foreground">Table {tableId}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={callWaiter}
            disabled={isCallingWaiter}
            title="Call waiter"
          >
            <BellRing className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search for dishes..." 
            className="pl-10 rounded-full bg-muted/50 border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-0 gap-2 no-scrollbar">
            <TabsTrigger 
              value="all" 
              className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="overflow-hidden border-none shadow-sm bg-muted/30">
                <CardContent className="p-0 flex gap-4">
                  <div className="flex-1 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-3 h-3 border-2 flex items-center justify-center rounded-sm",
                            item.isVeg ? "border-green-600" : "border-red-600"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.isVeg ? "bg-green-600" : "bg-red-600"
                            )} />
                          </span>
                          {item.isBestseller && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px] uppercase font-bold px-1.5 py-0">
                              Bestseller
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-base">{item.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                      {item.description || "No description available."}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-lg">Rs. {item.price}</span>
                      
                      {getItemQuantity(item.id) > 0 ? (
                        <div className="flex items-center bg-primary text-primary-foreground rounded-full h-9 px-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full text-primary-foreground hover:bg-primary/90"
                            onClick={() => updateQuantity(item.id, "", getItemQuantity(item.id) - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-sm">
                            {getItemQuantity(item.id)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full text-primary-foreground hover:bg-primary/90"
                            onClick={() => addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              quantity: 1,
                              addOns: [],
                              totalPrice: item.price
                            })}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="rounded-full px-6 font-bold"
                          onClick={() => addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            addOns: [],
                            totalPrice: item.price
                          })}
                        >
                          ADD
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.imageUrl && (
                    <div className="relative w-32 h-32 m-2">
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover rounded-xl"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <p className="text-muted-foreground">No items found matching your search.</p>
            <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {totalItems() > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <CartDrawer restaurant={restaurant} tableId={tableId} />
          </motion.div>
        </div>
      )}
    </div>
  );
}
