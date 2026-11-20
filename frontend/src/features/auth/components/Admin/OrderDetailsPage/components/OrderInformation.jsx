
import React from "react";
import { User, MapPin, CreditCard } from "lucide-react";

export default function OrderInformation({
  order,
  onViewCustomer,
}) {
  const shippingAddress = order.shippingAddress || {};
  const addressLine = shippingAddress.address || shippingAddress.street || shippingAddress.addressLine1;
  const regionLine =
    shippingAddress.region ||
    [shippingAddress.city, shippingAddress.state, shippingAddress.postalCode]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* Customer Information */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">

        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <User className="w-4 h-4 text-blue-600" />

          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Customer Profile
          </h2>
        </div>

        <div>
          <div className="text-sm font-bold text-gray-900">
            {order.customer.name}
          </div>

          <div className="text-xs text-gray-500">
            {order.customer.email}
          </div>

          <div className="text-xs text-gray-500 font-mono mt-0.5">
            {order.customer.phone}
          </div>
        </div>

        <button
          type="button"
          onClick={onViewCustomer}
          className="cursor-pointer text-xs text-blue-700 hover:underline block pt-1"
        >
          View Customer History &rarr;
        </button>

      </div>

      {/* Shipping Address */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">

        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <MapPin className="w-4 h-4 text-emerald-600" />

          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Destination Address
          </h2>
        </div>

        <div className="text-xs text-gray-700 leading-relaxed font-sans">
          {addressLine && <div>{addressLine}</div>}
          {regionLine && <div>{regionLine}</div>}
          {shippingAddress.country && <div>{shippingAddress.country}</div>}
        </div>

      </div>

      {/* Payment Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">

        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <CreditCard className="w-4 h-4 text-purple-600" />

          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Payment & Settlement
          </h2>
        </div>

        <div className="space-y-1.5 text-xs">

          <div className="flex justify-between">
            <span className="text-gray-500">Channel</span>

            <span className="text-gray-800 font-medium">
              {order.paymentMethod}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Payment Status</span>

            <span className="text-emerald-700 font-bold font-mono">
              {order.paymentStatus}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Currency</span>

            <span className="text-gray-800 font-mono">
              BDT (৳)
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
