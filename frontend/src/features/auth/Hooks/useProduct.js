import { useContext } from "react";
import { ProductContext } from "../components/contex/ProductContext.jsx";
import {
    updateProductById,
    uploadProduct,
} from "../services/productupload.api.js";

export const useProduct = () => {
    const context = useContext(ProductContext);

    if (!context) {
        throw new Error("useProduct must be used within a ProductProvider");
    }

    const { products, setProducts, loading, setLoading } = context;

    const handleUploadProduct = async (product) => {
        setLoading(true);

        try {
            const response = await uploadProduct(product);
            const uploadedProduct = response?.data ?? response?.product;

            if (!uploadedProduct) {
                throw new Error("Product upload failed: the server returned no product.");
            }

            setProducts((currentProducts) => [...currentProducts, uploadedProduct]);
            return uploadedProduct;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProduct = async (id, product) => {
        setLoading(true);

        try {
            const updatedProduct = await updateProductById(id, product);
            setProducts((currentProducts) =>
                currentProducts.map((currentProduct) =>
                    String(currentProduct._id) === String(updatedProduct._id)
                        ? updatedProduct
                        : currentProduct
                )
            );
            return updatedProduct;
        } finally {
            setLoading(false);
        }
    };

    return {
        products,
        loading,
        handleUploadProduct,
        handleUpdateProduct,
    };
};
