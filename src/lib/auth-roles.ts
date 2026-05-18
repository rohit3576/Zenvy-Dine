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

export function canAccessAdmin(user: Pick<User, "role" | "restaurantId"> | null, restaurantId: string) {
  return !!user && !!user.restaurantId && user.restaurantId === restaurantId && ["OWNER", "MANAGER", "STAFF"].includes(user.role);
}

