import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { normalizeRole, permissionsForRole } from "@/lib/auth-roles";
import { sessionCookieName } from "@/lib/auth-session";
import type { User } from "@/types";

export const getServerAuthUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const snapshot = await getAdminDb().collection("users").doc(decodedToken.uid).get();

    if (!snapshot.exists) return null;

    const data = snapshot.data() ?? {};
    const role = normalizeRole(data.role);
    const restaurantId = typeof data.restaurantId === "string" ? data.restaurantId : null;
    const email = typeof data.email === "string" ? data.email : decodedToken.email ?? "";

    if (!role || !restaurantId || !email) return null;

    return {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email,
      role,
      restaurantId,
      permissions: Array.isArray(data.permissions) ? data.permissions : permissionsForRole(role),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as User;
  } catch (error) {
    console.warn("Server auth verification failed", error instanceof Error ? error.message : error);
    return null;
  }
});

export async function requireAdminUser(restaurantId: string) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect(`/login?next=/admin/${restaurantId}`);
  }

  if (!user.restaurantId || user.restaurantId !== restaurantId) {
    redirect(`/unauthorized?restaurant=${restaurantId}`);
  }

  return user;
}

