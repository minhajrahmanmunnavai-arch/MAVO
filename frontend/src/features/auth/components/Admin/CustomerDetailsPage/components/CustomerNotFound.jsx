
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CustomerNotFound({ onBack }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Customer not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This customer may no longer be available in the customer list.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </button>
    </div>
  );
}
