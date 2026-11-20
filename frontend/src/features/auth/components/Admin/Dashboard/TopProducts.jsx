
import React from "react";

const TopProducts = ({ products, navigateTo }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">

        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Top Velocity Items
          </h2>

          <p className="text-[11px] text-gray-500">
            Leading merchandise by units fulfilled
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo("products")}
          className="px-5 py-2 cursor-pointer bg-black hover:bg-gray-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
        >
          Catalog
        </button>

      </div>

      {/* Product List */}
      <div className="divide-y divide-gray-100 p-2">

        {products.slice(0, 3).map((prod, idx) => (

          <div
            key={prod.id}
            onClick={() =>
              navigateTo("edit-product", {
                productId: prod.id,
              })
            }
            className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between gap-3"
          >

            <div className="flex items-center gap-3 min-w-0">

              <span
                className={`text-xs font-bold font-mono w-4 text-center ${
                  idx === 0
                    ? "text-amber-500"
                    : idx === 1
                    ? "text-gray-500"
                    : "text-amber-700"
                }`}
              >
                {idx + 1}
              </span>

              <img
                src={prod.image}
                alt={prod.name}
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
              />

              <div className="min-w-0 truncate">

                <div className="text-xs font-semibold text-gray-800 truncate">
                  {prod.name}
                </div>

                <div className="text-[10px] text-gray-500 truncate">
                  {prod.category}
                </div>

              </div>
            </div>

            <div className="text-right shrink-0">

              <div className="text-xs font-bold font-mono text-gray-900">
                ৳{prod.price.toFixed(2)}
              </div>

              <div className="text-[10px] font-mono text-gray-500">
                {prod.salesCount} sold
              </div>

            </div>

          </div>

        ))}

        {products.length === 0 && (
          <p className="text-center text-xs text-gray-500 py-8">
            No products found.
          </p>
        )}

      </div>
    </div>
  );
};

export default TopProducts;
