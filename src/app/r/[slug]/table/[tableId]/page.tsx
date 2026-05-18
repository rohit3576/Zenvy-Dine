import { notFound } from "next/navigation";
import { getRestaurantBySlug, getCategories, getMenuItems, getTableByNumber } from "@/services/restaurant-service";
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

  const restaurantSlug = restaurant.slug || restaurant.restaurantSlug || slug;
  const table = await getTableByNumber(restaurantSlug, tableId);
  if (!table) notFound();

  const [categories, items] = await Promise.all([
    getCategories(restaurantSlug),
    getMenuItems(restaurantSlug),
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
