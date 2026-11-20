
import React from 'react';
import CouponRow from './CouponRow';

export default function CouponsTable({
  coupons,
  loading,
  onCopyCode,
  onDeleteCoupon
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="w-full text-left border-collapse text-xs">

          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="py-3 px-4">Coupon Code</th>
              <th className="py-3 px-4">Benefit</th>
              <th className="py-3 px-4">Thresholds</th>
              <th className="py-3 px-4">Validity Window</th>
              <th className="py-3 px-4">Redemption Count</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {coupons.map((coupon) => (
              <CouponRow
                key={coupon.id}
                coupon={coupon}
                onCopyCode={onCopyCode}
                onDeleteCoupon={onDeleteCoupon}
              />
            ))}

            {loading && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-xs text-gray-500">
                  Loading coupons...
                </td>
              </tr>
            )}

            {!loading && coupons.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="py-8 text-center text-xs text-gray-500"
                >
                  No coupons found.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
