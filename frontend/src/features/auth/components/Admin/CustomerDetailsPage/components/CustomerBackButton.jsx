
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CustomerBackButton({ onBack }) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Customers
      </button>
    </div>
  );
}
