
import React from 'react';

export default function CouponCodeInput({
  code,
  setCode,
  onGenerate
}) {
  return (
    <div>

      <div className="flex items-center justify-between mb-1">

        <label className="text-xs font-semibold text-gray-700">
          Coupon Code <span className="text-red-600">*</span>
        </label>

        <button
          type="button"
          onClick={onGenerate}
          className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Auto Generate
        </button>

      </div>

      <input
        type="text"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="e.g. SUMMER25"
      />

    </div>
  );
}
