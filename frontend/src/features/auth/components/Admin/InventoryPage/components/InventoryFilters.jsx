
import React from "react";
import { Search } from "lucide-react";

const stockFilters = ["All", "In Stock", "Low Stock", "Out of Stock"];

export default function InventoryFilters({
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">

      {/* Search */}
      <div className="w-full sm:w-80 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="Search inventory by title or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Stock Filter Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        {stockFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStockFilter(filter)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              stockFilter === filter
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

    </div>
  );
}
