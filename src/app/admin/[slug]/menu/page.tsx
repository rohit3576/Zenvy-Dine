"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, Loader2, Plus, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Category, MenuItem } from "@/types/menu";
import { AdminAlert, AdminEmptyState } from "../_components/AdminState";
import { demoCategories, demoMenuItems, isDemoRestaurant, shouldUseLocalDemoFallback } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";

const defaultCategory = "none";

export default function MenuManagementPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: defaultCategory,
    imageUrl: "",
    isVeg: "true",
    isBestseller: "false",
  });

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("subscribe", {
      collection: "menuCategories",
      constraints: ["restaurantSlug == value", "orderBy order asc"],
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
      queryPath: "menuCategories",
    });

    const categoryQuery = query(
      collection(db, "menuCategories"),
      where("restaurantSlug", "==", user.restaurantId),
      orderBy("order", "asc")
    );

    return onSnapshot(categoryQuery, (snapshot) => {
      setCategories(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as Category[]);
      setCategoryError(null);
    }, (error) => {
      if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setCategories(demoCategories);
        setCategoryError(null);
        return;
      }
      logFirestoreError("menuCategories.subscribe", error, {
        collection: "menuCategories",
        restaurantSlug: user.restaurantId,
        queryPath: "menuCategories",
      });
      setCategoryError(`Menu category realtime updates are unavailable. ${formatFirestoreError(error)}`);
      toast.error(`Menu categories unavailable: ${formatFirestoreError(error)}`);
    });
  }, [user?.restaurantId, user?.role, user?.uid]);

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("subscribe", {
      collection: "menuItems",
      constraints: ["restaurantSlug == value"],
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
      queryPath: "menuItems",
    });

    const itemQuery = query(
      collection(db, "menuItems"),
      where("restaurantSlug", "==", user.restaurantId)
    );

    return onSnapshot(itemQuery, (snapshot) => {
      setItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as MenuItem[]);
      setItemError(null);
    }, (error) => {
      if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setItems(demoMenuItems);
        setItemError(null);
        return;
      }
      logFirestoreError("menuItems.subscribe", error, {
        collection: "menuItems",
        restaurantSlug: user.restaurantId,
        queryPath: "menuItems",
      });
      setItemError(`Menu item realtime updates are unavailable. ${formatFirestoreError(error)}`);
      toast.error(`Menu items unavailable: ${formatFirestoreError(error)}`);
    });
  }, [user?.restaurantId, user?.role, user?.uid]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const isLocalDemo = shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && !!user?.restaurantId && isDemoRestaurant(user.restaurantId);

  const createCategory = async () => {
    const restaurantId = user?.restaurantId;
    if (!restaurantId || !categoryName.trim()) return;
    setSavingCategory(true);
    try {
      if (isLocalDemo) {
        setCategories((current) => [
          ...current,
          {
            id: `local-category-${Date.now()}`,
            restaurantId,
            restaurantSlug: restaurantId,
            name: categoryName.trim(),
            order: current.length + 1,
            isActive: true,
            createdAt: demoCategories[0].createdAt,
            updatedAt: demoCategories[0].updatedAt,
          },
        ]);
        setCategoryName("");
        toast.success("Category added locally.");
        return;
      }
      logFirestoreOperation("addDoc", {
        collection: "menuCategories",
        restaurantSlug: restaurantId,
        queryPath: "menuCategories",
      });
      await addDoc(collection(db, "menuCategories"), {
        restaurantId,
        restaurantSlug: restaurantId,
        name: categoryName.trim(),
        order: categories.length + 1,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCategoryName("");
      toast.success("Category added.");
    } catch (error) {
      logFirestoreError("menuCategories.addDoc", error, {
        collection: "menuCategories",
        restaurantSlug: restaurantId,
        queryPath: "menuCategories",
      });
      toast.error(`Could not add category: ${formatFirestoreError(error)}`);
    } finally {
      setSavingCategory(false);
    }
  };

  const toggleCategory = async (category: Category) => {
    try {
      if (isLocalDemo) {
        setCategories((current) => current.map((entry) => entry.id === category.id ? { ...entry, isActive: !entry.isActive } : entry));
        return;
      }
      logFirestoreOperation("updateDoc", {
        collection: "menuCategories",
        queryPath: `menuCategories/${category.id}`,
        restaurantSlug: user?.restaurantId,
      });
      await updateDoc(doc(db, "menuCategories", category.id), {
        isActive: !category.isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logFirestoreError("menuCategories.updateDoc", error, {
        collection: "menuCategories",
        queryPath: `menuCategories/${category.id}`,
        restaurantSlug: user?.restaurantId,
      });
      toast.error(`Could not update category: ${formatFirestoreError(error)}`);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("Delete this category? Menu items will remain but may need reassignment.")) return;
    try {
      if (isLocalDemo) {
        setCategories((current) => current.filter((category) => category.id !== categoryId));
        toast.success("Category deleted locally.");
        return;
      }
      logFirestoreOperation("deleteDoc", {
        collection: "menuCategories",
        queryPath: `menuCategories/${categoryId}`,
        restaurantSlug: user?.restaurantId,
      });
      await deleteDoc(doc(db, "menuCategories", categoryId));
      toast.success("Category deleted.");
    } catch (error) {
      logFirestoreError("menuCategories.deleteDoc", error, {
        collection: "menuCategories",
        queryPath: `menuCategories/${categoryId}`,
        restaurantSlug: user?.restaurantId,
      });
      toast.error(`Could not delete category: ${formatFirestoreError(error)}`);
    }
  };

  const uploadImage = async (file: File) => {
    const restaurantId = user?.restaurantId;
    if (!restaurantId) return;
    setUploading(true);
    try {
      if (isLocalDemo) {
        setItemForm((current) => ({ ...current, imageUrl: URL.createObjectURL(file) }));
        toast.success("Image preview added locally.");
        return;
      }
      const imageRef = ref(storage, `restaurants/${restaurantId}/menu/${Date.now()}-${file.name}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      setItemForm((current) => ({ ...current, imageUrl }));
      toast.success("Image uploaded.");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Image upload failed. You can paste an image URL instead.");
    } finally {
      setUploading(false);
    }
  };

  const createItem = async () => {
    const restaurantId = user?.restaurantId;
    if (!restaurantId || !itemForm.name.trim() || itemForm.categoryId === defaultCategory) return;
    setSavingItem(true);
    try {
      if (isLocalDemo) {
        setItems((current) => [
          ...current,
          {
            id: `local-item-${Date.now()}`,
            restaurantId,
            restaurantSlug: restaurantId,
            categoryId: itemForm.categoryId,
            name: itemForm.name.trim(),
            description: itemForm.description.trim(),
            price: Number(itemForm.price || 0),
            imageUrl: itemForm.imageUrl.trim(),
            isVeg: itemForm.isVeg === "true",
            isBestseller: itemForm.isBestseller === "true",
            isAvailable: true,
            addOns: [],
            createdAt: demoCategories[0].createdAt,
            updatedAt: demoCategories[0].updatedAt,
          },
        ]);
        setItemForm({
          name: "",
          description: "",
          price: "",
          categoryId: defaultCategory,
          imageUrl: "",
          isVeg: "true",
          isBestseller: "false",
        });
        toast.success("Menu item added locally.");
        return;
      }
      logFirestoreOperation("addDoc", {
        collection: "menuItems",
        restaurantSlug: restaurantId,
        queryPath: "menuItems",
      });
      await addDoc(collection(db, "menuItems"), {
        restaurantId,
        restaurantSlug: restaurantId,
        categoryId: itemForm.categoryId,
        name: itemForm.name.trim(),
        description: itemForm.description.trim(),
        price: Number(itemForm.price || 0),
        imageUrl: itemForm.imageUrl.trim(),
        isVeg: itemForm.isVeg === "true",
        isBestseller: itemForm.isBestseller === "true",
        isAvailable: true,
        addOns: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setItemForm({
        name: "",
        description: "",
        price: "",
        categoryId: defaultCategory,
        imageUrl: "",
        isVeg: "true",
        isBestseller: "false",
      });
      toast.success("Menu item added.");
    } catch (error) {
      logFirestoreError("menuItems.addDoc", error, {
        collection: "menuItems",
        restaurantSlug: restaurantId,
        queryPath: "menuItems",
      });
      toast.error(`Could not add menu item: ${formatFirestoreError(error)}`);
    } finally {
      setSavingItem(false);
    }
  };

  const toggleItem = async (item: MenuItem, field: "isAvailable" | "isBestseller") => {
    try {
      if (isLocalDemo) {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, [field]: !entry[field] } : entry));
        return;
      }
      logFirestoreOperation("updateDoc", {
        collection: "menuItems",
        queryPath: `menuItems/${item.id}`,
        restaurantSlug: user?.restaurantId,
        field,
      });
      await updateDoc(doc(db, "menuItems", item.id), {
        [field]: !item[field],
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logFirestoreError("menuItems.updateDoc", error, {
        collection: "menuItems",
        queryPath: `menuItems/${item.id}`,
        restaurantSlug: user?.restaurantId,
        field,
      });
      toast.error(`Could not update menu item: ${formatFirestoreError(error)}`);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      if (isLocalDemo) {
        setItems((current) => current.filter((item) => item.id !== itemId));
        toast.success("Menu item deleted locally.");
        return;
      }
      logFirestoreOperation("deleteDoc", {
        collection: "menuItems",
        queryPath: `menuItems/${itemId}`,
        restaurantSlug: user?.restaurantId,
      });
      await deleteDoc(doc(db, "menuItems", itemId));
      toast.success("Menu item deleted.");
    } catch (error) {
      logFirestoreError("menuItems.deleteDoc", error, {
        collection: "menuItems",
        queryPath: `menuItems/${itemId}`,
        restaurantSlug: user?.restaurantId,
      });
      toast.error(`Could not delete menu item: ${formatFirestoreError(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
        <p className="text-muted-foreground">Manage categories, menu items, pricing, images, and availability.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
              <Button size="icon" onClick={createCategory} disabled={savingCategory || !categoryName.trim()}>
                {savingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            {categoryError && <AdminAlert>{categoryError}</AdminAlert>}
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">Order {category.order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={category.isActive ? "secondary" : "outline"} onClick={() => toggleCategory(category)}>
                      {category.isActive ? "Active" : "Hidden"}
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => deleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {!categoryError && categories.length === 0 && (
                <AdminEmptyState>No categories yet. Add one to start building the menu.</AdminEmptyState>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Menu Item</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Item name" value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} />
              <Input placeholder="Price" inputMode="decimal" value={itemForm.price} onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })} />
              <Select value={itemForm.categoryId} onValueChange={(value) => setItemForm({ ...itemForm, categoryId: value ?? defaultCategory })}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={defaultCategory}>Select category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Image URL" value={itemForm.imageUrl} onChange={(event) => setItemForm({ ...itemForm, imageUrl: event.target.value })} />
              <Input className="md:col-span-2" placeholder="Description" value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} />
              <Select value={itemForm.isVeg} onValueChange={(value) => setItemForm({ ...itemForm, isVeg: value ?? "true" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Vegetarian</SelectItem>
                  <SelectItem value="false">Non-vegetarian</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemForm.isBestseller} onValueChange={(value) => setItemForm({ ...itemForm, isBestseller: value ?? "false" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Regular item</SelectItem>
                  <SelectItem value="true">Bestseller</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 md:col-span-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
                </label>
                <Button onClick={createItem} disabled={savingItem || itemForm.categoryId === defaultCategory || !itemForm.name.trim()}>
                  {savingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add item
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5" /> Menu Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {itemError && <AdminAlert>{itemError}</AdminAlert>}
              {sortedItems.map((item) => (
                <div key={item.id} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[96px_1fr_auto]">
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-muted">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" /> : null}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{item.name}</h3>
                      <Badge variant="outline">{categoryNameById.get(item.categoryId) || "Uncategorized"}</Badge>
                      <Badge variant={item.isVeg ? "secondary" : "outline"}>{item.isVeg ? "Veg" : "Non-veg"}</Badge>
                      {item.isBestseller && <Badge>Bestseller</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description || "No description added."}</p>
                    <p className="font-mono text-sm font-bold">Rs. {item.price}</p>
                  </div>
                  <div className="flex flex-row gap-2 md:flex-col">
                    <Button size="sm" variant={item.isAvailable ? "secondary" : "outline"} onClick={() => toggleItem(item, "isAvailable")}>
                      {item.isAvailable ? "Available" : "Hidden"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleItem(item, "isBestseller")}>
                      {item.isBestseller ? "Unmark" : "Bestseller"}
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {!itemError && sortedItems.length === 0 && (
                <AdminEmptyState>No menu items yet. Add the first item above.</AdminEmptyState>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
