import React from "react";
import { Trash2 } from "lucide-react";

const BulkActionBar = ({
  selectedIds,
  setSelectedIds,
  onDelete,
}) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 animate-in fade-in duration-150">

      <span className="text-xs font-semibold text-blue-800">
        {selectedIds.length} products selected
      </span>

      <div className="flex items-center gap-2">

        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Selected</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedIds([])}
          className="cursor-pointer px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
        >
          Cancel
        </button>

      </div>
    </div>
  );
};

export default BulkActionBar;