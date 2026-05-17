import { Skeleton } from "@/components/ui/skeleton";

export default function StaffLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
