import admin from "firebase-admin";
import * as dotenv from "dotenv";
import { initializeApp as initializeClientApp, getApps as getClientApps } from "firebase/app";
import {
  collection as clientCollection,
  deleteDoc as clientDeleteDoc,
  doc as clientDoc,
  getDocs as getClientDocs,
  getFirestore as getClientFirestore,
  query as clientQuery,
  serverTimestamp as clientServerTimestamp,
  setDoc as clientSetDoc,
  where as clientWhere,
  type Firestore as ClientFirestore,
} from "firebase/firestore";

dotenv.config({ path: ".env.local" });

const DEMO_RESTAURANT_ID = "spice-garden";
const DEMO_RESTAURANT_SLUG = "spice-garden";
const RESET = process.argv.includes("--reset");
const RESET_ONLY = process.argv.includes("--reset-only");
const HELP = process.argv.includes("--help") || process.argv.includes("-h");
const FORCE_CLIENT = process.argv.includes("--client") || process.env.SEED_MODE === "client";

type SeedMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isBestseller: boolean;
};

type SeedMode = "admin" | "client";

let mode: SeedMode = FORCE_CLIENT ? "client" : "admin";
let adminDb: admin.firestore.Firestore | null = null;
let clientDb: ClientFirestore | null = null;

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = requireEnv("FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    return;
  }

  admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault(),
  });
}

function initializeFirebaseClient() {
  if (!getClientApps().length) {
    initializeClientApp({
      apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
      authDomain: requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: requireEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: requireEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
    });
  }

  clientDb = getClientFirestore();
}

function initializeDb(selectedMode: SeedMode) {
  mode = selectedMode;
  if (mode === "admin") {
    initializeFirebaseAdmin();
    adminDb = admin.firestore();
    return;
  }

  initializeFirebaseClient();
}

function now() {
  return mode === "admin"
    ? admin.firestore.FieldValue.serverTimestamp()
    : clientServerTimestamp();
}

async function setDocument(collectionName: string, documentId: string, data: Record<string, unknown>) {
  if (mode === "admin") {
    await adminDb!.collection(collectionName).doc(documentId).set(data, { merge: true });
    return;
  }

  await clientSetDoc(clientDoc(clientDb!, collectionName, documentId), data, { merge: true });
}

async function deleteDocument(collectionName: string, documentId: string) {
  if (mode === "admin") {
    await adminDb!.collection(collectionName).doc(documentId).delete();
    return;
  }

  await clientDeleteDoc(clientDoc(clientDb!, collectionName, documentId));
}

if (HELP) {
  console.log("Usage:");
  console.log("  npm run seed       Seed or update the Spice Garden demo data");
  console.log("  npm run reset-db   Delete Spice Garden demo data and seed it again");
  console.log("  ts-node scripts/seed.ts --reset-only");
  console.log("  npm run seed -- --client   Use Firebase client SDK; requires development rules deployed");
  process.exit(0);
}

const categories = [
  { id: "starters", name: "Starters", order: 1 },
  { id: "mains", name: "Main Course", order: 2 },
  { id: "drinks", name: "Drinks & Desserts", order: 3 },
];

const menuItems: SeedMenuItem[] = [
  {
    id: "crispy-corn-chaat",
    categoryId: "starters",
    name: "Crispy Corn Chaat",
    description: "Golden fried corn tossed with lime, chilli, coriander, and house chaat masala.",
    price: 220,
    imageUrl: "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: true,
  },
  {
    id: "paneer-tikka",
    categoryId: "starters",
    name: "Paneer Tikka",
    description: "Charred paneer cubes in a smoky yoghurt marinade with mint chutney.",
    price: 340,
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: true,
  },
  {
    id: "chilli-chicken",
    categoryId: "starters",
    name: "Chilli Chicken",
    description: "Crisp chicken bites tossed with peppers, onion, garlic, and soy chilli glaze.",
    price: 360,
    imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=800&fit=crop",
    isVeg: false,
    isBestseller: true,
  },
  {
    id: "honey-chilli-potato",
    categoryId: "starters",
    name: "Honey Chilli Potato",
    description: "Crispy potato fingers tossed in honey, sesame, and chilli sauce.",
    price: 240,
    imageUrl: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: false,
  },
  {
    id: "tandoori-prawns",
    categoryId: "starters",
    name: "Tandoori Prawns",
    description: "Tiger prawns roasted in tandoori spices with lemon butter.",
    price: 520,
    imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=800&fit=crop",
    isVeg: false,
    isBestseller: false,
  },
  {
    id: "butter-chicken",
    categoryId: "mains",
    name: "Butter Chicken",
    description: "Delhi-style chicken simmered in tomato, butter, cream, and kasuri methi.",
    price: 480,
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=800&fit=crop",
    isVeg: false,
    isBestseller: true,
  },
  {
    id: "paneer-butter-masala",
    categoryId: "mains",
    name: "Paneer Butter Masala",
    description: "Soft paneer in a rich makhani gravy finished with fresh cream.",
    price: 390,
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: true,
  },
  {
    id: "dal-bukhara",
    categoryId: "mains",
    name: "Dal Bukhara",
    description: "Slow-cooked black lentils with butter, tomato, and aromatic spices.",
    price: 330,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: false,
  },
  {
    id: "mutton-rogan-josh",
    categoryId: "mains",
    name: "Mutton Rogan Josh",
    description: "Tender mutton cooked in Kashmiri chilli, fennel, and browned onion gravy.",
    price: 560,
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=800&fit=crop",
    isVeg: false,
    isBestseller: true,
  },
  {
    id: "veg-biryani",
    categoryId: "mains",
    name: "Vegetable Dum Biryani",
    description: "Layered basmati rice, vegetables, saffron, mint, and fried onions.",
    price: 320,
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: false,
  },
  {
    id: "chicken-biryani",
    categoryId: "mains",
    name: "Chicken Dum Biryani",
    description: "Fragrant basmati rice layered with marinated chicken and biryani masala.",
    price: 420,
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=800&fit=crop",
    isVeg: false,
    isBestseller: true,
  },
  {
    id: "garlic-naan",
    categoryId: "mains",
    name: "Garlic Butter Naan",
    description: "Tandoor-baked naan brushed with garlic butter and coriander.",
    price: 90,
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: true,
  },
  {
    id: "aam-panna",
    categoryId: "drinks",
    name: "Aam Panna Cooler",
    description: "Raw mango cooler with mint, roasted cumin, and sparkling water.",
    price: 160,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: false,
  },
  {
    id: "cold-coffee",
    categoryId: "drinks",
    name: "Cold Coffee Frappe",
    description: "Chilled coffee blended with milk, vanilla ice cream, and chocolate.",
    price: 210,
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: true,
  },
  {
    id: "masala-chai",
    categoryId: "drinks",
    name: "Masala Chai",
    description: "Classic Indian tea brewed with ginger, cardamom, and whole spices.",
    price: 90,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: false,
  },
  {
    id: "gulab-jamun-cheesecake",
    categoryId: "drinks",
    name: "Gulab Jamun Cheesecake",
    description: "Creamy cheesecake layered with gulab jamun, saffron, and pistachio.",
    price: 240,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop",
    isVeg: true,
    isBestseller: true,
  },
];

async function deleteQuery(collectionName: string, field: string, value: string) {
  if (mode === "admin") {
    const snapshot = await adminDb!.collection(collectionName).where(field, "==", value).get();
    if (snapshot.empty) return 0;

    let deleted = 0;
    for (let i = 0; i < snapshot.docs.length; i += 450) {
      const batch = adminDb!.batch();
      for (const document of snapshot.docs.slice(i, i + 450)) {
        batch.delete(document.ref);
        deleted += 1;
      }
      await batch.commit();
    }
    return deleted;
  }

  const snapshot = await getClientDocs(
    clientQuery(clientCollection(clientDb!, collectionName), clientWhere(field, "==", value))
  );
  let deleted = 0;
  for (const document of snapshot.docs) {
    await clientDeleteDoc(document.ref);
    deleted += 1;
  }
  return deleted;
}

async function resetDemoData() {
  console.log("Resetting Spice Garden demo data...");
  const targets: Array<[string, string, string]> = [
    ["orders", "restaurantId", DEMO_RESTAURANT_ID],
    ["waiterCalls", "restaurantId", DEMO_RESTAURANT_ID],
    ["payments", "restaurantId", DEMO_RESTAURANT_ID],
    ["restaurantStaff", "restaurantId", DEMO_RESTAURANT_ID],
    ["tables", "restaurantId", DEMO_RESTAURANT_ID],
    ["menuItems", "restaurantId", DEMO_RESTAURANT_ID],
    ["menuCategories", "restaurantId", DEMO_RESTAURANT_ID],
    ["users", "restaurantId", DEMO_RESTAURANT_ID],
  ];

  for (const [collectionName, field, value] of targets) {
    const count = await deleteQuery(collectionName, field, value);
    console.log(`Deleted ${count} ${collectionName} documents`);
  }

  await deleteDocument("restaurants", DEMO_RESTAURANT_ID).catch(() => undefined);
  console.log("Deleted restaurant document if it existed");
}

async function seedDemoData() {
  console.log("Seeding Spice Garden demo restaurant...");

  await setDocument("restaurants", DEMO_RESTAURANT_ID, {
    name: "Spice Garden",
    slug: DEMO_RESTAURANT_SLUG,
    logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop",
    address: "18 Lotus Avenue, Indiranagar, Bengaluru",
    phone: "+91 98765 43210",
    settings: {
      currency: "INR",
      taxPercentage: 5,
      serviceChargePercentage: 2.5,
      themeColor: "#16a34a",
      accentColor: "#f97316",
      notificationPhone: "+91 98765 43210",
    },
    paymentSettings: {
      razorpayEnabled: true,
      payAtCounterEnabled: true,
    },
    isActive: true,
    seededBy: "scripts/seed.ts",
    createdAt: now(),
    updatedAt: now(),
  });
  console.log("Seeded restaurants/spice-garden");

  for (const category of categories) {
    await setDocument("menuCategories", `${DEMO_RESTAURANT_ID}-${category.id}`, {
      restaurantId: DEMO_RESTAURANT_ID,
      name: category.name,
      order: category.order,
      isActive: true,
      seededBy: "scripts/seed.ts",
      createdAt: now(),
      updatedAt: now(),
    });
  }
  console.log(`Seeded ${categories.length} menu categories`);

  for (const item of menuItems) {
    await setDocument("menuItems", `${DEMO_RESTAURANT_ID}-${item.id}`, {
      restaurantId: DEMO_RESTAURANT_ID,
      categoryId: `${DEMO_RESTAURANT_ID}-${item.categoryId}`,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      isBestseller: item.isBestseller,
      isAvailable: true,
      addOns: [
        {
          id: "spice-level",
          name: "Spice level",
          minSelection: 0,
          maxSelection: 1,
          options: [
            { id: "mild", name: "Mild", price: 0 },
            { id: "medium", name: "Medium", price: 0 },
            { id: "hot", name: "Hot", price: 0 },
          ],
        },
      ],
      seededBy: "scripts/seed.ts",
      createdAt: now(),
      updatedAt: now(),
    });
  }
  console.log(`Seeded ${menuItems.length} menu items`);

  for (let tableNumber = 1; tableNumber <= 5; tableNumber += 1) {
    await setDocument("tables", `${DEMO_RESTAURANT_ID}-table-${tableNumber}`, {
      restaurantId: DEMO_RESTAURANT_ID,
      number: String(tableNumber),
      capacity: tableNumber === 5 ? 6 : tableNumber <= 2 ? 2 : 4,
      isActive: true,
      qrCodeUrl: `/r/${DEMO_RESTAURANT_SLUG}/table/${tableNumber}`,
      seededBy: "scripts/seed.ts",
      createdAt: now(),
      updatedAt: now(),
    });
  }
  console.log("Seeded 5 tables");

  const users = [
    { id: "demo-owner", email: "owner@spicegarden.test", role: "RESTAURANT_OWNER", displayName: "Asha Rao" },
    { id: "demo-manager", email: "manager@spicegarden.test", role: "MANAGER", displayName: "Rohan Mehta" },
    { id: "demo-kitchen", email: "kitchen@spicegarden.test", role: "KITCHEN_STAFF", displayName: "Kitchen Team" },
    { id: "demo-cashier", email: "cashier@spicegarden.test", role: "CASHIER", displayName: "Cashier Desk" },
  ];

  for (const user of users) {
    await setDocument("users", user.id, {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      restaurantId: DEMO_RESTAURANT_ID,
      seededBy: "scripts/seed.ts",
      createdAt: now(),
      updatedAt: now(),
    });

    await setDocument("restaurantStaff", `${DEMO_RESTAURANT_ID}-${user.id}`, {
      restaurantId: DEMO_RESTAURANT_ID,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: true,
      seededBy: "scripts/seed.ts",
      createdAt: now(),
      updatedAt: now(),
    });
  }
  console.log(`Seeded ${users.length} users and restaurantStaff records`);

  console.log("");
  console.log("Seed complete.");
  console.log("Customer menu: /r/spice-garden/table/1");
  console.log("Restaurant landing: /r/spice-garden");
  console.log("Admin dashboard: /admin/spice-garden");
}

async function main() {
  console.log(`Using Firebase project: ${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  initializeDb(mode);
  console.log(`Seed mode: ${mode === "admin" ? "Admin SDK" : "Firebase client SDK"}`);

  if (RESET || RESET_ONLY) {
    await resetDemoData();
  }

  if (!RESET_ONLY) {
    await seedDemoData();
  }
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!FORCE_CLIENT && /PERMISSION_DENIED|permission/i.test(message)) {
      console.warn("Admin SDK write was denied. Falling back to Firebase client SDK.");
      console.warn("This fallback requires DEVELOPMENT ONLY Firestore rules to be deployed.");
      initializeDb("client");
      main().catch((clientError) => {
        console.error("Seed failed.");
        console.error(clientError instanceof Error ? clientError.message : clientError);
        process.exit(1);
      });
      return;
    }

    console.error("Seed failed.");
    console.error(message);
    process.exit(1);
  });
