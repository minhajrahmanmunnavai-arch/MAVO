
import React from "react";

export default function InventoryHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Inventory Management
        </h1>

        <p className="text-xs text-gray-500 mt-0.5">
          Monitor real-time warehouse counts, reserved allocations, and adjust stock.
        </p>
      </div>
    </div>
  );
}
