import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getUserRestaurantSlug, normalizeUserProfile, profileFromClaims } from "@/lib/auth-roles";
import { sessionCookieName } from "@/lib/auth-session";
import type { User } from "@/types";

export const getServerAuthUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    try {
      const snapshot = await getAdminDb().collection("users").doc(decodedToken.uid).get();

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
      console.warn("Development auth fallback: server Admin SDK could not verify the session. Client AdminGuard will enforce access.");
      return null;
    }

    redirect(`/login?next=/admin/${restaurantId}`);
  }

  if (getUserRestaurantSlug(user) !== restaurantId) {
    redirect(`/unauthorized?restaurant=${restaurantId}`);
  }

  return user;
}
