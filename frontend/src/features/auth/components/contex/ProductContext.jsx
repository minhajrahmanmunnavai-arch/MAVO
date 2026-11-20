import { createContext, useState, useEffect, useCallback } from "react";
import { getAllProducts } from "../../services/productupload.api.js";
import { subscribeToLiveUpdates } from "../../services/liveUpdates.api.js";
import ShowToast from "../Showtoast/Showtoast.jsx";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
    }, []);

    const closeToast = useCallback(() => {
        setToast(null);
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);

        try {
            const data = await getAllProducts();

            setProducts(data);
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Error fetching products",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => subscribeToLiveUpdates((update) => {
        if (update.type === "products:changed") fetchProducts();
    }), [fetchProducts]);

    return (
        <ProductContext.Provider
            value={{
                products,
                setProducts,
                loading,
                setLoading,
                fetchProducts,
                showToast,
            }}
        >
            {children}

            {toast && (
                <ShowToast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}
        </ProductContext.Provider>
    );
};