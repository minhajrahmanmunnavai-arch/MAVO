
import React from "react";
import { Search } from "lucide-react";

export default function CustomerSearch({
  searchTerm,
  setSearchTerm,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="Search customers by name, email, or telephone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

    </div>
  );
}
