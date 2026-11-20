
import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function OrderTimeline({ timeline }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">
        Fulfillment Timeline
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
        {timeline.map((step, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center"
          >
            {/* Step Icon */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                step.done
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                idx + 1
              )}
            </div>

            {/* Step Name */}
            <div className="text-xs font-semibold text-gray-800">
              {step.step}
            </div>

            {/* Step Time */}
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
              {step.time}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
