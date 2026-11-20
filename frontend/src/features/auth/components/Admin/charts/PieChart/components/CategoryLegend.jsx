const CategoryLegend = ({
  categories,
  activeIdx,
  setActiveIdx
}) => {

  return (
    <div className="w-full space-y-2 mt-4">

      {categories.map((category, idx) => (
        <div
          key={idx}
          onMouseEnter={() => setActiveIdx(idx)}
          onMouseLeave={() => setActiveIdx(null)}
          style={{
            animationDelay: `${idx * 100}ms`
          }}
          className={`
            flex items-center justify-between text-xs
            chart-legend-animation
            transition-opacity duration-300 cursor-pointer
            ${
              activeIdx === null || activeIdx === idx
                ? "opacity-100"
                : "opacity-40"
            }
          `}
        >

          <div className="flex items-center gap-2">

            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{
                backgroundColor: category.color
              }}
            />

            <span className="text-slate-600">
              {category.name}
            </span>

          </div>

          <span className="font-mono font-semibold text-slate-800">
            {category.percentage}%
          </span>

        </div>
      ))}

    </div>
  );
};

export default CategoryLegend;