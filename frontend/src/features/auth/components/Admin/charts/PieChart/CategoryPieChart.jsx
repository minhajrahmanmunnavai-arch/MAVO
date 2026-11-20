import { useState } from "react";

import { categories } from "./CategoryData.js";

import {
  calculateCategorySegments
} from "./CategoryCalculations.js";

import CategoryDonut from "./components/CategoryDonut.jsx";
import CategoryLegend from "./components/CategoryLegend.jsx";


export default function CategoryPieChart() {

  const [activeIdx, setActiveIdx] = useState(null);

  // SVG dimensions
  const size = 160;
  const strokeWidth = 24;

  // Calculate circle circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate category segments
  const segments = calculateCategorySegments(
    categories,
    circumference
  );

  return (
    <div className="flex flex-col items-center">

      {/* Donut Chart */}
      <CategoryDonut
        segments={segments}
        circumference={circumference}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
      />

      {/* Category Breakdown */}
      <CategoryLegend
        categories={categories}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
      />

    </div>
  );
}