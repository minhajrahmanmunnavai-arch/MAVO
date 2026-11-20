
import React from "react";
import InventoryRow from "./InventoryRow";

export default function InventoryTable({
  products,
  loading,
  editingStock,
  onStockInputChange,
  onSaveStock,
  savingStockId,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">

          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Item & SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Total Physical</th>
              <th className="py-3 px-4">Reserved</th>
              <th className="py-3 px-4">Available</th>
              <th className="py-3 px-4">Stock Status</th>
              <th className="py-3 px-4 text-right">Quick Stock Update</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500 text-xs">
                  Loading inventory...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((product) => (
                <InventoryRow
                  key={product.id}
                  product={product}
                  editingStock={editingStock}
                  onStockInputChange={onStockInputChange}
                  onSaveStock={onSaveStock}
                  isSaving={savingStockId === product.id}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-12 text-center text-gray-500 text-xs"
                >
                  No inventory found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
