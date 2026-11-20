
import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function CustomerOrderRow({
  order,
  onViewOrder
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">

      <td className="py-3 px-4 font-mono font-bold text-blue-700">
        {order.id}
      </td>

      <td className="py-3 px-4 font-mono text-gray-600">
        {order.date}
      </td>

      <td className="py-3 px-4 font-mono text-gray-600">
        {order.items.length} items
      </td>

      <td className="py-3 px-4 font-mono font-bold text-gray-900">
        ৳{order.total.toFixed(2)}
      </td>

      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200">
          {order.orderStatus}
        </span>
      </td>

      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={() => onViewOrder(order.id)}
          className="p-1.5 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
          title="View order"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </td>

    </tr>
  );
}
