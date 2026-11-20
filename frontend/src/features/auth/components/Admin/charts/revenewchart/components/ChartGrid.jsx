
const ChartGrid = ({
  maxVal,
  width,
  height,
  paddingX,
  paddingY
}) => {
  return (
    <>
      {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
        const y =
          height -
          paddingY -
          ratio * (height - paddingY * 2);

        const gridVal = ratio * maxVal;
        const label = maxVal >= 1000
          ? `৳${(gridVal / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
          : `৳${Math.round(gridVal).toLocaleString()}`;

        return (
          <g key={ratio}>
            <line
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth="1"
            />

            <text
              x={paddingX - 10}
              y={y + 4}
              fill="#64748b"
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="end"
            >
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
};

export default ChartGrid;
