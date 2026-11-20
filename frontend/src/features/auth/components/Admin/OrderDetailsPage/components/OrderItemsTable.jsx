
import React from "react";

export default function OrderItemsTable({ items = [] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Merchandise Breakdown ({items.length} items)
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">

          <thead>
            <tr className="border-b cursor-pointer border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Unit Price</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4 text-right">Subtotal</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors"
              >

                {/* Item */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                    />

                    <span className="font-semibold text-gray-900">
                      {item.name}
                    </span>
                  </div>
                </td>

                {/* SKU */}
                <td className="py-3 px-4 font-mono text-gray-500">
                  {item.sku}
                </td>

                {/* Unit Price */}
                <td className="py-3 px-4 font-mono text-gray-600">
                  ৳{Number(item.price).toFixed(2)}
                </td>

                {/* Quantity */}
                <td className="py-3 px-4 font-mono text-gray-600">
                  {item.quantity}
                </td>

                {/* Subtotal */}
                <td className="py-3 px-4 font-mono font-bold text-gray-900 text-right">
                  ৳{(Number(item.price) * item.quantity).toFixed(2)}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}
