import { api } from "./auth.api.js";

export async function getAdminOrderStats() {
  const response = await api.get("/api/analytics/orders");
  const stats = response.data;

  if (
    !Number.isFinite(stats?.totalOrders) ||
    !Number.isFinite(stats?.currentMonthOrders) ||
    !Number.isFinite(stats?.previousMonthOrders) ||
    (stats.monthOverMonthChange !== null &&
      !Number.isFinite(stats.monthOverMonthChange))
  ) {
    throw new Error("Unable to load dashboard order stats: invalid server response.");
  }

  return {
    totalOrders: stats.totalOrders,
    currentMonthOrders: stats.currentMonthOrders,
    previousMonthOrders: stats.previousMonthOrders,
    monthOverMonthChange: stats.monthOverMonthChange,
  };
}

export async function getAdminCustomerCount() {
  const response = await api.get("/api/analytics/customers");
  const totalCustomers = response.data?.totalCustomers;

  if (!Number.isFinite(totalCustomers)) {
    throw new Error("Unable to load dashboard customer count: invalid server response.");
  }

  return totalCustomers;
}

export async function getAdminRevenueStats(period) {
  const response = await api.get("/api/analytics/revenue", { params: { period } });
  const stats = response.data;

  if (
    stats?.period !== period ||
    !Number.isFinite(stats.currentRevenue) ||
    !Number.isFinite(stats.previousRevenue) ||
    (stats.percentageChange !== null &&
      !Number.isFinite(stats.percentageChange))
  ) {
    throw new Error("Unable to load dashboard revenue stats: invalid server response.");
  }

  return stats;
}

export async function getAdminSalesTrend(period) {
  const response = await api.get("/api/analytics", { params: { period } });
  const trend = response.data?.salesTrend;

  if (
    trend?.period !== period ||
    !Array.isArray(trend.labels) ||
    !Array.isArray(trend.current) ||
    !Array.isArray(trend.previous) ||
    trend.labels.length === 0 ||
    trend.labels.length !== trend.current.length ||
    trend.labels.length !== trend.previous.length ||
    !trend.current.every(Number.isFinite) ||
    !trend.previous.every(Number.isFinite)
  ) {
    throw new Error("Unable to load sales trend: invalid server response.");
  }

  return {
    labels: trend.labels,
    current: trend.current,
    previous: trend.previous,
  };
}
