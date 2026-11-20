
import React from "react";
import OrderRow from "./OrderRow";

export default function OrdersTable({
  orders,
  onViewOrder,
  onDeleteOrder,
  deletingOrderId,
  isLoading = false,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">

          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Order Status</th>
              <th className="py-3 px-4 text-right">Fulfillment</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-gray-500 text-xs">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onViewOrder={onViewOrder}
                  onDeleteOrder={onDeleteOrder}
                  isDeleting={
                    String(order.id || order._id) === deletingOrderId
                  }
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="py-12 text-center text-gray-500 text-xs"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
