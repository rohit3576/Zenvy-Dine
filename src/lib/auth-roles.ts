import type { Permission, Role, User } from "@/types";

const roleAliases: Record<string, Role> = {
  OWNER: "OWNER",
  ADMIN: "OWNER",
  RESTAURANT_OWNER: "OWNER",
  SUPER_ADMIN: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  KITCHEN_STAFF: "STAFF",
  CASHIER: "STAFF",
};

export const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    "restaurant:read",
    "restaurant:update",
    "orders:read",
    "orders:update",
    "menu:manage",
    "tables:manage",
    "staff:manage",
    "settings:manage",
  ],
  MANAGER: [
    "restaurant:read",
    "orders:read",
    "orders:update",
    "menu:manage",
    "tables:manage",
    "staff:manage",
  ],
  STAFF: ["restaurant:read", "orders:read", "orders:update"],
};

export function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") return null;
  return roleAliases[role.trim().toUpperCase()] ?? null;
}

export function permissionsForRole(role: Role): Permission[] {
  return rolePermissions[role];
}

export function hasPermission(user: Pick<User, "role" | "permissions"> | null, permission: Permission) {
  if (!user) return false;
  return user.permissions.includes(permission) || permissionsForRole(user.role).includes(permission);
}

export function getUserRestaurantSlug(user: Pick<User, "restaurantId" | "restaurantSlug"> | null) {
  return user?.restaurantSlug?.trim() || user?.restaurantId?.trim() || null;
}

export function isRestaurantAdmin(user: Pick<User, "role" | "restaurantId" | "restaurantSlug" | "isActive"> | null, restaurantSlug?: string) {
  const userSlug = getUserRestaurantSlug(user);
  const expectedSlug = restaurantSlug?.trim();

  return !!user
    && user.isActive
    && !!userSlug
    && (!expectedSlug || userSlug === expectedSlug)
    && ["OWNER", "MANAGER", "STAFF"].includes(user.role);
}

export const canAccessAdmin = isRestaurantAdmin;

export function normalizeUserProfile(uid: string, data: Record<string, unknown>, fallbackEmail = ""): User | null {
  const role = normalizeRole(data.role);
  const restaurantSlug = typeof data.restaurantSlug === "string"
    ? data.restaurantSlug.trim()
    : typeof data.restaurantId === "string"
      ? data.restaurantId.trim()
      : null;
  const email = typeof data.email === "string" ? data.email : fallbackEmail;
  const isActive = typeof data.isActive === "boolean" ? data.isActive : true;

  if (process.env.NODE_ENV !== "production") {
    console.log("AUTH UID:", uid);
    console.log("PROFILE:", data);
    console.log("ROLE:", data.role);
    console.log("SLUG:", data.restaurantSlug ?? data.restaurantId);
    console.log("ACTIVE:", data.isActive);
    console.log("EXPECTED ROLE:", "OWNER | MANAGER | STAFF");
    console.log("NORMALIZED ROLE:", role);
    console.log("NORMALIZED SLUG:", restaurantSlug);
  }

  if (!role || !restaurantSlug || !email || !isActive) return null;

  return {
    id: uid,
    uid,
    ...data,
    email,
    role,
    restaurantId: restaurantSlug,
    restaurantSlug,
    isActive,
    permissions: Array.isArray(data.permissions) ? data.permissions as Permission[] : permissionsForRole(role),
  } as User;
}

export function profileFromClaims(uid: string, claims: Record<string, unknown>, fallbackEmail = "") {
  return normalizeUserProfile(uid, {
    email: typeof claims.email === "string" ? claims.email : fallbackEmail,
    role: claims.role,
    restaurantSlug: claims.restaurantSlug,
    restaurantId: claims.restaurantId,
    isActive: claims.isActive,
    permissions: claims.permissions,
    createdAt: claims.auth_time,
    updatedAt: claims.iat,
  }, fallbackEmail);
}
