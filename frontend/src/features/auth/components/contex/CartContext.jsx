import { useEffect, useState } from "react";
import { useAuth } from "../../Hooks/useAuth.js";
import { subscribeToLiveUpdates } from "../../services/liveUpdates.api.js";
import { CartContext } from "./CartContext.js";
import {
    addCartItem as addCartItemRequest,
    getCart,
    removeCartItem as removeCartItemRequest,
    updateCartItem as updateCartItemRequest,
} from "../../services/cart.api.js";

function normalizeProduct(product) {
    const id = String(product._id || product.id || "");
    const price =
        product.discountPrice !== null &&
        product.discountPrice !== undefined &&
        product.discountPrice !== ""
            ? product.discountPrice
            : product.price;

    return {
        id,
        img: product.mainImage || product.img || "",
        shopName: product.shopName || "",
        productTitle:
            product.title || product.productName || product.productTitle || "",
        price: Number(price),
        stock: Number(product.stock) || 0,
    };
}

export function CartProvider({ children }) {
    const { user, loading: authLoading, showToast } = useAuth();
    const userId = user ? String(user.id || user._id) : null;
    const [accountCart, setAccountCart] = useState([]);
    const [loadedUserId, setLoadedUserId] = useState(null);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (authLoading || !userId) return undefined;

        let active = true;
        getCart()
            .then((items) => {
                if (active) {
                    setAccountCart(items);
                    setLoadError("");
                }
            })
            .catch((error) => {
                if (active) {
                    console.error("Unable to load shopping cart:", error);
                    setAccountCart([]);
                    setLoadError(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to load shopping cart."
                    );
                }
            })
            .finally(() => {
                if (active) setLoadedUserId(userId);
            });

        return () => {
            active = false;
        };
    }, [userId, authLoading]);

    useEffect(() => {
        if (authLoading || !userId) return undefined;

        let active = true;
        const unsubscribe = subscribeToLiveUpdates((update) => {
            if (update.type !== "cart:changed" && update.type !== "products:changed") return;
            getCart()
                .then((items) => {
                    if (active) {
                        setAccountCart(items);
                        setLoadError("");
                    }
                })
                .catch((error) => {
                    if (active) {
                        console.error("Unable to refresh shopping cart:", error);
                        setLoadError(
                            error.response?.data?.message ||
                            error.message ||
                            "Unable to refresh shopping cart."
                        );
                    }
                });
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [userId, authLoading]);

    const cartItems = userId && loadedUserId === userId ? accountCart : [];
    const loading = authLoading || Boolean(userId && loadedUserId !== userId);

    const requireAuthentication = () => {
        if (authLoading) {
            const error = new Error("Please wait while your account is being verified.");
            showToast(error.message, "info");
            throw error;
        }
        if (!userId) {
            const error = new Error("Please log in to use your shopping cart.");
            showToast(error.message, "warning");
            window.location.assign("/login");
            throw error;
        }
    };

    const addToCart = async (product, quantity = 1) => {
        requireAuthentication();
        const item = normalizeProduct(product);
        if (!item.id || item.id === "undefined") {
            showToast("A valid product is required to add to cart.", "error");
            throw new Error("A valid product is required to add to cart.");
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            showToast("Quantity must be a positive integer.", "error");
            throw new Error("Quantity must be a positive integer.");
        }

        const existingItem = cartItems.find((savedItem) => savedItem.id === item.id);
        const nextQuantity = (existingItem?.quantity || 0) + quantity;
        if (nextQuantity > item.stock) {
            showToast(`Only ${item.stock} item(s) are currently available.`, "error");
            throw new Error(`Only ${item.stock} item(s) are currently available.`);
        }

        try {
            setAccountCart(await addCartItemRequest(item.id, quantity));
            setLoadError("");
            showToast("Added to your shopping cart.", "success");
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to add item to cart.",
                "error"
            );
            throw error;
        }
    };

    const updateQuantity = async (productId, quantity) => {
        requireAuthentication();
        const id = String(productId);
        const item = cartItems.find((cartItem) => cartItem.id === id);
        if (!item) {
            showToast("Product is not in the shopping cart.", "error");
            throw new Error("Product is not in the shopping cart.");
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            showToast("Quantity must be a positive integer.", "error");
            throw new Error("Quantity must be a positive integer.");
        }
        if (quantity > item.stock) {
            showToast(`Only ${item.stock} item(s) are currently available.`, "error");
            throw new Error(`Only ${item.stock} item(s) are currently available.`);
        }

        try {
            setAccountCart(await updateCartItemRequest(id, quantity));
            setLoadError("");
            showToast("Cart quantity updated.", "success");
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to update cart quantity.",
                "error"
            );
            throw error;
        }
    };

    const removeFromCart = async (productId, { silent = false } = {}) => {
        requireAuthentication();
        const id = String(productId);
        try {
            setAccountCart(await removeCartItemRequest(id));
            setLoadError("");
            if (!silent) showToast("Removed from your shopping cart.", "success");
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to remove item from cart.",
                "error"
            );
            throw error;
        }
    };

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                loading,
                loadError,
                addToCart,
                updateQuantity,
                removeFromCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
