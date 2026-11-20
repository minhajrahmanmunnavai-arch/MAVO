
import React from "react";
import { Search } from "lucide-react";

export default function CategorySearch({ searchTerm, setSearchTerm }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  );
}
