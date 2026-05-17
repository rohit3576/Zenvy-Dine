import "server-only";
import * as admin from "firebase-admin";

function initializeAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
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
