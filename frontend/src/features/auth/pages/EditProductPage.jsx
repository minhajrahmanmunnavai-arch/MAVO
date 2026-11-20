import { useEffect, useState } from "react";
import { useAdmin } from "../components/contex/AdminContext.jsx";
import ProductForm from "../components/Admin/ProductForm/ProductForm.jsx";
import { getProductById } from "../services/productupload.api.js";

export default function EditProductPage() {
  const { selectedProductId, navigateTo } = useAdmin();
  const [result, setResult] = useState({ product: null, error: "", loadedId: null });

  useEffect(() => {
    let active = true;

    if (!selectedProductId) {
      return undefined;
    }

    getProductById(selectedProductId)
      .then((fetchedProduct) => {
        if (active) {
          setResult({
            product: fetchedProduct,
            error: "",
            loadedId: selectedProductId,
          });
        }
      })
      .catch((fetchError) => {
        if (active) {
          setResult({
            product: null,
            error: fetchError.message || "Unable to load product.",
            loadedId: selectedProductId,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedProductId]);

  const loading = Boolean(selectedProductId) && result.loadedId !== selectedProductId;
  const product = result.loadedId === selectedProductId ? result.product : null;

  if (loading) {
    return <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Loading product...</p>;
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="mb-4 text-sm text-slate-400">
          {selectedProductId ? result.error || "Product not found." : "Product not found."}
        </p>
        <button
          type="button"
          onClick={() => navigateTo("products")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return <ProductForm key={product._id} initialProduct={product} isEdit />;
}
