
import React, { useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";

// Components
import OrderDetailsHeader from "./components/OrderDetailsHeader";
import OrderTimeline from "./components/OrderTimeline";
import OrderInformation from "./components/OrderInformation";
import OrderItemsTable from "./components/OrderItemsTable";
import OrderTotals from "./components/OrderTotals";
import OrderStatusModal from "./components/OrderStatusModal";
import OrderPackingSlip from "./components/OrderPackingSlip.jsx";
import { downloadPackingSlipPdf } from "./components/packingSlipPdf.js";

export default function OrderDetailsPage() {
  const {
    orders,
    selectedOrderId,
    updateOrderStatus,
    navigateTo,
  } = useAdmin();

  const sourceOrder = orders.find(
    (item) => String(item.id || item._id) === String(selectedOrderId)
  );
  const order = sourceOrder
    ? {
        ...sourceOrder,
        id: String(sourceOrder.id || sourceOrder._id),
        orderStatus: sourceOrder.orderStatus || sourceOrder.status || "Pending",
        date:
          sourceOrder.date ||
          (sourceOrder.createdAt
            ? new Date(sourceOrder.createdAt).toLocaleString()
            : "—"),
        paymentMethod:
          sourceOrder.paymentMethod === "cash_on_delivery"
            ? "Cash on Delivery"
            : sourceOrder.paymentMethod || "—",
        paymentStatus: sourceOrder.paymentStatus || "Pending",
        customer: {
          id: sourceOrder.customer?.id || sourceOrder.customer?._id,
          name:
            sourceOrder.customer?.name ||
            sourceOrder.customer?.username ||
            sourceOrder.address?.fullName ||
            "Unknown customer",
          email: sourceOrder.customer?.email || sourceOrder.address?.email || "—",
          phone: sourceOrder.customer?.phone || sourceOrder.address?.phoneNumber || "—",
        },
        shippingAddress: sourceOrder.shippingAddress || sourceOrder.address || {},
        items: (sourceOrder.items || sourceOrder.products || []).map((item) => {
          const product = item.product && typeof item.product === "object"
            ? item.product
            : {};
          const price = Number(item.price ?? product.price) || 0;
          return {
            name: item.name || product.title || product.productName || "Product",
            sku: item.sku || product.sku || "—",
            image: item.image || product.mainImage || "",
            price,
            quantity: Number(item.quantity) || 1,
          };
        }),
        subtotal: Number(sourceOrder.subtotal ?? sourceOrder.totalAmount ?? sourceOrder.total) || 0,
        shippingCost: Number(sourceOrder.shippingCost) || 0,
        discount: Number(sourceOrder.discount) || 0,
        total: Number(sourceOrder.total ?? sourceOrder.totalAmount) || 0,
        timeline: Array.isArray(sourceOrder.timeline) ? sourceOrder.timeline : [],
      }
    : null;

  const [selectedNewStatus, setSelectedNewStatus] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Order Not Found
  if (!order) {
    return (
      <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
        <p className="text-sm text-gray-500 mb-4">
          Order record not found.
        </p>

        <button
          type="button"
          onClick={() => navigateTo("orders")}
          className="cursor-pointer px-4 py-2 bg-black hover:bg-gray-700 text-white rounded-lg text-xs font-semibold"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  // Status Change Click
  const handleStatusChangeClick = (newStatus) => {
    if (newStatus === order.orderStatus) return;

    setSelectedNewStatus(newStatus);
    setIsConfirmModalOpen(true);
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!selectedNewStatus) return;

    const updated = await updateOrderStatus(order.id, selectedNewStatus);
    if (updated) {
      setIsConfirmModalOpen(false);
      setSelectedNewStatus("");
    }
  };

  // Customer Details Navigation
  const handleViewCustomer = () => {
    navigateTo("customer-details", {
      customerId: order.customer.id,
    });
  };

  // Back to Orders
  const handleBackToOrders = () => {
    navigateTo("orders");
  };

  const handlePrint = () => {
    const shouldPrint = window.confirm(
      "Make sure your printer is connected. You can select an available printer in the next dialog. Continue?"
    );
    if (shouldPrint) window.print();
  };

  const handleDownloadPdf = () => {
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    setDownloadError("");
    window.requestAnimationFrame(async () => {
      try {
        await downloadPackingSlipPdf(order);
        window.setTimeout(() => setIsDownloadingPdf(false), 900);
      } catch (error) {
        console.error("Unable to download packing slip PDF:", error);
        setIsDownloadingPdf(false);
        setDownloadError("Unable to create the PDF. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <OrderDetailsHeader
        order={order}
        onBack={handleBackToOrders}
        onStatusChange={handleStatusChangeClick}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
      />

      {downloadError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {downloadError}
        </p>
      )}

      <div className="packing-slip-screen">
        <OrderPackingSlip order={order} />
      </div>

      {/* Fulfillment Timeline */}
      <OrderTimeline timeline={order.timeline} />

      {/* Customer, Address & Payment */}
      <OrderInformation
        order={order}
        onViewCustomer={handleViewCustomer}
      />

      {/* Merchandise Breakdown */}
      <OrderItemsTable items={order.items} />

      {/* Order Totals */}
      <OrderTotals order={order} />

      {/* Status Confirmation Modal */}
      <OrderStatusModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        orderId={order.id}
        selectedNewStatus={selectedNewStatus}
      />

      {isDownloadingPdf && (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Preparing your packing slip PDF"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/30">
              <span className="text-2xl font-bold">M</span>
            </div>
            <p className="mt-5 text-base font-semibold text-gray-900">
              Preparing your packing slip
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Your PDF download will begin shortly.
            </p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-linear-to-r from-blue-500 to-violet-500" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
