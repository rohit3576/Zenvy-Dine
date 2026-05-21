import { getAdminDb } from "@/lib/firebase-admin";
import { demoCategories, demoMenuItems, demoRestaurant, demoTables, isDemoRestaurant } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";
import { Table } from "@/types/restaurant";

type FirestoreRestValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
};

type FirestoreRestDocument = {
  name: string;
  fields?: Record<string, FirestoreRestValue>;
};

type FirestoreRestQueryRow = {
  document?: FirestoreRestDocument;
};

function serializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isActiveTable(table: Partial<Table>) {
  return table.isActive !== false && table.active !== false;
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function getFirestoreRestConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error("Missing public Firebase REST configuration");
  }

  return {
    apiKey,
    baseUrl: `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)`,
  };
}

function firestoreRestUrl(path: string) {
  const { apiKey, baseUrl } = getFirestoreRestConfig();
  return `${baseUrl}/${path}?key=${encodeURIComponent(apiKey)}`;
}

function firestoreRestValueToJson(value: FirestoreRestValue): unknown {
  if ("stringValue" in value) return value.stringValue ?? "";
  if ("integerValue" in value) return Number(value.integerValue ?? 0);
  if ("doubleValue" in value) return Number(value.doubleValue ?? 0);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue ?? null;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(firestoreRestValueToJson);
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields ?? {})
        .map(([key, nestedValue]) => [key, firestoreRestValueToJson(nestedValue)]),
    );
  }

  return null;
}

function firestoreRestDocumentToJson(document: FirestoreRestDocument) {
  const id = decodeURIComponent(document.name.split("/").pop() ?? "");
  const data: Record<string, unknown> = { id };

  for (const [key, value] of Object.entries(document.fields ?? {})) {
    data[key] = firestoreRestValueToJson(value);
  }

  return data;
}

async function fetchFirestoreRest(path: string, init?: RequestInit) {
  const response = await fetch(firestoreRestUrl(path), {
    ...init,
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Firestore REST ${response.status}: ${message}`);
  }

  return response.json() as Promise<unknown>;
}

async function getPublicRestaurantBySlug(slug: string) {
  const direct = await fetchFirestoreRest(`documents/restaurants/${encodeURIComponent(slug)}`);
  if (direct) return serializable(firestoreRestDocumentToJson(direct as FirestoreRestDocument));

  const snapshot = await runPublicStringQuery("restaurants", "slug", slug);
  return serializable(snapshot[0] ?? null);
}

async function runPublicStringQuery(collectionName: string, fieldPath: string, value: string) {
  const rows = await fetchFirestoreRest("documents:runQuery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: "EQUAL",
            value: { stringValue: value },
          },
        },
      },
    }),
  }) as FirestoreRestQueryRow[] | null;

  return (rows ?? [])
    .map((row) => row.document)
    .filter((document): document is FirestoreRestDocument => Boolean(document))
    .map(firestoreRestDocumentToJson);
}

async function getPublicDocsByRestaurant(collectionName: string, restaurantId: string) {
  const bySlug = await runPublicStringQuery(collectionName, "restaurantSlug", restaurantId);
  if (bySlug.length > 0) return bySlug;

  return runPublicStringQuery(collectionName, "restaurantId", restaurantId);
}

async function getPublicCategories(restaurantId: string) {
  const categories = await getPublicDocsByRestaurant("menuCategories", restaurantId);
  return serializable(categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)));
}

async function getPublicMenuItems(restaurantId: string) {
  const items = await getPublicDocsByRestaurant("menuItems", restaurantId);
  return serializable(items.filter((item) => item.isAvailable !== false));
}

async function getPublicTables(restaurantId: string) {
  const tables = await getPublicDocsByRestaurant("tables", restaurantId);
  return serializable(tables
    .filter((table) => isActiveTable(table as Partial<Table>))
    .sort((a, b) => Number(a.number ?? a.tableNumber ?? 0) - Number(b.number ?? b.tableNumber ?? 0)));
}

async function getPublicTableByNumber(restaurantId: string, tableNumber: string) {
  const directIds = [tableNumber, `${restaurantId}-table-${tableNumber}`];

  for (const id of directIds) {
    const direct = await fetchFirestoreRest(`documents/tables/${encodeURIComponent(id)}`);
    if (!direct) continue;

    const data = firestoreRestDocumentToJson(direct as FirestoreRestDocument) as unknown as Table;
    const belongsToRestaurant = data.restaurantSlug === restaurantId || data.restaurantId === restaurantId;
    const matchesNumber = data.number === tableNumber || data.tableNumber === tableNumber;
    if (belongsToRestaurant && matchesNumber && isActiveTable(data)) {
      return serializable(data);
    }
  }

  const tables = await getPublicTables(restaurantId) as unknown as Table[];
  return serializable(tables.find((table) => table.number === tableNumber || table.tableNumber === tableNumber) ?? null);
}

export async function getRestaurantBySlug(slug: string) {
  if (isProductionRuntime()) {
    try {
      logFirestoreOperation("public.getDoc", { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
      const restaurant = await getPublicRestaurantBySlug(slug);
      if (restaurant) return restaurant;
      if (isDemoRestaurant(slug)) return serializable(demoRestaurant);
    } catch (publicError) {
      logFirestoreError("restaurants.public.lookup", publicError, { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
      console.warn("Public restaurant lookup failed:", formatFirestoreError(publicError));
    }
  }

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
      if (isDemoRestaurant(slug)) return serializable(demoRestaurant);
      return null;
    }
    return serializable({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(slug)) return serializable(demoRestaurant);
    logFirestoreError("restaurants.admin.lookup", error, { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
    console.warn("Restaurant lookup failed:", formatFirestoreError(error));
    if (isProductionRuntime()) {
      if (isDemoRestaurant(slug)) return serializable(demoRestaurant);
      return null;
    }
    try {
      logFirestoreOperation("public.getDoc", { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
      const restaurant = await getPublicRestaurantBySlug(slug);
      if (restaurant) return restaurant;
      if (isDemoRestaurant(slug)) return serializable(demoRestaurant);
      return null;
    } catch (publicError) {
      logFirestoreError("restaurants.public.lookup", publicError, { collection: "restaurants", queryPath: `restaurants/${slug}`, restaurantSlug: slug });
      console.warn("Public restaurant lookup failed:", formatFirestoreError(publicError));
      if (isDemoRestaurant(slug)) return serializable(demoRestaurant);
      return null;
    }
  }
}

export async function getCategories(restaurantId: string) {
  if (isProductionRuntime()) {
    try {
      logFirestoreOperation("public.query", { collection: "menuCategories", constraints: ["restaurantSlug/restaurantId == value"], restaurantSlug: restaurantId, queryPath: "menuCategories" });
      const categories = await getPublicCategories(restaurantId);
      if (categories.length > 0) return categories;
      if (isDemoRestaurant(restaurantId)) return serializable(demoCategories);
    } catch (publicError) {
      logFirestoreError("menuCategories.public.query", publicError, { collection: "menuCategories", restaurantSlug: restaurantId, queryPath: "menuCategories" });
      console.warn("Public category lookup failed:", formatFirestoreError(publicError));
    }
  }

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

    if (snapshot.empty && isDemoRestaurant(restaurantId)) return serializable(demoCategories);
    return serializable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoCategories);
    logFirestoreError("menuCategories.admin.query", error, { collection: "menuCategories", restaurantSlug: restaurantId, queryPath: "menuCategories" });
    console.warn("Category lookup failed:", formatFirestoreError(error));
    if (isProductionRuntime()) {
      if (isDemoRestaurant(restaurantId)) return serializable(demoCategories);
      return [];
    }
    try {
      logFirestoreOperation("public.query", { collection: "menuCategories", constraints: ["restaurantSlug/restaurantId == value"], restaurantSlug: restaurantId, queryPath: "menuCategories" });
      const categories = await getPublicCategories(restaurantId);
      if (categories.length > 0) return categories;
      if (isDemoRestaurant(restaurantId)) return serializable(demoCategories);
      return [];
    } catch (publicError) {
      logFirestoreError("menuCategories.public.query", publicError, { collection: "menuCategories", restaurantSlug: restaurantId, queryPath: "menuCategories" });
      console.warn("Public category lookup failed:", formatFirestoreError(publicError));
      if (isDemoRestaurant(restaurantId)) return serializable(demoCategories);
      return [];
    }
  }
}

export async function getMenuItems(restaurantId: string) {
  if (isProductionRuntime()) {
    try {
      logFirestoreOperation("public.query", { collection: "menuItems", constraints: ["restaurantSlug/restaurantId == value"], restaurantSlug: restaurantId, queryPath: "menuItems" });
      const items = await getPublicMenuItems(restaurantId);
      if (items.length > 0) return items;
      if (isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
    } catch (publicError) {
      logFirestoreError("menuItems.public.query", publicError, { collection: "menuItems", restaurantSlug: restaurantId, queryPath: "menuItems" });
      console.warn("Public menu item lookup failed:", formatFirestoreError(publicError));
    }
  }

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

    if (snapshot.empty && isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
    return serializable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
    logFirestoreError("menuItems.admin.query", error, { collection: "menuItems", restaurantSlug: restaurantId, queryPath: "menuItems" });
    console.warn("Menu item lookup failed:", formatFirestoreError(error));
    if (isProductionRuntime()) {
      if (isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
      return [];
    }
    try {
      logFirestoreOperation("public.query", { collection: "menuItems", constraints: ["restaurantSlug/restaurantId == value"], restaurantSlug: restaurantId, queryPath: "menuItems" });
      const items = await getPublicMenuItems(restaurantId);
      if (items.length > 0) return items;
      if (isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
      return [];
    } catch (publicError) {
      logFirestoreError("menuItems.public.query", publicError, { collection: "menuItems", restaurantSlug: restaurantId, queryPath: "menuItems" });
      console.warn("Public menu item lookup failed:", formatFirestoreError(publicError));
      if (isDemoRestaurant(restaurantId)) return serializable(demoMenuItems);
      return [];
    }
  }
}

export async function getTables(restaurantId: string) {
  if (isProductionRuntime()) {
    try {
      logFirestoreOperation("public.query", { collection: "tables", constraints: ["restaurantSlug/restaurantId == value"], restaurantSlug: restaurantId, queryPath: "tables" });
      const tables = await getPublicTables(restaurantId);
      if (tables.length > 0) return tables;
      if (isDemoRestaurant(restaurantId)) return serializable(demoTables);
    } catch (publicError) {
      logFirestoreError("tables.public.query", publicError, { collection: "tables", restaurantSlug: restaurantId, queryPath: "tables" });
      console.warn("Public table lookup failed:", formatFirestoreError(publicError));
    }
  }

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

    if (snapshot.empty && isDemoRestaurant(restaurantId)) return serializable(demoTables);
    return serializable(snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Table))
      .sort((a, b) => Number(a.number) - Number(b.number)));
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) return serializable(demoTables);
    logFirestoreError("tables.admin.query", error, { collection: "tables", restaurantSlug: restaurantId, queryPath: "tables" });
    console.warn("Table lookup failed:", formatFirestoreError(error));
    if (isProductionRuntime()) {
      if (isDemoRestaurant(restaurantId)) return serializable(demoTables);
      return [];
    }
    try {
      logFirestoreOperation("public.query", { collection: "tables", constraints: ["restaurantSlug/restaurantId == value"], restaurantSlug: restaurantId, queryPath: "tables" });
      const tables = await getPublicTables(restaurantId);
      if (tables.length > 0) return tables;
      if (isDemoRestaurant(restaurantId)) return serializable(demoTables);
      return [];
    } catch (publicError) {
      logFirestoreError("tables.public.query", publicError, { collection: "tables", restaurantSlug: restaurantId, queryPath: "tables" });
      console.warn("Public table lookup failed:", formatFirestoreError(publicError));
      if (isDemoRestaurant(restaurantId)) return serializable(demoTables);
      return [];
    }
  }
}

export async function getTableByNumber(restaurantId: string, tableNumber: string) {
  if (isProductionRuntime()) {
    try {
      logFirestoreOperation("public.query", { collection: "tables", constraints: ["restaurantSlug/restaurantId == value", "number/tableNumber == value"], restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
      const table = await getPublicTableByNumber(restaurantId, tableNumber);
      if (table) return table;
      if (isDemoRestaurant(restaurantId)) {
        return serializable(demoTables.find((table) => table.number === tableNumber) || null);
      }
    } catch (publicError) {
      logFirestoreError("tables.public.getByNumber", publicError, { collection: "tables", restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
      console.warn("Public table lookup by number failed:", formatFirestoreError(publicError));
    }
  }

  try {
    const db = getAdminDb();
    logFirestoreOperation("admin.query", { collection: "tables", constraints: ["restaurantSlug/restaurantId == value", "number/tableNumber == value", "isActive == true"], restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });

    const directIds = [tableNumber, `${restaurantId}-table-${tableNumber}`];
    for (const id of directIds) {
      const direct = await db.collection("tables").doc(id).get();
      if (!direct.exists) continue;

      const data = { id: direct.id, ...direct.data() } as Table;
      const belongsToRestaurant = data.restaurantSlug === restaurantId || data.restaurantId === restaurantId;
      const matchesNumber = data.number === tableNumber || data.tableNumber === tableNumber;
      if (belongsToRestaurant && matchesNumber && isActiveTable(data)) {
        return serializable(data);
      }
    }

    const queryShapes = [
      { restaurantField: "restaurantSlug", tableField: "number", requireIsActive: true },
      { restaurantField: "restaurantId", tableField: "number", requireIsActive: true },
      { restaurantField: "restaurantSlug", tableField: "tableNumber", requireIsActive: true },
      { restaurantField: "restaurantId", tableField: "tableNumber", requireIsActive: true },
      { restaurantField: "restaurantSlug", tableField: "number", requireIsActive: false },
      { restaurantField: "restaurantId", tableField: "number", requireIsActive: false },
      { restaurantField: "restaurantSlug", tableField: "tableNumber", requireIsActive: false },
      { restaurantField: "restaurantId", tableField: "tableNumber", requireIsActive: false },
    ];

    for (const shape of queryShapes) {
      let tableQuery = db.collection("tables")
        .where(shape.restaurantField, "==", restaurantId)
        .where(shape.tableField, "==", tableNumber);

      if (shape.requireIsActive) {
        tableQuery = tableQuery.where("isActive", "==", true);
      }

      const snapshot = await tableQuery
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const table = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Table;
        if (isActiveTable(table)) return serializable(table);
      }
    }

    if (isDemoRestaurant(restaurantId)) {
      return serializable(demoTables.find((table) => table.number === tableNumber) || null);
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(restaurantId)) {
      return serializable(demoTables.find((table) => table.number === tableNumber) || null);
    }
    logFirestoreError("tables.admin.getByNumber", error, { collection: "tables", restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
    console.warn("Table lookup by number failed:", formatFirestoreError(error));
    if (isProductionRuntime()) {
      if (isDemoRestaurant(restaurantId)) {
        return serializable(demoTables.find((table) => table.number === tableNumber) || null);
      }
      return null;
    }
    try {
      logFirestoreOperation("public.query", { collection: "tables", constraints: ["restaurantSlug/restaurantId == value", "number/tableNumber == value"], restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
      const table = await getPublicTableByNumber(restaurantId, tableNumber);
      if (table) return table;
      if (isDemoRestaurant(restaurantId)) {
        return serializable(demoTables.find((table) => table.number === tableNumber) || null);
      }
      return null;
    } catch (publicError) {
      logFirestoreError("tables.public.getByNumber", publicError, { collection: "tables", restaurantSlug: restaurantId, tableId: tableNumber, queryPath: "tables" });
      console.warn("Public table lookup by number failed:", formatFirestoreError(publicError));
      if (isDemoRestaurant(restaurantId)) {
        return serializable(demoTables.find((table) => table.number === tableNumber) || null);
      }
      return null;
    }
  }
}
