import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, QrCode, UtensilsCrossed } from "lucide-react";
import { getRestaurantBySlug, getTables } from "@/services/restaurant-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Restaurant, Table } from "@/types/restaurant";
import { StatusBadge } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ restaurantSlug: string }>;
}

export default async function RestaurantLandingPage({ params }: PageProps) {
  const { restaurantSlug: requestedSlug } = await params;
  const restaurant = await getRestaurantBySlug(requestedSlug) as Restaurant | null;

  if (!restaurant) notFound();

  const restaurantSlug = restaurant.slug || restaurant.restaurantSlug || requestedSlug;
  const tables = await getTables(restaurantSlug) as Table[];

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(10,132,255,0.22)]">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <div>
            <StatusBadge tone="green">QR ordering</StatusBadge>
            <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">{restaurant.name}</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{restaurant.address}</p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <QrCode className="h-5 w-5 text-primary" />
              Choose a table
            </CardTitle>
            <p className="text-sm text-muted-foreground">Open the live customer menu for a configured table.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {tables.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tables.map((table) => (
                  <Link
                    key={table.id}
                    href={`/r/${restaurantSlug}/table/${table.number}`}
                    className={cn(buttonVariants({ variant: "glass", className: "h-14 rounded-2xl justify-between px-4" }))}
                  >
                    Table {table.number}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white p-6 text-center text-sm text-muted-foreground">
                No active tables are configured yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
