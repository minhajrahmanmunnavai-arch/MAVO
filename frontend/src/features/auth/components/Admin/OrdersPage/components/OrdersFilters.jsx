
import React from "react";
import { Search } from "lucide-react";

export default function OrdersFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="Search by order ID, customer name, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Order Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
      >
        <option value="All">All Fulfillment Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Processing">Processing</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      {/* Payment Filter */}
      <select
        value={paymentFilter}
        onChange={(e) => setPaymentFilter(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
      >
        <option value="All">All Payment States</option>
        <option value="Paid">Paid</option>
        <option value="Pending">Pending / COD</option>
        <option value="Refunded">Refunded</option>
      </select>

    </div>
  );
}
