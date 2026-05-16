import * as admin from "firebase-admin";

function initializeAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
    return admin.app();
  }
}

export function getAdminDb() {
  initializeAdminApp();
  return admin.firestore();
}

export function getAdminAuth() {
  initializeAdminApp();
  return admin.auth();
}

export function getAdminStorage() {
  initializeAdminApp();
  return admin.storage();
}
