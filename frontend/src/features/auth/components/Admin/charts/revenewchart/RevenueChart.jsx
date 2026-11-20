import { useState, useId, useEffect, useRef } from "react";

import { calculateChartData } from "./ChartCalculations.js";
import { getAdminSalesTrend } from "../../../../services/dashboard.api.js";
import { subscribeToLiveUpdates } from "../../../../services/liveUpdates.api.js";

import {
  createSmoothPath,
  createAreaPath
} from "./ChartPaths.js";

import ChartGrid from "./components/ChartGrid.jsx";
import ChartLines from "./components/ChartLines.jsx";

import ChartTooltip, {
  ChartDataPoints
} from "./components/ChartTooltip.jsx";


export default function RevenueChart({ period = "monthly", refreshKey = 0 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [salesTrend, setSalesTrend] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const requestId = useRef(0);
  const isActive = useRef(false);
  const hoveredIdx = hoveredPoint?.period === period ? hoveredPoint.index : null;
  const setHoveredIdx = (index) => {
    setHoveredPoint(index === null ? null : { period, index });
  };

  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    isActive.current = true;

    const loadSalesTrend = async (showLoading = false) => {
      const currentRequestId = ++requestId.current;
      if (showLoading) {
        setIsLoading(true);
        setSalesTrend(null);
      }

      try {
        const trend = await getAdminSalesTrend(period);
        if (isActive.current && requestId.current === currentRequestId) {
          setSalesTrend(trend);
          setErrorMessage("");
        }
      } catch (error) {
        if (isActive.current && requestId.current === currentRequestId) {
          console.error("Unable to load dashboard sales trend:", error);
          setErrorMessage(
            error.response?.data?.message || error.message || "Unable to load sales trend."
          );
        }
      } finally {
        if (isActive.current && requestId.current === currentRequestId) {
          setIsLoading(false);
        }
      }
    };

    loadSalesTrend(true);
    const unsubscribe = subscribeToLiveUpdates((update) => {
      if (update.type === "order:changed") loadSalesTrend();
    });
    const refreshInterval = window.setInterval(() => loadSalesTrend(), 15000);

    return () => {
      isActive.current = false;
      requestId.current += 1;
      window.clearInterval(refreshInterval);
      unsubscribe();
    };
  }, [period, refreshKey]);

  // SVG dimensions
  const height = 260;
  const width = 640;
  const paddingX = 40;
  const paddingY = 30;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-gray-500" role="status">
        Loading {period} sales data...
      </div>
    );
  }

  if (!salesTrend) {
    return (
      <div className="flex h-64 items-center justify-center text-center text-xs text-red-600" role="alert">
        {errorMessage || "Sales data is unavailable."}
      </div>
    );
  }

  // Calculate chart positions
  const {
    maxVal,
    pointsCurrent,
    pointsPrev
  } = calculateChartData(
    salesTrend,
    width,
    height,
    paddingX,
    paddingY
  );

  // Create chart paths
  const pathCurrent = createSmoothPath(pointsCurrent);
  const pathPrev = createSmoothPath(pointsPrev);

  const areaCurrent = createAreaPath(
    pointsCurrent,
    pathCurrent,
    height,
    paddingY
  );

  return (
    <div className="w-full relative select-none">
      {errorMessage && (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {errorMessage} Showing the last available data.
        </p>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-64 overflow-visible"
      >

        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#3b82f6"
              stopOpacity="0.25"
            />

            <stop
              offset="100%"
              stopColor="#3b82f6"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Grid */}
        <ChartGrid
          maxVal={maxVal}
          width={width}
          height={height}
          paddingX={paddingX}
          paddingY={paddingY}
        />

        {/* Animated Chart Lines */}
        <ChartLines
          key={`lines-${period}`}
          pathCurrent={pathCurrent}
          pathPrev={pathPrev}
          areaCurrent={areaCurrent}
          gradientId={gradientId}
        />

        {/* Animated Interactive Points */}
        <ChartDataPoints
          key={`points-${period}`}
          pointsCurrent={pointsCurrent}
          hoveredIdx={hoveredIdx}
          setHoveredIdx={setHoveredIdx}
          height={height}
        />

      </svg>

      {/* Tooltip */}
      <ChartTooltip
        hoveredIdx={hoveredIdx}
        pointsCurrent={pointsCurrent}
        pointsPrev={pointsPrev}
        width={width}
        height={height}
      />

    </div>
  );
}