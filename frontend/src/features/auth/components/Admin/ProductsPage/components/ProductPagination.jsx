import React from "react";

const ProductPagination = ({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  totalProducts,
}) => {
  return (
    <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">

      <div>
        Showing{" "}
        {totalProducts === 0
          ? 0
          : (currentPage - 1) * itemsPerPage + 1}{" "}
        to{" "}
        {Math.min(currentPage * itemsPerPage, totalProducts)} of{" "}
        {totalProducts} products
      </div>

      <div className="flex items-center gap-1.5">

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            setCurrentPage((p) => Math.max(1, p - 1))
          }
          className="cursor-pointer px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 text-xs font-medium"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
          (page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`cursor-pointer w-8 h-8 rounded-md font-mono text-xs font-semibold ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((p) => Math.min(totalPages, p + 1))
          }
          className="cursor-pointer px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 text-xs font-medium"
        >
          Next
        </button>

      </div>
    </div>
  );
};

export default ProductPagination;