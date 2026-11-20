
import React from "react";
import StatCard from "../common/StatCard";

import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Store,
  Clock,
} from "lucide-react";

const DashboardStats = ({
  products,
  orders,
  sellers,
  totalOrders = null,
  orderChange = null,
  totalCustomers = null,
  revenueStats = null,
  revenueStatsError = false,
  period = "monthly",
}) => {

  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === "Pending"
  ).length;

  const verifiedSellersCount = sellers.filter(
    (s) => s.status === "Approved"
  ).length;
  const revenuePeriodLabel = {
    daily: "prior day",
    weekly: "prior week",
    monthly: "prior month",
    yearly: "prior year",
  }[period] || "prior period";
  const selectedRevenueStats = revenueStats?.period === period ? revenueStats : null;
  const revenueHasBaseline = selectedRevenueStats?.previousRevenue > 0;
  const revenueValue = Number.isFinite(selectedRevenueStats?.currentRevenue)
    ? `৳${selectedRevenueStats.currentRevenue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
  const revenueComparisonLabel = revenueStatsError
    ? "Revenue unavailable"
    : selectedRevenueStats
      ? revenueHasBaseline
        ? `vs ${revenuePeriodLabel}`
        : `No ${revenuePeriodLabel} baseline`
      : "Loading revenue...";

  return (
    <section
      aria-label="Key performance indicators"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >

      <StatCard
        label="Total Revenue"
        value={revenueValue}
        change={revenueHasBaseline ? selectedRevenueStats.percentageChange : null}
        period={revenueComparisonLabel}
        icon={DollarSign}
        variant="blue"
      />

      <StatCard
        label="Total Orders"
        value={totalOrders === null ? "—" : totalOrders.toLocaleString()}
        change={orderChange}
        period={orderChange === null ? "No prior-month baseline" : "vs prior month"}
        icon={ShoppingBag}
        variant="emerald"
      />

      <StatCard
        label="Customers"
        value={totalCustomers === null ? "—" : totalCustomers.toLocaleString()}
        period="registered accounts"
        icon={Users}
        variant="purple"
      />

      <StatCard
        label="Catalog Items"
        value={products.length}
        change="+4 new"
        period="this week"
        icon={Package}
        variant="blue"
      />

      <StatCard
        label="Verified Sellers"
        value={verifiedSellersCount}
        change="3 pending"
        period="review required"
        icon={Store}
        variant="emerald"
      />

      <StatCard
        label="Pending Orders"
        value={pendingOrdersCount}
        change="Requires action"
        period="dispatch queue"
        icon={Clock}
        variant="amber"
        isWarning={pendingOrdersCount > 0}
      />

    </section>
  );
};

export default DashboardStats;
