
import React from 'react';

export default function CustomerMetrics({ customer }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Total Orders */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

        <div className="text-xs font-semibold text-gray-500">
          Total Orders Placed
        </div>

        <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
          {customer.ordersCount}
        </div>

      </div>

      {/* Lifetime Spending */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

        <div className="text-xs font-semibold text-gray-500">
          Lifetime Gross Spending
        </div>

        <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
          ৳{customer.totalSpent.toFixed(2)}
        </div>

      </div>

      {/* Average Cart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

        <div className="text-xs font-semibold text-gray-500">
          Average Cart Size
        </div>

        <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
          ৳{(customer.totalSpent / Math.max(1, customer.ordersCount)).toFixed(2)}
        </div>

      </div>

    </div>
  );
}
