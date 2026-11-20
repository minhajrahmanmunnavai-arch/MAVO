
import React, { useState } from "react";
import { useAdmin } from "../../contex/AdminContext.jsx";

// Components
import OrdersHeader from "./components/OrdersHeader";
import OrdersFilters from "./components/OrdersFilters";
import OrdersTable from "./components/OrdersTable";
import { deleteAdminOrder } from "../../../services/adminOrder.api.js";

export default function OrdersPage() {
  const {
    orders,
    ordersLoading,
    ordersError,
    navigateTo,
    setOrders,
    addToast,
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    const orderId = String(order.id || order._id || "");
    const customerName = String(
      order.customer?.name || order.customer?.username || order.address?.fullName || ""
    );
    const customerEmail = String(order.customer?.email || order.address?.email || "");
    const orderStatus = String(order.orderStatus || order.status || "Pending").toLowerCase();
    const paymentStatus = order.paymentStatus || "Pending";
    const matchesSearch =
      orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      orderStatus === statusFilter.toLowerCase();

    const matchesPayment =
      paymentFilter === "All" ||
      paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Navigate to Order Details
  const handleViewOrder = (orderId) => {
    navigateTo("order-details", { orderId });
  };

  const handleDeleteOrder = async (order) => {
    if (deletingOrderId) return;

    const orderId = String(order.id || order._id);
    setDeletingOrderId(orderId);
    setDeleteError("");
    try {
      await deleteAdminOrder(orderId);
      setOrders((currentOrders) =>
        currentOrders.filter(
          (order) => String(order.id || order._id) !== orderId
        )
      );
      addToast({
        title: "Order Deleted",
        message: `Order #${orderId} was deleted.`,
        type: "success",
      });
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || error.message || "Unable to delete order."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <OrdersHeader />

      {/* Search & Filters */}
      <OrdersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
      />

      {ordersError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {ordersError}
        </p>
      )}

      {deleteError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {deleteError}
        </p>
      )}

      {/* Orders Table */}
      <OrdersTable
        orders={filteredOrders}
        onViewOrder={handleViewOrder}
        onDeleteOrder={handleDeleteOrder}
        deletingOrderId={deletingOrderId}
        isLoading={ordersLoading}
      />

    </div>
  );
}
