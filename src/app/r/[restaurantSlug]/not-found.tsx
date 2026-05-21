import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function RestaurantNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Restaurant or table not found</h1>
        <p className="text-muted-foreground">
          The restaurant may not be seeded yet, or this table QR code is no longer active.
        </p>
        <Link href="/" className={buttonVariants()}>
          Back to Zenvy Dine
        </Link>
      </div>
    </main>
  );
}
