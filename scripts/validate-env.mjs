import { config } from "dotenv";

config({ path: ".env.local" });

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

const missing = required.filter((name) => !process.env[name]);
const missingGroups = [
  {
    label: "Firebase Admin project id",
    keys: ["FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
  },
  {
    label: "Firebase Admin client email",
    keys: ["FIREBASE_CLIENT_EMAIL", "FIREBASE_ADMIN_CLIENT_EMAIL"],
  },
  {
    label: "Firebase Admin private key",
    keys: ["FIREBASE_PRIVATE_KEY", "FIREBASE_ADMIN_PRIVATE_KEY"],
  },
  {
    label: "Razorpay key id",
    keys: ["RAZORPAY_KEY_ID", "NEXT_PUBLIC_RAZORPAY_KEY_ID"],
  },
].filter((group) => !group.keys.some((key) => process.env[key]));

if (missing.length > 0 || missingGroups.length > 0) {
  console.error("Missing required environment variables:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  for (const group of missingGroups) {
    console.error(`- ${group.label}: one of ${group.keys.join(", ")}`);
  }
  process.exit(1);
}

if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
  console.warn("Warning: RAZORPAY_WEBHOOK_SECRET is missing. Webhook verification will not be production-ready.");
}

console.log("Environment validation passed.");
