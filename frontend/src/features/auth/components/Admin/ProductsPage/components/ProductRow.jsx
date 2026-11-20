import React from "react";
import { Copy, Trash2, Edit } from "lucide-react";

const ProductRow = ({
  product,
  isSelected,
  toggleSelectOne,
  navigateTo,
  duplicateProduct,
  onDelete,
}) => {
  const p = product;

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50" : ""
      }`}
    >

      {/* Checkbox */}
      <td className="py-3 px-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectOne(p.id)}
          className="rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
        />
      </td>

      {/* Product Information */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">

          <img
            src={p.image}
            alt={p.name}
            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/80x80/1e293b/f8fafc?text=MOX";
            }}
          />

          <div className="min-w-0">

            <button
              type="button"
              onClick={() =>
                navigateTo("edit-product", { productId: p.id })
              }
              className="cursor-pointer font-semibold text-gray-900 hover:text-blue-700 transition-colors text-left truncate block max-w-xs"
            >
              {p.name}
            </button>

            <span className="text-[10px] text-gray-500 block">
              {p.brand}
            </span>

          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="py-3 px-4 font-mono text-gray-500 font-medium">
        {p.sku}
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-gray-700">
        {p.category}
      </td>

      {/* Price */}
      <td className="py-3 px-4 font-mono font-bold text-gray-900">
        <div>৳{p.price.toFixed(2)}</div>

        {p.salePrice && p.salePrice < p.price && (
          <div className="text-[10px] text-emerald-400 line-through">
            ৳{p.salePrice.toFixed(2)}
          </div>
        )}
      </td>

      {/* Stock */}
      <td className="py-3 px-4">
        <div className="font-mono text-gray-800 font-semibold">
          {p.stock} units
        </div>

        <div className="text-[10px] text-gray-500 font-mono">
          {p.reserved} reserved
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
            p.status === "Active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : p.status === "Out of Stock"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {p.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">

          <button
            type="button"
            onClick={() =>
              navigateTo("edit-product", { productId: p.id })
            }
            className="cursor-pointer p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            title="Edit Product"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => duplicateProduct(p.id)}
            className="cursor-pointer p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors"
            title="Duplicate Product"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(p)}
            className="cursor-pointer p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-100 transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

        </div>
      </td>

    </tr>
  );
};

export default ProductRow;