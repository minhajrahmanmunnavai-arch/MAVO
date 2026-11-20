
import React from 'react';
import { Copy, Trash2 } from 'lucide-react';

export default function CouponRow({
  coupon,
  onCopyCode,
  onDeleteCoupon
}) {
  return (
    <tr className="transition-colors hover:bg-gray-50">

      {/* Coupon Code */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">

          <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-sm font-bold text-blue-700">
            {coupon.code}
          </span>

          <button
            type="button"
            onClick={() => onCopyCode(coupon.code)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Copy code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

        </div>
      </td>

      {/* Benefit */}
      <td className="py-3 px-4 font-mono font-bold text-gray-800">
        {coupon.discountType === 'percentage'
          ? `${coupon.discountValue}% OFF`
          : `৳${coupon.discountValue} OFF`}
      </td>

      {/* Thresholds */}
      <td className="py-3 px-4 font-mono text-gray-700">
        <div>Min: ৳{coupon.minPurchase.toFixed(2)}</div>

        <div className="text-[10px] text-gray-500">
          Cap: ৳{coupon.maxDiscount.toFixed(2)}
        </div>
      </td>

      {/* Validity */}
      <td className="py-3 px-4 font-mono text-gray-500">
        <div>{coupon.startDate}</div>

        <div className="text-gray-700">
          to {coupon.expiryDate}
        </div>
      </td>

      {/* Redemption Count */}
      <td className="py-3 px-4 font-mono">
        <span className="font-bold text-gray-900">
          {coupon.usageCount}
        </span>

        <span className="text-gray-500">
          {' '}/ {coupon.usageLimit}
        </span>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
            coupon.status === 'Active'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-gray-200 bg-gray-100 text-gray-600'
          }`}
        >
          {coupon.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={() => onDeleteCoupon(coupon)}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete Coupon"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>

    </tr>
  );
}
