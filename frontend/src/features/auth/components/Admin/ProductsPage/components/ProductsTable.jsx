import React from "react";
import ProductRow from "./ProductRow.jsx";

const ProductsTable = ({
  products,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  navigateTo,
  duplicateProduct,
  onDelete,
}) => {
  const allSelected =
    products.length > 0 &&
    products.every((p) => selectedIds.includes(p.id));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">

          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">

              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                />
              </th>

              <th className="py-3 px-4">Product Info</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                isSelected={selectedIds.includes(product.id)}
                toggleSelectOne={toggleSelectOne}
                navigateTo={navigateTo}
                duplicateProduct={duplicateProduct}
                onDelete={onDelete}
              />
            ))}

            {products.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="py-12 text-center text-gray-500 text-xs"
                >
                  No products found matching your current filter criteria.
                </td>
              </tr>
            )}

          </tbody>

        </table>
      </div>

    </div>
  );
};

export default ProductsTable;