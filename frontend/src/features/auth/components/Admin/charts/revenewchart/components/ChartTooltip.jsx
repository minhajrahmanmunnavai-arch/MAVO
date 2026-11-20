export const ChartDataPoints = ({
  pointsCurrent,
  hoveredIdx,
  setHoveredIdx,
  height
}) => {
  return (
    <>
      {pointsCurrent.map((point, idx) => (
        <g
          key={idx}
          className="chart-point-animation"
          style={{
            animationDelay: `${idx * 60}ms`
          }}
        >

          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredIdx === idx ? 6 : 3.5}
            fill="#0f172a"
            stroke="#60a5fa"
            strokeWidth={hoveredIdx === idx ? 3 : 2}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          />

          <text
            x={point.x}
            y={height - 8}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="var(--font-sans)"
            textAnchor="middle"
          >
            {point.label}
          </text>

        </g>
      ))}
    </>
  );
};


const ChartTooltip = ({
  hoveredIdx,
  pointsCurrent,
  pointsPrev,
  width,
  height
}) => {
  if (hoveredIdx === null) return null;

  const current = pointsCurrent[hoveredIdx];
  const previous = pointsPrev[hoveredIdx];

  return (
    <div
      className="
        absolute pointer-events-none
        bg-slate-900 border border-slate-700
        rounded-lg p-2.5 shadow-xl
        text-xs z-20
        chart-tooltip-animation
        -translate-x-1/2 -translate-y-full
      "
      style={{
        left: `${(current.x / width) * 100}%`,
        top: `${(current.y / height) * 100 - 4}%`
      }}
    >

      <div className="font-semibold text-slate-200 mb-1">
        {current.label}
      </div>

      <div className="flex items-center gap-2 font-mono tabular-nums text-blue-400 font-bold">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        Current: ৳{current.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400 text-[11px]">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        Previous: ৳{previous.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

    </div>
  );
};

export default ChartTooltip;