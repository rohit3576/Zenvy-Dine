"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserRestaurantSlug, isRestaurantAdmin } from "@/lib/auth-roles";

export default function AdminGuard({ children, slug }: { children: React.ReactNode; slug: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("ADMIN GUARD DECISION:", {
        loading,
        uid: user?.uid ?? null,
        role: user?.role ?? null,
        restaurantSlug: getUserRestaurantSlug(user),
        isActive: user?.isActive ?? null,
        expectedSlug: slug,
        allowed: isRestaurantAdmin(user, slug),
      });
    }

    if (!loading && !user) {
      if (process.env.NODE_ENV !== "production") {
        console.log("ADMIN GUARD REDIRECT:", `/login?next=/admin/${slug}`);
      }
      router.push(`/login?next=/admin/${slug}`);
    } else if (!loading && user && !isRestaurantAdmin(user, slug)) {
      if (process.env.NODE_ENV !== "production") {
        console.log("ADMIN GUARD REDIRECT:", `/unauthorized?restaurant=${slug}`);
      }
      router.push(`/unauthorized?restaurant=${slug}`);
    }
  }, [user, loading, router, slug]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!user) return null;

  if (!isRestaurantAdmin(user, slug)) return null;

  return <>{children}</>;
}
