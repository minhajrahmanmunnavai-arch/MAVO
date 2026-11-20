
import React from "react";
import { Warehouse, AlertTriangle, XCircle } from "lucide-react";

export default function InventoryStats({ products }) {
  const totalStock = products.reduce(
    (acc, product) => acc + product.stock,
    0
  );

  const lowStockCount = products.filter(
    (product) =>
      product.stock > 0 &&
      product.stock <= product.lowStockThreshold
  ).length;

  const outOfStockCount = products.filter(
    (product) => product.stock === 0
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Total Stock */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs font-semibold text-gray-500">
            Total Stock on Hand
          </div>

          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {totalStock} units
          </div>
        </div>

        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
          <Warehouse className="w-5 h-5" />
        </div>
      </div>

      {/* Low Stock */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs font-semibold text-gray-500">
            Low Stock SKUs
          </div>

          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {lowStockCount} items
          </div>
        </div>

        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Out of Stock */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs font-semibold text-gray-500">
            Out of Stock Listings
          </div>

          <div className="text-2xl font-bold font-mono text-red-600 mt-1">
            {outOfStockCount} items
          </div>
        </div>

        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
          <XCircle className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
}
