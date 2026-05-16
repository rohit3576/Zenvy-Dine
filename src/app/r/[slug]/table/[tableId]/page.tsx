import { notFound } from "next/navigation";
import { getRestaurantBySlug, getCategories, getMenuItems } from "@/services/restaurant-service";
import RestaurantMenu from "@/features/menu/components/RestaurantMenu";
import { Restaurant } from "@/types/restaurant";
import { Category, MenuItem } from "@/types/menu";

interface PageProps {
  params: Promise<{
    slug: string;
    tableId: string;
  }>;
}

export default async function TableMenuPage({ params }: PageProps) {
  const { slug, tableId } = await params;

  const restaurant = await getRestaurantBySlug(slug) as Restaurant | null;
  if (!restaurant) notFound();

  // Fetch categories and items
  const [categories, items] = await Promise.all([
    getCategories(restaurant.id),
    getMenuItems(restaurant.id),
  ]);

  return (
    <RestaurantMenu 
      restaurant={restaurant} 
      categories={categories as Category[]} 
      items={items as MenuItem[]} 
      tableId={tableId}
    />
  );
}
