"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    // Optional: Check if user belongs to this restaurant slug
    // This would require fetching restaurant ID by slug first
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

  return <>{children}</>;
}
