
import React from "react";
import { Plus } from "lucide-react";

export default function CategoriesHeader({ onAddCategory }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Category Taxonomy
        </h1>

        <p className="text-xs text-gray-500 mt-0.5">
          Organize catalog verticals, navigation hierarchies, and department filters.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddCategory}
        className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
      >
        <Plus size={16} />
        Add Category
      </button>
    </div>
  );
}
