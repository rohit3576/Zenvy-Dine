import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
