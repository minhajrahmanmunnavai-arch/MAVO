
import React, { useEffect, useState } from 'react';
import CouponCodeInput from './CouponCodeInput';

export default function CouponFormModal({
  isOpen,
  onClose,
  onSubmit,
  generateRandomCode
}) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('100.00');
  const [maxDiscount, setMaxDiscount] = useState('50.00');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState('500');

  // Generate code when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode(generateRandomCode());
    }
  }, [isOpen]);

  const handleGenerateCode = () => {
    setCode(generateRandomCode());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!code.trim() || !discountValue) return;

    onSubmit({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit
    });

    // Reset form
    setCode('');
    setDiscountValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-form-title"
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <h2 id="coupon-form-title" className="mb-5 text-lg font-semibold text-gray-900">
          Configure New Promotional Coupon
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

        {/* Coupon Code */}
        <CouponCodeInput
          code={code}
          setCode={setCode}
          onGenerate={handleGenerateCode}
        />

        {/* Discount Type & Value */}
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Discount Type
            </label>

            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Currency (৳)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Value <span className="text-red-600">*</span>
            </label>

            <input
              type="number"
              required
              min="0"
              placeholder="20"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        {/* Purchase & Discount Limits */}
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Min. Cart Spend (৳)
            </label>

            <input
              type="number"
              min="0"
              value={minPurchase}
              onChange={(e) => setMinPurchase(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Max. Discount Limit (৳)
            </label>

            <input
              type="number"
              min="0"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Expiration Date
            </label>

            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        {/* Usage Limit */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Usage Limit
          </label>

          <input
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-200 pt-3">

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Save Coupon
          </button>

        </div>

        </form>
      </section>
    </div>
  );
}
