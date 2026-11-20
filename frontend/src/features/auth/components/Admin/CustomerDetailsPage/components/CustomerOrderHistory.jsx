
import React from 'react';
import CustomerOrderRow from './CustomerOrderRow';

export default function CustomerOrderHistory({
  orders,
  onViewOrder,
  loading = false
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Order History & Fulfillment Receipts
        </h2>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-left border-collapse text-xs">

          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Items Count</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500 text-xs">
                  Loading customer orders...
                </td>
              </tr>
            ) : orders.map((ord) => (
              <CustomerOrderRow
                key={ord.id}
                order={ord}
                onViewOrder={onViewOrder}
              />
            ))}

            {!loading && orders.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="py-8 text-center text-gray-500 text-xs"
                >
                  No orders found for this customer.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
