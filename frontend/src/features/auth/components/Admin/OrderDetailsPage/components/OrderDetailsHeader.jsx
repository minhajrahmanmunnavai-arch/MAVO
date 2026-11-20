
import React from "react";
import { ArrowDownToLine, ArrowLeft, LoaderCircle, Printer } from "lucide-react";

export default function OrderDetailsHeader({
  order,
  onBack,
  onStatusChange,
  onPrint,
  onDownloadPdf,
  isDownloadingPdf,
}) {
  const statusClass =
    order.orderStatus === "Delivered"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : order.orderStatus === "Shipped"
      ? "bg-blue-50 text-blue-700 border border-blue-200"
      : "bg-amber-50 text-amber-700 border border-amber-200";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      {/* Order Information */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1.5 mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Orders
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 font-mono">
            Order #{order.id}
          </h1>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${statusClass}`}
          >
            {order.orderStatus}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Placed on{" "}
          <span className="font-mono text-gray-700">
            {order.date}
          </span>{" "}
          via {order.paymentMethod}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">

        {/* Status Changer */}
        <select
          value={order.orderStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:border-blue-500"
        >
          <option value="Pending">Mark as Pending</option>
          <option value="Processing">Mark as Processing</option>
          <option value="Shipped">Mark as Shipped</option>
          <option value="Delivered">Mark as Delivered</option>
          <option value="Cancelled">Mark as Cancelled</option>
        </select>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
          title="Download packing slip as PDF"
        >
          {isDownloadingPdf ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDownToLine aria-hidden="true" className="h-4 w-4" />
          )}
          {isDownloadingPdf ? "Preparing..." : "Download PDF"}
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          title="Print packing slip"
        >
          <Printer aria-hidden="true" className="h-4 w-4" />
          Print
        </button>

      </div>
    </div>
  );
}
