import { api } from "./auth.api.js";

const formatStatus = (status) =>
  String(status || "pending")
    .toLowerCase()
    .replace(/(^|[\s_-])([a-z])/g, (_, separator, character) =>
      `${separator ? " " : ""}${character.toUpperCase()}`
    );

const normalizeTimeline = (order) => {
  const events = Array.isArray(order.timeline) && order.timeline.length
    ? order.timeline
    : [{ status: order.status || order.orderStatus || "pending", changedAt: order.updatedAt || order.createdAt }];

  return events.map((event) => {
    const status = String(event.status || "pending").toLowerCase();
    const label = status === "pending"
      ? "Order Placed"
      : `Marked ${formatStatus(status)}`;
    const changedAt = event.changedAt || event.createdAt;

    return {
      step: label,
      done: true,
      time: changedAt ? new Date(changedAt).toLocaleString() : "—",
    };
  });
};

const normalizeOrder = (order) => {
  const products = Array.isArray(order.products) ? order.products : [];
  const items = products.map((item) => {
    const product =
      item.product && typeof item.product === "object" ? item.product : {};

    return {
      name: product.title || product.productName || "Product",
      sku: product.sku || "—",
      image: product.mainImage || "",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0,
    };
  });
  const total = Number(order.totalAmount) || 0;

  return {
    ...order,
    id: String(order._id || order.id),
    date: order.createdAt ? new Date(order.createdAt).toLocaleString() : "—",
    customer: {
      id: order.user?._id || order.user || "",
      name: order.user?.username || order.address?.fullName || "Unknown customer",
      email: order.user?.email || order.address?.email || "—",
      phone: order.address?.phoneNumber || "—",
    },
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    orderStatus: formatStatus(order.status || order.orderStatus),
    timeline: normalizeTimeline(order),
    paymentStatus: order.paymentStatus || "Pending",
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    total,
    shippingCost: 0,
    discount: 0,
  };
};

export async function getAdminOrders() {
  const response = await api.get("/api/orders");
  if (!Array.isArray(response.data?.orders)) {
    throw new Error("Unable to load orders: invalid server response.");
  }
  return response.data.orders.map(normalizeOrder);
}

export async function updateAdminOrderStatus(orderId, status) {
  const response = await api.put(`/api/orders/${orderId}/status`, {
    status: String(status).toLowerCase(),
  });
  if (!response.data?.order?._id) {
    throw new Error("Order status update failed: invalid server response.");
  }
  return normalizeOrder(response.data.order);
}

export async function deleteAdminOrder(orderId) {
  const response = await api.delete(
    `/api/orders/admin/${encodeURIComponent(orderId)}`
  );
  if (response.data?.orderId !== orderId) {
    throw new Error("Order deletion failed: invalid server response.");
  }
}
