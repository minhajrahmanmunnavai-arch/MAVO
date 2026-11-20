
import React from "react";
import { ArrowRight } from "lucide-react";

export default function CustomersTable({
  customers,
  onViewCustomer,
  loading = false,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">

          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Orders Placed</th>
              <th className="py-3 px-4">Lifetime Spent</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4">Registered Date</th>
              <th className="py-3 px-4 text-right">View Profile</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500 text-xs">
                  Loading customers...
                </td>
              </tr>
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 shrink-0">
                        {customer.name.charAt(0)}
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => onViewCustomer(customer.id)}
                          className="cursor-pointer font-semibold text-gray-900 hover:text-blue-600 text-left"
                        >
                          {customer.name}
                        </button>

                        <div className="text-[10px] text-gray-500">
                          {customer.email}
                        </div>
                      </div>

                    </div>
                  </td>

                  {/* Contact Phone */}
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {customer.phone}
                  </td>

                  {/* Orders */}
                  <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                    {customer.ordersCount} orders
                  </td>

                  {/* Lifetime Spent */}
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    ৳{customer.totalSpent.toFixed(2)}
                  </td>

                  {/* Account Status */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {customer.status}
                    </span>
                  </td>

                  {/* Registered Date */}
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {customer.registeredAt}
                  </td>

                  {/* View Profile */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewCustomer(customer.id)}
                      className="cursor-pointer px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <span>History</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-10 text-center text-gray-500"
                >
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
