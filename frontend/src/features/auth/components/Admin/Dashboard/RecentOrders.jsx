
import React from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

const RecentOrders = ({ orders = [], navigateTo }) => {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">

        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Recent Fulfillment Orders
          </h2>

          <p className="text-[11px] text-gray-500">
            Latest transactions received across channels
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo("orders")}
          className="px-5 py-2 cursor-pointer bg-black hover:bg-gray-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
        >
          All Orders
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">

        <table className="w-full text-left border-collapse text-xs">

          <thead>
            <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">

              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">View</th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {orders.map((ord) => {
              const items = Array.isArray(ord?.items) ? ord.items : [];
              const customer = ord?.customer ?? {};
              const total = Number(ord?.total ?? 0);
              const orderStatus = ord?.orderStatus ?? "Pending";

              return (
                <tr
                  key={ord.id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                    {ord.id}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">
                      {customer.name ?? "Unknown customer"}
                    </div>

                    <div className="text-[10px] text-gray-500">
                      {customer.email ?? "No email"}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                    {(ord?.date ?? "").split(" ")[0] || "N/A"}
                  </td>

                  <td className="py-3 px-4 font-mono text-gray-600">
                    {items.length}{" "}
                    {items.length === 1 ? "item" : "items"}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-gray-900">
                    ৳{total.toFixed(2)}
                  </td>

                  <td className="py-3 px-4">

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                        orderStatus === "Delivered"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : orderStatus === "Shipped"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : orderStatus === "Processing"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {orderStatus}
                    </span>

                  </td>

                  <td className="py-3 px-4 text-right">

                    <button
                      type="button"
                      onClick={() =>
                        navigateTo("order-details", {
                          orderId: ord.id,
                        })
                      }
                      className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 transition-colors"
                      title="View Order Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                  </td>

                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-gray-500"
                >
                  No orders found.
                </td>
              </tr>
            )}

          </tbody>
        </table>

      </div>
    </div>
  );
};

export default RecentOrders;
