import { api } from "./auth.api.js";

function normalizeCustomer(customer) {
  return {
    id: String(customer._id || customer.id),
    name: customer.name || "Unknown customer",
    email: customer.email || "",
    phone: customer.phone || "—",
    ordersCount: Number(customer.ordersCount) || 0,
    totalSpent: Number(customer.totalSpent) || 0,
    status: customer.status || "Active",
    registeredAt: customer.registeredAt
      ? new Date(customer.registeredAt).toLocaleDateString()
      : "—",
  };
}

export async function getAdminCustomers() {
  const response = await api.get("/api/admin/customers");
  if (!Array.isArray(response.data?.customers)) {
    throw new Error("Unable to load customers: invalid server response.");
  }
  return response.data.customers.map(normalizeCustomer);
}
