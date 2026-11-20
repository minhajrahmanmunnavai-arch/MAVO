
import React from "react";

const metrics = [
  {
    label: "Average Order Value",
    value: "৳86.66",
    change: "+4.1% MoM",
    color: "text-emerald-600",
  },
  {
    label: "Checkout Conversion",
    value: "3.42%",
    change: "+0.3% MoM",
    color: "text-emerald-600",
  },
  {
    label: "Return / Refund Ratio",
    value: "1.18%",
    change: "-0.2% Nominal",
    color: "text-emerald-600",
  },
  {
    label: "Verified Customer Rating",
    value: "4.88 / 5.0",
    change: "98.2% Positive",
    color: "text-amber-600",
  },
];

const DashboardMetrics = () => {
  return (
    <section
      aria-label="Operational benchmarks"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
    >

      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`px-3 py-2 ${
            index !== metrics.length - 1
              ? "border-r border-gray-200"
              : ""
          }`}
        >
          <div className="text-[11px] text-gray-500 font-medium">
            {metric.label}
          </div>

          <div className="text-base font-bold font-mono text-gray-900 mt-0.5">
            {metric.value}
          </div>

          <div className={`text-[10px] font-mono mt-0.5 ${metric.color}`}>
            {metric.change}
          </div>
        </div>
      ))}

    </section>
  );
};

export default DashboardMetrics;
