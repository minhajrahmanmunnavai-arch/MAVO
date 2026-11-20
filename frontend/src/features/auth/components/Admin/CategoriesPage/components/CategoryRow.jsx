
import React from "react";
import { Layers, Edit, Trash2, Check } from "lucide-react";

export default function CategoryRow({ category, onDelete }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Category Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers size={16} />
          </div>

          <span className="text-sm font-semibold text-gray-900">
            {category.name}
          </span>
        </div>
      </td>

      {/* Slug */}
      <td className="py-3 px-4">
        <span className="text-xs text-gray-500 font-mono">
          /{category.slug}
        </span>
      </td>

      {/* Description */}
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">
          {category.description || "—"}
        </span>
      </td>

      {/* Parent */}
      <td className="py-3 px-4">
        <span className="text-sm text-gray-700">
          {category.parent || "None"}
        </span>
      </td>

      {/* Product Count */}
      <td className="py-3 px-4">
        <span className="text-sm text-gray-700">
          {category.productCount || 0} items
        </span>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            category.status === "Active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {category.status === "Active" && <Check size={12} />}
          {category.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            title="Edit Category"
          >
            <Edit size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(category)}
            className="cursor-pointer p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-100 transition-colors"
            title="Delete Category"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
