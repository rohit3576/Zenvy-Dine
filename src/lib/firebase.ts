import { initializeApp, getApps, getApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { authDebug, maskValue } from "@/lib/auth-debug";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== "measurementId" && !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  console.warn("[firebase] Missing client environment variables", missingFirebaseConfig);
}

authDebug("firebase client config", {
  apiKey: maskValue(firebaseConfig.apiKey),
  authDomain: firebaseConfig.authDomain || "missing",
  projectId: firebaseConfig.projectId || "missing",
  storageBucket: firebaseConfig.storageBucket || "missing",
  messagingSenderId: maskValue(firebaseConfig.messagingSenderId),
  appId: maskValue(firebaseConfig.appId),
  appCountBeforeInit: getApps().length,
});

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let persistencePromise: Promise<void> | null = null;

authDebug("firebase initialized", {
  appName: app.name,
  projectId: app.options.projectId,
  authDomain: app.options.authDomain,
});

export function ensureAuthPersistence() {
  if (typeof window === "undefined") return Promise.resolve();
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence)
      .then(() => {
        authDebug("auth persistence ready", { persistence: "browserLocalPersistence" });
        if (process.env.NODE_ENV !== "production") {
          console.log("AUTH INITIALIZED");
          console.log("CURRENT USER:", auth.currentUser);
        }
      })
      .catch((error) => {
        persistencePromise = null;
        console.error("[auth] Failed to configure browserLocalPersistence", error);
        throw error;
      });
  }

  return persistencePromise;
}

export { app, auth, db, storage };
