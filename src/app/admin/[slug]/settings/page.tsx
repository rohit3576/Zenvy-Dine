"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { demoRestaurant, isDemoRestaurant, shouldUseLocalDemoFallback } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";

export default function RestaurantSettingsPage() {
  const { user } = useAuth();
  const [themeColor, setThemeColor] = useState("#16a34a");
  const [accentColor, setAccentColor] = useState("#f97316");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("5");
  const [serviceChargePercentage, setServiceChargePercentage] = useState("0");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isLocalDemo = shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && !!user?.restaurantId && isDemoRestaurant(user.restaurantId);

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("getDoc", {
      collection: "restaurants",
      queryPath: `restaurants/${user.restaurantId}`,
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
    });

    getDoc(doc(db, "restaurants", user.restaurantId))
      .then((snapshot) => {
        const restaurant = snapshot.data();
        if (!restaurant) {
          setLoadError("Restaurant settings were not found. Run npm run seed or check the current user restaurantId.");
          return;
        }

        setLoadError(null);
        setThemeColor(restaurant.settings?.themeColor || "#16a34a");
        setAccentColor(restaurant.settings?.accentColor || "#f97316");
        setNotificationPhone(restaurant.settings?.notificationPhone || restaurant.phone || "");
        setTaxPercentage(String(restaurant.settings?.taxPercentage ?? 5));
        setServiceChargePercentage(String(restaurant.settings?.serviceChargePercentage ?? 0));
      })
      .catch((error) => {
        if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
          setLoadError(null);
          setThemeColor(demoRestaurant.settings.themeColor || "#16a34a");
          setAccentColor(demoRestaurant.settings.accentColor || "#f97316");
          setNotificationPhone(demoRestaurant.settings.notificationPhone || demoRestaurant.phone);
          setTaxPercentage(String(demoRestaurant.settings.taxPercentage));
          setServiceChargePercentage(String(demoRestaurant.settings.serviceChargePercentage));
          return;
        }
        logFirestoreError("restaurants.settings.getDoc", error, {
          collection: "restaurants",
          queryPath: `restaurants/${user.restaurantId}`,
          restaurantSlug: user.restaurantId,
        });
        setLoadError(`Could not load restaurant settings: ${formatFirestoreError(error)}`);
      });
  }, [user?.restaurantId, user?.role, user?.uid]);

  const saveSettings = async () => {
    if (!user?.restaurantId) return;

    setSaving(true);
    try {
      if (isLocalDemo) {
        toast.success("Restaurant settings saved locally.");
        return;
      }
      logFirestoreOperation("updateDoc", {
        collection: "restaurants",
        queryPath: `restaurants/${user.restaurantId}`,
        restaurantSlug: user.restaurantId,
      });
      await updateDoc(doc(db, "restaurants", user.restaurantId), {
        "settings.themeColor": themeColor,
        "settings.accentColor": accentColor,
        "settings.notificationPhone": notificationPhone,
        "settings.taxPercentage": Number(taxPercentage),
        "settings.serviceChargePercentage": Number(serviceChargePercentage),
        updatedAt: new Date(),
      });
      toast.success("Restaurant settings saved.");
    } catch (error) {
      logFirestoreError("restaurants.settings.updateDoc", error, {
        collection: "restaurants",
        queryPath: `restaurants/${user.restaurantId}`,
        restaurantSlug: user.restaurantId,
      });
      toast.error(`Could not save settings: ${formatFirestoreError(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Restaurant Settings</h2>
        <p className="text-muted-foreground">Customize customer ordering, billing, and notifications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme and Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {loadError && (
            <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">Primary color</p>
            <div className="flex gap-2">
              <Input type="color" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} className="w-14 p-1" />
              <Input value={themeColor} onChange={(event) => setThemeColor(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Accent color</p>
            <div className="flex gap-2">
              <Input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="w-14 p-1" />
              <Input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">GST percentage</p>
            <Input inputMode="decimal" value={taxPercentage} onChange={(event) => setTaxPercentage(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Service charge percentage</p>
            <Input inputMode="decimal" value={serviceChargePercentage} onChange={(event) => setServiceChargePercentage(event.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">WhatsApp notification phone</p>
            <Input value={notificationPhone} onChange={(event) => setNotificationPhone(event.target.value)} placeholder="+91 9876543210" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
