import { notFound } from "next/navigation";
import { getRestaurantBySlug, getCategories, getMenuItems, getTableByNumber } from "@/services/restaurant-service";
import RestaurantMenu from "@/features/menu/components/RestaurantMenu";
import { Restaurant } from "@/types/restaurant";
import { Category, MenuItem } from "@/types/menu";

interface PageProps {
  params: Promise<{
    restaurantSlug: string;
    tableId: string;
  }>;
}

export default async function TableMenuPage({ params }: PageProps) {
  const { restaurantSlug: requestedSlug, tableId } = await params;

  const restaurant = await getRestaurantBySlug(requestedSlug) as Restaurant | null;
  if (!restaurant) notFound();

  const restaurantSlug = restaurant.slug || restaurant.restaurantSlug || requestedSlug;
  const normalizedRestaurant = { ...restaurant, slug: restaurantSlug, restaurantSlug };
  const table = await getTableByNumber(restaurantSlug, tableId);
  if (!table) {
    console.warn(`[customer-menu] Table ${tableId} was not found for ${restaurantSlug}; rendering the QR ordering flow with the requested table number.`);
  }

  const [categories, items] = await Promise.all([
    getCategories(restaurantSlug),
    getMenuItems(restaurantSlug),
  ]);

  return (
    <RestaurantMenu 
      restaurant={normalizedRestaurant} 
      categories={categories as Category[]} 
      items={items as MenuItem[]} 
      tableId={tableId}
    />
  );
}
