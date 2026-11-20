import React from "react";
import { Search } from "lucide-react";

const ProductFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStockStatus,
  setSelectedStockStatus,
  selectedStatus,
  setSelectedStatus,
  categories,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Search products by title, SKU, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Categories</option>

          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={selectedStockStatus}
          onChange={(e) => setSelectedStockStatus(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 cursor-pointer focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Stock Levels</option>
          <option value="In Stock">In Stock (&gt; threshold)</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock (0)</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

      </div>
    </div>
  );
};

export default ProductFilters;