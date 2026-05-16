import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const timestamp = admin.firestore.FieldValue.serverTimestamp;

const restaurantId = "demo-spice-garden";
const restaurantSlug = "spice-garden";

const categories = [
  { id: "starters", name: "Starters", order: 1 },
  { id: "tandoor", name: "Tandoor", order: 2 },
  { id: "mains", name: "Main Course", order: 3 },
  { id: "breads-rice", name: "Breads & Rice", order: 4 },
  { id: "beverages", name: "Beverages", order: 5 },
  { id: "desserts", name: "Desserts", order: 6 },
];

const menuItems = [
  ["starters", "Crispy Corn Chaat", "Golden corn tossed with lime, chilli, coriander, and house masala.", 220, true, true, "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&h=800&fit=crop"],
  ["starters", "Chilli Chicken Bites", "Wok-tossed chicken with peppers, garlic, and a glossy Indo-Chinese glaze.", 340, false, true, "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=800&fit=crop"],
  ["tandoor", "Paneer Tikka Trio", "Three marinades of charred paneer served with mint chutney.", 360, true, true, "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=800&fit=crop"],
  ["tandoor", "Smoky Murgh Tikka", "Boneless chicken marinated overnight and finished in the tandoor.", 420, false, true, "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop"],
  ["mains", "Paneer Butter Masala", "Soft paneer simmered in a makhani gravy with kasuri methi.", 390, true, true, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&h=800&fit=crop"],
  ["mains", "Butter Chicken", "Classic Delhi-style butter chicken with slow-cooked tomato cream sauce.", 480, false, true, "https://images.unsplash.com/photo-1603894584714-74399304301a?w=800&h=800&fit=crop"],
  ["mains", "Dal Bukhara", "Black lentils cooked low and slow with butter and cream.", 330, true, false, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop"],
  ["breads-rice", "Garlic Butter Naan", "Tandoor-baked naan brushed with garlic butter.", 90, true, true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=800&fit=crop"],
  ["breads-rice", "Jeera Rice", "Steamed basmati rice tempered with cumin and ghee.", 180, true, false, "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=800&fit=crop"],
  ["beverages", "Aam Panna Cooler", "Raw mango, mint, roasted cumin, and sparkling water.", 160, true, false, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop"],
  ["beverages", "Cold Coffee Frappe", "Chilled coffee blended with milk and vanilla ice cream.", 210, true, true, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop"],
  ["desserts", "Gulab Jamun Cheesecake", "A plated fusion dessert with saffron cream and pistachio crumb.", 240, true, true, "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop"],
];

async function seedDemoData() {
  console.log("Seeding professional demo restaurant: Spice Garden...");

  await db.collection("restaurants").doc(restaurantId).set({
    name: "Spice Garden",
    slug: restaurantSlug,
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
    createdAt: timestamp(),
    updatedAt: timestamp(),
  });

  for (const category of categories) {
    await db.collection("menuCategories").doc(`${restaurantId}-${category.id}`).set({
      restaurantId,
      name: category.name,
      order: category.order,
      isActive: true,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  }

  for (let index = 0; index < menuItems.length; index += 1) {
    const [categoryId, name, description, price, isVeg, isBestseller, imageUrl] = menuItems[index];
    await db.collection("menuItems").doc(`${restaurantId}-item-${index + 1}`).set({
      restaurantId,
      categoryId: `${restaurantId}-${categoryId}`,
      name,
      description,
      price,
      imageUrl,
      isVeg,
      isBestseller,
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
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  }

  for (let tableNumber = 1; tableNumber <= 10; tableNumber += 1) {
    await db.collection("tables").doc(`${restaurantId}-table-${tableNumber}`).set({
      restaurantId,
      number: String(tableNumber),
      capacity: tableNumber <= 4 ? 2 : tableNumber <= 8 ? 4 : 6,
      isActive: true,
      qrCodeUrl: `/r/${restaurantSlug}/table/${tableNumber}`,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  }

  console.log("Demo URL: /r/spice-garden/table/1");
  console.log("Printable QR cards are available in Admin > Table Management.");
  console.log("Seeding completed successfully.");
}

seedDemoData().catch((error) => {
  console.error(error);
  process.exit(1);
});
