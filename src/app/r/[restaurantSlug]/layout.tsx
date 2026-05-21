import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/services/restaurant-service";
import { Restaurant } from "@/types/restaurant";

interface RestaurantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ restaurantSlug: string }> }): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const restaurant = await getRestaurantBySlug(restaurantSlug) as Restaurant | null;
  if (!restaurant) return { title: "Restaurant Not Found" };
  
  return {
    title: `${restaurant.name} - Order Online`,
    description: `Browse menu and order online from ${restaurant.name}`,
  };
}

export default async function RestaurantLayout({ children, params }: RestaurantLayoutProps) {
  const { restaurantSlug } = await params;
  const restaurant = await getRestaurantBySlug(restaurantSlug) as Restaurant | null;
  if (!restaurant) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
}
