"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const adminRoles = new Set(["SUPER_ADMIN", "RESTAURANT_OWNER", "MANAGER", "KITCHEN_STAFF", "CASHIER"]);

export default function AdminGuard({ children, slug }: { children: React.ReactNode; slug: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!user) return null;

  if (!adminRoles.has(user.role) || (user.role !== "SUPER_ADMIN" && user.restaurantId !== slug)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center">
          <h1 className="text-xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is not assigned to this restaurant or does not have an admin role.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
