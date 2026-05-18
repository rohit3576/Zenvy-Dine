import type { Permission, Role, User } from "@/types";

const roleAliases: Record<string, Role> = {
  OWNER: "OWNER",
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
  return typeof role === "string" ? roleAliases[role] ?? null : null;
}

export function permissionsForRole(role: Role): Permission[] {
  return rolePermissions[role];
}

export function hasPermission(user: Pick<User, "role" | "permissions"> | null, permission: Permission) {
  if (!user) return false;
  return user.permissions.includes(permission) || permissionsForRole(user.role).includes(permission);
}

export function getUserRestaurantSlug(user: Pick<User, "restaurantId" | "restaurantSlug"> | null) {
  return user?.restaurantSlug || user?.restaurantId || null;
}

export function canAccessAdmin(user: Pick<User, "role" | "restaurantId" | "restaurantSlug" | "isActive"> | null, restaurantSlug: string) {
  return !!user
    && user.isActive
    && getUserRestaurantSlug(user) === restaurantSlug
    && ["OWNER", "MANAGER", "STAFF"].includes(user.role);
}

export function normalizeUserProfile(uid: string, data: Record<string, unknown>, fallbackEmail = ""): User | null {
  const role = normalizeRole(data.role);
  const restaurantSlug = typeof data.restaurantSlug === "string"
    ? data.restaurantSlug
    : typeof data.restaurantId === "string"
      ? data.restaurantId
      : null;
  const email = typeof data.email === "string" ? data.email : fallbackEmail;
  const isActive = typeof data.isActive === "boolean" ? data.isActive : true;

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
