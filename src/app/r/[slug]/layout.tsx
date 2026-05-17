import { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoRestaurant, isDemoRestaurant } from "@/data/demo-restaurant";
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
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("restaurants")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return JSON.parse(JSON.stringify({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })) as Restaurant;
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDemoRestaurant(slug)) {
      return JSON.parse(JSON.stringify(demoRestaurant)) as Restaurant;
    }
    console.warn("Restaurant layout lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
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
