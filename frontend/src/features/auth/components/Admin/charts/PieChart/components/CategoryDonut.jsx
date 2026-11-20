const CategoryDonut = ({
  segments,
  circumference,
  activeIdx,
  setActiveIdx
}) => {

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center my-2">

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full -rotate-90"
      >

        {segments.map((category, idx) => (
          <circle
            key={idx}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={category.color}
            strokeWidth={strokeWidth}
            strokeDasharray={category.strokeDasharray}
            strokeDashoffset={category.strokeDashoffset}
            opacity={
              activeIdx === null || activeIdx === idx
                ? 1
                : 0.3
            }
            className="cursor-pointer transition-opacity duration-300"
            onMouseEnter={() => setActiveIdx(idx)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <animate
              attributeName="stroke-dasharray"
              from={`0 ${circumference}`}
              to={category.strokeDasharray}
              dur="1s"
              begin={`${idx * 0.15}s`}
              fill="freeze"
            />
          </circle>
        ))}

      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none chart-center-animation">

        <span className="text-xl font-bold font-mono text-slate-900">
          100%
        </span>

        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          Volume
        </span>

      </div>

    </div>
  );
};

export default CategoryDonut;