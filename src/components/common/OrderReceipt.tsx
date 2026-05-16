"use client";

import { Order } from "@/types/order";
import { Restaurant } from "@/types/restaurant";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptProps {
  order: Order;
  restaurant: Restaurant;
}

export function OrderReceipt({ order, restaurant }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div id="receipt-content" className="p-8 bg-white text-black border shadow-sm max-w-[400px] mx-auto font-mono text-sm print:shadow-none print:border-none">
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-xl font-bold uppercase">{restaurant.name}</h2>
          <p className="text-xs">{restaurant.address}</p>
          <p className="text-xs">Ph: {restaurant.phone}</p>
          <div className="border-b border-dashed my-2" />
          <p className="font-bold">INVOICE</p>
        </div>

        <div className="space-y-1 mb-4 text-xs">
          <div className="flex justify-between">
            <span>Date: {format(new Date(), "dd/MM/yyyy")}</span>
            <span>Time: {format(new Date(), "hh:mm a")}</span>
          </div>
          <div className="flex justify-between">
            <span>Order: #{order.id.slice(-6)}</span>
            <span>Table: {order.tableNumber}</span>
          </div>
        </div>

        <div className="border-b border-dashed mb-4" />

        <div className="space-y-2 mb-4">
          <div className="flex justify-between font-bold text-xs uppercase">
            <span className="w-1/2">Item</span>
            <span className="w-1/4 text-center">Qty</span>
            <span className="w-1/4 text-right">Amt</span>
          </div>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="w-1/2">{item.name}</span>
              <span className="w-1/4 text-center">{item.quantity}</span>
              <span className="w-1/4 text-right">Rs. {item.totalPrice}</span>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed mb-4" />

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs. {order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST ({restaurant.settings.taxPercentage}%):</span>
            <span>Rs. {order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Chg:</span>
            <span>Rs. {order.serviceCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed">
            <span>TOTAL:</span>
            <span>Rs. {order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-8 space-y-2">
          <p className="text-xs italic">Thank you for dining with us!</p>
          <p className="text-[10px] opacity-50 uppercase tracking-widest">Powered by Zenvy Dine</p>
        </div>
      </div>

      <div className="flex justify-center gap-4 print:hidden">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" /> Print Receipt
        </Button>
      </div>
    </div>
  );
}
