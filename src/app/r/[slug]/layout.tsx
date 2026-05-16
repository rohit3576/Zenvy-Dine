import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase-admin";
import { Restaurant } from "@/types/restaurant";

interface RestaurantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) return { title: "Restaurant Not Found" };
  
  return {
    title: `${restaurant.name} - Order Online`,
    description: `Browse menu and order online from ${restaurant.name}`,
  };
}

async function getRestaurant(slug: string): Promise<Restaurant | null> {
  const db = getAdminDb();
  const snapshot = await db.collection("restaurants")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Restaurant;
}

export default async function RestaurantLayout({ children, params }: RestaurantLayoutProps) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
}
