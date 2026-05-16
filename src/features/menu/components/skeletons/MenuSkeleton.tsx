import { Skeleton } from "@/components/ui/skeleton";

export function MenuSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border animate-pulse bg-muted/20">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-28 w-28 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
