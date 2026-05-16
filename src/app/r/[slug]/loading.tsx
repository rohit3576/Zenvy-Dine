import { MenuSkeleton } from "@/features/menu/components/skeletons/MenuSkeleton";

export default function RestaurantLoading() {
  return (
    <div className="space-y-4 pt-4">
      <div className="px-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-full" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 bg-muted animate-pulse rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
      <MenuSkeleton />
    </div>
  );
}
