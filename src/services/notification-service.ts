import { Order } from "@/types/order";
import { Restaurant } from "@/types/restaurant";

export const notificationService = {
  /**
   * Generates a WhatsApp message link for the restaurant owner when a new order is placed.
   */
  getWhatsAppOrderLink: (order: Order, restaurant: Restaurant) => {
    const phone = restaurant.phone.replace(/[^\d]/g, "");
    
    const itemsText = order.items
      .map((item) => `- ${item.quantity}x ${item.name} (Rs. ${item.totalPrice})`)
      .join("\n");

    const message = `
*New Order Received!*
--------------------------
*Table:* ${order.tableNumber}
*Order ID:* #${order.id.slice(-6)}
*Time:* ${new Date().toLocaleTimeString()}

*Items:*
${itemsText}

*Total Amount:* Rs. ${order.total}
*Payment:* ${order.paymentMethod} (${order.paymentStatus})

_Sent via Zenvy Dine_
    `.trim();

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Placeholder for future WhatsApp API integration (e.g. Twilio, Meta API)
   */
  sendWhatsAppNotification: async (order: Order, restaurant: Restaurant) => {
    console.log("Automated WhatsApp notification pending", {
      orderId: order.id,
      restaurantId: restaurant.id,
    });
    // This would typically be a server-side Cloud Function call
  }
};
