import { config } from "dotenv";

config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const restaurantId = "spice-garden";
const restaurantSlug = "spice-garden";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

if (!projectId || !apiKey) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_API_KEY.");
  process.exit(1);
}

function valueToFirestore(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(valueToFirestore) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, valueToFirestore(entry)])),
      },
    };
  }
  return { stringValue: String(value) };
}

async function setDoc(collectionName, documentId, data) {
  const response = await fetch(`${baseUrl}/${collectionName}/${documentId}?key=${apiKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, valueToFirestore(value)])),
    }),
  });

  if (!response.ok) {
    throw new Error(`${collectionName}/${documentId}: ${response.status} ${await response.text()}`);
  }
}

const now = () => new Date();

const categories = [
  { id: "starters", name: "Starters", order: 1 },
  { id: "mains", name: "Main Course", order: 2 },
  { id: "drinks", name: "Drinks & Desserts", order: 3 },
];

const menuItems = [
  ["starters", "Crispy Corn Chaat", "Golden corn tossed with lime, chilli, coriander, and house masala.", 220, true, true],
  ["starters", "Paneer Tikka", "Charred paneer cubes with mint chutney.", 340, true, true],
  ["mains", "Paneer Butter Masala", "Soft paneer simmered in a makhani gravy.", 390, true, true],
  ["mains", "Butter Chicken", "Delhi-style butter chicken with tomato cream sauce.", 480, false, true],
  ["mains", "Garlic Butter Naan", "Tandoor-baked naan brushed with garlic butter.", 90, true, false],
  ["drinks", "Masala Chaas", "Chilled spiced buttermilk with roasted cumin.", 120, true, false],
];

async function seed() {
  await setDoc("restaurants", restaurantId, {
    name: "Spice Garden",
    slug: restaurantSlug,
    restaurantSlug,
    logoUrl: "/brand/zenvy-dine.svg",
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
    paymentSettings: { razorpayEnabled: true, payAtCounterEnabled: true },
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  });

  for (const category of categories) {
    await setDoc("menuCategories", `${restaurantId}-${category.id}`, {
      restaurantId,
      restaurantSlug,
      name: category.name,
      order: category.order,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  for (let index = 0; index < menuItems.length; index += 1) {
    const [categoryId, name, description, price, isVeg, isBestseller] = menuItems[index];
    await setDoc("menuItems", `${restaurantId}-item-${index + 1}`, {
      restaurantId,
      restaurantSlug,
      categoryId: `${restaurantId}-${categoryId}`,
      name,
      description,
      price,
      imageUrl: "/brand/zenvy-dine.svg",
      isVeg,
      isBestseller,
      isAvailable: true,
      addOns: [],
      createdAt: now(),
      updatedAt: now(),
    });
  }

  for (let tableNumber = 1; tableNumber <= 5; tableNumber += 1) {
    await setDoc("tables", `${restaurantId}-table-${tableNumber}`, {
      restaurantId,
      restaurantSlug,
      number: String(tableNumber),
      capacity: tableNumber <= 2 ? 2 : 4,
      isActive: true,
      qrCodeUrl: `/r/${restaurantSlug}/table/${tableNumber}`,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  await setDoc("orders", `${restaurantId}-order-demo-1`, {
    restaurantId,
    restaurantSlug,
    tableId: `${restaurantId}-table-1`,
    tableNumber: "1",
    items: [
      { id: `${restaurantId}-item-3`, name: "Paneer Butter Masala", price: 390, quantity: 1, addOns: [], totalPrice: 390 },
      { id: `${restaurantId}-item-5`, name: "Garlic Butter Naan", price: 90, quantity: 2, addOns: [], totalPrice: 180 },
    ],
    subtotal: 570,
    tax: 28.5,
    serviceCharge: 14.25,
    total: 612.75,
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    paymentMethod: "CASH",
    createdAt: now(),
    updatedAt: now(),
  });

  await setDoc("waiterCalls", `${restaurantId}-waiter-call-demo-1`, {
    restaurantId,
    restaurantSlug,
    tableNumber: "2",
    status: "OPEN",
    message: "Water requested",
    createdAt: now(),
    updatedAt: now(),
  });

  await setDoc("restaurantStaff", `${restaurantId}-owner`, {
    restaurantId,
    restaurantSlug,
    userId: "demo-owner",
    email: "owner@spicegarden.test",
    displayName: "Demo Owner",
    role: "OWNER",
    isActive: true,
    inviteStatus: "ACTIVE",
    createdAt: now(),
    updatedAt: now(),
  });

  await setDoc("staff", `${restaurantId}-owner`, {
    restaurantId,
    restaurantSlug,
    userId: "demo-owner",
    email: "owner@spicegarden.test",
    displayName: "Demo Owner",
    role: "OWNER",
    isActive: true,
    inviteStatus: "ACTIVE",
    createdAt: now(),
    updatedAt: now(),
  });
}

seed()
  .then(() => console.log("Seeded Spice Garden demo data via Firestore REST."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
