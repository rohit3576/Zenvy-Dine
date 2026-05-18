import { getAdminDb } from "@/lib/firebase-admin";
import { demoCategories, demoMenuItems, demoRestaurant, demoTables, isDemoRestaurant } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";
import { Table } from "@/types/restaurant";

function serializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getRestaurantBySlug(slug: string) {
  try {
    const db = getAdminDb();
    logFirestoreOperation("admin.getDoc", { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
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
    logFirestoreError("restaurants.admin.lookup", error, { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
    console.warn("Restaurant lookup failed:", formatFirestoreError(error));
    return null;
  }
}

export async function getCategories(restaurantId: string) {
  try {
    const db = getAdminDb();
    logFirestoreOperation("admin.query", { collection: "menuCategories", constraints: ["restaurantSlug == value", "isActive == true", "orderBy order asc"], restaurantSlug: restaurantId, queryPath: "menuCategories" });
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
    logFirestoreError("menuCategories.admin.query", error, { collection: "menuCategories", restaurantSlug: restaurantId, queryPath: "menuCategories" });
    console.warn("Category lookup failed:", formatFirestoreError(error));
    return [];
  }
}

export async function getMenuItems(restaurantId: string) {
  try {
    const db = getAdminDb();
    logFirestoreOperation("admin.query", { collection: "menuItems", constraints: ["restaurantSlug == value", "isAvailable == true"], restaurantSlug: restaurantId, queryPath: "menuItems" });
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
    logFirestoreError("menuItems.admin.query", error, { collection: "menuItems", restaurantSlug: restaurantId, queryPath: "menuItems" });
    console.warn("Menu item lookup failed:", formatFirestoreError(error));
    return [];
  }
}

export async function getTables(restaurantId: string) {
  try {
    const db = getAdminDb();
    logFirestoreOperation("admin.query", { collection: "tables", constraints: ["restaurantSlug == value", "isActive == true"], restaurantSlug: restaurantId, queryPath: "tables" });
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
    logFirestoreError("tables.admin.query", error, { collection: "tables", restaurantSlug: restaurantId, queryPath: "tables" });
    console.warn("Table lookup failed:", formatFirestoreError(error));
    return [];
  }
}

export async function getTableByNumber(restaurantId: string, tableNumber: string) {
  try {
    const db = getAdminDb();
    logFirestoreOperation("admin.query", { collection: "tables", constraints: ["restaurantSlug == value", "number == value", "isActive == true"], restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
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
    logFirestoreError("tables.admin.getByNumber", error, { collection: "tables", restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
    console.warn("Table lookup by number failed:", formatFirestoreError(error));
    return null;
  }
}
