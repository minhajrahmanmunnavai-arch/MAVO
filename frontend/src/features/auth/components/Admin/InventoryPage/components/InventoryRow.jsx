
import React from "react";
import StockUpdateInput from "./StockUpdateInput";

export default function InventoryRow({
  product,
  editingStock,
  onStockInputChange,
  onSaveStock,
  isSaving,
}) {
  const available = Math.max(
    0,
    product.stock - (product.reserved || 0)
  );

  const isEditing = editingStock[product.id] !== undefined;

  const currentVal = isEditing
    ? editingStock[product.id]
    : product.stock;

  // Stock Status
  const stockStatus =
    product.stock === 0
      ? "Out of Stock"
      : product.stock <= product.lowStockThreshold
      ? "Low Stock"
      : "In Stock";

  const statusClass =
    product.stock === 0
      ? "bg-red-50 text-red-700 border border-red-200"
      : product.stock <= product.lowStockThreshold
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-emerald-50 text-emerald-700 border border-emerald-200";

  return (
    <tr className=" cursor-pointer hover:bg-gray-50 transition-colors">

      {/* Item & SKU */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
          />

          <div>
            <div className="font-semibold text-gray-900">
              {product.name}
            </div>

            <div className="text-[10px] font-mono text-gray-500">
              {product.sku}
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-gray-700">
        {product.category}
      </td>

      {/* Physical Stock */}
      <td className="py-3 px-4 font-mono font-semibold text-gray-900">
        {product.stock}
      </td>

      {/* Reserved */}
      <td className="py-3 px-4 font-mono text-gray-500">
        {product.reserved || 0}
      </td>

      {/* Available */}
      <td className="py-3 px-4 font-mono font-bold text-blue-600">
        {available}
      </td>

      {/* Stock Status */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${statusClass}`}
        >
          {stockStatus}
        </span>
      </td>

      {/* Quick Stock Update */}
      <td className="py-3 px-4 text-right">
        <StockUpdateInput
          productId={product.id}
          currentVal={currentVal}
          isEditing={isEditing}
          isSaving={isSaving}
          onChange={onStockInputChange}
          onSave={onSaveStock}
        />
      </td>

    </tr>
  );
}
