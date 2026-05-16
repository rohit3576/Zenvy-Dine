import { getAdminDb } from "@/lib/firebase-admin";

export async function getRestaurantBySlug(slug: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("restaurants")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function getCategories(restaurantId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("menuCategories")
    .where("restaurantId", "==", restaurantId)
    .where("isActive", "==", true)
    .orderBy("order", "asc")
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMenuItems(restaurantId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("menuItems")
    .where("restaurantId", "==", restaurantId)
    .where("isAvailable", "==", true)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
