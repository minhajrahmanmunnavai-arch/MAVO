
import React from "react";

const PricingSection = ({
  price,
  discountPrice,
  tax,
  setPrice,
  setDiscountPrice,
  setTax,
  fieldErrors = {},
  onRequiredFieldChange = () => {},
}) => {
  const toNonNegativeNumber = (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= 0
      ? number
      : null;
  };

  const regularPrice = toNonNegativeNumber(price);
  const salePrice = toNonNegativeNumber(discountPrice);
  const taxValue = toNonNegativeNumber(tax);

  const saleExceedsRegular =
    regularPrice !== null &&
    salePrice !== null &&
    salePrice > regularPrice;

  // Discount Calculation
  const discountPercentage =
    regularPrice !== null &&
    regularPrice > 0 &&
    salePrice !== null &&
    salePrice < regularPrice
      ? ((regularPrice - salePrice) / regularPrice) * 100
      : null;

  // Savings Calculation
  const savings =
    regularPrice !== null &&
    salePrice !== null &&
    !saleExceedsRegular
      ? regularPrice - salePrice
      : null;

  const formattedDiscount =
    discountPercentage === null
      ? ""
      : discountPercentage.toFixed(2);

  const formatPrice = (value) =>
    value === null ? "—" : `৳${value.toFixed(2)}`;

  // Price Change
  const handlePriceChange = (setter, value, fieldName) => {
    if (value !== "") {
      const number = Number(value);

      if (!Number.isFinite(number) || number < 0) {
        return;
      }
    }

    setter(value);

    if (fieldName === "price") {
      onRequiredFieldChange("price", value);
    }
  };

  // Tax Change
  const handleTaxChange = (value) => {
    if (value !== "") {
      const number = Number(value);

      if (!Number.isFinite(number) || number < 0) {
        return;
      }
    }

    setTax(value);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">

      <h2 className="text-sm font-bold text-gray-500 border-b border-gray-200 pb-3">
        Pricing & Valuation
      </h2>

      <div className="space-y-3">

        {/* Regular Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Regular Price (৳) <span className="text-red-400">*</span>
          </label>

          <input
            type="number"
            value={price}
            min="0"
            step="0.01"
            placeholder="249.00"
            aria-invalid={Boolean(fieldErrors.price)}
            onChange={(e) =>
              handlePriceChange(setPrice, e.target.value, "price")
            }
            className={`w-full bg-white border ${
              fieldErrors.price ? "border-red-500" : "border-gray-300"
            } rounded-lg px-3.5 py-2 text-xs text-gray-500 font-mono font-bold outline-0`}
          />

          {fieldErrors.price && (
            <p className="mt-1 text-xs text-red-500">
              This field is required
            </p>
          )}
        </div>

        {/* Sale Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Sale Promotional Price (৳)
          </label>

          <input
            type="number"
            value={discountPrice}
            min="0"
            max={price || undefined}
            step="0.01"
            placeholder="199.00"
            aria-invalid={saleExceedsRegular}
            onChange={(e) =>
              handlePriceChange(
                setDiscountPrice,
                e.target.value,
                "discountPrice"
              )
            }
            className={`w-full bg-white border ${
              saleExceedsRegular ? "border-red-500" : "border-gray-300"
            } rounded-lg px-3.5 py-2 text-xs text-gray-500 font-mono font-bold outline-0`}
          />

          {saleExceedsRegular && (
            <p className="mt-1 text-xs text-red-500" role="alert">
              Sale Price cannot be greater than Regular Price.
            </p>
          )}
        </div>

        {/* Discount Percentage */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Discount Percentage (%)
          </label>

          <input
            type="text"
            value={formattedDiscount}
            readOnly
            placeholder="0.00"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-500 font-mono outline-none"
          />
        </div>

        {/* Tax Percentage */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Tax Percentage (%)
          </label>

          <input
            type="number"
            value={tax}
            min="0"
            step="0.01"
            placeholder="5.00"
            onChange={(e) => handleTaxChange(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-500 font-mono font-bold outline-0"
          />
        </div>

      </div>

      {/* Price Preview */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2 text-xs text-gray-600">

        <h3 className="font-semibold text-gray-700">
          Price Preview
        </h3>

        <div className="flex justify-between">
          <span>Regular Price</span>
          <span className="font-mono">{formatPrice(regularPrice)}</span>
        </div>

        <div className="flex justify-between">
          <span>Sale Price</span>
          <span className="font-mono">{formatPrice(salePrice)}</span>
        </div>

        <div className="flex justify-between">
          <span>Discount</span>
          <span className="font-mono">
            {discountPercentage === null ? "—" : `${formattedDiscount}%`}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Total Savings</span>
          <span className="font-mono">{formatPrice(savings)}</span>
        </div>

        <div className="flex justify-between">
          <span>Tax</span>
          <span className="font-mono">
            {taxValue === null ? "—" : `${taxValue}%`}
          </span>
        </div>

      </div>

    </div>
  );
};

export default PricingSection;
