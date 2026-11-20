
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Trash2 } from "lucide-react";

export default function OrderRow({
  order,
  onViewOrder,
  onDeleteOrder,
  isDeleting = false,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);
  const orderId = order.id || order._id || "Unknown";
  const customerName =
    order.customer?.name ||
    order.customer?.username ||
    order.address?.fullName ||
    "Unknown customer";
  const customerEmail =
    order.customer?.email || order.address?.email || "—";
  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.products)
      ? order.products
      : [];
  const itemCount = Number.isInteger(order.itemCount)
    ? order.itemCount
    : items.length;
  const total = Number(order.total ?? order.totalAmount) || 0;
  const orderStatus = order.orderStatus || order.status || "Pending";
  const paymentMethod =
    order.paymentMethod === "cash_on_delivery"
      ? "Cash on Delivery"
      : order.paymentMethod || "—";
  const paymentStatus = order.paymentStatus || "Pending";

  // Order Status Styling
  const statusClass =
    orderStatus === "Delivered" || orderStatus === "delivered"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : orderStatus === "Shipped" || orderStatus === "shipped"
      ? "bg-blue-50 text-blue-700 border border-blue-200"
      : orderStatus === "Processing" || orderStatus === "pending"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-gray-100 text-gray-600 border border-gray-200";

  // Payment Status Styling
  const paymentClass =
    paymentStatus === "Paid"
      ? "text-emerald-700 bg-emerald-50"
      : paymentStatus === "Refunded"
      ? "text-red-700 bg-red-50"
      : "text-amber-700 bg-amber-50";

  useEffect(() => {
    if (!contextMenu) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!contextMenuRef.current?.contains(event.target)) {
        setContextMenu(null);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setContextMenu(null);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({
      left: Math.max(8, Math.min(event.clientX, window.innerWidth - 168)),
      top: Math.max(8, Math.min(event.clientY, window.innerHeight - 48)),
    });
  };

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onContextMenu={handleContextMenu}
    >

      {/* Order ID */}
      <td className="py-3 px-4 font-mono font-bold text-blue-700">
        <button
          type="button"
          onClick={() => onViewOrder(orderId)}
          className="cursor-pointer hover:underline"
        >
          {orderId}
        </button>
      </td>

      {/* Customer Details */}
      <td className="py-3 px-4">
        <div className="font-semibold text-gray-900">
          {customerName}
        </div>

        <div className="text-[10px] text-gray-500">
          {customerEmail}
        </div>
      </td>

      {/* Date & Time */}
      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
        {order.date || (order.createdAt ? new Date(order.createdAt).toLocaleString() : "—")}
      </td>

      {/* Items */}
      <td className="py-3 px-4 font-mono text-gray-600">
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </td>

      {/* Total Amount */}
      <td className="py-3 px-4 font-mono font-bold text-gray-900">
        ৳{total.toFixed(2)}
      </td>

      {/* Payment Method */}
      <td className="py-3 px-4">
        <div className="text-gray-700 text-[11px]">
          {paymentMethod}
        </div>

        <span
          className={`inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded ${paymentClass}`}
        >
          {paymentStatus}
        </span>
      </td>

      {/* Order Status */}
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${statusClass}`}
        >
          {orderStatus}
        </span>
      </td>

      {/* Fulfillment */}
      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={() => onViewOrder(orderId)}
          className="cursor-pointer px-2.5 py-1 bg-black hover:bg-gray-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors"
        >
          <span>Details</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </td>

      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            role="menu"
            aria-label={`Actions for order ${orderId}`}
            className="fixed z-50 min-w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
            style={{ left: contextMenu.left, top: contextMenu.top }}
          >
            <button
              type="button"
              role="menuitem"
              disabled={isDeleting}
              onClick={() => {
                setContextMenu(null);
                onDeleteOrder(order);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>,
          document.body
        )}

    </tr>
  );
}
