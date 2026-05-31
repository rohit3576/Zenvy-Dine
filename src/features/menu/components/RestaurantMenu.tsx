"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BellRing,
  ChefHat,
  CheckCircle2,
  Clock3,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { Restaurant } from "@/types/restaurant";
import { Category, MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import CartDrawer from "@/features/cart/components/CartDrawer";
import { toast } from "sonner";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";

interface RestaurantMenuProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  tableId: string;
}

const statusTone = (status: string) => {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "CONFIRMED":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "PREPARING":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "READY":
    case "SERVED":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-slate-200 bg-white text-muted-foreground";
  }
};

function isFoodPhoto(url?: string): url is string {
  return Boolean(url && !url.includes("/brand/") && !url.endsWith(".svg"));
}

export default function RestaurantMenu({ restaurant, categories, items, tableId }: RestaurantMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);
  const [latestOrderStatus, setLatestOrderStatus] = useState<string | null>(null);
  const { addItem, updateQuantity, items: cartItems, totalItems, hasHydrated } = useCartStore();

  useEffect(() => {
    Promise.resolve(useCartStore.persist.rehydrate()).catch((error) => {
      console.error("[cart] Failed to hydrate cart storage", error);
      useCartStore.getState().setHasHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!restaurant.settings.themeColor) return;
    document.documentElement.style.setProperty("--primary", restaurant.settings.themeColor);
  }, [restaurant.settings.themeColor]);

  useEffect(() => {
    if (!latestOrderId) return;

    logFirestoreOperation("subscribe", {
      collection: "orders",
      queryPath: `orders/${latestOrderId}`,
      restaurantSlug: restaurant.slug,
      tableId,
    });

    return onSnapshot(doc(db, "orders", latestOrderId), (snapshot) => {
      setLatestOrderStatus(snapshot.exists() ? String(snapshot.data().status || "PENDING") : "UNKNOWN");
    }, (error) => {
      logFirestoreError("orders.customerStatus.subscribe", error, {
        collection: "orders",
        queryPath: `orders/${latestOrderId}`,
        restaurantSlug: restaurant.slug,
        tableId,
      });
      toast.error(`Order status updates unavailable: ${formatFirestoreError(error)}`);
    });
  }, [latestOrderId, restaurant.slug, tableId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const description = item.description || "";
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const heroImage = useMemo(() => {
    return items.find((item) => item.isBestseller && isFoodPhoto(item.imageUrl))?.imageUrl ||
      items.find((item) => isFoodPhoto(item.imageUrl))?.imageUrl;
  }, [items]);

  const activeCategoryName = selectedCategory === "all"
    ? "All dishes"
    : categories.find((category) => category.id === selectedCategory)?.name || "Menu";

  const bestsellerCount = items.filter((item) => item.isBestseller).length;
  const currency = restaurant.settings.currency === "INR" || !restaurant.settings.currency ? "Rs." : restaurant.settings.currency;
  const formatMoney = (amount: number) => `${currency} ${Number(amount || 0).toFixed(amount % 1 === 0 ? 0 : 2)}`;

  const getItemQuantity = (itemId: string) => {
    if (!hasHydrated) return 0;

    return cartItems
      .filter((item) => item.id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const callWaiter = async () => {
    setIsCallingWaiter(true);
    try {
      logFirestoreOperation("addDoc", {
        collection: "waiterCalls",
        queryPath: "waiterCalls",
        restaurantSlug: restaurant.slug,
        tableId,
      });
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
      logFirestoreError("waiterCalls.addDoc", error, {
        collection: "waiterCalls",
        queryPath: "waiterCalls",
        restaurantSlug: restaurant.slug,
        tableId,
      });
      toast.error(`Could not call a waiter: ${formatFirestoreError(error)}`);
    } finally {
      setIsCallingWaiter(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 text-foreground">
      <section className="relative isolate overflow-hidden">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="pointer-events-none -z-10 object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(10,132,255,0.12),rgba(34,197,94,0.08),rgba(248,250,252,1))]" />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(245,245,247,0.94)_72%,rgba(245,245,247,1))]" />

        <div className="mx-auto flex min-h-[430px] max-w-5xl flex-col px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 rounded-full border border-black/[0.06] bg-white/90 px-3 py-2 shadow-sm backdrop-blur-xl">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-black/[0.06]">
                {restaurant.logoUrl ? (
                  <Image src={restaurant.logoUrl} alt={restaurant.name} fill loading="eager" sizes="44px" className="object-cover" />
                ) : (
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground">Table {tableId}</p>
              </div>
            </div>

            <Button
              variant="glass"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={callWaiter}
              disabled={isCallingWaiter}
              title="Call waiter"
            >
              <BellRing className="h-5 w-5" />
              <span className="sr-only">Call waiter</span>
            </Button>
          </div>

          <div className="mt-auto max-w-2xl pb-9 pt-20">
            <Badge className="mb-4 border-blue-100 bg-blue-50 text-blue-700 shadow-sm">
              <Sparkles className="h-3 w-3" />
              Live table ordering
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              {restaurant.name}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {restaurant.address}
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
              <div className="rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-sm backdrop-blur-xl">
                <ChefHat className="mb-2 h-4 w-4 text-primary" />
                {items.length} dishes
              </div>
              <div className="rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-sm backdrop-blur-xl">
                <Star className="mb-2 h-4 w-4 text-amber-200" />
                {bestsellerCount} favorites
              </div>
              <div className="rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-sm backdrop-blur-xl">
                <Clock3 className="mb-2 h-4 w-4 text-sky-200" />
                Made fresh
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-y border-black/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search dishes, drinks, desserts..."
              className="h-12 rounded-2xl border-black/[0.08] bg-white pl-11 text-base shadow-inner"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value || "all")} className="w-full">
            <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 no-scrollbar">
              <TabsTrigger
                value="all"
                className="h-10 flex-none rounded-full border border-black/[0.06] bg-white px-4 text-sm font-semibold data-active:bg-primary data-active:text-primary-foreground"
              >
                All
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="h-10 flex-none rounded-full border border-black/[0.06] bg-white px-4 text-sm font-semibold data-active:bg-primary data-active:text-primary-foreground"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <AnimatePresence>
          {latestOrderStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("mb-5 rounded-2xl border p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]", statusTone(latestOrderStatus))}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Order #{latestOrderId?.slice(-6).toUpperCase()} is {latestOrderStatus.toLowerCase()}</p>
                  <p className="text-xs opacity-75">This status updates automatically from the kitchen.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary/80">{activeCategoryName}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose your next plate</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm sm:flex">
            <ShoppingBag className="h-4 w-4" />
            {filteredItems.length} items
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid gap-4">
            {filteredItems.map((item, index) => {
              const quantity = getItemQuantity(item.id);

              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(index * 0.025, 0.16), duration: 0.28 }}
                  className="group grid grid-cols-[1fr_118px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)] sm:grid-cols-[1fr_168px]"
                >
                  <div className="min-w-0 p-4 sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-[5px] border-2",
                        item.isVeg ? "border-emerald-400" : "border-red-400"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          item.isVeg ? "bg-emerald-400" : "bg-red-400"
                        )} />
                      </span>
                      {item.isBestseller && (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Bestseller
                        </Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          Limited
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="line-clamp-2 text-lg font-semibold tracking-tight sm:text-xl">{item.name}</h3>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.description || "Chef curated dish from the kitchen."}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold">{formatMoney(item.price)}</span>

                      {quantity > 0 ? (
                        <motion.div
                          layout
                          className="flex h-10 items-center rounded-full bg-primary px-1 text-primary-foreground shadow-[0_10px_22px_rgba(10,132,255,0.22)]"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-primary-foreground hover:bg-black/10"
                            onClick={() => updateQuantity(item.id, "", quantity - 1)}
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center text-sm font-bold">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-primary-foreground hover:bg-black/10"
                            onClick={() => addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              quantity: 1,
                              addOns: [],
                              totalPrice: item.price
                            })}
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      ) : (
                        <Button
                          variant="premium"
                          size="sm"
                          className="rounded-full px-5 font-bold"
                          onClick={() => addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            addOns: [],
                            totalPrice: item.price
                          })}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="relative min-h-full overflow-hidden bg-slate-100">
                    {isFoodPhoto(item.imageUrl) ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        loading="eager"
                        sizes="(max-width: 640px) 118px, 168px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full min-h-[156px] items-center justify-center bg-[linear-gradient(135deg,rgba(10,132,255,0.10),rgba(34,197,94,0.08))]">
                        <UtensilsCrossed className="h-8 w-8 text-primary/70" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12))]" />
                  </div>
                </motion.article>
              );
            })}
          </div>
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-primary shadow-sm">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold">No dishes found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try another search or category.</p>
            <Button variant="glass" className="mt-5 rounded-full" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
              Clear filters
            </Button>
          </div>
        )}
      </main>

      {hasHydrated && totalItems() > 0 && (
        <div className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md pb-[env(safe-area-inset-bottom)]">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
          >
            <CartDrawer restaurant={restaurant} tableId={tableId} onOrderPlaced={setLatestOrderId} />
          </motion.div>
        </div>
      )}
    </div>
  );
}
