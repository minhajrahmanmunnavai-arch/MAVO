
import React, { useEffect, useRef, useState } from "react";

import { useAdmin } from "../components/contex/AdminContext.jsx";
import {
  getAdminCustomerCount,
  getAdminOrderStats,
  getAdminRevenueStats,
} from "../services/dashboard.api.js";
import { subscribeToLiveUpdates } from "../services/liveUpdates.api.js";

import DashboardHeader from "../components/Admin/Dashboard/DashboardHeader.jsx";
import DashboardStats from "../components/Admin/Dashboard/DashboardStats.jsx";
import DashboardMetrics from "../components/Admin/Dashboard/DashboardMetrics.jsx";
import DashboardCharts from "../components/Admin/Dashboard/DashboardCharts.jsx";
import RecentOrders from "../components/Admin/Dashboard/RecentOrders.jsx";
import TopProducts from "../components/Admin/Dashboard/TopProducts.jsx";

export default function DashboardPage() {

  // Admin Context
  const {
    products,
    orders,
    sellers,
    navigateTo,
    addToast,
  } = useAdmin();
  const [orderStats, setOrderStats] = useState(null);
  const [totalCustomers, setTotalCustomers] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [revenueStatsErrorPeriod, setRevenueStatsErrorPeriod] = useState(null);
  const orderStatsRequestId = useRef(0);
  const customerCountRequestId = useRef(0);
  const revenueStatsRequestId = useRef(0);

  // Dashboard States
  const [period, setPeriod] = useState("monthly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);

  useEffect(() => {
    const loadCustomerCount = async () => {
      const requestId = ++customerCountRequestId.current;
      try {
        const count = await getAdminCustomerCount();
        if (customerCountRequestId.current === requestId) {
          setTotalCustomers(count);
        }
      } catch (error) {
        if (customerCountRequestId.current === requestId) {
          console.error("Unable to load dashboard customer count:", error);
        }
      }
    };

    const loadOrderStats = async () => {
      const requestId = ++orderStatsRequestId.current;
      try {
        const stats = await getAdminOrderStats();
        if (orderStatsRequestId.current === requestId) {
          setOrderStats(stats);
        }
      } catch (error) {
        if (orderStatsRequestId.current === requestId) {
          console.error("Unable to load dashboard order stats:", error);
        }
      }
    };

    loadCustomerCount();
    loadOrderStats();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "order:changed") loadOrderStats();
      if (update.type === "customers:changed") loadCustomerCount();
    });
    const refreshInterval = window.setInterval(() => {
      loadOrderStats();
      loadCustomerCount();
    }, 15000);

    return () => {
      orderStatsRequestId.current += 1;
      customerCountRequestId.current += 1;
      window.clearInterval(refreshInterval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadRevenueStats = async () => {
      const requestId = ++revenueStatsRequestId.current;
      try {
        const stats = await getAdminRevenueStats(period);
        if (revenueStatsRequestId.current === requestId) {
          setRevenueStats(stats);
          setRevenueStatsErrorPeriod(null);
        }
      } catch (error) {
        if (revenueStatsRequestId.current === requestId) {
          console.error("Unable to load dashboard revenue stats:", error);
          setRevenueStatsErrorPeriod(period);
        }
      }
    };

    loadRevenueStats();
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "order:changed") loadRevenueStats();
    });
    const refreshInterval = window.setInterval(loadRevenueStats, 15000);

    return () => {
      revenueStatsRequestId.current += 1;
      window.clearInterval(refreshInterval);
      unsubscribe();
    };
  }, [period]);

  // Refresh Function
  const handleRefresh = async () => {

    if (isRefreshing) return;

    setIsRefreshing(true);
    const orderRequestId = ++orderStatsRequestId.current;
    const customerRequestId = ++customerCountRequestId.current;
    const revenueRequestId = ++revenueStatsRequestId.current;

    try {
      const [stats, customerCount, revenue] = await Promise.all([
        getAdminOrderStats(),
        getAdminCustomerCount(),
        getAdminRevenueStats(period),
      ]);
      if (orderStatsRequestId.current === orderRequestId) {
        setOrderStats(stats);
      }
      if (customerCountRequestId.current === customerRequestId) {
        setTotalCustomers(customerCount);
      }
      if (revenueStatsRequestId.current === revenueRequestId) {
        setRevenueStats(revenue);
        setRevenueStatsErrorPeriod(null);
      }
      if (
        orderStatsRequestId.current === orderRequestId &&
        customerCountRequestId.current === customerRequestId &&
        revenueStatsRequestId.current === revenueRequestId
      ) {
        setChartRefreshKey((key) => key + 1);
        addToast({
          title: "Telemetry Synchronized",
          message: "Dashboard metrics updated.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Unable to refresh dashboard order stats:", error);
      if (
        orderStatsRequestId.current === orderRequestId &&
        customerCountRequestId.current === customerRequestId
      ) {
        addToast({
          title: "Sync Failed",
          message: error.response?.data?.message || error.message || "Unable to update dashboard metrics.",
          type: "error",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Dashboard Header */}
      <DashboardHeader
        period={period}
        setPeriod={setPeriod}
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Statistics Cards */}
      <DashboardStats
        products={products}
        orders={orders}
        sellers={sellers}
        period={period}
        revenueStats={revenueStats}
        revenueStatsError={revenueStatsErrorPeriod === period}
        totalOrders={orderStats?.totalOrders ?? null}
        orderChange={orderStats?.monthOverMonthChange ?? null}
        totalCustomers={totalCustomers}
      />

      {/* 3. Operational Metrics */}
      <DashboardMetrics />

      {/* 4. Charts */}
      <DashboardCharts
        period={period}
        refreshKey={chartRefreshKey}
      />

      {/* 5. Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <RecentOrders
          orders={orders}
          navigateTo={navigateTo}
        />

        <TopProducts
          products={products}
          navigateTo={navigateTo}
        />

      </div>

    </div>
  );
}
