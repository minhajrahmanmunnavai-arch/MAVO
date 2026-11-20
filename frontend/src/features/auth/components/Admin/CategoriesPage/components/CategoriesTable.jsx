
import React from "react";
import CategoryRow from "./CategoryRow";

export default function CategoriesTable({ categories, onDelete, loading = false }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Catalog Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500 text-xs">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-12 text-center text-gray-500 text-xs"
                >
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
