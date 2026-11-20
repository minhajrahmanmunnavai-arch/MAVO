
import React from "react";
import { Check } from "lucide-react";

export default function StockUpdateInput({
  productId,
  currentVal,
  isEditing,
  isSaving,
  onChange,
  onSave,
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <input
        type="number"
        min="0"
        value={currentVal}
        onChange={(e) => onChange(productId, e.target.value)}
        className="w-16 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 font-mono text-center focus:outline-none focus:border-blue-500"
      />

      {isEditing ? (
        <button
          type="button"
          onClick={() => onSave(productId)}
          disabled={isSaving}
          className="cursor-pointer p-1.5 bg-black hover:bg-gray-700 text-white rounded transition-colors"
          title="Save stock level"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="text-[10px] text-gray-500">
          units
        </span>
      )}
    </div>
  );
}
