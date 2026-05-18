import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getUserRestaurantSlug, isRestaurantAdmin, normalizeUserProfile, profileFromClaims } from "@/lib/auth-roles";
import { sessionCookieName } from "@/lib/auth-session";
import type { User } from "@/types";

export const getServerAuthUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (process.env.NODE_ENV !== "production") {
    console.log("MIDDLEWARE TOKEN:", token ? "present" : "missing");
  }
  if (!token) return null;

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    try {
      const snapshot = await getAdminDb().collection("users").doc(decodedToken.uid).get();
      if (process.env.NODE_ENV !== "production") {
        console.log("SERVER PROFILE LOOKUP:", {
          path: `users/${decodedToken.uid}`,
          uid: decodedToken.uid,
          exists: snapshot.exists,
          profile: snapshot.exists ? snapshot.data() : null,
        });
      }

      if (snapshot.exists) {
        return normalizeUserProfile(decodedToken.uid, snapshot.data() ?? {}, decodedToken.email ?? "");
      }
    } catch (profileError) {
      console.warn("Server Firestore profile lookup failed; falling back to verified custom claims", profileError instanceof Error ? profileError.message : profileError);
    }

    return profileFromClaims(decodedToken.uid, decodedToken as unknown as Record<string, unknown>, decodedToken.email ?? "");
  } catch (error) {
    console.warn("Server auth verification failed", error instanceof Error ? error.message : error);
    return null;
  }
});

export async function requireAdminUser(restaurantId: string) {
  const user = await getServerAuthUser();

  if (!user) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("REDIRECT REASON:", "No verified server session yet. Client AdminGuard will wait for Firebase persistence.");
      return null;
    }

    console.warn("REDIRECT REASON:", "No __session cookie or invalid Firebase ID token");
    return null;
  }

  if (!isRestaurantAdmin(user, restaurantId)) {
    if (process.env.NODE_ENV !== "production") {
      console.log("SERVER ADMIN REDIRECT:", {
        uid: user.uid,
        role: user.role,
        restaurantSlug: getUserRestaurantSlug(user),
        expectedSlug: restaurantId,
        allowed: isRestaurantAdmin(user, restaurantId),
        redirectTo: `/unauthorized?restaurant=${restaurantId}`,
      });
    }
    redirect(`/unauthorized?restaurant=${restaurantId}`);
  }

  return user;
}
