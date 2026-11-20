import { Check, ArrowLeft } from 'lucide-react';

const ProductFormHeader = ({
  navigateTo,
  isEdit = false,
}) => {

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      <div>

        <button
          type="button"
          onClick={() => navigateTo('products')}
          className="text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-400 flex items-center gap-1.5 mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Products
        </button>

        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {isEdit ? "Edit Product" : "Add Product"}
        </h1>

        <p className="text-xs text-slate-400">
          {isEdit
            ? "Update product details, pricing, inventory, and media."
            : "Publish merchandise to storefront with specifications, media, and pricing."}
        </p>

      </div>


      <div className="flex items-center gap-2.5">

        <button
          type="button"
          onClick={() => navigateTo('products')}
          className="px-4 py-2 bg-red-500 cursor-pointer hover:scale-105 active:scale-100 text-white font-medium rounded-lg text-xs  transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-5 py-2 cursor-pointer bg-black hover:bg-gray-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
        >
          <Check className="w-4 h-4" />
          {isEdit ? "Save Changes" : "Publish Product"}

        </button>

      </div>

    </div>
  );

};

export default ProductFormHeader;