
import React from "react";

export default function OrdersHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Order Management
        </h1>

        <p className="text-xs text-gray-500 mt-0.5">
          Track customer transactions, fulfillment lifecycle, and dispatch states.
        </p>
      </div>
    </div>
  );
}
