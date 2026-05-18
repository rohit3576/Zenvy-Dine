"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessAdmin } from "@/lib/auth-roles";

export default function AdminGuard({ children, slug }: { children: React.ReactNode; slug: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=/admin/${slug}`);
    } else if (!loading && user && !canAccessAdmin(user, slug)) {
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

  if (!canAccessAdmin(user, slug)) return null;

  return <>{children}</>;
}
