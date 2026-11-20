
import React from "react";
import { RotateCw } from "lucide-react";

const DashboardHeader = ({
  period,
  setPeriod,
  handleRefresh,
  isRefreshing,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      {/* Dashboard Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Store Command Center
        </h1>

        <p className="text-xs text-gray-500 mt-0.5">
          Real-time sales velocity, fulfillment telemetry, and merchant operations.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5">

        {/* Period Selector */}
        <div className="flex items-center bg-white border border-gray-200 p-1 rounded-lg shadow-sm">

          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer rounded-md transition-all capitalize ${
                period === p
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}

        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Synchronize Live Metrics"
          className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${
              isRefreshing ? "animate-spin text-blue-500" : ""
            }`}
          />

          <span>Sync</span>
        </button>

      </div>
    </div>
  );
};

export default DashboardHeader;
