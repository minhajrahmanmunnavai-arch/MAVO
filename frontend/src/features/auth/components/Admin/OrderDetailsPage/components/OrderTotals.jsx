
import React from "react";

export default function OrderTotals({ order }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-xs">

          {/* Subtotal */}
          <div className="flex justify-between text-gray-500">
            <span>Items Subtotal:</span>

            <span className="font-mono text-gray-800">
              ৳{Number(order.subtotal).toFixed(2)}
            </span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between text-gray-500">
            <span>Shipping & Handling:</span>

            <span className="font-mono text-gray-800">
              {order.shippingCost === 0
                ? "FREE"
                : `৳${Number(order.shippingCost).toFixed(2)}`}
            </span>
          </div>

          {/* Discount */}
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Promotional Discount:</span>

              <span className="font-mono">
                -৳{Number(order.discount).toFixed(2)}
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
            <span>Grand Total:</span>

            <span className="font-mono text-base text-blue-700">
              ৳{Number(order.total).toFixed(2)}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
