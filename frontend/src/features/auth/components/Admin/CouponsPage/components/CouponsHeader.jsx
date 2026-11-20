
import React from 'react';
import { Plus } from 'lucide-react';

export default function CouponsHeader({ onCreateCoupon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Promotional Coupons
        </h1>

        <p className="text-xs text-gray-500 mt-0.5">
          Configure discount codes, tiered order thresholds, and promotion usage limits.
        </p>
      </div>

      <button
        type="button"
        onClick={onCreateCoupon}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
      >
        <Plus className="w-4 h-4" />
        <span>Create Coupon</span>
      </button>

    </div>
  );
}
