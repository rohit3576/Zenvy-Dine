import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode, UtensilsCrossed } from "lucide-react";
import { getRestaurantBySlug, getTables } from "@/services/restaurant-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Restaurant, Table } from "@/types/restaurant";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RestaurantLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug) as Restaurant | null;

  if (!restaurant) notFound();

  const restaurantSlug = restaurant.slug || restaurant.restaurantSlug || slug;
  const tables = await getTables(restaurantSlug) as Table[];

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5" />
              Choose a demo table
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tables.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {tables.map((table) => (
                  <Link
                    key={table.id}
                    href={`/r/${slug}/table/${table.number}`}
                    className={buttonVariants({ variant: "outline", className: "h-12" })}
                  >
                    Table {table.number}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No active tables are configured yet. Run <span className="font-mono">npm run seed</span> to load demo tables.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
