
import React from "react";

import RevenueChart from "../charts/revenewchart/RevenueChart.jsx";
import CategoryPieChart from "../charts/PieChart/CategoryPieChart.jsx";

const DashboardCharts = ({ period, refreshKey }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Revenue Chart */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Revenue Dynamics
            </h2>

            <p className="text-[11px] text-gray-500">
              Gross transaction merchandise volume
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">

            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-2.5 h-1 bg-blue-500 rounded-full" />
              Current
            </span>

            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-1 bg-gray-400 rounded-full border border-dashed border-gray-500" />
              Prior
            </span>

          </div>
        </div>

        <RevenueChart period={period} refreshKey={refreshKey} />

      </div>

      {/* Category Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">

        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Category Breakdown
          </h2>

          <p className="text-[11px] text-gray-500">
            Merchandise share by sales volume
          </p>
        </div>

        <CategoryPieChart />

      </div>

    </div>
  );
};

export default DashboardCharts;
