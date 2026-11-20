const ChartLines = ({
  pathCurrent,
  pathPrev,
  areaCurrent,
  gradientId
}) => {
  return (
    <g>

      {/* Gradient Area */}
      <path
        d={areaCurrent}
        fill={`url(#${gradientId})`}
        className="chart-area-animation"
      />

      {/* Previous Period Line */}
      <path
        d={pathPrev}
        fill="none"
        stroke="#475569"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className="chart-previous-line-animation"
      />

      {/* Current Period Line */}
      <path
        d={pathCurrent}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        pathLength="1"
        className="chart-current-line-animation"
      />

    </g>
  );
};

export default ChartLines;