import { getAdminDb } from "@/lib/firebase-admin";
import { demoCategories, demoMenuItems, demoRestaurant, demoTables, isDemoRestaurant } from "@/data/demo-restaurant";
import { Table } from "@/types/restaurant";

function serializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getRestaurantBySlug(slug: string) {
  try {
    const db = getAdminDb();
    const direct = await db.collection("restaurants").doc(slug).get();
    if (direct.exists) return serializable({ id: direct.id, ...direct.data() });

    const snapshot = await db.collection("restaurants")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      if (process.env.NODE_ENV !== "production" && isDemoRestaurant(slug)) return serializable(demoRestaurant);
      return null;
    }
    return serializable({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(slug)) return serializable(demoRestaurant);
    console.warn("Restaurant lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getCategories(restaurantId: string) {
  try {
    const db = getAdminDb();
    let snapshot = await db.collection("menuCategories")
      .where("restaurantSlug", "==", restaurantId)
      .where("isActive", "==", true)
      .orderBy("order", "asc")
      .get();

    if (snapshot.empty) {
      snapshot = await db.collection("menuCategories")
        .where("restaurantId", "==", restaurantId)
        .where("isActive", "==", true)
        .orderBy("order", "asc")
        .get();
    }

    if (snapshot.empty && process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoCategories);
    return serializable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoCategories);
    console.warn("Category lookup failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getMenuItems(restaurantId: string) {
  try {
    const db = getAdminDb();
    let snapshot = await db.collection("menuItems")
      .where("restaurantSlug", "==", restaurantId)
      .where("isAvailable", "==", true)
      .get();

    if (snapshot.empty) {
      snapshot = await db.collection("menuItems")
        .where("restaurantId", "==", restaurantId)
        .where("isAvailable", "==", true)
        .get();
    }

    if (snapshot.empty && process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
    return serializable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
    console.warn("Menu item lookup failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getTables(restaurantId: string) {
  try {
    const db = getAdminDb();
    let snapshot = await db.collection("tables")
      .where("restaurantSlug", "==", restaurantId)
      .where("isActive", "==", true)
      .get();

    if (snapshot.empty) {
      snapshot = await db.collection("tables")
        .where("restaurantId", "==", restaurantId)
        .where("isActive", "==", true)
        .get();
    }

    if (snapshot.empty && process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoTables);
    return serializable(snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Table))
      .sort((a, b) => Number(a.number) - Number(b.number)));
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoTables);
    console.warn("Table lookup failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getTableByNumber(restaurantId: string, tableNumber: string) {
  try {
    const db = getAdminDb();
    let snapshot = await db.collection("tables")
      .where("restaurantSlug", "==", restaurantId)
      .where("number", "==", tableNumber)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await db.collection("tables")
        .where("restaurantId", "==", restaurantId)
        .where("number", "==", tableNumber)
        .where("isActive", "==", true)
        .limit(1)
        .get();
    }

    if (snapshot.empty && process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) {
      return serializable(demoTables.find((table) => table.number === tableNumber) || null);
    }
    if (snapshot.empty) return null;
    return serializable({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Table);
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) {
      return serializable(demoTables.find((table) => table.number === tableNumber) || null);
    }
    console.warn("Table lookup by number failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
