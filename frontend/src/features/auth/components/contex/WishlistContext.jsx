import { useEffect, useState } from "react";
import { useAuth } from "../../Hooks/useAuth.js";
import { subscribeToLiveUpdates } from "../../services/liveUpdates.api.js";
import { WishlistContext } from "./WishlistContext.js";
import {
    addWishlistItem,
    getWishlist,
    removeWishlistItem,
} from "../../services/wishlist.api.js";

function toWishlistItem(product) {
    return {
        id: String(product._id || product.id),
        img: product.mainImage || product.img || "",
        shopName: product.shopName || "",
        productTitle: product.title || product.productName || product.productTitle || "",
        price: product.price,
    };
}

export function WishlistProvider({ children }) {
    const { user, loading: authLoading, showToast } = useAuth();
    const userId = user ? String(user.id || user._id) : null;
    const [accountWishlist, setAccountWishlist] = useState([]);
    const [loadedUserId, setLoadedUserId] = useState(null);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (authLoading || !userId) return undefined;

        let active = true;
        getWishlist()
            .then((items) => {
                if (active) {
                    setAccountWishlist(items);
                    setLoadError("");
                }
            })
            .catch((error) => {
                if (active) {
                    console.error("Unable to load wishlist:", error);
                    setAccountWishlist([]);
                    setLoadError(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to load wishlist."
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
            if (update.type !== "wishlist:changed" && update.type !== "products:changed") return;
            getWishlist()
                .then((items) => {
                    if (active) {
                        setAccountWishlist(items);
                        setLoadError("");
                    }
                })
                .catch((error) => {
                    if (active) {
                        console.error("Unable to refresh wishlist:", error);
                        setLoadError(
                            error.response?.data?.message ||
                            error.message ||
                            "Unable to refresh wishlist."
                        );
                    }
                });
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [userId, authLoading]);

    const wishlist = userId && loadedUserId === userId ? accountWishlist : [];
    const loading = authLoading || Boolean(userId && loadedUserId !== userId);

    const requireAuthentication = () => {
        if (authLoading) {
            const error = new Error("Please wait while your account is being verified.");
            showToast(error.message, "info");
            throw error;
        }
        if (!userId) {
            const error = new Error("Please log in to use your wishlist.");
            showToast(error.message, "warning");
            window.location.assign("/login");
            throw error;
        }
    };

    const addToWishlist = async (product) => {
        requireAuthentication();
        const item = toWishlistItem(product);
        if (!item.id || item.id === "undefined") {
            showToast("A valid product is required to update the wishlist.", "error");
            throw new Error("A valid product is required to update the wishlist.");
        }

        if (wishlist.some((savedItem) => savedItem.id === item.id)) {
            showToast("This product is already in your wishlist.", "info");
            return;
        }

        try {
            setAccountWishlist(await addWishlistItem(item.id));
            setLoadError("");
            showToast("Added to your wishlist.", "success");
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to add item to wishlist.",
                "error"
            );
            throw error;
        }
    };

    const removeFromWishlist = async (productId) => {
        requireAuthentication();
        const id = String(productId);
        try {
            setAccountWishlist(await removeWishlistItem(id));
            setLoadError("");
            showToast("Removed from your wishlist.", "success");
        } catch (error) {
            showToast(
                error.response?.data?.message || error.message || "Unable to remove item from wishlist.",
                "error"
            );
            throw error;
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                loading,
                loadError,
                addToWishlist,
                removeFromWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}
